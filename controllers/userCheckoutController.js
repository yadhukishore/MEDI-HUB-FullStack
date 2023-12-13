//controller/userCheckoutController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Middleware
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to view your account details.');
        res.redirect('/login');
    }
};


exports.getCheckoutPage = [verifyLogin, async (req, res) => {
    try {
        if (req.session.user) {
            
            const user = await User.findById(req.session.user._id).populate('cart.product');
             const totalPrice = calculateTotalPrice(user.cart);
            res.render('./userCheckout.ejs', { user, totalPrice });
        } else {
            req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.redirect('/login');
    }
}];

// Helper function to calculate the total price from the user's cart
function calculateTotalPrice(cart) {
    let totalPrice = 0;
    if (cart && cart.length > 0) {
        cart.forEach(item => {
            totalPrice += item.product.price * item.quantity;
        });
    }
    return totalPrice;
}
exports.calculateTotalPrice = calculateTotalPrice;


exports.saveDefaultAddress = [verifyLogin, async (req, res) => {
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
}];
