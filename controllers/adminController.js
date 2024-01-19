// controllers/adminController.js
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const bcrypt = require("bcrypt");
const Admin = require("../models/admin");
const categoryName = require("../models/category");
const saltRounds = 10;
const fs = require("fs").promises;
const { check, validationResult } = require("express-validator");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");



// Helper functions
const handleValidationErrors = (req, res, redirectPath) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("error", errors.array().map(e => e.msg).join(", "));
    return res.redirect(redirectPath);
  }
};

// Admin Signup
exports.getAdminSignup = (req, res) => {
  res.render("admin/adminSignup", {
    error: req.flash("error"),
    success: req.flash("success")
  });
};

exports.postAdminSignup = async (req, res) => {
  handleValidationErrors(req, res, "/admin/adminSignup");

  const { username, email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      req.flash("error", "Admin with this username already exists");
      return res.redirect("/admin/adminSignup");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newAdmin = new Admin({ username, email, password: hashedPassword });
    await newAdmin.save();

    req.flash("success", "Admin signup successful. Please log in.");
    res.redirect("/admin/admin_login");
  } catch (error) {
    req.flash("error", "Internal Server Error");
    res.redirect("/admin/adminSignup");
  }
};

// Admin Login
exports.showAdminLogin = (req, res) => {
  if (req.session.adminUser) {
    res.redirect("/admin");
  } else {
    res.render("admin/admin_login", { error: req.flash("error") });
  }
};

exports.postAdminLogin = async (req, res) => {
  handleValidationErrors(req, res, "/admin/admin_login");

  const { username, password } = req.body;
  try {
    const adminUser = await Admin.findOne({ username }).select("+password");
    if (!adminUser) {
      req.flash("error", "Invalid username or password");
      return res.redirect("/admin/admin_login");
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    if (!passwordMatch) {
      req.flash("error", "Invalid username or password");
      return res.redirect("/admin/admin_login");
    }

    req.session.adminUser = { isAdmin: true };
    res.redirect("/admin/adminDash");
  } catch (error) {
    req.flash("error", "Internal Server Error");
    res.redirect("/admin/admin_login");
  }
};


exports.getAdminRoute = [
  adminAuthMiddleware,
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 6; 
    const skip = (page - 1) * pageSize;

    try {
      const totalProducts = await Product.countDocuments({ deleted: false });
      const products = await Product.find({ deleted: false })
        .populate("category", "categoryName")
        .select("-__v").skip(skip)
        .limit(pageSize);

      const totalPages = Math.ceil(totalProducts / pageSize);

      res.render("admin/admin_panel", { products, page, totalPages ,pageSize});
    } catch (error) {
      console.error("Error fetching products:", error);
      res.redirect("/admin/admin_login");
    }
  },
];


exports.getAdminAddProduct = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const error = req.query.error;
      console.log("Error:", error);
      const categories = await categoryName.find({}, "categoryName");
      res.render("admin/add_product", { error, categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.redirect("/admin");
    }
  },
];
exports.postAdminAddProduct = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      console.log("Form Data:", req.body);
      console.log("Files:", req.files);

      const {
        productName,
        productDescription,
        productPrice,
        productCategory,
        stock,
      } = req.body;

      const productImages = req.files.map((file) => file.filename);

      if (productImages.length === 0) {
        throw new Error("No files uploaded.");
      }

      if (
        !productName ||
        !productDescription ||
        !productPrice ||
        !productCategory ||
        !stock
      ) {
        throw new Error("Please fill out all required fields.");
      }

      const nonNegPrice = parseFloat(productPrice);
      if (isNaN(nonNegPrice) || nonNegPrice < 0) {
        throw new Error("Product price must be a non-negative number.");
      }

      const parsedStock = parseInt(stock);
      if (isNaN(parsedStock) || parsedStock < 1) {
        throw new Error(
          "You need to add at least one quantity of your product!"
        );
      }

      const category = await categoryName.findOne({
        categoryName: productCategory,
      });

      if (!category) {
        console.error("Category not found for:", productCategory);
        throw new Error("Category not found");
      }

      const newProduct = new Product({
        name: productName,
        description: productDescription,
        price: nonNegPrice,
        category: category._id,
        images: productImages,
        stock: parsedStock,
      });

      console.log("Product is about to save!");

      console.log("Newproduct: ", newProduct);

      await newProduct.save();

      console.log("Product saved successfully.");

      res.redirect("/admin");
    } catch (error) {
      console.error("Error adding product:", error.message);
      res.redirect(
        "/admin/add_product?error=" + encodeURIComponent(error.message)
      );
    }
  },
];

