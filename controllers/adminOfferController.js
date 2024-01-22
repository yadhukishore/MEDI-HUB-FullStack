// controllers/adminOfferController.js
const Product = require('../models/product');

const handleError = (err, res) => {
  console.error('Error:', err);
  res.status(500).render('error', { statusCode: 500, message: err.message });
 };

exports.getOffersPage = async (req, res) => {
  try {
    const products = await Product.find({ deleted: false }).populate('category');
    res.render('admin/offers', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    handleError(error, res);  }
};

exports.addOffer = async (req, res) => {
    const { productId, offerAmount } = req.body;
   
    try {
      const product = await Product.findById(productId);
      const newPrice = product.price - offerAmount;

      product.price = newPrice;
      product.offer = {
        amount: offerAmount,
        isActive: true,
      };
   
      const savedValue = await product.save();

      res.redirect('/admin/offer');
    } catch (error) {
      console.error('Error adding offer:', error);
      handleError(error, res);    }
   };
   


   exports.deleteOffer = async (req, res) => {
    const { productId } = req.body;
   
    try {
      const product = await Product.findById(productId);

      product.offer = {
         isActive: false,
      };

      const savedValue = await product.save();
      res.redirect('/admin/offer');
    } catch (error) {
      console.error('Error deleting offer:', error);
      handleError(error, res);    }
   };
   