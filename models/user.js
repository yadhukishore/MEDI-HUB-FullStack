const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null,
    
  },
  otpExpiration: Date,
  blocked: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.otp;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
