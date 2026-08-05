// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.code === '23505') {
    // PostgreSQL unique violation
    return res.status(409).json({ success: false, message: 'Record already exists' });
  }
  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    return res.status(400).json({ success: false, message: 'Referenced record not found' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
