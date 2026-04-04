import { io } from "socket.io-client";
import config from "../config";

let socket = null;

const listeners = new Map();
const complaintSubscriptions = new Set();

const getSocketUrl = () => config.socket.url;

const emitToListeners = (event, payload) => {
  const handlers = listeners.get(event);
  if (!handlers) return;

  handlers.forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`Socket listener failed for ${event}:`, error);
    }
  });
};

const bindCoreEvents = () => {
  if (!socket || socket.__smartCityBound) return;

  socket.on("connect", () => {
    complaintSubscriptions.forEach((complaintId) => {
      socket.emit("complaint:subscribe", complaintId);
    });
  });

  ["complaint:assigned", "complaint:status-changed"].forEach((event) => {
    socket.on(event, (payload) => emitToListeners(event, payload));
  });

  socket.__smartCityBound = true;
};

const connect = (token) => {
  if (!token) return null;

  if (socket) {
    if (socket.auth?.token !== token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect().connect();
      } else {
        socket.connect();
      }
    }
    bindCoreEvents();
    return socket;
  }

  socket = io(getSocketUrl(), {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: {
      token,
    },
  });

  bindCoreEvents();
  socket.connect();
  return socket;
};

const disconnect = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  listeners.clear();
  complaintSubscriptions.clear();
};

const on = (event, handler) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  const handlers = listeners.get(event);
  handlers.add(handler);

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      listeners.delete(event);
    }
  };
};

const subscribeToComplaint = (complaintId) => {
  if (!complaintId) return;
  complaintSubscriptions.add(complaintId);
  if (socket?.connected) {
    socket.emit("complaint:subscribe", complaintId);
  }
};

const unsubscribeFromComplaint = (complaintId) => {
  if (!complaintId) return;
  complaintSubscriptions.delete(complaintId);
  if (socket?.connected) {
    socket.emit("complaint:unsubscribe", complaintId);
  }
};

const isConnected = () => Boolean(socket?.connected);

export default {
  connect,
  disconnect,
  on,
  subscribeToComplaint,
  unsubscribeFromComplaint,
  isConnected,
};
