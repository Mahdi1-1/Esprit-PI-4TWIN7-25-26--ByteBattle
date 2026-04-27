import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // On connecte à la main post-login
});

export const connectSocket = async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      socket.auth = { token };
      socket.connect();
    }
  } catch (e) {
    console.error('Socket connection error:', e);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
