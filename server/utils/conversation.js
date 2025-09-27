const buildConvoId = (userIdA, userIdB) => {
  const sorted = [userIdA.toString(), userIdB.toString()].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

module.exports = {
  buildConvoId
};
