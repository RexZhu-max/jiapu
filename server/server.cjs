const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { randomBytes } = require('crypto');

const PORT = Number(process.env.PORT || 3001);
const DATA_PATH = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'storage', 'uploads');
const streamClients = new Map();

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4'
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, statusCode, data) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  setCors(res);
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function writeSSE(res, event, payload) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function registerStreamClient(familyId, res) {
  if (!streamClients.has(familyId)) {
    streamClients.set(familyId, new Set());
  }
  streamClients.get(familyId).add(res);
}

function unregisterStreamClient(familyId, res) {
  const group = streamClients.get(familyId);
  if (!group) return;
  group.delete(res);
  if (group.size === 0) {
    streamClients.delete(familyId);
  }
}

function broadcastFamilyEvent(familyId, event, payload = {}) {
  const group = streamClients.get(familyId);
  if (!group || group.size === 0) return;
  const data = { ...payload, ts: Date.now() };
  for (const client of group) {
    writeSSE(client, event, data);
  }
}

function buildNotificationView(item) {
  return {
    ...item,
    time: formatRelativeTime(item.createdAt)
  };
}

function computeUnreadCount(db, familyId) {
  return db.notifications.filter((item) => item.familyId === familyId && !item.isRead).length;
}

async function loadDB() {
  const raw = await fsp.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function saveDB(db) {
  await fsp.writeFile(DATA_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk.toString();
      if (data.length > 30 * 1024 * 1024) {
        reject(new Error('请求体过大'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error('JSON 解析失败'));
      }
    });
    req.on('error', reject);
  });
}

function parseAuthUser(req, db) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return null;
  }
  const session = db.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }
  const user = db.users.find((item) => item.id === session.userId);
  return user || null;
}

function requireAuth(req, res, db) {
  const user = parseAuthUser(req, db);
  if (!user) {
    sendJson(res, 401, { message: '未登录或登录已过期' });
    return null;
  }
  return user;
}

function formatRelativeTime(iso) {
  const date = new Date(iso).getTime();
  const diff = Date.now() - date;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
}

function normalizeMoment(db, moment) {
  const user = db.users.find((item) => item.id === moment.userId);
  return {
    id: moment.id,
    user: {
      name: user?.name || '未知成员',
      relation: user?.role || '成员',
      avatar: user?.avatar || ''
    },
    memoryDate: moment.memoryDate,
    content: moment.content,
    images: moment.images || [],
    audio: moment.audio || undefined,
    participants: moment.participants || [],
    location: moment.location || '',
    isUnread: false,
    createdAt: moment.createdAt
  };
}

function buildFamilyTree(db, familyId) {
  const generations = db.generations
    .filter((item) => item.familyId === familyId)
    .sort((a, b) => a.order - b.order)
    .map((generation) => {
      const members = db.members
        .filter((member) => member.familyId === familyId && member.generationId === generation.id)
        .map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          birth: member.birth,
          bio: member.bio,
          memories: member.memories || 0,
          img: member.img || null,
          gender: member.gender || '',
          birthDate: member.birthDate || '',
          birthPlace: member.birthPlace || '',
          phone: member.phone || '',
          email: member.email || ''
        }));
      return {
        id: generation.id,
        title: generation.title,
        order: generation.order,
        description: generation.description || '',
        members
      };
    });
  return generations;
}

function nextId(db, key, prefix) {
  const n = db.nextIds[key] || 1;
  db.nextIds[key] = n + 1;
  return `${prefix}_${n}`;
}

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function decodeDataUrl(dataUrl) {
  const matched = /^data:(.+);base64,(.+)$/.exec(dataUrl || '');
  if (!matched) {
    throw new Error('无效的数据格式');
  }
  return {
    mimeType: matched[1],
    buffer: Buffer.from(matched[2], 'base64')
  };
}

