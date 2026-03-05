import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, type CameraPermissionState } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { trackEvent } from '../telemetry';

const PUSH_TOKEN_KEY = 'heritage.push.token';
let pushBootstrapped = false;

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function hasPermission(state?: CameraPermissionState) {
  return state === 'granted' || state === 'limited';
}

function inferFileNameFromPath(webPath: string, fallbackExt = '.jpg') {
  const pathName = webPath.split('?')[0] || '';
  const rawName = pathName.split('/').pop() || '';
  if (rawName.includes('.')) return rawName;
  return `media-${Date.now()}${fallbackExt}`;
}

async function webPathToFile(webPath: string, fileName?: string, mimeType?: string) {
  const res = await fetch(webPath);
  if (!res.ok) {
    throw new Error('读取系统媒体失败');
  }
  const blob = await res.blob();
  const ext = mimeType?.includes('png') ? '.png' : '.jpg';
  const resolvedName = fileName || inferFileNameFromPath(webPath, ext);
  return new File([blob], resolvedName, { type: blob.type || mimeType || 'application/octet-stream' });
}

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function getPlatform() {
  return Capacitor.getPlatform();
}

export function resolveApiBaseUrl() {
  const webBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '');
  if (webBase) return webBase;

  if (!isNativeApp()) return '';

  const nativeBase = trimTrailingSlash(import.meta.env.VITE_NATIVE_API_BASE_URL || '');
  if (nativeBase) return nativeBase;

  // Android 模拟器访问宿主机 localhost 需要固定映射地址。
  if (getPlatform() === 'android') {
    return 'http://10.0.2.2:3001';
  }
  return 'http://localhost:3001';
}

export function withApiBase(path: string) {
  if (!path) return path;
  if (isAbsoluteHttpUrl(path)) return path;
  const base = resolveApiBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveAssetUrl(url: string) {
  if (!url) return url;
  if (isAbsoluteHttpUrl(url)) return url;
  return withApiBase(url);
}

export async function pickImagesFromGallery(limit = 9) {
  if (!isNativeApp()) return [] as File[];

  const current = await Camera.checkPermissions();
  if (!hasPermission(current.photos)) {
    const requested = await Camera.requestPermissions({ permissions: ['photos'] });
    if (!hasPermission(requested.photos)) {
      throw new Error('未获得相册权限，请在系统设置中开启后重试');
    }
  }

  const picked = await Camera.pickImages({
    quality: 85,
    limit,
  });
  const files = await Promise.all(
    (picked.photos || [])
      .filter((photo) => Boolean(photo.webPath))
      .map((photo) => webPathToFile(photo.webPath || '', undefined, photo.format ? `image/${photo.format}` : undefined)),
  );
  return files;
}

export async function takePhotoFromCamera() {
  if (!isNativeApp()) return null as File | null;

  const current = await Camera.checkPermissions();
  if (!hasPermission(current.camera)) {
    const requested = await Camera.requestPermissions({ permissions: ['camera'] });
    if (!hasPermission(requested.camera)) {
      throw new Error('未获得相机权限，请在系统设置中开启后重试');
    }
  }

  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    quality: 85,
    resultType: CameraResultType.Uri,
  });

  if (!photo.webPath) return null;
  return webPathToFile(photo.webPath, undefined, photo.format ? `image/${photo.format}` : undefined);
}

export async function ensureMicrophonePermission() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('当前设备不支持录音功能');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
  return true;
}

export async function bootstrapPushNotifications() {
  if (!isNativeApp() || pushBootstrapped) {
    return;
  }

  pushBootstrapped = true;
  try {
    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', (token) => {
      localStorage.setItem(PUSH_TOKEN_KEY, token.value);
      trackEvent('push.registration.success');
    });

    PushNotifications.addListener('registrationError', (event) => {
      trackEvent('push.registration.error', { message: event.error });
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      trackEvent('push.received', { id: notification.id || '' });
    });

    const permissionStatus = await PushNotifications.checkPermissions();
    let receive = permissionStatus.receive;
    if (receive === 'prompt') {
      const requested = await PushNotifications.requestPermissions();
      receive = requested.receive;
    }

    if (receive !== 'granted') {
      trackEvent('push.permission.denied', { status: receive });
      return;
    }

    await PushNotifications.register();
    trackEvent('push.registration.start');
  } catch (error) {
    pushBootstrapped = false;
    const message = error instanceof Error ? error.message : '推送初始化失败';
    trackEvent('push.bootstrap.failed', { message });
  }
}

export function getCachedPushToken() {
  return localStorage.getItem(PUSH_TOKEN_KEY) || '';
}
