//controller/userOrderController.js

const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product'); 
const { calculateTotalPrice } = require('./userCheckoutController');
const cron = require('node-cron');

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

  
    await Promise.all(stockReductionPromises);
};

exports.postProcessOrder = [verifyLogin, async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user._id;
            const user = await User.findById(userId).populate('cart.product');
            const totalPrice = calculateTotalPrice(user.cart);

           
            for (const item of user.cart) {
                const product = await Product.findById(item.product._id);
                if (!product || product.stock < item.quantity) {
                    return res.status(400).json({ message: `Product ${product.name} is out of stock` });
                }
            }

            const selectedPaymentMethod = "COD";
           

            
            if (!user.addresses || user.addresses.length === 0) {
                return res.status(400).json({ message: 'No addresses found for the user' });
            }
           
            const defaultAddress = user.addresses.find(address => address.isDefault);
            
            if (!defaultAddress || !defaultAddress._id) {
                return res.status(400).json({ message: 'Default address is missing or invalid' });
            }
            console.log("Default Address:", defaultAddress);
            console.log("Address gottt!");
           
            await reduceStockForProducts(user.cart);

            
            const orderProducts = user.cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                name: item.product.name,
            }));

           
            const order = new Order({
                user: userId,
                address: defaultAddress._id,
                products: orderProducts,
                totalAmount: totalPrice,
                paymentMethod: selectedPaymentMethod,
                deliveryDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000), //delivery date 4 days from now
                status: 'Confirmed', 
            });
            console.log("defaultAddress._id:",defaultAddress._id);
            console.log("orderProducts:", orderProducts);
            console.log("totalPrice:", totalPrice);
           
            await order.save();

               // cron job
        cron.schedule(`* * * * *`, async () => {
            const currentDate = new Date();
            if (order.deliveryDate && order.deliveryDate <= currentDate && order.status === 'Confirmed') {
               
                await Order.findByIdAndUpdate(order._id, { status: 'Delivered' });
                 
                 const updatedOrder = await Order.findById(order._id);

                 
                    res.render('./userOrderSuccess.ejs', { order: updatedOrder });

            }
        }, {
            scheduled: true, 
        });
            console.log("orders-----: ", order);
            console.log("Orders Saved!!");

          
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

        res.render('./userOrderSuccess.ejs', { order: order, orderDate: order.createdAt, deliveryDate: order.deliveryDate, status: order.status });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.redirect('/userCheckout');
    }
}];

exports.getMyOrders = [verifyLogin, async (req, res) => {
    try {
        console.log('getMyOrders controller called');
        if (req.session.user) {
            const userId = req.session.user._id;
            const user = await User.findById(req.session.user._id).populate('cart.product');
            console.log("user:::", user);

            const orders = await Order.find({ user: userId })
                .sort({ createdAt: -1 })
                .populate('products.product')
                .exec();

               
      const modifiedOrders = orders.map(order => {
        if (order.status === 'Cancelled') {
          // Exclude 'Delivery Date' for 'Cancelled' orders
          const { deliveryDate, ...restOrder } = order.toObject();
          return restOrder;
        }
        return order;
      });

             console.log("modifiedOrders:", modifiedOrders);
      res.render('./myOrders.ejs', { user, orders: modifiedOrders });
        } else {
            req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.redirect('/');
    }
}];
exports.cancelOrder=async(req,res)=>{
    const orderId = req.params.orderId;

    try {
      const order = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });
  
      if (!order) {
        req.flash('error', 'Order not found');
        return res.status(404).json({ message: 'Order not found' });
      }
      req.flash('success', 'Order cancelled successfully');
      res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
      console.error('Error cancelling order:', error);
      req.flash('error', 'Internal Server Error');
      res.status(500).json({ message: 'Internal Server Error' });
    }
}

exports.submitReturnRequest = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const { returnReason } = req.body;
  
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status === 'Delivered') {
        order.returnRequest = {
          reason: returnReason,
          status: 'Pending',
        };
  
        await order.save();
  
        req.flash('success', 'Return request submitted successfully.');
      } else {
        req.flash('error', 'Return request can only be submitted for delivered orders.');
      }
  
      res.redirect('/myOrders');
    } catch (error) {
      console.error('Error submitting return request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };