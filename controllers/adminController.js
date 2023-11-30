// controllers/adminController.js
const User = require('../models/user');
const Product = require('../models/product');





exports.showAdminLogin = (req, res) => {
  if(req.session.user){
    res.redirect('/admin');
  }
  else{
  res.render('admin/admin_login');
  }
};

exports.postAdminLogin = async (req, res) => { 
  const { username, password } = req.body;

  try {
    // Find the user with the provided username
    const adminUser = await User.findOne({ username });

    // Check if the user exists and if their password is correct
    if (adminUser && adminUser.isAdmin && (password === adminUser.password)) {
      req.session.user = { isAdmin: true }; // Set isAdmin to true for the session
      res.redirect('/admin');
    } else {
      res.redirect('/admin/admin_login'); // Redirect back to admin login if credentials are invalid
    }
  } catch (error) {
    console.error('Error during admin login:', error);
    res.redirect('/admin/admin_login'); // Redirect back to admin login in case of an error
  }
};


exports.getAdminRoute = async (req, res) => { 

  if (req.session.user && req.session.user.isAdmin) {
    try {
      const products = await Product.find({ deleted: false }); // Fetch only non-deleted products
      res.render('admin/admin_panel', { products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.redirect('/admin/admin_login');
    }
  } else {
    res.redirect('/admin/admin_login'); // Redirect to admin login if not admin
  }
}

exports.getAdminAddProduct = (req,res)=>{
  res.render('admin/add_product');
}

exports.postAdminAddProduct = async (req, res) => {
  try {
    console.log('Form Data:', req.body);
    console.log('Files:', req.files);

    const { productName, productDescription, productPrice,productCategory } = req.body;
    
    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      throw new Error('No files uploaded.');
    }

    // Map filenames from uploaded files
    const productImages = req.files.map(file => file.filename);

    // Validate required fields
    if (!productName || !productDescription || !productPrice || !productCategory) {
      throw new Error('Please fill out all required fields.');
    }

    const newProduct = new Product({
      name: productName,
      description: productDescription,
      price: productPrice,
      category: productCategory,
      images: productImages,
    });

    // Save the new product to the database
    await newProduct.save();

    console.log('Product saved successfully.');

    // Redirect back to the admin panel after adding the product
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding product:', error.message);
    res.redirect('/admin/add_product');
  }
};


exports.getAdminEdit = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
        // Redirect to the admin panel if the product is not found
        res.redirect('/admin');
        return;
    }

    res.render('admin/edit_product', { product });
} catch (error) {
    console.error('Error fetching product for edit:', error);
    res.redirect('/admin');
}
 }

 exports.postAdminEdit = async (req, res) => {
  try {
      const productId = req.params.id;
      const { name, description, price,category } = req.body;

      // Validate the form data
      if (!name || !description || !price || !category) {
          // Handle validation error, you can redirect to a specific page or show an error message
          res.redirect(`/admin/edit_product/${productId}`);
          return;
      }

      // Find the product by ID
      const product = await Product.findById(productId);

      // Update product details
      product.name = name;
      product.description = description;
      product.price = price;
      product.category = category;

      // Check if new images are provided
      if (req.files && req.files.length > 0) {
          // Assuming your Product model has an 'images' field for storing multiple images
          product.images = req.files.map(file => file.filename);
      }

      // Save the updated product
      await product.save();

      res.redirect('/admin');
  } catch (error) {
      console.error('Error updating product:', error);
      res.redirect('/admin');
  }
};
//soft delete
 exports.getAdminDelete= async(req,res)=>{
  const productId = req.params.id;

  try {
    
      await Product.findByIdAndUpdate(productId, { deleted: true });

    console.log(`Product ${productId} soft-deleted successfully.`);

    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting product:', error);
    res.redirect('/admin');
  }
 }

 exports.postAdminLogout=(req,res)=>{
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
    } else {
      res.redirect('/admin/admin_login');
    }
  });
 }

 exports.getUserList = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Render the userList view and pass the users data
    res.render('admin/userList', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(userId, { blocked: true }, { new: true });

    if (!user) {
      // Handle the case where the user is not found
      return res.status(404).send('User not found');
    }

    res.redirect('/admin/userList');
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(userId, { blocked: false }, { new: true });

    if (!user) {
      // Handle the case where the user is not found
      return res.status(404).send('User not found');
    }

    res.redirect('/admin/userList');
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).send('Internal Server Error');
  }
};