exports.getAdminEdit = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId).populate(
        "category",
        "categoryName"
      );

      const categories = await categoryName.find({}, "categoryName");
      const error = req.query.error;

      if (!product) {
        res.redirect("/admin");
        return;
      }

      res.render("admin/edit_product", { product, categories, error });
    } catch (error) {
      console.error("Error fetching product for edit:", error);
      res.redirect("/admin");
    }
  },
];
exports.postAdminEdit = [
  adminAuthMiddleware,
  async (req, res) => {
    let productId;
    try {
      productId = req.params.id;
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      const { name, description, price, productCategory, stock } = req.body;

      if (!name || !description || !price || !productCategory || stock < 0) {
        res.redirect(
          `/admin/edit_product/${productId}?error=Please fill out all required fields and enter a valid quantity.`
        );
        return;
      }

      const nonNegPrice = parseFloat(price);
      if (isNaN(nonNegPrice) || nonNegPrice < 0) {
        throw new Error("Product price must be a non-negative number.");
      }

      const parsedStock = parseInt(stock);
      if (isNaN(parsedStock) || parsedStock < 1) {
        throw new Error(
          "You need to add at least one quantity of your product!"
        );
      }

      const category = await categoryName.findOne({
        categoryName: productCategory,
      });

      if (!category) {
        console.error("Category not found for:", productCategory);
        throw new Error("Category not found");
      }

      const updateData = {
        name,
        description,
        price: nonNegPrice,
        category: category._id,
        stock: parseInt(parsedStock),
      };

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => file.filename);
        updateData.images = newImages;
      }

      await Product.findByIdAndUpdate(productId, updateData);

      console.log("Update image saved");

      res.redirect("/admin");
    } catch (error) {
      console.error("Error updating product:", error.message);
      res.redirect(
        `/admin/edit_product/${productId}?error=${encodeURIComponent(
          error.message
        )}`
      );
    }
  },
];

exports.deleteInEditProduct = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const imageName = req.params.imageName;

      const product = await Product.findById(productId);

      // Image te assosiation kalanju from the product without actually deleting the image file.
      product.images = product.images.filter((image) => image !== imageName);

      await product.save();

      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
];

//soft delete
exports.getAdminDelete = [
  adminAuthMiddleware,
  async (req, res) => {
    const productId = req.params.id;

    try {
      await Product.findByIdAndUpdate(productId, { deleted: true });

      console.log(`Product ${productId} soft-deleted successfully.`);

      res.redirect("/admin");
    } catch (error) {
      console.error("Error deleting product:", error);
      res.redirect("/admin");
    }
  },
];


exports.getUserList = [
  adminAuthMiddleware,
  async (req, res) => {
    if (req.session.adminUser && req.session.adminUser.isAdmin) {
      try {
        const users = await User.find();

        res.render("admin/userList", { users });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.render("/admin/userList", {
          error: "Internal Server Error. Please try again Later!",
        });
      }
    } else {
      res.redirect("/admin/admin_login");
    }
  },
];

// Block a user
exports.blockUser = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findByIdAndUpdate(
        userId,
        { blocked: true },
        { new: true }
      );

      if (!user) {
        res.render("/admin/userList", { error: " User not found!" });
      }

      res.redirect("/admin/userList");
    } catch (error) {
      console.error("Error blocking user:", error);
      res.render("/admin/userList", {
        error: "Internal Server Error. Please try again Later!",
      });
    }
  },
];

// Unblock a user
exports.unblockUser = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findByIdAndUpdate(
        userId,
        { blocked: false },
        { new: true }
      );

      if (!user) {
        res.render("/admin/userList", { error: " User not found!" });
      }

      res.redirect("/admin/userList");
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.render("/admin/userList", {
        error: "Internal Server Error. Please try again Later!",
      });
    }
  },
];

exports.getAdminAddUser = [
  adminAuthMiddleware,
  (req, res) => {
    const { error } = req.query; // Check if error is present in the query parameters
    res.render("admin/add_user", { error }); // Pass the error variable to the view
  },
];

exports.postAdminAddUser = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.redirect("/admin/add_user");
      }
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.render("admin/add_user", { error: "email_exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      res.redirect("/admin/userList");
    } catch (error) {
      console.error("Error adding user:", error);
      // res.status(500).send('Internal Server Error');
      res.render("/admin/userList", {
        error: "Internal Server Error. Please try again Later!",
      });
    }
  },
];

