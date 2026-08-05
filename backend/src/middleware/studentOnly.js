const studentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Access denied. Students only.' });
  }
  next();
};

module.exports = studentOnly;
