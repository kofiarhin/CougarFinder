const dayjs = require('dayjs');
const { Message } = require('../models/Message');
const { buildConvoId } = require('../utils/conversation');
const { createUserAndToken } = require('./helpers');

describe('Message HTTP endpoints', () => {
  it('requires a target user when fetching message threads', async () => {
    const { token } = await createUserAndToken();

    const response = await global.request
      .get('/api/messages/thread')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('withUserId is required');
  });

  it('returns ordered messages and conversation summaries', async () => {
    const { user: viewer, token } = await createUserAndToken({ email: 'viewer@example.com' });
    const { user: partner } = await createUserAndToken({ email: 'partner@example.com' });
    const { user: stranger } = await createUserAndToken({ email: 'stranger@example.com' });

    const convoId = buildConvoId(viewer._id, partner._id);
    const otherConvoId = buildConvoId(viewer._id, stranger._id);

    const firstMessage = await Message.create({
      convoId,
      fromUserId: viewer._id,
      toUserId: partner._id,
      body: 'Hey there!',
      createdAt: dayjs().subtract(5, 'minute').toDate()
    });
    const secondMessage = await Message.create({
      convoId,
      fromUserId: partner._id,
      toUserId: viewer._id,
      body: 'Hi!'
    });
    await Message.create({
      convoId: otherConvoId,
      fromUserId: stranger._id,
      toUserId: viewer._id,
      body: 'Hello there'
    });

    const threadResponse = await global.request
      .get('/api/messages/thread')
      .set('Authorization', `Bearer ${token}`)
      .query({ withUserId: partner._id.toString(), limit: 10 });

    expect(threadResponse.status).toBe(200);
    expect(threadResponse.body.messages).toHaveLength(2);
    expect(threadResponse.body.messages[0]._id).toBe(firstMessage._id.toString());
    expect(threadResponse.body.messages[1]._id).toBe(secondMessage._id.toString());

    const convoResponse = await global.request
      .get('/api/messages')
      .set('Authorization', `Bearer ${token}`);

    expect(convoResponse.status).toBe(200);
    const conversations = convoResponse.body.conversations;
    const convoIds = conversations.map((convo) => convo._id);
    expect(convoIds).toContain(convoId);
    expect(convoIds).toContain(otherConvoId);
    const otherConvo = conversations.find((convo) => convo._id === otherConvoId);
    expect(otherConvo.lastMessage.body).toBe('Hello there');
  });
});
