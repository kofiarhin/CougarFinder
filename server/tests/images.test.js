const { createUserAndToken } = require('./helpers');

describe('Image management', () => {
  it('uploads and lists images', async () => {
    const { token } = await createUserAndToken();
    const res = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('image-one'), 'photo1.jpg');
    expect(res.status).toBe(201);
    expect(res.body.images.length).toBe(1);

    const listRes = await global.request
      .get('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.images.length).toBe(1);
  });

  it('prevents uploading more than four images', async () => {
    const { token } = await createUserAndToken();
    const firstUpload = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('1'), '1.jpg')
      .attach('images', Buffer.from('2'), '2.jpg')
      .attach('images', Buffer.from('3'), '3.jpg')
      .attach('images', Buffer.from('4'), '4.jpg');
    expect(firstUpload.status).toBe(201);
    const secondUpload = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('5'), '5.jpg');
    expect(secondUpload.status).toBe(400);
  });
});
