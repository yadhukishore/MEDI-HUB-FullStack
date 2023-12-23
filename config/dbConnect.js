const { default: mongoose } = require("mongoose");

const dbConnect = () => {
// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/medibase').then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

}

module.exports = dbConnect