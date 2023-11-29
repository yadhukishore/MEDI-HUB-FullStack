const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

exports.getProduct= async(req,res)=>{
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);
    
        if (!product) {
          return res.status(404).send('Product not found');
        }
    
        res.render('product_details', { product });
      } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Internal Server Error');
      }
}