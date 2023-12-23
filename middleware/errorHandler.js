// utils/errorHandler.js

//middleware

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404).render('./error.ejs', { statusCode: 404, message: 'Not Found', user: true });
    next(error);
  }
  
  const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).render('error', { statusCode, message: err.message, user: true });
  }
  
  module.exports = { notFound, errorHandler };
  