async function serveUploadFile(req, res, pathname) {
  const safeName = path.basename(pathname);
  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    sendText(res, 404, '文件不存在');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_MAP[ext] || 'application/octet-stream';
  setCors(res);
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

async function handleSSEStream(req, res, url) {
  const token = url.searchParams.get('token') || '';
  if (!token) {
    sendJson(res, 401, { message: '缺少登录令牌' });
    return;
  }

  const db = await loadDB();
  const session = db.sessions.find((item) => item.token === token);
  const user = session ? db.users.find((item) => item.id === session.userId) : null;
  if (!user) {
    sendJson(res, 401, { message: '登录已过期' });
    return;
  }

  setCors(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  res.write('\n');

  registerStreamClient(user.familyId, res);
  writeSSE(res, 'connected', { ok: true });

  const heartbeat = setInterval(() => {
    writeSSE(res, 'heartbeat', { ok: true });
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterStreamClient(user.familyId, res);
  });
}

async function handleApi(req, res, pathname) {
  const db = await loadDB();

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(req);
    const { phone, password } = body;
    const user = db.users.find((item) => item.phone === phone && item.password === password);
    if (!user) {
      sendJson(res, 401, { message: '手机号或密码错误' });
      return;
    }
    const token = randomBytes(20).toString('hex');
    db.sessions = db.sessions.filter((item) => item.userId !== user.id);
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    await saveDB(db);
    sendJson(res, 200, {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        familyId: user.familyId
      }
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    sendJson(res, 200, {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        familyId: user.familyId
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/media/upload') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const body = await readBody(req);
    const { dataUrl, fileName = '', type = 'image' } = body;
    if (!dataUrl) {
      sendJson(res, 400, { message: '缺少媒体数据' });
      return;
    }
    const decoded = decodeDataUrl(dataUrl);
    const ext = path.extname(fileName || '') || (decoded.mimeType.includes('audio') ? '.webm' : '.jpg');
    const mediaId = nextId(db, 'media', 'me');
    const storedName = `${mediaId}_${Date.now()}${ext}`;
    const savedPath = path.join(UPLOAD_DIR, storedName);
    await fsp.writeFile(savedPath, decoded.buffer);
    const url = `/uploads/${storedName}`;
    db.media.push({
      id: mediaId,
      familyId: user.familyId,
      userId: user.id,
      type,
      url,
      mimeType: decoded.mimeType,
      fileName: fileName || storedName,
      createdAt: new Date().toISOString()
    });
    await saveDB(db);
    sendJson(res, 200, { id: mediaId, url, type });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/moments') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const list = db.moments
      .filter((item) => item.familyId === user.familyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => normalizeMoment(db, item));
    sendJson(res, 200, { moments: list });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/moments') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const body = await readBody(req);
    const { content, memoryDate, participants = [], images = [], audio = null, location = '' } = body;
    if (!content && images.length === 0 && !audio) {
      sendJson(res, 400, { message: '动态内容不能为空' });
      return;
    }
    const now = new Date().toISOString();
    const momentId = nextId(db, 'moment', 'mo');
    const moment = {
      id: momentId,
      familyId: user.familyId,
      userId: user.id,
      memoryDate: memoryDate || '今天',
      content: content || '发布了新的家族记录',
      images,
      audio,
      participants,
      location,
      createdAt: now
    };
    db.moments.push(moment);

    const notificationId = nextId(db, 'notification', 'n');
    const createdNotification = {
      id: notificationId,
      familyId: user.familyId,
      type: 'memory',
      avatar: user.avatar,
      sender: user.name,
      action: '发布了新动态',
      target: memoryDate || '家族动态',
      time: '刚刚',
      isRead: false,
      preview: (content || '').slice(0, 80),
      image: images[0] || '',
      createdAt: now
    };
    db.notifications.unshift(createdNotification);

    await saveDB(db);
    const unreadCount = computeUnreadCount(db, user.familyId);
    const normalizedMoment = normalizeMoment(db, moment);
    broadcastFamilyEvent(user.familyId, 'moment-updated', {
      action: 'create',
      moment: normalizedMoment
    });
    broadcastFamilyEvent(user.familyId, 'notification-updated', {
      action: 'create',
      notification: buildNotificationView(createdNotification),
      unreadCount
    });
    sendJson(res, 201, { moment: normalizedMoment });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const notifications = db.notifications
      .filter((item) => item.familyId === user.familyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => buildNotificationView(item));
    sendJson(res, 200, {
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/notifications/read-all') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const changedIds = [];
    db.notifications = db.notifications.map((item) =>
      item.familyId === user.familyId ? { ...item, isRead: true } : item
    );
    for (const item of db.notifications) {
      if (item.familyId === user.familyId) {
        changedIds.push(item.id);
      }
    }
    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'notification-updated', {
      action: 'read-all',
      ids: changedIds,
      unreadCount: 0
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'DELETE' && pathname === '/api/notifications/read') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const removedIds = db.notifications
      .filter((item) => item.familyId === user.familyId && item.isRead)
      .map((item) => item.id);
    db.notifications = db.notifications.filter((item) => !(item.familyId === user.familyId && item.isRead));
    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'notification-updated', {
      action: 'clear-read',
      ids: removedIds,
      unreadCount: computeUnreadCount(db, user.familyId)
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/notifications/') && pathname.endsWith('/read')) {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const parts = pathname.split('/');
    const id = parts[3];
    db.notifications = db.notifications.map((item) =>
      item.id === id && item.familyId === user.familyId ? { ...item, isRead: true } : item
    );
    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'notification-updated', {
      action: 'read-one',
      id,
      unreadCount: computeUnreadCount(db, user.familyId)
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/notifications/')) {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const id = pathname.split('/')[3];
    db.notifications = db.notifications.filter((item) => !(item.id === id && item.familyId === user.familyId));
    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'notification-updated', {
      action: 'delete-one',
      id,
      unreadCount: computeUnreadCount(db, user.familyId)
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/family/tree') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const generations = buildFamilyTree(db, user.familyId);
    sendJson(res, 200, { generations });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/family/generations') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const body = await readBody(req);
    const { title, description = '', position = 'after' } = body;
    if (!title || !String(title).trim()) {
      sendJson(res, 400, { message: '辈分名称不能为空' });
      return;
    }
    const familyGens = db.generations
      .filter((item) => item.familyId === user.familyId)
      .sort((a, b) => a.order - b.order);
    const order = position === 'before'
      ? (familyGens[0]?.order || 1) - 1
      : (familyGens[familyGens.length - 1]?.order || 0) + 1;

    db.generations.push({
      id: nextId(db, 'generation', 'g'),
      familyId: user.familyId,
      title: String(title).trim(),
      order,
      description: String(description || '').trim()
    });
    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'family-tree-updated', { action: 'generation-create' });
    sendJson(res, 201, { generations: buildFamilyTree(db, user.familyId) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/family/members') {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const body = await readBody(req);
    const {
      name,
      role,
      birth,
      bio,
      img,
      generationId,
      generationTitle,
      gender,
      birthDate,
      birthPlace,
      phone,
      email
    } = body;

    if (!name || !String(name).trim()) {
      sendJson(res, 400, { message: '成员姓名不能为空' });
      return;
    }

    let targetGenerationId = generationId;
    if (!targetGenerationId && generationTitle) {
      const found = db.generations.find(
        (item) => item.familyId === user.familyId && item.title === generationTitle
      );
      if (found) {
        targetGenerationId = found.id;
      } else {
        const familyGens = db.generations
          .filter((item) => item.familyId === user.familyId)
          .sort((a, b) => a.order - b.order);
        const newGen = {
          id: nextId(db, 'generation', 'g'),
          familyId: user.familyId,
          title: generationTitle,
          order: (familyGens[familyGens.length - 1]?.order || 0) + 1,
          description: ''
        };
        db.generations.push(newGen);
        targetGenerationId = newGen.id;
      }
    }

    if (!targetGenerationId) {
      sendJson(res, 400, { message: '请选择辈分' });
      return;
    }

    db.members.push({
      id: nextId(db, 'member', 'm'),
      familyId: user.familyId,
      generationId: targetGenerationId,
      name: String(name).trim(),
      role: role || '成员',
      birth: birth || '',
      bio: bio || '',
      img: img || null,
      memories: 0,
      gender: gender || '',
      birthDate: birthDate || '',
      birthPlace: birthPlace || '',
      phone: phone || '',
      email: email || ''
    });

    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'family-tree-updated', { action: 'member-create' });
    sendJson(res, 201, { generations: buildFamilyTree(db, user.familyId) });
    return;
  }

  if (req.method === 'PUT' && pathname.startsWith('/api/family/members/')) {
    const user = requireAuth(req, res, db);
    if (!user) return;
    const memberId = pathname.split('/')[4];
    const body = await readBody(req);
    const index = db.members.findIndex((item) => item.id === memberId && item.familyId === user.familyId);
    if (index === -1) {
      sendJson(res, 404, { message: '成员不存在' });
      return;
    }

    const old = db.members[index];
    db.members[index] = {
      ...old,
      name: body.name ?? old.name,
      role: body.role ?? old.role,
      birth: body.birth ?? old.birth,
      bio: body.bio ?? old.bio,
      img: body.img ?? old.img,
      gender: body.gender ?? old.gender,
      birthDate: body.birthDate ?? old.birthDate,
      birthPlace: body.birthPlace ?? old.birthPlace,
      phone: body.phone ?? old.phone,
      email: body.email ?? old.email
    };

    await saveDB(db);
    broadcastFamilyEvent(user.familyId, 'family-tree-updated', { action: 'member-update', id: memberId });
    sendJson(res, 200, { generations: buildFamilyTree(db, user.familyId) });
    return;
  }

  sendJson(res, 404, { message: '接口不存在' });
}

async function requestHandler(req, res) {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/api/stream') {
      await handleSSEStream(req, res, url);
      return;
    }

    if (pathname.startsWith('/uploads/')) {
      await serveUploadFile(req, res, pathname);
      return;
    }

    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
      return;
    }

    sendJson(res, 200, {
      message: 'Heritage API is running',
      now: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 500, { message: error.message || '服务器异常' });
  }
}

ensureUploadDir();

http.createServer(requestHandler).listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log('[server] 测试账号: 13800000000 / 123456');
});
