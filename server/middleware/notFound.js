const notFoundHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Route not found'
  });
};

module.exports = {
  notFoundHandler
};
