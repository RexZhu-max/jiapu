const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { randomBytes } = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 3001);
const DATA_PATH = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'storage', 'uploads');
const streamClients = new Map();
const chatClients = new Map();

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

function sendWs(socket, payload) {
  if (!socket || socket.readyState !== 1) return;
  socket.send(JSON.stringify(payload));
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

function registerChatClient(familyId, socket) {
  if (!chatClients.has(familyId)) {
    chatClients.set(familyId, new Set());
  }
  chatClients.get(familyId).add(socket);
}

function unregisterChatClient(familyId, socket) {
  const group = chatClients.get(familyId);
  if (!group) return;
  group.delete(socket);
  if (group.size === 0) {
    chatClients.delete(familyId);
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

function broadcastChatEvent(familyId, payload) {
  const group = chatClients.get(familyId);
  if (!group || group.size === 0) return;
  for (const client of group) {
    sendWs(client, payload);
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

function ensureAdminData(db) {
  let changed = false;

  if (!Array.isArray(db.adminUsers)) {
    db.adminUsers = [];
    changed = true;
  }
  if (!Array.isArray(db.adminSessions)) {
    db.adminSessions = [];
    changed = true;
  }
  if (!Array.isArray(db.adminLogs)) {
    db.adminLogs = [];
    changed = true;
  }
  if (!Array.isArray(db.notices)) {
    db.notices = [];
    changed = true;
  }
  if (!db.nextIds) {
    db.nextIds = {};
    changed = true;
  }
  if (!db.nextIds.notice) {
    db.nextIds.notice = 1;
    changed = true;
  }
  if (!db.nextIds.adminLog) {
    db.nextIds.adminLog = 1;
    changed = true;
  }

  if (db.adminUsers.length === 0) {
    db.adminUsers.push({
      id: 'a_1',
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      role: 'super_admin'
    });
    changed = true;
  }

  if (Array.isArray(db.users)) {
    for (const user of db.users) {
      if (typeof user.isBanned !== 'boolean') {
        user.isBanned = false;
        changed = true;
      }
    }
  }

  if (Array.isArray(db.moments)) {
    for (const moment of db.moments) {
      if (!moment.moderationStatus) {
        moment.moderationStatus = 'approved';
        changed = true;
      }
      if (typeof moment.reviewRemark !== 'string') {
        moment.reviewRemark = '';
        changed = true;
      }
      if (typeof moment.reviewedAt !== 'string') {
        moment.reviewedAt = '';
        changed = true;
      }
      if (typeof moment.reviewedBy !== 'string') {
        moment.reviewedBy = '';
        changed = true;
      }
    }
  }

  return changed;
}

function ensureChatData(db, familyId) {
  let changed = false;

  if (!Array.isArray(db.chatConversations)) {
    db.chatConversations = [];
    changed = true;
  }
  if (!Array.isArray(db.chatMessages)) {
    db.chatMessages = [];
    changed = true;
  }
  if (!db.nextIds) {
    db.nextIds = {};
    changed = true;
  }
  if (!db.nextIds.conversation) {
    db.nextIds.conversation = 1;
    changed = true;
  }
  if (!db.nextIds.chatMessage) {
    db.nextIds.chatMessage = 1;
    changed = true;
  }

  const familyUsers = db.users.filter((item) => item.familyId === familyId);
  if (familyUsers.length === 0) {
    return changed;
  }

  const familyConversations = db.chatConversations.filter((item) => item.familyId === familyId);
  if (familyConversations.length === 0) {
    const now = Date.now();
    const conversationId = nextId(db, 'conversation', 'c');
    const participantIds = familyUsers.map((item) => item.id);
    const readStates = {};
    participantIds.forEach((id) => {
      readStates[id] = new Date(now - 5 * 60 * 1000).toISOString();
    });

    const conversation = {
      id: conversationId,
      familyId,
      name: '林氏家族群',
      type: 'group',
      participantIds,
      readStates,
      updatedAt: new Date(now).toISOString(),
      lastMessageId: ''
    };
    db.chatConversations.push(conversation);

    const fallbackSender = familyUsers.find((item) => item.id !== participantIds[0]) || familyUsers[0];
    const welcomeMessage = {
      id: nextId(db, 'chatMessage', 'cm'),
      familyId,
      conversationId,
      senderId: fallbackSender.id,
      type: 'text',
      content: '欢迎来到家族消息频道，大家可以在这里沟通祭祖、家宴和修谱安排。',
      createdAt: new Date(now - 2 * 60 * 1000).toISOString()
    };
    db.chatMessages.push(welcomeMessage);
    conversation.lastMessageId = welcomeMessage.id;
    conversation.updatedAt = welcomeMessage.createdAt;
    changed = true;
  }

  for (const conversation of db.chatConversations.filter((item) => item.familyId === familyId)) {
    let localChanged = false;

    if (!Array.isArray(conversation.participantIds) || conversation.participantIds.length === 0) {
      conversation.participantIds = familyUsers.map((item) => item.id);
      localChanged = true;
    } else {
      const nextParticipants = conversation.participantIds.filter((id, index, arr) => {
        return arr.indexOf(id) === index && familyUsers.some((user) => user.id === id);
      });
      if (nextParticipants.length !== conversation.participantIds.length) {
        conversation.participantIds = nextParticipants;
        localChanged = true;
      }
      if (conversation.participantIds.length === 0) {
        conversation.participantIds = familyUsers.map((item) => item.id);
        localChanged = true;
      }
    }

    if (!conversation.readStates || typeof conversation.readStates !== 'object') {
      conversation.readStates = {};
      localChanged = true;
    }

    const fallbackReadAt = conversation.updatedAt || new Date().toISOString();
    for (const participantId of conversation.participantIds) {
      if (!conversation.readStates[participantId]) {
        conversation.readStates[participantId] = fallbackReadAt;
        localChanged = true;
      }
    }

    if (!conversation.updatedAt) {
      conversation.updatedAt = new Date().toISOString();
      localChanged = true;
    }

    if (localChanged) {
      changed = true;
    }
  }

  return changed;
}

function isConversationMember(conversation, userId) {
  return Array.isArray(conversation.participantIds) && conversation.participantIds.includes(userId);
}

function buildChatMessage(db, message) {
  const sender = db.users.find((item) => item.id === message.senderId);
  return {
    id: message.id,
    conversationId: message.conversationId,
    sender: {
      id: sender?.id || message.senderId,
      name: sender?.name || '未知成员',
      role: sender?.role || '成员',
      avatar: sender?.avatar || ''
    },
    type: message.type || 'text',
    content: message.content || '',
    createdAt: message.createdAt
  };
}

function getConversationLastMessage(db, conversation) {
  if (conversation.lastMessageId) {
    const byId = db.chatMessages.find((item) => item.id === conversation.lastMessageId);
    if (byId) return byId;
  }
  const sorted = db.chatMessages
    .filter((item) => item.conversationId === conversation.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sorted[0] || null;
}

function computeConversationUnreadCount(db, conversation, userId) {
  const readAt = new Date(conversation.readStates?.[userId] || 0).getTime();
  return db.chatMessages.filter((item) => {
    if (item.conversationId !== conversation.id) return false;
    if (item.senderId === userId) return false;
    return new Date(item.createdAt).getTime() > readAt;
  }).length;
}

function buildConversationView(db, conversation, currentUserId) {
  const participants = (conversation.participantIds || []).map((participantId) => {
    const user = db.users.find((item) => item.id === participantId);
    return {
      id: participantId,
      name: user?.name || '未知成员',
      role: user?.role || '成员',
      avatar: user?.avatar || ''
    };
  });

  const lastMessage = getConversationLastMessage(db, conversation);
  return {
    id: conversation.id,
    familyId: conversation.familyId,
    name: conversation.name || '未命名会话',
    type: conversation.type || 'group',
    updatedAt: conversation.updatedAt,
    participants,
    unreadCount: computeConversationUnreadCount(db, conversation, currentUserId),
    lastMessage: lastMessage ? buildChatMessage(db, lastMessage) : null
  };
}

function computeChatUnreadTotal(db, familyId, userId) {
  const conversations = db.chatConversations.filter(
    (item) => item.familyId === familyId && isConversationMember(item, userId),
  );
  return conversations.reduce((sum, item) => sum + computeConversationUnreadCount(db, item, userId), 0);
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
      } catch {
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
  if (user.isBanned) {
    sendJson(res, 403, { message: '账号已被封禁，请联系管理员' });
    return null;
  }
  return user;
}

function parseAdminUser(req, db) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const session = db.adminSessions.find((item) => item.token === token);
  if (!session) return null;
  const admin = db.adminUsers.find((item) => item.id === session.adminId);
  return admin || null;
}

function requireAdminAuth(req, res, db) {
  const admin = parseAdminUser(req, db);
  if (!admin) {
    sendJson(res, 401, { message: '管理员未登录或登录已过期' });
    return null;
  }
  return admin;
}

function pushAdminLog(db, adminId, action, targetType, targetId, detail = '') {
  db.adminLogs.unshift({
    id: nextId(db, 'adminLog', 'al'),
    adminId,
    action,
    targetType,
    targetId,
    detail,
    createdAt: new Date().toISOString()
  });
  if (db.adminLogs.length > 500) {
    db.adminLogs = db.adminLogs.slice(0, 500);
  }
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
  return db.generations
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
  ensureAdminData(db);
  const session = db.sessions.find((item) => item.token === token);
  const user = session ? db.users.find((item) => item.id === session.userId) : null;
  if (!user || user.isBanned) {
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

async function handleApi(req, res, pathname, url) {
  const db = await loadDB();
  const adminDataChanged = ensureAdminData(db);
  if (adminDataChanged) {
    await saveDB(db);
  }

  if (req.method === 'POST' && pathname === '/api/admin/auth/login') {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();
    const admin = db.adminUsers.find((item) => item.username === username && item.password === password);
    if (!admin) {
      sendJson(res, 401, { message: '管理员账号或密码错误' });
      return;
    }
    const token = randomBytes(20).toString('hex');
    db.adminSessions = db.adminSessions.filter((item) => item.adminId !== admin.id);
    db.adminSessions.push({ token, adminId: admin.id, createdAt: new Date().toISOString() });
    await saveDB(db);
    sendJson(res, 200, {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/overview') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const pendingMoments = db.moments.filter((item) => item.moderationStatus === 'pending').length;
    const rejectedMoments = db.moments.filter((item) => item.moderationStatus === 'rejected').length;
    const bannedUsers = db.users.filter((item) => item.isBanned).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = db.moments.filter((item) => new Date(item.createdAt).getTime() >= today.getTime()).length;
    sendJson(res, 200, {
      stats: {
        totalUsers: db.users.length,
        bannedUsers,
        totalFamilies: db.families.length,
        totalMoments: db.moments.length,
        pendingMoments,
        rejectedMoments,
        totalNotifications: db.notifications.length,
        todayPosts
      }
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/users') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const list = db.users.map((user) => {
      const family = db.families.find((item) => item.id === user.familyId);
      const posts = db.moments.filter((item) => item.userId === user.id).length;
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        familyId: user.familyId,
        familyName: family?.name || '未知家族',
        isBanned: Boolean(user.isBanned),
        postCount: posts
      };
    });
    sendJson(res, 200, { users: list });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/admin/users/') && pathname.endsWith('/status')) {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const userId = pathname.split('/')[4];
    const body = await readBody(req);
    const nextBanned = Boolean(body.isBanned);
    const user = db.users.find((item) => item.id === userId);
    if (!user) {
      sendJson(res, 404, { message: '用户不存在' });
      return;
    }
    user.isBanned = nextBanned;
    if (nextBanned) {
      db.sessions = db.sessions.filter((item) => item.userId !== userId);
    }
    pushAdminLog(
      db,
      admin.id,
      nextBanned ? 'user.ban' : 'user.unban',
      'user',
      userId,
      `${user.name}(${user.phone})`,
    );
    await saveDB(db);
    sendJson(res, 200, { ok: true, userId, isBanned: nextBanned });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/families') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const families = db.families.map((family) => {
      const users = db.users.filter((item) => item.familyId === family.id);
      const members = db.members.filter((item) => item.familyId === family.id);
      const moments = db.moments.filter((item) => item.familyId === family.id);
      const unreadNotifications = db.notifications.filter((item) => item.familyId === family.id && !item.isRead).length;
      return {
        id: family.id,
        name: family.name,
        userCount: users.length,
        memberCount: members.length,
        momentCount: moments.length,
        unreadNotifications
      };
    });
    sendJson(res, 200, { families });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/moments') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const status = String(url.searchParams.get('status') || 'all');
    const familyId = String(url.searchParams.get('familyId') || '');
    const list = db.moments
      .filter((item) => (familyId ? item.familyId === familyId : true))
      .filter((item) => (status === 'all' ? true : item.moderationStatus === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => {
        const user = db.users.find((u) => u.id === item.userId);
        const family = db.families.find((f) => f.id === item.familyId);
        return {
          id: item.id,
          familyId: item.familyId,
          familyName: family?.name || '未知家族',
          userId: item.userId,
          userName: user?.name || '未知成员',
          userPhone: user?.phone || '',
          content: item.content || '',
          memoryDate: item.memoryDate || '',
          createdAt: item.createdAt,
          imageCount: Array.isArray(item.images) ? item.images.length : 0,
          hasAudio: Boolean(item.audio?.url),
          moderationStatus: item.moderationStatus || 'approved',
          reviewRemark: item.reviewRemark || '',
          reviewedAt: item.reviewedAt || '',
          reviewedBy: item.reviewedBy || ''
        };
      });
    sendJson(res, 200, { moments: list });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/admin/moments/') && pathname.endsWith('/review')) {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const momentId = pathname.split('/')[4];
    const body = await readBody(req);
    const status = String(body.status || '');
    const reviewRemark = String(body.reviewRemark || '').trim();
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      sendJson(res, 400, { message: '审核状态非法' });
      return;
    }
    const moment = db.moments.find((item) => item.id === momentId);
    if (!moment) {
      sendJson(res, 404, { message: '动态不存在' });
      return;
    }
    moment.moderationStatus = status;
    moment.reviewRemark = reviewRemark;
    moment.reviewedAt = new Date().toISOString();
    moment.reviewedBy = admin.name;

    if (status === 'rejected') {
      const notificationId = nextId(db, 'notification', 'n');
      const created = {
        id: notificationId,
        familyId: moment.familyId,
        type: 'system',
        avatar: '',
        sender: '系统通知',
        action: '下架了一条动态',
        target: '',
        time: '刚刚',
        isRead: false,
        preview: reviewRemark || '该内容不符合社区规范',
        image: '',
        createdAt: new Date().toISOString()
      };
      db.notifications.unshift(created);
      broadcastFamilyEvent(moment.familyId, 'notification-updated', {
        action: 'create',
        notification: buildNotificationView(created),
        unreadCount: computeUnreadCount(db, moment.familyId)
      });
    }

    pushAdminLog(db, admin.id, `moment.review.${status}`, 'moment', momentId, reviewRemark);
    await saveDB(db);
    sendJson(res, 200, { ok: true, momentId, status });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/notices') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const notices = db.notices
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    sendJson(res, 200, { notices });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/admin/notices') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const body = await readBody(req);
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!title || !content) {
      sendJson(res, 400, { message: '公告标题和内容不能为空' });
      return;
    }
    const notice = {
      id: nextId(db, 'notice', 'nt'),
      title,
      content,
      createdBy: admin.name,
      createdAt: new Date().toISOString()
    };
    db.notices.unshift(notice);

    for (const family of db.families) {
      const created = {
        id: nextId(db, 'notification', 'n'),
        familyId: family.id,
        type: 'system',
        avatar: '',
        sender: '系统公告',
        action: title,
        target: '',
        time: '刚刚',
        isRead: false,
        preview: content.slice(0, 80),
        image: '',
        createdAt: new Date().toISOString()
      };
      db.notifications.unshift(created);
      broadcastFamilyEvent(family.id, 'notification-updated', {
        action: 'create',
        notification: buildNotificationView(created),
        unreadCount: computeUnreadCount(db, family.id)
      });
    }

    pushAdminLog(db, admin.id, 'notice.create', 'notice', notice.id, title);
    await saveDB(db);
    sendJson(res, 201, { notice });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/logs') {
    const admin = requireAdminAuth(req, res, db);
    if (!admin) return;
    const logs = db.adminLogs.slice(0, 200).map((item) => {
      const operator = db.adminUsers.find((u) => u.id === item.adminId);
      return {
        ...item,
        adminName: operator?.name || '未知管理员'
      };
    });
    sendJson(res, 200, { logs });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(req);
    const { phone, password } = body;
    const user = db.users.find((item) => item.phone === phone && item.password === password);
    if (!user) {
      sendJson(res, 401, { message: '手机号或密码错误' });
      return;
    }
    if (user.isBanned) {
      sendJson(res, 403, { message: '账号已被封禁，请联系管理员' });
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

  if (req.method === 'GET' && pathname === '/api/chat/conversations') {
    const user = requireAuth(req, res, db);
    if (!user) return;

    const changed = ensureChatData(db, user.familyId);
    if (changed) {
      await saveDB(db);
    }

    const conversations = db.chatConversations
      .filter((item) => item.familyId === user.familyId && isConversationMember(item, user.id))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((item) => buildConversationView(db, item, user.id));

    sendJson(res, 200, {
      conversations,
      totalUnread: conversations.reduce((sum, item) => sum + item.unreadCount, 0)
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/chat/messages') {
    const user = requireAuth(req, res, db);
    if (!user) return;

    const conversationId = url.searchParams.get('conversationId') || '';
    const after = url.searchParams.get('after') || '';
    const limitRaw = Number(url.searchParams.get('limit') || 0);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;
    if (!conversationId) {
      sendJson(res, 400, { message: '缺少会话 ID' });
      return;
    }

    const changed = ensureChatData(db, user.familyId);
    if (changed) {
      await saveDB(db);
    }

    const conversation = db.chatConversations.find(
      (item) => item.id === conversationId && item.familyId === user.familyId,
    );
    if (!conversation) {
      sendJson(res, 404, { message: '会话不存在' });
      return;
    }
    if (!isConversationMember(conversation, user.id)) {
      sendJson(res, 403, { message: '无权访问该会话' });
      return;
    }

    const afterTs = after ? new Date(after).getTime() : 0;
    const baseList = db.chatMessages
      .filter((item) => item.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const filtered = afterTs > 0
      ? baseList.filter((item) => new Date(item.createdAt).getTime() > afterTs)
      : baseList;
    const sliced = filtered.slice(-limit);
    const messages = sliced.map((item) => buildChatMessage(db, item));
    const cursor = sliced.length > 0 ? sliced[sliced.length - 1].createdAt : '';

    sendJson(res, 200, { messages, cursor });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/chat/messages') {
    const user = requireAuth(req, res, db);
    if (!user) return;

    const body = await readBody(req);
    const conversationId = String(body.conversationId || '');
    const content = String(body.content || '').trim();

    if (!conversationId) {
      sendJson(res, 400, { message: '缺少会话 ID' });
      return;
    }
    if (!content) {
      sendJson(res, 400, { message: '消息内容不能为空' });
      return;
    }

    const changed = ensureChatData(db, user.familyId);
    if (changed) {
      await saveDB(db);
    }

    const conversation = db.chatConversations.find(
      (item) => item.id === conversationId && item.familyId === user.familyId,
    );
    if (!conversation) {
      sendJson(res, 404, { message: '会话不存在' });
      return;
    }
    if (!isConversationMember(conversation, user.id)) {
      sendJson(res, 403, { message: '无权发送消息到该会话' });
      return;
    }

    const now = new Date().toISOString();
    const message = {
      id: nextId(db, 'chatMessage', 'cm'),
      familyId: user.familyId,
      conversationId,
      senderId: user.id,
      type: 'text',
      content,
      createdAt: now
    };
    db.chatMessages.push(message);

    if (!conversation.readStates || typeof conversation.readStates !== 'object') {
      conversation.readStates = {};
    }
    conversation.readStates[user.id] = now;
    conversation.lastMessageId = message.id;
    conversation.updatedAt = now;

    await saveDB(db);

    const view = buildChatMessage(db, message);
    broadcastChatEvent(user.familyId, {
      type: 'chat:message',
      data: {
        conversationId,
        message: view
      }
    });

    sendJson(res, 201, { message: view });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/chat/conversations/') && pathname.endsWith('/read')) {
    const user = requireAuth(req, res, db);
    if (!user) return;

    const conversationId = pathname.split('/')[4];
    if (!conversationId) {
      sendJson(res, 400, { message: '缺少会话 ID' });
      return;
    }

    const changed = ensureChatData(db, user.familyId);
    if (changed) {
      await saveDB(db);
    }

    const conversation = db.chatConversations.find(
      (item) => item.id === conversationId && item.familyId === user.familyId,
    );
    if (!conversation) {
      sendJson(res, 404, { message: '会话不存在' });
      return;
    }
    if (!isConversationMember(conversation, user.id)) {
      sendJson(res, 403, { message: '无权操作该会话' });
      return;
    }

    const lastMessage = getConversationLastMessage(db, conversation);
    const readAt = lastMessage?.createdAt || new Date().toISOString();
    if (!conversation.readStates || typeof conversation.readStates !== 'object') {
      conversation.readStates = {};
    }
    conversation.readStates[user.id] = readAt;

    await saveDB(db);

    broadcastChatEvent(user.familyId, {
      type: 'chat:conversation',
      data: {
        action: 'read',
        conversationId,
        userId: user.id,
        readAt
      }
    });

    sendJson(res, 200, {
      ok: true,
      conversationId,
      totalUnread: computeChatUnreadTotal(db, user.familyId, user.id)
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
      .filter((item) => item.moderationStatus !== 'rejected')
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
      createdAt: now,
      moderationStatus: 'approved',
      reviewRemark: '',
      reviewedAt: '',
      reviewedBy: ''
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
      await handleApi(req, res, pathname, url);
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

async function handleChatUpgrade(req, socket, head, wss) {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  if (url.pathname !== '/ws/chat') {
    return false;
  }

  const token = url.searchParams.get('token') || '';
  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return true;
  }

  try {
    const db = await loadDB();
    const adminDataChanged = ensureAdminData(db);
    if (adminDataChanged) {
      await saveDB(db);
    }
    const session = db.sessions.find((item) => item.token === token);
    const user = session ? db.users.find((item) => item.id === session.userId) : null;
    if (!user || user.isBanned) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return true;
    }

    const changed = ensureChatData(db, user.familyId);
    if (changed) {
      await saveDB(db);
    }

    req.chatUser = user;
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.chatUser = user;
      wss.emit('connection', ws, req);
    });
    return true;
  } catch {
    socket.destroy();
    return true;
  }
}

ensureUploadDir();

const server = http.createServer(requestHandler);
const chatWss = new WebSocketServer({ noServer: true });

chatWss.on('connection', (socket) => {
  const user = socket.chatUser;
  if (!user) {
    socket.close();
    return;
  }

  registerChatClient(user.familyId, socket);
  sendWs(socket, {
    type: 'chat:connected',
    data: {
      userId: user.id
    }
  });

  socket.on('message', async (raw) => {
    let payload = null;
    try {
      payload = JSON.parse(String(raw || '{}'));
    } catch {
      return;
    }

    if (!payload || typeof payload !== 'object') return;

    if (payload.type === 'chat:ping') {
      sendWs(socket, { type: 'chat:pong', data: { ts: Date.now() } });
      return;
    }

    if (payload.type === 'chat:mark-read') {
      const conversationId = String(payload?.data?.conversationId || '');
      if (!conversationId) return;

      try {
        const db = await loadDB();
        const conversation = db.chatConversations?.find(
          (item) => item.id === conversationId && item.familyId === user.familyId,
        );
        if (!conversation) return;
        if (!isConversationMember(conversation, user.id)) return;

        const lastMessage = getConversationLastMessage(db, conversation);
        const readAt = lastMessage?.createdAt || new Date().toISOString();
        if (!conversation.readStates || typeof conversation.readStates !== 'object') {
          conversation.readStates = {};
        }
        conversation.readStates[user.id] = readAt;
        await saveDB(db);

        broadcastChatEvent(user.familyId, {
          type: 'chat:conversation',
          data: {
            action: 'read',
            conversationId,
            userId: user.id,
            readAt
          }
        });
      } catch {
        // ignore message-level errors
      }
    }
  });

  socket.on('close', () => {
    unregisterChatClient(user.familyId, socket);
  });

  socket.on('error', () => {
    unregisterChatClient(user.familyId, socket);
  });
});

server.on('upgrade', (req, socket, head) => {
  handleChatUpgrade(req, socket, head, chatWss)
    .then((handled) => {
      if (!handled) {
        socket.destroy();
      }
    })
    .catch(() => {
      socket.destroy();
    });
});

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log('[server] 测试账号: 13800000000 / 123456');
});