exports.getCategoryList = [
  adminAuthMiddleware,
  async (req, res) => {
    if (req.session.adminUser && req.session.adminUser.isAdmin) {
      try {
        const categories = await categoryName.find({}, "categoryName");

        const products = await Product.find().populate(
          "category",
          "categoryName"
        );

        const successMessage = req.flash("success");
        const errorMessage = req.flash("error");

        res.render("admin/category_list", {
          categories,
          products,
          successMessage,
          errorMessage,
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
        res.render("admin/category_list", {
          error: "Internal Server Error. Please try again Later!",
        });
      }
    } else {
      res.redirect("/admin/admin_login");
    }
  },
];

exports.getAddCategory = [
  adminAuthMiddleware,
  (req, res) => {
    const errorMessage = req.flash("error");
    res.render("./admin/add_category", { errorMessage });
  },
];
exports.postAddCategory = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const newCategory = req.body;
      console.log("New category: ", newCategory);

      const existingCategory = await categoryName.findOne({
        categoryName: { $regex: new RegExp(newCategory.categoryName, 'i') },
      });

      if (existingCategory) {
        throw new Error("Category already exists!");  
      }

      // Create a new category in the database
      await categoryName.create({ categoryName: newCategory.categoryName });
      console.log(categoryName, "Saved to the database!");
      res.redirect("/admin/category_list");
    } catch (error) {
      console.error("Error in adding categoryname:", error.message);
      req.flash("error", error.message);  
      res.redirect("/admin/category_list");
    }
  },
];


exports.getEditCategory = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const categoryId = req.params.id;
      const category = await categoryName.findById(categoryId);
      res.render("./admin/edit_category", { category });
    } catch (error) {
      console.error("Error fetching category for edit:", error);
      res.redirect("/admin/category_list");
    }
  },
];

exports.postEditCategory = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const categoryId = req.params.id;
      const categoryPeru = req.body;
      console.log("Category id: ", categoryId);
      console.log("caregory peru: ", categoryPeru);

      await categoryName.findByIdAndUpdate(categoryId, categoryPeru);

      console.log(
        `${categoryPeru} is saved to the database with id: ${categoryId}`
      );
      res.redirect("/admin/category_list");
    } catch (error) {
      console.error("Error updating category:", error);
      res.redirect("/admin/category_list");
    }
  },
];

exports.deleteCategory = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const categoryId = req.params.id;

      const productsInCategory = await Product.find({ category: categoryId });
      console.log("Products in category: ", productsInCategory);

      if (productsInCategory.length > 0) {
        req.flash("error", "Cannot delete category with associated products.");
        console.error("Cannot delete category with associated products.");
        return res.redirect("/admin/category_list");
      }

      await categoryName.findByIdAndDelete(categoryId);
      console.log("Category Deleted Successfully!");

      req.flash("success", "Category deleted successfully.");
      res.redirect("/admin/category_list");
    } catch (error) {
      console.error("Error deleting category:", error);
      req.flash("error", "Error deleting category.");
      res.redirect("/admin/category_list");
    }
  },
];

exports.getListAllOrders = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      // Fetch all orders with relevant information
      const orders = await Order.find()
        .populate({
          path: "products.product",
          select: "name category price",
        })
        .populate("user", "username")
        .exec();

      // Render the EJS template for the list of all orders with the orders data
      res.render("./admin/list-all-orders.ejs", { orders });
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];

exports.updateOrderStatus = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      console.log("Called updateOrderStatus");
      const statusUpdates = Object.keys(req.body)
        .filter((key) => key.startsWith("status_"))
        .reduce((updates, key) => {
          const orderId = key.replace("status_", "");
          updates.push({ orderId, status: req.body[key] });
          return updates;
        }, []);

      // Update the status of each order
      await Promise.all(
        statusUpdates.map(async (update) => {
          await Order.findByIdAndUpdate(update.orderId, {
            status: update.status,
          });
        })
      );

      res.redirect("/list-all-orders");
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
exports.getReturnRequests = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const returnRequests = await Order.aggregate([
        {
          $match: {
            "returnRequest.status": {
              $in: ["Pending", "Approved", "Decliened"],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
      ]);

      console.log("RRRRRRRRRRRREEEEE", returnRequests);
      res.render("./admin/returnRequests.ejs", { returnRequests });
    } catch (error) {
      console.error("Error fetching return requests:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];

exports.processReturnRequest = [
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const { action } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (action === "approve") {
        order.returnRequest.status = "Approved";
      } else if (action === "decline") {
        order.returnRequest.status = "Declined";
      }
      console.log("orders: \n", order);
      await order.save();
      console.log("saved return actions status in DB!");

      res.redirect("/returnRequests");
    } catch (error) {
      console.error("Error processing return request:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
// Logout controller for admin
// Logout controller for admin
exports.postAdminLogout = [
  adminAuthMiddleware,
  (req, res) => {
    // Set admin-related session properties to null
    req.session.adminUser = null;
    // Save the session after changes
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect("/admin/admin_login");
    });
  },
];
