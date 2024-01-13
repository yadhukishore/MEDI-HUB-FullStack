// controllers/adminOfferController.js
const Product = require('../models/product');

exports.getOffersPage = async (req, res) => {
  try {
    const products = await Product.find({ deleted: false }).populate('category');
    res.render('admin/offers', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.addOffer = async (req, res) => {
    const { productId, offerAmount } = req.body;
   
    try {
      // Find the product by ID
      const product = await Product.findById(productId);
   
      // Calculate the new price
      const newPrice = product.price - offerAmount;
   
      // Update the product's price and offer fields
      product.price = newPrice;
      product.offer = {
        amount: offerAmount,
        isActive: true,
      };
   
      // Save the updated product
      const savedValue = await product.save();
      console.log("SavedVal", savedValue);
   
      // Redirect to the offers page or handle response as needed
      res.redirect('/admin/offer');
    } catch (error) {
      console.error('Error adding offer:', error);
      res.status(500).send('Internal Server Error');
    }
   };
   


   exports.deleteOffer = async (req, res) => {
    const { productId } = req.body;
   
    try {
      // Find the product by ID
      const product = await Product.findById(productId);
      console.log("Offer Product>>>",product);
   
      // Set the offer amount to 0 and make the offer inactive
      product.offer = {
         isActive: false,
      };
   
      // Save the updated product
      const savedValue = await product.save();
      console.log("SavedVal", savedValue);
   
      // Redirect to the offers page or handle response as needed
      res.redirect('/admin/offer');
    } catch (error) {
      console.error('Error deleting offer:', error);
      res.status(500).send('Internal Server Error');
    }
   };
   