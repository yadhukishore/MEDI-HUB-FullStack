//controller/userOrderController.js

const User = require("../models/user");
const Order = require("../models/order");
const Product = require("../models/product");
const Coupon = require('../models/coupenSchema');
const { calculateTotalPrice } = require("./userCheckoutController");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require('dotenv').config();
const Payment = require("../models/payment");
const razorpay = new Razorpay({
  key_id:  process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});


const createRazOrder = (orderId, totalAmount) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: totalAmount * 100, // Convert amount to paise
      currency: "INR",
      receipt: orderId.toString(),
      payment_capture: 1,
    };

    razorpay.orders.create(options, (err, order) => {
      if (err) {
        console.error("Razorpay order creation error:", err);
        reject(err);
      } else {
        resolve(order);
      }
    });
  });
};

// Middleware
const verifyLoginOrderController = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("error", "Please log in to view your cart.");
    res.redirect("/login");
  }
};
exports.verifyLoginOrderController = verifyLoginOrderController;

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

exports.successRouter = async (req, res) => {
  try {
    let order;
    if (req.query.id) {
      const paymentId = req.query.id;

      let order_id = await Payment.findOne(
        { payment_id: paymentId },
        { _id: 0, order_id: 1 }
      );
      let orderID = order_id.order_id;
      order = await Order.findById(orderID);
    } else if (req.query.order_id) {
      let orderID = req.query.order_id;
      order = await Order.findById(orderID);
    }

    if (!order) {
      return console.error("Order Not found!");
    }
    res.render("./userOrderSuccess.ejs", { order });
  } catch (error) {
    console.error("Error rendering success page:", error);
  }
};
exports.postProcessOrder = 
  
  async (req, res) => {
    try {
      if (req.session.user) {
        const userId = req.session.user._id;
        const user = await User.findById(userId).populate("cart.product");
        const appliedCoupon = req.session.appliedCoupon || null;
        const totalPrice = calculateTotalPrice(user.cart, appliedCoupon);

        for (const item of user.cart) {
          const product = await Product.findById(item.product._id);
          if (!product || product.stock < item.quantity) {
            return res
              .status(400)
              .json({ message: `Product ${product.name} is out of stock` });
          }
        }
        const selectedPaymentMethod = req.body.paymentMethod;
        let status;
        if (selectedPaymentMethod === "COD" || selectedPaymentMethod==="wallet") {
          status = "Confirmed";
        } else {
          status = "Pending";
        }

        if (selectedPaymentMethod === "wallet") {
          const walletBalance = user.user_wallet;
          if (walletBalance < totalPrice) {
            console.log("Insufficient wallet balance");
            return res.status(400).json({ error: "Take other payment methods or credit the wallet" });
          }
        }

        if (!user.addresses || user.addresses.length === 0) {
          return res
            .status(400)
            .json({ message: "No addresses found for the user" });
        }

        const defaultAddress = user.addresses.find(
          (address) => address.isDefault
        );

        if (!defaultAddress || !defaultAddress._id) {
          return res
            .status(400)
            .json({ message: "Default address is missing or invalid" });
        }
       

        // await reduceStockForProducts(user.cart);

        const orderProducts = user.cart.map((item) => ({
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
          deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
          status: status,
        });

        const orderCreadted = await order.save();
       

        if (orderCreadted.status === "Confirmed") {
          res.json({
            status: true,
            order_id: orderCreadted._id,
          });
        } else if (orderCreadted.status === "Pending") {
          // For Razorpay order
          let razorOrder = await createRazOrder(orderCreadted._id, totalPrice);

          let payments = new Payment({
            payment_id: razorOrder.id,
            amount: parseInt(razorOrder.amount) / 100,
            currency: razorOrder.currency,
            order_id: orderCreadted._id,
            status: razorOrder.status,
          });
          await payments.save();
          
          if (razorOrder) {
            res.json({
              success: true,
              order: razorOrder,
              user: user,
            });
          }
        }

      
if (req.session.appliedCoupon && req.session.appliedCoupon.is_delete !== true) {

  await Coupon.findByIdAndUpdate(req.session.appliedCoupon._id, { is_delete: true });

  // Change discounted value of total price to normal
  console.log(">>>>>dISCOUNT>>>>>>",req.session.appliedCoupon.discount);
  order.totalAmount += req.session.appliedCoupon.discount;
}

// cart clearing logic for COD orders
if (selectedPaymentMethod === "COD") {
  await reduceStockForProducts(user.cart);
  console.log("Reduced STOCK!");
  
  user.cart = [];
  console.log("\nCleared cart!!!\n");
  await user.save();
  console.log("SAVED COD");

}else if(selectedPaymentMethod === "wallet"){
  await reduceStockForProducts(user.cart);
  console.log("REEEEDUCED STOCK!");
  
  user.cart = [];
  console.log("\nCleared cart!!!\n");
   user.user_wallet -= totalPrice;

    user.wallet_history.push({
      amount: order.totalAmount,
      status: "Debit",
      time: new Date()
    });
console.log("Reduced wallet amount!");
  await user.save();
  console.log("sAVED Wallet");

}
       

         if (req.session.appliedCoupon && req.session.appliedCoupon.is_delete !== true) {
          req.session.appliedCoupon = null;
      }
        res.render("./userOrderSuccess.ejs", { order });
      } else {
        req.flash("error", "Please log in to proceed to payment.");
        res.redirect("/login");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

exports.verifyPayment = async (req, res) => {
  console.log("Entered verify payment");
  try {
    if (req.session.user) {
      const userId = req.session.user._id;
      const user = await User.findById(userId).populate("cart.product");
      const totalPrice = calculateTotalPrice(user.cart);
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
  hmac.update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id);
  let generatedSignature = hmac.digest("hex");
  let isSignatureValid = generatedSignature === req.body.razorpay_signature;
  if (isSignatureValid) {
    let paymentId = req.body.razorpay_order_id;
    const order_id = await Payment.findOne(
      { payment_id: paymentId },
      { _id: 0, order_id: 1 }
    );
    let orderID = order_id.order_id;
    let updateOrder = await Order.findByIdAndUpdate(
      { _id: orderID },
      { $set: { status: "Confirmed" } }
    );
    await reduceStockForProducts(user.cart);
    console.log("Reduced Srock!!\n");
    user.cart = [];
    console.log("\nCleared cart!!!\n");
    console.log("OORRDDEERR: ", order_id);

    await user.save();
    res.json({
      payment_id: paymentId,
      success: true,
    });
  }
}} catch (error) {
  console.error("Error verifying payment:", error);
  res.status(500).json({ message: "Internal Server Error" });
}}

// exports.getOrderSuccess = 
//   async (req, res) => {
//     try {
//       const userId = req.session.user._id;
//       const orderId = req.query.orderId;

//       const order = await Order.findOne({ _id: orderId, userId: userId })
//         .populate("products.productId")
//         .exec();

//       if (!order) {
//         throw new Error("Order not found");
//       }

//       res.render("./userOrderSuccess.ejs", {
//         order: order,
//         orderDate: order.createdAt,
//         deliveryDate: order.deliveryDate,
//         status: order.status,
//       });
//     } catch (error) {
//       console.error("Error fetching order details:", error);
//       res.redirect("/userCheckout");
//     }
//   };

exports.getMyOrders = 
  
  async (req, res) => {
    try {
      console.log("getMyOrders controller called");
      if (req.session.user) {
        const userId = req.session.user._id;
        const user = await User.findById(req.session.user._id).populate(
          "cart.product"
        );
        // console.log("user:::", user);

        const orders = await Order.find({ user: userId })
          .sort({ createdAt: -1 })
          .populate("products.product")
          .exec();

        const modifiedOrders = orders.map((order) => {
          if (order.status === "Cancelled") {
            // Exclude 'Delivery Date' for 'Cancelled' orders
            const { deliveryDate, ...restOrder } = order.toObject();
            return restOrder;
          }
          return order;
        });

       
        res.render("./myOrders.ejs", { user, orders: modifiedOrders });
      } else {
        req.flash("error", "Please log in to view your account details.");
        res.redirect("/login");
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.redirect("/");
    }
  };


  exports.cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;
  
    try {
      const order = await Order.findById(orderId);
  
      if (!order) {
        req.flash("error", "Order not found");
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.paymentMethod === "razorpay" && order.status === "Confirmed") {
        const user = await User.findById(order.user);
        console.log("order was paid online and is confirmed, so we can update wallet!");
  
        user.user_wallet += order.totalAmount;
  
        user.wallet_history.push({
          amount: order.totalAmount,
          status: "Credit",
          time: new Date()
        });
  

       const checkWallet = await user.save();
        console.log("Updated wallet\n",checkWallet);
      }

      console.log("order was paid COD SO WE CAN CANCEL IT!!");
  

      order.status = "Cancelled";
      await order.save();
  
      req.flash("success", "Order cancelled successfully and Check your wallet?");
      res.status(200).json({ message: "Order cancelled successfully and amount credited to wallet", order });
    } catch (error) {
      console.error("Error cancelling order:", error);
      req.flash("error", "Internal Server Error");
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

exports.submitReturnRequest = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { returnReason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      order.returnRequest = {
        reason: returnReason,
        status: "Pending",
      };

      await order.save();

      req.flash("success", "Return request submitted successfully.");
    } else {
      req.flash(
        "error",
        "Return request can only be submitted for delivered orders."
      );
    }

    res.redirect("/myOrders");
  } catch (error) {
    console.error("Error submitting return request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




exports.getPaymentFailed=async(req,res)=>{
  res.render('./paymentFailed.ejs');
}