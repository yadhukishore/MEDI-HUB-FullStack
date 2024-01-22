// errorMiddleware.js
exports.handleError = async(err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error', { statusCode: 500, message: 'Internal Server Error' });
};

