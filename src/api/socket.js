// src/socket.js
import { io } from 'socket.io-client';

// Use your backend URL or local dev URL

const socket = io({
  transports: ['websocket'], // optional
  withCredentials: true,
});

// const socket = io('http://localhost:4000/',{
//   transports: ['websocket'], // Optional: force WebSocket only
// });

export default socket;
