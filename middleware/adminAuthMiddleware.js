// adminAuthMiddleware.js
module.exports = (req, res, next) => {
    if (req.session.adminUser && req.session.adminUser.isAdmin) {
      // If the user is an admin, proceed to the next middleware or route handler
      next();
    } else {
      // If not an admin, redirect to the admin login page
      res.redirect('/admin/admin_login');
    }
  };