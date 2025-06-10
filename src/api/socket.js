// src/socket.js
import { io } from 'socket.io-client';

// Use your backend URL or local dev URL
const socket = io('https://office.vrkkt.com/',{
  transports: ['websocket'], // Optional: force WebSocket only
});
// const socket = io('http://localhost:4000/',{
//   transports: ['websocket'], // Optional: force WebSocket only
// });

export default socket;
