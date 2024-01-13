//product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
 
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'categoryName', required: true },
  images: [{ type: String, required: true }],
  stock: { type: Number, default: 0, min: 0 },
  deleted: { type: Boolean, default: false }, // Soft delete 
  offer: {
    amount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
