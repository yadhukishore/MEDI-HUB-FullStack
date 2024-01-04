//controller/userCheckoutController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const Coupon = require('../models/coupenSchema');
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
 
    // Subtract the discount value if a coupon is applied
     // Only subtract the discount value if a coupon is applied
     if (coupon && coupon.is_delete !== true) {
        totalPrice -= coupon.discount;
    }
 console.log("Totalprice in fun:",totalPrice);
    return totalPrice;
 }
exports.calculateTotalPrice = calculateTotalPrice;



function isValidCoupon(cart, totalPrice, coupon) {
    // Check if the coupon is still within its validity period
    const currentDate = new Date();
    if (currentDate < coupon.start_date || currentDate > coupon.exp_date) {
        console.log("Coupon date is invalid!!");
        return false;
    }
 
    // Check if the total price in the cart satisfies the minimum amount condition
    if (totalPrice < coupon.min_amount) {
        console.log("Coupon amount is not matching the minimum amount condition!!");
        return false;
    }
 
    // Check if the user has not exceeded the maximum usage count of the coupon
    if (coupon.used_count > coupon.max_count) {
        console.log("User exceeded the maximum usage count of the coupon");
        return false;
    }
 
    return true;
 }



// Helper function to apply coupon to coupon details and update usage count
async function applyCouponToCoupon(coupon, userId) {
    // Update the user list in the coupon and increase the used count
    coupon.user_list.push(userId);
    coupon.used_count += 1;

    // Disable the coupon if the usage count exceeds the maximum count
    if (coupon.used_count > coupon.max_count) {
        coupon.is_delete = true;
    }

    // Save the updated coupon
    await coupon.save();
    console.log("Saved updated coupon!");

    return coupon;
}

exports.applyCoupon =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const couponCode = req.body.couponCode;
        
        console.log("SelecedCoupen:  ",couponCode);

        const user = await User.findById(userId).populate('cart.product');
        const selectedCoupon = await Coupon.findOne({ coupon_code: couponCode });

        // Calculate the total price without considering the discount
        const totalPrice = calculateTotalPrice(user.cart);
        console.log("TOTTTELP;",totalPrice);

        // Check if the coupon is valid and satisfies any conditions
        if (selectedCoupon && isValidCoupon(user.cart, totalPrice, selectedCoupon)) {
            const updatedCoupon = await applyCouponToCoupon(selectedCoupon, userId);
            req.session.appliedCoupon = updatedCoupon;
            console.log("Coupon applied successfully!\n", updatedCoupon);
            req.flash('success', 'Coupon applied successfully!');
        } else {
            console.error("Coupon is not applicable or invalid!");
            req.flash('error', 'Invalid or not applicable coupon. Please check the coupon code and try again.');
       
             // Reset the applied coupon in the session
             req.session.appliedCoupon = null;
        }
        
 
        res.redirect('/userCheckout');
    } catch (error) {
        console.error('Error fetching user details:', error);
    
        // You might want to check the type of error and handle it accordingly
        if (error.name === 'CastError') {
            req.flash('error', 'Invalid user ID. Please log in again.');
            res.redirect('/login');
        } else {
            req.flash('error', 'Error fetching user details. Please try again.');
            res.redirect('/userCheckout');
        }
    }
 };


exports.getCheckoutPage =  async (req, res) => {
    try {
        if (req.session.user) {
            
            const user = await User.findById(req.session.user._id).populate('cart.product');
            console.log("Applied coupon:", req.session.appliedCoupon);
        
            let totalPrice;
            if (req.session.appliedCoupon && req.session.appliedCoupon.is_delete !== true) {
              totalPrice = calculateTotalPrice(user.cart, req.session.appliedCoupon);
            } else {
              totalPrice = calculateTotalPrice(user.cart);
            }
             console.log("main total price:",totalPrice);
             const productDetails = user.cart.map(item => ({
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            }));
            const availableCoupons = await Coupon.find({});
            // console.log("Coupens:\n",availableCoupons);
            res.render('./userCheckout.ejs', { user, totalPrice,productDetails,availableCoupons });
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
console.log("addressId: ",addressId);
        // Update all other addresses to mark them as non-default
        await User.updateMany(
            { _id: userId },
            { $set: { 'addresses.$[].isDefault': false } }
        );

        // Update the selected address as default
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
