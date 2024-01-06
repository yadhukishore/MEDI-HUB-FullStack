const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Category = require('../models/category');

exports.getHome = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the page parameter from the query string
    const perPage = 6; // Set the number of products to display per page
    const searchQuery = req.query.search || ''; // Extract the search query from the request
    let user = null;
    
    if (req.session.user) {
      user = await User.findById(req.session.user._id).populate('cart.product');
    }

    // Use the aggregate pipeline to fetch paginated results
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
      { $match: { $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { categoryName: { $regex: searchQuery, $options: 'i' } },
      ]}},
      { $skip: (page - 1) * perPage },
      { $limit: perPage },
    ]);
   
    // Calculate totalProducts and totalPages
    const totalProducts = await Product.countDocuments({ deleted: false });
    const totalPages = Math.ceil(totalProducts / perPage);

    res.render('index', {user, products, page, totalPages, messages: req.flash() });
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

    // Search for products matching the query
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

    // Search for categories matching the query
    const categoryResults = await Category.find({
      categoryName: { $regex: new RegExp(query, 'i') },
    });

    // Fetch products associated with the matching categories
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
  try {
    const searchQuery = req.query.search || '';
    let user = null;

    const filterCategories = req.query.categories; // Add this line to get selected categories from query parameters
    const sortOrder = req.query.sort;

    if (req.session.user) {
      user = await User.findById(req.session.user._id).populate('cart.product');
    }

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
      ...filterPipeline, // Include the filter pipeline
      {
        $match: {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { categoryName: { $regex: searchQuery, $options: 'i' } },
          ],
        },
      },
      { $sort: { price: sortOrder === 'lowToHigh' ? 1 : -1 } },
    ]);

    res.render('medicines', {
      products,
      categories,
      user,
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
        res.render('wishlist', { wishlist: user.wishlist, cart: user.cart, categories: user.categories });
        return;
      }
    }

    // If user is not found or not logged in, redirect to login or handle accordingly
    res.redirect('/login'); // Update this based on your login route
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

    // Check if the product is already in the wishlist
    const user = await User.findById(userId);
    if (user.wishlist.some(item => item.product._id.toString() === productId)) {
      console.log("Product already in the wishlist");
      req.flash('info', 'Product already in the wishlist');
      return res.redirect(`/product/${productId}`);
    }

    // Add the product to the wishlist
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
    console.log("Removed Product from wishList");
    req.flash('success', 'Product is removed!');
    res.redirect('/add_wishlist');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Internal Server Error');
    res.redirect('/add_wishlist');
  }
  }
 
 