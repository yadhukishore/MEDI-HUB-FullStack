// Import required modules
const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const path = require('path');

const dbConnect= require("./config/dbConnect")

const errorHandlerMiddleware = require('./middleware/errorHandler');
const adminRoutes = require('./routes/admin/adminRoutes');
const userRoutes = require('./routes/user/userRoutes');
dbConnect();

// // Connect to MongoDB
// mongoose.connect('mongodb://127.0.0.1:27017/medibase').then(() => {
//   console.log('Connected to MongoDB');
// }).catch(err => {
//   console.error('Error connecting to MongoDB:', err);
//   process.exit(1);
// });

// Create the Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware with MongoDB session store
const store = new MongoStore({
  uri: 'mongodb://127.0.0.1:27017/medibase',
  collection: 'sessions'
});

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: store
}));
app.use(flash());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static('public'));

// Parse request bodies
app.use(express.urlencoded({ extended: true }));

// Custom middleware to check if the user is logged in
const checkLoggedIn = (req, res, next) => {
  // Exclude the login route from the check
  if (req.path === '/login') {
    next();
  } else if (req.session.user) {
    res.locals.user = req.session.user;  // Make user data available in views
    next();
  } else {
    res.locals.user = null;  // Set user to null if not logged in
    next();
  }
};
app.use(checkLoggedIn);



// Custom middleware to disable caching
const disableCache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

// Use the disableCache middleware for all routes
app.use(disableCache);

app.use('/', adminRoutes);
app.use('/', userRoutes);

// //ErrorHandler
// app.use(errorHandlerMiddleware.notFound);
// app.use(errorHandlerMiddleware.errorHandler);

app.listen(3009, () => {
  console.log('Server started on port 3009');
});
