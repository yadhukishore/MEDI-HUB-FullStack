// Import required modules
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Product = require('./models/product');
const multer = require('multer');
const upload = require('./utils/multer');

const bodyParser = require('body-parser');
const adminController = require('./controllers/adminController');
const userAuthController = require('./controllers/userAuthController');
const  productController  = require('./controllers/productController');



// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'arjunreddy8921@gmail.com',
//     pass: 'jsds kafa dwcu mfce'
//   }
// });

// var mailOptions = {
//   from: 'arjunreddy8921@gmail.com',
//   to: 'yadhukishore37@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'Ntha mwone jadayana'
// };

// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });

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
  if (req.session.user) {
    res.locals.user = req.session.user;  // Make user data available in views
    next();
  } else {
    res.locals.user = null;  // Set user to null if not logged in
    next();
  }
};
// Use the checkLoggedIn middleware for all routes
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




// Route for displaying the forgot password form
app.get('/forgot_password', userAuthController.getForgotPassword);

// Route for handling the forgot password form submission
app.post('/forgot_password', userAuthController.postForgotPassword);

app.get('/verify_otp', userAuthController.getVerifyOTP);
app.post('/verify_otp', userAuthController.postVerifyOTP);

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
app.get('/search',userAuthController.searchProducts)
// Fetch Products from the Database
app.get('/', async (req, res) => {
  try {
    const products = await Product.find({ deleted: false });
    res.render('index', { products, isAdmin: req.session.user ? req.session.user.isAdmin : false });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.redirect('/login');
  }
})
// Add a new route for displaying multiple images and product details
app.get('/product/:productId',productController.getProduct )
// Signup route
app.get('/signup', userAuthController.getSignup);
// Signup route with OTP generation and verification
app.post('/signup', userAuthController.postSignup );


app.get('/login', userAuthController.getUserLogin);

app.post('/login', userAuthController.postUserLogin);



app.post('/logout', userAuthController.postUserLogout);



app.listen(3009, () => {
  console.log('Server started on port 3009');
});