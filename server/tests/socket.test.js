const { io: Client } = require('socket.io-client');
const { Message } = require('../models/Message');
const { createUserAndToken } = require('./helpers');

jest.setTimeout(60000);

const waitForConnection = (socket) => new Promise((resolve) => socket.on('connect', resolve));
const waitForDisconnect = (socket) =>
  new Promise((resolve) => {
    if (socket.disconnected) {
      resolve();
      return;
    }
    socket.once('disconnect', resolve);
    socket.disconnect();
  });

describe('Socket messaging', () => {
  it('delivers realtime messages with acknowledgements and status updates', async () => {
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

    const newMessagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Message not received in time')), 5000);
      receiverSocket.once('message:new', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    const ack = await new Promise((resolve, reject) => {
      senderSocket.emit(
        'message:send',
        { toUserId: receiver.user._id.toString(), body: 'hello world' },
        (response) => {
          if (response.status === 'ok') {
            resolve(response);
          } else {
            reject(new Error(response.message));
          }
        }
      );
    });

    expect(ack.status).toBe('ok');
    const message = await newMessagePromise;
    expect(message.body).toBe('hello world');
    expect(message.fromUserId.toString()).toBe(sender.user._id.toString());

    const deliveredPromise = new Promise((resolve) => {
      senderSocket.once('message:delivered', resolve);
    });
    receiverSocket.emit('message:delivered', {
      messageId: message._id.toString(),
      toUserId: sender.user._id.toString()
    });
    const deliveredPayload = await deliveredPromise;
    expect(deliveredPayload.messageId).toBe(message._id.toString());

    const readPromise = new Promise((resolve) => {
      senderSocket.once('message:read', resolve);
    });
    receiverSocket.emit('message:read', {
      messageId: message._id.toString(),
      toUserId: sender.user._id.toString()
    });
    const readPayload = await readPromise;
    expect(readPayload.messageId).toBe(message._id.toString());

    const followUpPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Second message not received')), 5000);
      receiverSocket.once('message:new', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });
    senderSocket.emit('message:send', {
      toUserId: receiver.user._id.toString(),
      body: 'no ack message'
    });
    const followUpMessage = await followUpPromise;
    expect(followUpMessage.body).toBe('no ack message');

    const storedMessage = await Message.findById(message._id);
    expect(storedMessage.deliveredAt).toBeTruthy();
    expect(storedMessage.readAt).toBeTruthy();

    const offlinePromise = new Promise((resolve) => {
      senderSocket.on('presence:user', (payload) => {
        if (payload.status === 'offline') {
          resolve(payload);
        }
      });
    });

    await waitForDisconnect(receiverSocket);
    const presencePayload = await offlinePromise;
    expect(presencePayload.userId).toBe(receiver.user._id.toString());

    await waitForDisconnect(senderSocket);
  });

  it('rejects unauthorized socket connections', async () => {
    await expect(
      new Promise((resolve, reject) => {
        const client = new Client(global.__TEST_AGENT_URL__, {
          transports: ['websocket'],
          auth: { token: 'invalid' }
        });
        client.on('connect', () => reject(new Error('should not connect')));
        client.on('connect_error', (err) => {
          waitForDisconnect(client).then(() => resolve(err));
        });
      })
    ).resolves.toBeInstanceOf(Error);
  });

  it('accepts bearer tokens provided via headers and surfaces handler errors', async () => {
    const sender = await createUserAndToken({ email: 'header-sender@example.com' });
    const receiver = await createUserAndToken({ email: 'header-receiver@example.com' });
    const createSpy = jest.spyOn(Message, 'create').mockRejectedValue(new Error('storage failure'));

    const client = new Client(global.__TEST_AGENT_URL__, {
      transports: ['websocket'],
      auth: {},
      extraHeaders: { Authorization: `Bearer ${sender.token}` }
    });

    await waitForConnection(client);

    const ack = await new Promise((resolve) => {
      client.emit(
        'message:send',
        { toUserId: receiver.user._id.toString(), body: 'fails' },
        (response) => resolve(response)
      );
    });

    expect(ack.status).toBe('error');
    expect(ack.message).toBe('storage failure');

    client.emit('message:send', {
      toUserId: receiver.user._id.toString(),
      body: 'should not ack'
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    createSpy.mockRestore();
    await waitForDisconnect(client);
  });
});
