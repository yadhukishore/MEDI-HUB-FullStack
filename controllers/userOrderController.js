//controller/userOrderController.js

const User = require('../models/user');
const Order = require('../models/order');
const mongoose = require('mongoose');

// Middleware
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to view your cart.');
        res.redirect('/login');
    }
};
exports.postProcessOrder = [verifyLogin, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const currentDefaultAddress = req.body.currentDefaultAddress;

        if ( !mongoose.Types.ObjectId.isValid(currentDefaultAddress)) {
            throw new Error('Invalid address ID');
        }

        const user = await User.findById(userId).populate('cart.product').exec();
        const products = user.cart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
        }));

        const totalAmount = user.cart.reduce((total, item) => {
            return total + item.product.price * item.quantity;
        }, 0);

        const paymentMethod = req.body.paymentMethod;

        const order = new Order({
            userId: userId,
            address: currentDefaultAddress, 
            products: products,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            orderDate: new Date(), 
        });

        
        await order.save();
        console.log("Saved in order Collections!");

        // Clear the user's cart
        await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

        res.redirect(`/orderSuccess?orderId=${order._id}`);
    } catch (error) {
        console.error('Error processing order:', error);
        res.redirect('/userCheckout');
    }
}];


exports.getOrderSuccess = [verifyLogin, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const orderId = req.query.orderId;

        const order = await Order.findOne({ _id: orderId, userId: userId })
            .populate('products.productId')
            .exec();

        if (!order) {
            throw new Error('Order not found');
        }

        res.render('./userOrderSuccess.ejs', { order: order, orderDate: order.createdAt });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.redirect('/userCheckout');
    }
}];


exports.getMyOrders = [verifyLogin, async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user._id;
            const user = await User.findById(req.session.user._id).populate('cart.product');

            const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 }).populate('products.productId').exec();

            res.render('./myOrders.ejs', { user, orders: orders });
        } else {
            req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.redirect('/');
    }
}];