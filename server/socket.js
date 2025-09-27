const { Server } = require('socket.io');
const { verifySocketToken } = require('./utils/token');
const { Message } = require('./models/Message');
const { User } = require('./models/User');
const { buildConvoId } = require('./utils/conversation');
const { buildSocketCorsOptions } = require('./utils/cors');

const activeUsers = new Map();

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: buildSocketCorsOptions()
  });

  io.use((socket, next) => {
    const headerToken = socket.handshake.headers?.authorization || '';
    const bearerToken = headerToken.startsWith('Bearer ')
      ? headerToken.replace('Bearer ', '')
      : null;
    const token = socket.handshake.auth?.token || bearerToken;
    const payload = verifySocketToken(token);

    if (!payload) {
      next(new Error('Unauthorized'));
      return;
    }

    socket.user = payload;
    next();
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    activeUsers.set(userId, { socketId: socket.id, lastSeen: new Date() });
    await User.findByIdAndUpdate(userId, {
      presence: { status: 'online', lastSeen: new Date() }
    });
    io.emit('presence:user', { userId, status: 'online' });

    socket.on('message:send', async (payload, callback) => {
      try {
        const { toUserId, body } = payload;
        const convoId = buildConvoId(userId, toUserId);
        const message = await Message.create({
          convoId,
          fromUserId: userId,
          toUserId,
          body
        });
        const emitPayload = { ...message.toObject(), createdAt: message.createdAt };
        io.to(`user:${userId}`).to(`user:${toUserId}`).emit('message:new', emitPayload);
        if (callback) {
          callback({ status: 'ok', message: emitPayload });
        }
      } catch (error) {
        if (callback) {
          callback({ status: 'error', message: error.message });
        }
      }
    });

    socket.on('message:delivered', async ({ messageId, toUserId }) => {
      await Message.findByIdAndUpdate(messageId, { deliveredAt: new Date() });
      io.to(`user:${toUserId}`).emit('message:delivered', { messageId });
    });

    socket.on('message:read', async ({ messageId, toUserId }) => {
      await Message.findByIdAndUpdate(messageId, { readAt: new Date() });
      io.to(`user:${toUserId}`).emit('message:read', { messageId });
    });

    socket.on('disconnect', async () => {
      activeUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        presence: { status: 'offline', lastSeen: new Date() }
      });
      io.emit('presence:user', { userId, status: 'offline' });
    });
  });

  return io;
};

module.exports = {
  initSocket
};
