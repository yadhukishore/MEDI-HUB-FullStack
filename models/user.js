const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  state: String,
  city: String,
  pincode: String,
  landmark: String,
  fullAddress: String,
  isDefault: {
      type: Boolean,
      default: false,
  },
});

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
  phone:{
    type:Number,
    require:false
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
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: {
        type: Number,
        default: 1
      }
    }
  ],
  addresses: [addressSchema],

});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.otp;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
