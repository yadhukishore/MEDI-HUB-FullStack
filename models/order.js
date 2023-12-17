const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                default: 1,
                required: true,
            },
            price: {
                type: Number, 
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    deliveryDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Confirmed','Shipped','Delivered','Out for delivery', 'Cancelled'],
        default: 'Pending',
        required: true,
    },
    returnRequest: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reason: String,
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Declined'],
            default: 'Pending',
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
