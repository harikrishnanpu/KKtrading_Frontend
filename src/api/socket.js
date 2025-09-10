// src/socket.js
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_APP_API_URL ,{
  transports: ['websocket'],
  withCredentials: true,
});


export default socket;
