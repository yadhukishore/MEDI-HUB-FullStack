const { default: mongoose } = require("mongoose");

const dbConnect = () => {
// Connect to MongoDB
mongoose.connect(process.env.MONGO_ATLAS_URL).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

}

module.exports = dbConnect;