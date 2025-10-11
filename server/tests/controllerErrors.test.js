const { signup, login } = require('../controllers/authController');
const { listImages, uploadImages, setPrimaryImage, deleteImage } = require('../controllers/imageController');
const { browseMatches } = require('../controllers/matchController');
const { getMessages, listConversations } = require('../controllers/messageController');
const { getMe, updateProfile, sendLike } = require('../controllers/userController');
const { User } = require('../models/User');
const { Like } = require('../models/Like');
const { Message } = require('../models/Message');

describe('Controller error propagation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards signup failures to the error handler', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('signup failed'));
    const next = jest.fn();
    const res = { status: jest.fn(() => res), json: jest.fn() };

    await signup({ body: {} }, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('forwards login failures to the error handler', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('login failed'));
    const next = jest.fn();
    const res = { status: jest.fn(() => res), json: jest.fn() };

    await login({ body: {} }, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('propagates image lookup errors', async () => {
    jest.spyOn(User, 'findById').mockRejectedValue(new Error('image load failed'));
    const next = jest.fn();

    await listImages({ user: { _id: '1' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    await uploadImages({ user: { _id: '1' }, files: [] }, { status: jest.fn(() => ({ json: jest.fn() })) }, next);
    expect(next).toHaveBeenCalledTimes(2);

    await setPrimaryImage({ user: { _id: '1' }, params: { imageId: '2' } }, {}, next);
    expect(next).toHaveBeenCalledTimes(3);

    await deleteImage({ user: { _id: '1' }, params: { imageId: '2' } }, {}, next);
    expect(next).toHaveBeenCalledTimes(4);
  });

  it('handles getMe serialization failures', async () => {
    const next = jest.fn();
    const res = { json: () => {
      throw new Error('serialize fail');
    } };

    await getMe({ user: {} }, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles updateProfile and sendLike failures', async () => {
    const next = jest.fn();
    const saveError = jest.fn(() => {
      throw new Error('persist fail');
    });

    await updateProfile({ user: { save: saveError } }, { json: jest.fn() }, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    jest.spyOn(Like, 'findOneAndUpdate').mockRejectedValue(new Error('like fail'));
    await sendLike({ user: { _id: { toString: () => '1' } }, body: { targetUserId: '2' } }, { status: jest.fn(() => ({ json: jest.fn() })) }, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('propagates match errors', async () => {
    jest.spyOn(User, 'find').mockImplementation(() => {
      throw new Error('match fail');
    });
    const next = jest.fn();

    await browseMatches({ query: {}, user: { _id: '1', location: null, profile: { preferences: {} } } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('builds default match filters for zero-valued inputs', async () => {
    const limitMock = jest.fn().mockResolvedValue([]);
    const nearMock = jest.fn().mockReturnValue({ limit: limitMock });
    const whereMock = jest.fn(() => ({ near: nearMock }));
    const selectMock = jest.fn(() => ({ where: whereMock, limit: limitMock }));
    let capturedFilters;
    jest.spyOn(User, 'find').mockImplementation((filters) => {
      capturedFilters = filters;
      return { select: selectMock };
    });

    const res = { json: jest.fn() };
    await browseMatches(
      {
        query: { ageMin: '0', ageMax: '0', distance: '0' },
        user: {
          _id: '1',
          location: { coordinates: [0, 0] },
          profile: { preferences: { distance: 25 } }
        }
      },
      res,
      jest.fn()
    );

    expect(res.json).toHaveBeenCalledWith({ matches: [] });
    expect(capturedFilters.dateOfBirth).toBeDefined();
    expect(nearMock).toHaveBeenCalled();
  });

  it('applies explicit age filters when provided', async () => {
    const limitMock = jest.fn().mockResolvedValue([]);
    let capturedFilters;
    jest.spyOn(User, 'find').mockImplementation((filters) => {
      capturedFilters = filters;
      return { select: () => ({ limit: limitMock }) };
    });

    const res = { json: jest.fn() };
    await browseMatches(
      {
        query: { ageMin: '30', ageMax: '35' },
        user: { _id: '1', location: null }
      },
      res,
      jest.fn()
    );

    expect(res.json).toHaveBeenCalledWith({ matches: [] });
    expect(capturedFilters.dateOfBirth.$gte).toBeDefined();
    expect(capturedFilters.dateOfBirth.$lte).toBeDefined();
  });

  it('propagates message controller failures', async () => {
    jest.spyOn(Message, 'find').mockImplementation(() => ({
      sort: () => {
        throw new Error('message fail');
      }
    }));
    const next = jest.fn();
    const req = { user: { _id: '1' }, query: { withUserId: '2' } };

    await getMessages(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    jest.spyOn(Message, 'aggregate').mockRejectedValue(new Error('aggregate fail'));
    await listConversations({ user: { _id: '1' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
