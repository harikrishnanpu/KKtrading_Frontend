// src/socket.js
import { io } from 'socket.io-client';

// Use your backend URL or local dev URL
const socket = io('http://localhost:4000/');

export default socket;
