import { io, Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;
let sharedSocketUrl: string | null = null;

export function getSharedSocket(backendUrl?: string): Socket {
  const url = backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  if (sharedSocket && sharedSocketUrl === url) {
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
  });

  sharedSocket.on('connect', () => console.log('[socket] connected:', sharedSocket?.id));
  sharedSocket.on('disconnect', () => console.log('[socket] disconnected'));
  sharedSocket.on('connect_error', err => console.log('[socket] error:', err.message));

  return sharedSocket;
}

export function getSharedSocketUrl(): string {
  return sharedSocketUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}
