const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
 
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {type: String,required: true},
  images: [{ type: String, required: true }], 
  deleted: { type: Boolean, default: false }, // Soft delete 
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
