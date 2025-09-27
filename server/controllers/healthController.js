const getHealth = (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'CougarFinder'
  });
};

module.exports = {
  getHealth
};
