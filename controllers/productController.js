const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Category = require('../models/category');
const Banner = require('../models/banner');

exports.getHome = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const perPage = 6; 
    const searchQuery = req.query.search || ''; 
    let user = null;
    
    if (req.session.user) {
      user = await User.findById(req.session.user._id).populate('cart.product');
    }

    const products = await Product.aggregate([
      { $match: { deleted: false } },
      {
        $lookup: {
          from: 'categorynames',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          _id: 1,
          name: 1,
          images: 1,
          price: 1,
          stock: 1,
          categoryName: '$categoryDetails.categoryName',
          offer: 1,
        },
      },
      { $match: { $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { categoryName: { $regex: searchQuery, $options: 'i' } },
      ]}},
      { $skip: (page - 1) * perPage },
      { $limit: perPage },
    ]);

    const banners = await Banner.find({ banner_status: true });
    const totalProducts = await Product.countDocuments({ deleted: false });
    const totalPages = Math.ceil(totalProducts / perPage);

    res.render('index', { user, products, banners, page, totalPages, messages: req.flash() });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
};




exports.getProduct= async(req,res)=>{
    try {
        const productId = req.params.productId;
        
        const product = await Product.findById(productId) .populate('category', 'categoryName');        
    
        if (!product) {
          return res.status(404).send('Product not found');
        }
        const page = parseInt(req.query.page) || 1; 
    const perPage = 6; 
    const searchQuery = req.query.search || ''; 
    
         const relatedProducts = await Product.aggregate([
          { $match: { deleted: false } },
          {
            $lookup: {
              from: 'categorynames',
              localField: 'category',
              foreignField: '_id',
              as: 'categoryDetails',
            },
          },
          { $unwind: '$categoryDetails' },
          {
            $project: {
              _id: 1,
              name: 1,
              images: 1,
              price: 1,
              stock: 1,
              categoryName: '$categoryDetails.categoryName',
              offer: 1,
            },
          },
          { $match: { $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { categoryName: { $regex: searchQuery, $options: 'i' } },
          ]}},
          { $skip: (page - 1) * perPage },
          { $limit: perPage }, 
          { $limit: 4 }  
        ]);
        
         //user variable lek userinfo um with cart-le productinfo um ketti
         const user = await User.findById(req.session.user._id).populate('cart.product');

    
        res.render('product_details', {  product, user, products: relatedProducts });
      } catch (error) {
        console.error('Error fetching product details:', error);
        req.flash('error', 'Please Login Or Register!');
        res.redirect('/login');

      }
}
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    const productResults = await Product.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ name: { $regex: new RegExp(query, 'i') } }] },
            { deleted: false },
          ],
        },
      },
      {
        $lookup: {
          from: 'categorynames',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: 1,
          images: 1,
          price: 1,
          stock: 1,
          category: '$category.categoryName',
        },
      },
    ]);

    const categoryResults = await Category.find({
      categoryName: { $regex: new RegExp(query, 'i') },
    });

    const categoryProductResults = await Product.aggregate([
      {
        $match: {
          category: { $in: categoryResults.map(category => category._id) },
          deleted: false,
        },
      },
      {
        $lookup: {
          from: 'categorynames',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: 1,
          images: 1,
          price: 1,
          stock: 1,
          category: '$category.categoryName',
        },
      },
    ]);

    res.render('search.ejs', {
      query,
      products: productResults,
      categories: categoryResults,
      categoryProducts: categoryProductResults,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.redirect('/');
  }
};


exports.getAllMedicines = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 9; 
  const skip = (page - 1) * pageSize;
  try {
    const searchQuery = req.query.search || '';
    let user = null;

    const filterCategories = req.query.categories; 
    const sortOrder = req.query.sort;

    if (req.session.user) {
      user = await User.findById(req.session.user._id).populate('cart.product');
    }
        // Calculate the total number of products to determine the number of pages
        const totalProducts = await Product.countDocuments({ deleted: false });
    const totalPages = Math.ceil(totalProducts / pageSize);

    const categories = await Category.aggregate([
      {
        $project: {
          _id: 0,
          categoryName: 1,
        },
      },
    ]);

    const categoriesArray = categories.map(category => category.categoryName);

    const filterPipeline = filterCategories
      ? [{ $match: { categoryName: { $in: filterCategories } } }]
      : [];

    const products = await Product.aggregate([
      { $match: { deleted: false } },
      {
        $lookup: {
          from: 'categorynames',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          _id: 1,
          name: 1,
          images: 1,
          price: 1,
          stock: 1,
          categoryName: '$categoryDetails.categoryName',
        },
      },
      ...filterPipeline,
      {
        $match: {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { categoryName: { $regex: searchQuery, $options: 'i' } },
          ],
        },
      },
      { $sort: { price: sortOrder === 'lowToHigh' ? 1 : -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ]);
    

    res.render('medicines', {
      products,
      categories,
      user,
      totalPages,
       page,
       pageSize,
       filterCategories,
       searchQuery,
      messages: req.flash(),
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.add_wishlist = async(req,res)=>{
  try {
    const userId = req.session.user._id;

    if (userId) {
      const user = await User.findById(userId)
        .populate({
          path: 'cart.product wishlist.product',
          populate: {
            path: 'category',
            select: 'categoryName',
          },
        });

      if (user) {
        res.render('wishlist', {user, wishlist: user.wishlist, cart: user.cart, categories: user.categories });
        return;
      }
    }

    res.redirect('/login'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
 }

 exports.postToWishlist=async(req,res)=>{
  try {
    console.log("get post req!");
    const productId = req.params.productId;
    const userId = req.session.user._id;

    const user = await User.findById(userId);
    if (user.wishlist.some(item => item.product._id.toString() === productId)) {
      console.log("Product already in the wishlist");
      req.flash('info', 'Product already in the wishlist');
      return res.redirect(`/product/${productId}`);
    }

    user.wishlist.push({ product: productId });
    await user.save();
    console.log("Product added to the wishlist DB!");

    req.flash('success', 'Product added to the wishlist');
    res.redirect(`/add_wishlist`);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    req.flash('error', 'Internal Server Error');
    res.redirect('/');
  }
 }

 exports.removeFromWishlist =async(req,res)=>{
  const productId = req.params.productId;
  const userId = req.session.user._id;

  try {
    const user = await User.findById(userId);
    user.wishlist = user.wishlist.filter(item => item.product.toString() !== productId);
    await user.save();
   
    req.flash('success', 'Product is removed!');
    res.redirect('/add_wishlist');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Internal Server Error');
    res.redirect('/add_wishlist');
  }
  }
 
 