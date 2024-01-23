//controller/userCheckoutController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const Coupon = require('../models/coupenSchema');
const Order = require("../models/order");
// Middleware
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to view your account details.');
        res.redirect('/login');
    }
};
exports.verifyLogin = verifyLogin;

// Helper function to calculate the total price from the user's cart

 function calculateTotalPrice(cart, coupon) {
    let totalPrice = 0;
    
    if (cart && cart.length > 0) {
        cart.forEach(item => {
            totalPrice += item.product.price * item.quantity;
        });
    }
 
     if (coupon && coupon.is_delete !== true) {
        totalPrice -= coupon.discount;
    }
 console.log("Totalprice in fun:",totalPrice);
    return totalPrice;
 }
exports.calculateTotalPrice = calculateTotalPrice;



function isValidCoupon(cart, totalPrice, coupon) {

    const currentDate = new Date();
    if (currentDate < coupon.start_date || currentDate > coupon.exp_date) {
        console.log("Coupon date is invalid!!");
        return false;
    }
 
    if (totalPrice < coupon.min_amount) {
        console.log("Coupon amount is not matching the minimum amount condition!!");
        return false;
    }

    if (coupon.used_count >=1) {
        console.log("User exceeded the maximum usage count of the coupon");
        return false;
    }
 
    return true;
 }



// Helper function to apply coupon to coupon details and update usage count
async function applyCouponToCoupon(coupon, userId) {

    coupon.user_list.push(userId);
    coupon.used_count += 1;

   
    if (coupon.used_count >2) {
        coupon.is_delete = true;
    }

    await coupon.save();

    return coupon;
}

exports.applyCoupon =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const couponCode = req.body.couponCode;
        

        const user = await User.findById(userId).populate('cart.product');
        const selectedCoupon = await Coupon.findOne({ coupon_code: couponCode });

        const totalPrice = calculateTotalPrice(user.cart);

        if (selectedCoupon && isValidCoupon(user.cart, totalPrice, selectedCoupon)) {
            const updatedCoupon = await applyCouponToCoupon(selectedCoupon, userId);
            req.session.appliedCoupon = updatedCoupon;
            console.log("Coupon applied successfully!\n", updatedCoupon);
            req.flash('success', 'Coupon applied successfully!');
        } else {
            console.error("Coupon is not applicable or invalid!");
            req.flash('error', 'Invalid or not applicable coupon. Please check the coupon code and try again.');

             req.session.appliedCoupon = null;
        }
        
 
        res.redirect('/userCheckout');
    } catch (error) {
        console.error('Error fetching user details:', error);

        if (error.name === 'CastError') {
            req.flash('error', 'Invalid user ID. Please log in again.');
            res.redirect('/login');
        } else {
            req.flash('error', 'Error fetching user details. Please try again.');
            res.redirect('/userCheckout');
        }
    }
 };
 exports.getCheckoutPage = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user._id).populate('cart.product');
            const updatedCoupon = await Coupon.findById(req.session.appliedCoupon);
            req.session.appliedCoupon = updatedCoupon;
            console.log("Applied coupon:", req.session.appliedCoupon);

            let totalPrice;

            if (req.session.appliedCoupon && req.session.appliedCoupon.is_delete !== true) {
              console.log("cOUPEN OND");
                totalPrice = calculateTotalPrice(user.cart, req.session.appliedCoupon);
            } else {
                console.log("COUPON ILLA");
                totalPrice = calculateTotalPrice(user.cart);
            }

            console.log("main total price:", totalPrice);
            const productDetails = user.cart.map(item => ({
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            }));
            const availableCoupons = await Coupon.find({});
            
            if (req.session.appliedCoupon && req.session.appliedCoupon.is_delete === true) {
                req.session.appliedCoupon = null;
            }

            res.render('./userCheckout.ejs', { user, totalPrice, productDetails, availableCoupons });
        } else {
            req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.redirect('/login');
    }
};





exports.saveDefaultAddress =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.body.defaultAddress;
        await User.updateMany(
            { _id: userId },
            { $set: { 'addresses.$[].isDefault': false } }
        );

        await User.updateOne(
            { _id: userId, 'addresses._id': addressId },
            { $set: { 'addresses.$.isDefault': true } }
        );

        console.log("Saved default address!");
        req.flash('success', 'Default address saved successfully!');
        res.redirect('/userCheckout');
    } catch (error) {
        console.error('Error saving default address:', error);
        req.flash('error', 'Error saving default address. Please try again.');
        res.redirect('/userCheckout');
    }
};
