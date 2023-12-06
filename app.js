// Import required modules
const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Product = require('./models/product');
const multer = require('multer');
const upload = require('./utils/multer');
const path = require('path');

const bodyParser = require('body-parser');
const adminController = require('./controllers/adminController');
const userAuthController = require('./controllers/userAuthController');
const  productController  = require('./controllers/productController');
const  userCartController = require('./controllers/userCartController');




// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/medibase').then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

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
app.set('views', path.join(__dirname, 'views'));
// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

// Parse request bodies
app.use(express.urlencoded({ extended: true }));
// Add this middleware to handle back button behavior
// const handleBackButton = (req, res, next) => {
//   res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//   next();
// };
// app.use(handleBackButton)

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




// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/'); // Set the destination folder for uploaded images
//   },
//   filename: (req, file, cb) => {
//     // Set the filename to be unique, for example, you can use the current timestamp
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });
// // Create the multer instance with the storage configuration
// const upload = multer({ storage: storage });


app.get('/login', userAuthController.getUserLogin);

app.post('/login', userAuthController.postUserLogin);

// Signup route
app.get('/signup', userAuthController.getSignup);
// Signup route with OTP generation and verification
app.post('/signup', userAuthController.postSignup );

// Route for displaying the forgot password form
app.get('/forgot_password', userAuthController.getForgotPassword);

// Route for handling the forgot password form submission
app.post('/forgot_password', userAuthController.postForgotPassword);

app.get('/verify_otp', userAuthController.getVerifyOTP);
app.post('/verify_otp', userAuthController.postVerifyOTP);
app.post('/resend_otp', userAuthController.postResendOTP)
// Route for displaying the reset password form
app.get('/reset_password/:email',userAuthController.getResetPassword);

// Route for handling the reset password form submission
app.post('/reset_password/:email', userAuthController.postResetPassword);

// Admin section routes
app.get('/admin/admin_login', adminController.showAdminLogin);

app.post('/admin/login', adminController.postAdminLogin);

// Admin section routes
app.get('/admin', adminController.getAdminRoute)

app.get('/admin/add_product',adminController.getAdminAddProduct)
app.post('/admin/add_product', upload.array('productImages', 12), adminController.postAdminAddProduct);
app.get('/admin/edit_product/:id',adminController.getAdminEdit)
app.post('/admin/edit_product/:id', upload.array('images'), adminController.postAdminEdit);
// Logout route for admin
app.post('/admin/logout',adminController.postAdminLogout)
// Soft delete route
app.get('/admin/delete_product/:id', adminController.getAdminDelete)

app.get('/admin/userList',adminController.getUserList);
app.get('/admin/block_user/:id',adminController.blockUser);
app.get('/admin/unblock_user/:id',adminController.unblockUser);
app.get('/admin/add_user',adminController.getAdminAddUser);
app.post('/admin/add_user',adminController.postAdminAddUser);
app.get('/admin/category_list',adminController.getCategoryList);
app.get('/search',productController.searchProducts)
// Fetch Products from the Database
app.get('/',  async (req, res) => {
  try {
    const products = await Product.find({ deleted: false });
    res.render('index', { products, isAdmin: req.session.user ? req.session.user.isAdmin : false });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.redirect('/login');
  }
})

app.get('/product/:productId',productController.getProduct )
app.get('/add-to-cart/:productId',userCartController.addToCart)
app.get('/userCart',userCartController.getUserCart)



app.post('/logout', userAuthController.postUserLogout);



app.listen(3009, () => {
  console.log('Server started on port 3009');
});
