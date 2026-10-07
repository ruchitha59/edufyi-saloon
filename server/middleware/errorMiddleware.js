export const notFound = (request, response, next) => {
  const error = new Error(`Not Found - ${request.originalUrl}`);
  response.status(404);
  next(error);
};

export const errorHandler = (error, _request, response, _next) => {
  const statusCode = error.statusCode || (response.statusCode === 200 ? 500 : response.statusCode);
  const payload = {
    success: false,
    message: error.message || 'Server Error',
  };

  if (error.code) {
    payload.code = error.code;
  }

  response.status(statusCode).json(payload);
};
