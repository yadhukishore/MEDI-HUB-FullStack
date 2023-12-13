//controller/userOrderController.js

const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product'); 
const { calculateTotalPrice } = require('./userCheckoutController');

// Middleware
const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to view your cart.');
        res.redirect('/login');
    }
};

// Function to reduce stock for each product in the cart
const reduceStockForProducts = async (cart) => {
    const stockReductionPromises = cart.map(async (item) => {
        const product = await Product.findById(item.product._id);
        if (!product || product.stock < item.quantity) {
            throw new Error(`Product ${product.name} is out of stock`);
        }

        product.stock -= item.quantity;
        await product.save();
    });

    // Wait for all stock reductions to complete
    await Promise.all(stockReductionPromises);
};

exports.postProcessOrder = [verifyLogin, async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user._id;
            const user = await User.findById(userId).populate('cart.product');
            const totalPrice = calculateTotalPrice(user.cart);

            // Check if products in the cart are still in stock
            for (const item of user.cart) {
                const product = await Product.findById(item.product._id);
                if (!product || product.stock < item.quantity) {
                    return res.status(400).json({ message: `Product ${product.name} is out of stock` });
                }
            }

            const selectedPaymentMethod = "COD";
           

              // Check if defaultAddress exists before accessing its properties
            if (!user.addresses || user.addresses.length === 0) {
                return res.status(400).json({ message: 'No addresses found for the user' });
            }
            // Find the default address
            const defaultAddress = user.addresses.find(address => address.isDefault);
            
            if (!defaultAddress || !defaultAddress._id) {
                return res.status(400).json({ message: 'Default address is missing or invalid' });
            }
            console.log("Default Address:", defaultAddress);
            console.log("Address gottt!");
            // Reduce stock in product collection
            await reduceStockForProducts(user.cart);

            // Create order
            const orderProducts = user.cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
            }));

           
            const order = new Order({
                user: userId,
                address: defaultAddress._id,
                products: orderProducts,
                totalAmount: totalPrice,
                paymentMethod: selectedPaymentMethod,
            });
            console.log("defaultAddress._id:",defaultAddress._id);
            console.log("orderProducts:", orderProducts);
            console.log("totalPrice:", totalPrice);
            // Save the order
            await order.save();
            console.log("orders-----: ", order);
            console.log("Orders Saved!!");

            // Clear user's cart after order is created
            user.cart = [];
            console.log("\nCleared cart!!!\n");
            await user.save();
            console.log("user-----:", user);
            console.log("User Saved!!");

            res.render('./userOrderSuccess.ejs', { order });
        } else {
            req.flash('error', 'Please log in to proceed to payment.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
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