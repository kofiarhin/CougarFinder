const { io: Client } = require('socket.io-client');
const { createUserAndToken } = require('./helpers');

const waitForConnection = (socket) => new Promise((resolve) => socket.on('connect', resolve));

describe('Socket messaging', () => {
  it('delivers realtime messages', async () => {
    const sender = await createUserAndToken({ email: 'sender@example.com' });
    const receiver = await createUserAndToken({ email: 'receiver@example.com' });

    const senderSocket = new Client(global.__TEST_AGENT_URL__, {
      auth: { token: sender.token },
      transports: ['websocket']
    });
    const receiverSocket = new Client(global.__TEST_AGENT_URL__, {
      auth: { token: receiver.token },
      transports: ['websocket']
    });

    await Promise.all([waitForConnection(senderSocket), waitForConnection(receiverSocket)]);

    const messagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message not received in time'));
      }, 5000);
      receiverSocket.on('message:new', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    senderSocket.emit('message:send', {
      toUserId: receiver.user._id.toString(),
      body: 'hello world'
    });

    const message = await messagePromise;
    expect(message.body).toBe('hello world');
    expect(message.fromUserId.toString()).toBe(sender.user._id.toString());

    senderSocket.disconnect();
    receiverSocket.disconnect();
  });
});
