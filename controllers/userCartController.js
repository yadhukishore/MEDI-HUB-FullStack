const User = require('../models/user');
const Product = require('../models/product');
const bcrypt = require('bcrypt');

// Middleware
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Render user cart page
exports.getUserCart = [verifyLogin, async (req, res) => {
    try {
        // Check if the user is authenticated
        if (!req.session.user) {
            return res.redirect('/login');
        }

        // Find the logged-in user by their session user ID and populate the cart property
        const user = await User.findById(req.session.user._id).populate('cart.product');

        // Log the session user ID and found user ID
        console.log('Session User ID:', req.session.user._id);
        console.log('Found User ID:', user ? user._id : 'User not found');

        // Check if the user and user cart are found
        if (!user || !user.cart) {
            return res.status(404).json({ message: 'User or user cart not found' });
        }

        // Render the userCart template with the user and cart information
        res.render('userCart', { user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];

// Add product to user's cart
exports.addToCart = async (req, res) => {
    try {
        // Check if the user is authenticated
        if (!req.session.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Find the logged-in user by their session user ID and populate the cart property
        const user = await User.findById(req.session.user._id).populate('cart.product');

        // Log the session user ID and found user ID
        console.log('Session User ID:', req.session.user._id);
        console.log('Found User ID:', user ? user._id : 'User not found');

        // Check if the user and user cart are found
        if (!user || !user.cart) {
            return res.status(404).json({ message: 'User or user cart not found' });
        }

        const productId = req.params.productId;

        // Log the product ID
        console.log('Product ID:', productId);

        // Check if the product is already in the cart
        const cartItem = user.cart.find(item => item.product._id.toString() === productId);

        if (cartItem) {
            // If the product is in the cart, increment the quantity
            cartItem.quantity += 1; // You can adjust the quantity increment as needed
        } else {
            // If the product is not in the cart, add a new item
            user.cart.push({
                product: productId,
                quantity: 1 // You can adjust the quantity as needed
            });
        }

        // Save the updated user document
        await user.save();

        // Redirect or respond as needed
        res.redirect('/userCart'); // Redirect to the user's cart page

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = exports;
