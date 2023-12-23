//routes/admin/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController'); // adjust the path based on your project structure
const upload = require('../../middleware/multer');

router.get('/admin/adminSignup',adminController.getAdminSignup);
router.post('/admin/adminSignup',adminController.postAdminSignup);
router.get('/admin/admin_login', adminController.showAdminLogin);
router.post('/admin/login', adminController.postAdminLogin);

router.get('/admin', adminController.getAdminRoute);
// Product management routes
router.get('/admin/add_product', adminController.getAdminAddProduct)
router.post('/admin/add_product', upload, adminController.postAdminAddProduct);
router.get('/admin/edit_product/:id', adminController.getAdminEdit);
router.post('/admin/edit_product/:id', upload, adminController.postAdminEdit);
router.patch('/delete-in-editProduct/:productId/:imageName', adminController.deleteInEditProduct);
router.get('/delete_product/:id', adminController.getAdminDelete);

// User management routes
router.get('/admin/userList', adminController.getUserList);
router.get('/admin/block_user/:id', adminController.blockUser);
router.get('/admin/unblock_user/:id', adminController.unblockUser);
router.get('/admin/add_user', adminController.getAdminAddUser);
router.post('/admin/add_user', adminController.postAdminAddUser);

// Category management routes
router.get('/admin/category_list', adminController.getCategoryList);
router.get('/add_category', adminController.getAddCategory);
router.post('/add_category', adminController.postAddCategory);
router.get('/edit_category/:id', adminController.getEditCategory);
router.post('/edit_category/:id', adminController.postEditCategory);
router.post('/delete_category/:id', adminController.deleteCategory);

// Order management routes
router.get('/list-all-orders', adminController.getListAllOrders);
router.post('/update-order-status', adminController.updateOrderStatus);

// Logout route for admin
router.post('/admin/logout',adminController.postAdminLogout)
// Soft delete route
router.get('/admin/delete_product/:id', adminController.getAdminDelete)

router.get('/returnRequests', adminController.getReturnRequests);
router.post('/admin/process-return-request/:orderId', adminController.processReturnRequest);

module.exports = router;
