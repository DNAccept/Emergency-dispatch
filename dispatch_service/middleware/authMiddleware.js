const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied: Bearer syntax required' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or Expired Token' });
  }
};

module.exports = { authenticate };
