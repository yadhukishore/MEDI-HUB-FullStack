const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 3009;

const dbConnect= require("./config/dbConnect");

const errorHandlerMiddleware = require('./middleware/errorHandler');
const adminRoutes = require('./routes/admin/adminRoutes');
const userRoutes = require('./routes/user/userRoutes');
dbConnect();


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const store = new MongoStore({
  uri:process.env.MONGO_ATLAS_URL,
  collection: 'sessions'
});

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: store
}));
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Custom middleware to check if the user is logged in
const checkLoggedIn = (req, res, next) => {
  // Exclude the login route from the check
  if (req.path === '/login') {
    next();
  } else if (req.session.user) {
    res.locals.user = req.session.user; 
    next();
  } else {
    res.locals.user = null;  
    next();
  }
};
app.use(checkLoggedIn);


const disableCache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};


app.use(disableCache);

app.use('/', adminRoutes);
app.use('/', userRoutes);

//ErrorHandler
app.use(errorHandlerMiddleware.notFound);
app.use(errorHandlerMiddleware.errorHandler);

app.listen(PORT, () => {
  console.log(`Server started on port -> ${PORT}`);
});
