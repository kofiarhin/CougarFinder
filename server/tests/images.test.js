const { User } = require('../models/User');
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

  it('allows selecting and removing images', async () => {
    const { token, user } = await createUserAndToken();
    const uploadRes = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('1'), '1.jpg')
      .attach('images', Buffer.from('2'), '2.jpg');

    expect(uploadRes.status).toBe(201);
    const [firstImage, secondImage] = uploadRes.body.images;

    const setPrimaryRes = await global.request
      .patch(`/api/users/me/images/${secondImage._id}/primary`)
      .set('Authorization', `Bearer ${token}`);

    expect(setPrimaryRes.status).toBe(200);
    const updatedImages = setPrimaryRes.body.images;
    expect(updatedImages.find((img) => img._id === secondImage._id).isPrimary).toBe(true);
    expect(updatedImages.find((img) => img._id === firstImage._id).isPrimary).toBe(false);

    const deleteRes = await global.request
      .delete(`/api/users/me/images/${secondImage._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.images).toHaveLength(1);
    expect(deleteRes.body.images[0]._id).toBe(firstImage._id);

    const refreshed = await User.findById(user._id);
    expect(refreshed.hasPrimary).toBe(false);
  });

  it('returns 404 for missing images when updating or deleting', async () => {
    const { token } = await createUserAndToken();
    const missingId = '507f1f77bcf86cd799439011';

    const setPrimaryRes = await global.request
      .patch(`/api/users/me/images/${missingId}/primary`)
      .set('Authorization', `Bearer ${token}`);

    expect(setPrimaryRes.status).toBe(404);
    expect(setPrimaryRes.body.message).toBe('Image not found');

    const deleteRes = await global.request
      .delete(`/api/users/me/images/${missingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body.message).toBe('Image not found');
  });

  it('preserves the current primary image when adding more uploads', async () => {
    const { token } = await createUserAndToken();

    const initialUpload = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('1'), '1.jpg');

    expect(initialUpload.status).toBe(201);
    expect(initialUpload.body.images[0].isPrimary).toBe(true);

    const secondUpload = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('2'), '2.jpg');

    expect(secondUpload.status).toBe(201);
    expect(secondUpload.body.images).toHaveLength(2);
    expect(secondUpload.body.images[0].isPrimary).toBe(true);
    expect(secondUpload.body.images[1].isPrimary).toBe(false);
  });

  it('maintains primary state when removing non-primary images', async () => {
    const { token, user } = await createUserAndToken();
    const uploadRes = await global.request
      .post('/api/users/me/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('1'), '1.jpg')
      .attach('images', Buffer.from('2'), '2.jpg');

    const [firstImage, secondImage] = uploadRes.body.images;

    await global.request
      .patch(`/api/users/me/images/${secondImage._id}/primary`)
      .set('Authorization', `Bearer ${token}`);

    const deleteRes = await global.request
      .delete(`/api/users/me/images/${firstImage._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.images).toHaveLength(1);
    expect(deleteRes.body.images[0]._id).toBe(secondImage._id);
    expect(deleteRes.body.images[0].isPrimary).toBe(true);

    const refreshed = await User.findById(user._id);
    expect(refreshed.hasPrimary).toBe(true);
  });
});
