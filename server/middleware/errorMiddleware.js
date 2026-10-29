import multer from 'multer';

// 404 for unknown API routes
export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found - ${req.originalUrl}` });
};

// Central error handler - maps known error types to proper status codes
// and never leaks stack traces outside of development
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = `${Object.keys(err.keyValue || {}).join(', ') || 'Value'} already exists`;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
  }

  if (statusCode >= 500) {
    console.error(err);
    message = 'Server Error';
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
