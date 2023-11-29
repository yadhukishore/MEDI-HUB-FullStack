const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // existing fields...
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {type: String,required: true},
  images: [{ type: String, required: true }], // Array to store multiple images
  deleted: { type: Boolean, default: false }, // Soft delete field
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
