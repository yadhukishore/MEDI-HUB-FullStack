// adminAuthMiddleware.js
module.exports = (req, res, next) => {
    if (req.session.adminUser && req.session.adminUser.isAdmin) {
      next();
    } else {
      res.redirect('/admin/admin_login');
    }
  };