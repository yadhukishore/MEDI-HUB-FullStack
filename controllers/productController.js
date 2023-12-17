const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Category = require('../models/category');

exports.getProduct= async(req,res)=>{
    try {
        const productId = req.params.productId;
        
        const product = await Product.findById(productId) .populate('category', 'categoryName');        
    
        if (!product) {
          return res.status(404).send('Product not found');
        }
         //user variable lek userinfo um with cart-le productinfo um ketti
         const user = await User.findById(req.session.user._id).populate('cart.product');

    
        res.render('product_details', { product,user });
      } catch (error) {
        console.error('Error fetching product details:', error);
        req.flash('error', 'Please log in to view your cart.');
        res.redirect('/login');

      }
}

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    const productResults = await Product.find({
      $and: [
        {
          $or: [
            { name: { $regex: new RegExp(query, 'i') } },
            { 'category.categoryName': { $regex: new RegExp(query, 'i') } },
          ],
        },
        { deleted: false }, 
      ],
    }).populate('category');

    const categoryResults = await Category.find({
      categoryName: { $regex: new RegExp(query, 'i') },
    });

    const categoryProductResults = await Product.find({
      'category': { $in: categoryResults.map(category => category._id) },
      deleted: false,
    }).populate('category');

    res.render('search.ejs', { query, products: productResults, categories: categoryResults, categoryProducts: categoryProductResults });
  } catch (error) {
    console.error('Error searching products:', error);
    res.redirect('/');
  }
};
