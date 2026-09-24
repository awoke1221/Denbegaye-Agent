import { io, Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;
let sharedSocketUrl: string | null = null;

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const storages = [window.localStorage, window.sessionStorage];
    for (const storage of storages) {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
        const rawValue = storage.getItem(key);
        if (!rawValue) continue;
        const session = JSON.parse(rawValue) as { access_token?: string };
        if (session.access_token) return session.access_token;
      }
    }
  } catch (error) {
    console.warn('[socket] failed to read Supabase session:', error);
  }

  return null;
}

export function getSharedSocket(backendUrl?: string, accessToken?: string | null): Socket {
  const url = backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const token = accessToken === undefined ? getStoredAccessToken() : accessToken;

  if (sharedSocket && sharedSocketUrl === url) {
    sharedSocket.auth = token ? { token } : {};
    if (token && !sharedSocket.connected) sharedSocket.connect();
    return sharedSocket;
  }

  if (sharedSocket) {
    try {
      sharedSocket.disconnect();
    } catch (error) {
      console.warn('Failed to disconnect previous shared socket', error);
    }
  }

  sharedSocketUrl = url;
  sharedSocket = io(url, {
    autoConnect: true,
    auth: token ? { token } : undefined,
  });

  sharedSocket.on('connect', () => console.log('[socket] connected:', sharedSocket?.id));
  sharedSocket.on('disconnect', () => console.log('[socket] disconnected'));
  sharedSocket.on('connect_error', err => console.log('[socket] error:', err.message));

  return sharedSocket;
}

export function getSharedSocketUrl(): string {
  return sharedSocketUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}
