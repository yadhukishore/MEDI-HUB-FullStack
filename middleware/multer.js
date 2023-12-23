const multer = require('multer');

// set storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
    cb(null, file.fieldname + '-' + Date.now() + ext);
  },
});

// Multer middleware that dynamically sets the field name based on the route
const upload = (req, res, next) => {
  let fieldName;

  // Check the route to determine the appropriate field name
  if (req.route.path === '/admin/add_product') {
    fieldName = 'productImages';
  } else if (req.route.path === '/admin/edit_product/:id') {
    fieldName = 'updateImages';
  }

  // Use the correct middleware function with the request object
  const uploadMiddleware = multer({ storage: storage, field: fieldName }).array(fieldName, 4);
  
  // Use uploadMiddleware as the middleware directly
  uploadMiddleware(req, res, (error) => {
    if (error) {
      return res.status(400).send(error.message);
    }
    next();
  });
};

module.exports = upload;

