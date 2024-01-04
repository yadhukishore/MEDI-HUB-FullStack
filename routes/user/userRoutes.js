//routes/user/userRoutes.js
const express = require('express');
const router = express.Router();
const userCartController = require('../../controllers/userCartController');
const userAccController = require('../../controllers/userAccController');
const userOrderController = require('../../controllers/userOrderController');
const productController = require('../../controllers/productController');
const userCheckoutController =require('../../controllers/userCheckoutController');
const userAuthController = require('../../controllers/userAuthController');


//getHome
router.get('/',productController.getHome);
router.get('/search',productController.searchProducts)

router.get('/login', userAuthController.getUserLogin);

router.post('/login', userAuthController.postUserLogin);

// Signup route
router.get('/signup', userAuthController.getSignup);
// Signup route with OTP generation and verification
router.post('/signup', userAuthController.postSignup );

// Route for displaying the forgot password form
router.get('/forgot_password', userAuthController.getForgotPassword);

// Route for handling the forgot password form submission
router.post('/forgot_password', userAuthController.postForgotPassword);

router.get('/verify_otp', userAuthController.getVerifyOTP);
router.post('/verify_otp', userAuthController.postVerifyOTP);
router.post('/resend_otp', userAuthController.postResendOTP)
// Route for displaying the reset password form
router.get('/reset_password/:email',userAuthController.getResetPassword);

// Route for handling the reset password form submission
router.post('/reset_password/:email', userAuthController.postResetPassword);


// User cart routes
router.get('/userCart', userCartController.getUserCart);
router.get('/add-to-cart/:productId', userCartController.addToCart);
router.post('/update-product-quantity', userCartController.updateProductQuantity);
router.get('/get-updated-total-price', userCartController.updateTotalPrice);
router.get('/get-updated-prices', userCartController.getUpdatedPrices);
router.post('/removeFromCart/:productId', userCartController.removeFromCart);

// User account routes
router.get('/userAccount', userAccController.getAccountDetails);
router.post('/userAccount', userAccController.postAccountDetails);
router.post('/changePassword', userAccController.postChangePassword);
router.get('/userAddress', userAccController.getUserAddress);
router.get('/add_address', userAccController.getAddAddress);
router.post('/add_address', userAccController.postAddAddress);
router.post('/userAddress/deleteAddress/:addressId', userAccController.deleteAddress);
router.get('/userAddress/editAddress/:addressId', userAccController.getEditAddress);
router.post('/userAddress/editAddress/:addressId', userAccController.postEditAddress);

// User checkout route
router.get('/userCheckout', userCheckoutController.verifyLogin ,userCheckoutController.getCheckoutPage);
router.post('/processOrder',userOrderController.verifyLoginOrderController, userOrderController.postProcessOrder);
router.get('/success',userOrderController.verifyLoginOrderController, userOrderController.successRouter);
router.get('/myOrders', userOrderController.verifyLoginOrderController,userOrderController.getMyOrders);
router.post('/saveDefaultAddress',userCheckoutController.verifyLogin,userCheckoutController.saveDefaultAddress);
router.post('/verifyPayment',userOrderController.verifyPayment);
router.post('/applyCoupon',userCheckoutController.verifyLogin,userCheckoutController.applyCoupon);
// Product routes
router.get('/product/:productId', productController.getProduct);
router.get('/allMedicines',productController.getAllMedicines)
router.post('/cancel-order/:orderId', userOrderController.cancelOrder);
router.post('/submit-return-request/:orderId', userOrderController.submitReturnRequest);


// User authentication routes
router.post('/logout', userAuthController.postUserLogout);

module.exports = router;
