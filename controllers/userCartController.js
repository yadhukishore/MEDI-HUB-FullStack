const User = require('../models/user');
const Product = require('../models/product');
const bcrypt = require('bcrypt');

// Middleware
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to view your cart.');
        res.redirect('/login');
    }
};
// Render user cart page
exports.getUserCart = [verifyLogin, async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Please log in to view your cart.');
            return res.redirect('/login');
        }

        //user variable lek userinfo um with cart-le productinfo um ketti
        const user = await User.findById(req.session.user._id).populate('cart.product');

        console.log('Session User ID:', req.session.user._id);
        console.log('Found User ID:', user ? user._id : 'User not found');

        if (!user || !user.cart) {
            req.flash('error', 'User or user cart not found.');
            return res.status(404).json({ message: 'User or user cart not found' });
        }

       
        // req.flash('success', 'User cart retrieved successfully.');

        res.render('userCart', { user });

    } catch (error) {
        console.error(error);
        req.flash('error', 'Internal Server Error. Please try again later.');
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];

exports.addToCart = [verifyLogin, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(404).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(req.session.user._id).populate('cart.product');

        if (!user || !user.cart) {
            return res.status(404).json({ message: 'User or user cart not found' });
        }

        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const userCartItem = user.cart.find(item => item.product._id.toString() === productId);

        console.log("User cart item: ",userCartItem);
      
        if (product.stock > 0 && (!userCartItem || userCartItem.userStock < product.stock)) {
            if (userCartItem) {
                userCartItem.quantity += 1;
                userCartItem.userStock += 1;
            } else {
                user.cart.push({
                    product: productId,
                    quantity: 1,
                    userStock: Math.min(1, product.stock), 
                });
            }

            
            product.stock -= 1;
            req.flash('success', 'Product added to cart successfully.');

            await user.save();

            return res.redirect('/userCart');
        } else {
            req.flash('error', 'Sorry product is out of stock! ');
            return res.redirect('/');
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];


exports.removeFromCart = [verifyLogin, async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(404).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(req.session.user._id).populate('cart.product');

        console.log('Session User ID:', req.session.user._id);
        console.log('Found User ID:', user ? user._id : 'User not found');

        if (!user || !user.cart) {
            return res.status(404).json({ message: 'User or user cart not found' });
        }

        const productId = req.params.productId;

        user.cart = user.cart.filter(item => item.product._id.toString() !== productId);
        await user.save();
        req.flash('success', 'Product Removed from cart !');
        res.redirect('/userCart'); 

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];
exports.updateProductQuantity = [verifyLogin, async (req, res) => {
    try {
        const productId = req.body.productId;
        const newQuantity = req.body.newQuantity;

        const user = await User.findById(req.session.user._id).populate('cart.product');
        const cartItem = user.cart.find(item => item.product._id.toString() === productId);

        if (!cartItem) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const quantityDiff = newQuantity - cartItem.quantity;

        if (cartItem.userStock + quantityDiff <= product.stock) {
            
            cartItem.quantity = newQuantity;
            cartItem.userStock += quantityDiff;

            product.stock -= quantityDiff;

            await user.save();
           
            console.log("Quantity ++");

            res.status(200).json({ message: 'Quantity updated successfully', updatedStock: product.stock });
        } else {
          
            console.log("Quantity no change");
            res.status(409).json({ message: 'Maximum quantity reached!' });
        }

    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];

exports.updateTotalPrice = [verifyLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).populate('cart.product');

        if (!user || !user.cart) {
            return res.status(404).json({ message: 'User or user cart not found' });
        }

        let totalPrice = 0;

        user.cart.forEach(item => {
            totalPrice += item.product.price * item.quantity;
        });

        user.totalPrice = totalPrice;

        await user.save();

        res.status(200).json({ totalPrice: totalPrice });
    } catch (error) {
        console.error('Error updating total price:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];

exports.getUpdatedPrices = [verifyLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).populate('cart.product');

        if (!user || !user.cart) {
            return res.status(404).json({ message: 'User or user cart not found' });
        }

        let totalPrice = 0;
        let updatedPrices = [];

        user.cart.forEach(item => {
            totalPrice += item.product.price * item.quantity;
            updatedPrices.push({ productId: item.product._id, price: item.product.price * item.quantity });
       
        });

        user.totalPrice = totalPrice;

        await user.save();
        
        
        res.status(200).json({ totalPrice: totalPrice, updatedPrices: updatedPrices });
    } catch (error) {
        console.error('Error fetching updated prices:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}];
module.exports = exports;
