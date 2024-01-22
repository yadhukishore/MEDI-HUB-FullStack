// controllers/userAuthController.js
const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const  isValidPassword  = require('../middleware/passwordValid');
const { check, validationResult } = require('express-validator');
require('dotenv').config();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
  
// forgot_password
exports.getForgotPassword = (req, res) => {
  const error = req.flash('error');
  res.render('forgot_password', { error });
};

exports.postForgotPassword = async (req, res) => {
  try {

    const existingUser = await User.findOne({ email: req.body.email });

    if (!existingUser) {

      console.log('User not found');
      req.flash('error', 'User not found');
      return res.redirect('/forgot_password');
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpExpiration = Date.now() + 300000;

    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      { $set: { otp, otpExpiration } },
      { new: true, upsert: true }
    );
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.body.email,
      subject: 'Reset Your Password',
      text: `Your OTP for resetting the password is ${otp}. Please use it to reset your password.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        req.flash('error', 'Internal Server Error. Please try again later!');
        res.redirect('/forgot_password');
      } else {
        console.log('Email sent:', info.response);
        res.redirect(`/verify_otp?email=${req.body.email}`);
      }
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    req.flash('error', 'Server failed! Please try again later!');
    res.redirect('/forgot_password');
  }
};

 exports.getVerifyOTP=(req,res)=>{
    const email = req.query.email;
    const error = req.query.error; 
    res.render('verify_otp', { email, error });
 }

 exports.postVerifyOTP=async(req,res)=>{
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
    
        if (user) {
          if (user.otp === otp) {
            console.log('OTP Matched!');
            res.redirect(`/reset_password/${email}`);
          } else {
            console.log('Invalid OTP');
            res.render('verify_otp', { email, error: 'Invalid OTP. Please try again.' });
          }
        } else {
          console.log('User not found');
          res.render('verify_otp', { email, error: 'User not found. Please try again.' });
        }
      } catch (error) {
        console.error('Error in OTP verification:', error);
       res.render('verify_otp',{error:'Server Error'})
      }
 }
 
exports.postResendOTP = async (req, res) => {
  try {
      const email = req.body.email;

      const newOtp = Math.floor(100000 + Math.random() * 900000);

      const otpExpiration = Date.now() + 300000;

      const user = await User.findOneAndUpdate(
          { email },
          { $set: { otp: newOtp, otpExpiration } },
          { new: true }
      );

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Resend OTP',
          text: `Your new OTP for verification is ${newOtp}. Please use it to verify your account.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log('Error sending email:', error);
              res.render('verify_otp', { email, error: 'Error sending OTP. Please try again.' });
          } else {
              console.log('Email sent:', info.response);
              res.redirect(`/verify_otp?email=${email}&success=Resend successful`);
          }
      });
  } catch (error) {
      console.error('Error in resending OTP:', error);
      res.status(500).send('Internal Server Error');
  }
}
//reset_password
exports.getResetPassword = (req, res) => {
  const email = req.params.email;
  const error = req.flash('error');
  res.render('reset_password', { email, error }); 
};

exports.postResetPassword = async (req, res) => {
  try {
    const email = req.params.email;
    const { newPassword, confirmPassword } = req.body;

    if (!isValidPassword(newPassword)) {
      req.flash('error', 'Poor Password. Password must be strong and not contain spaces.');
      return res.redirect(`/reset_password/${email}`);
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect(`/reset_password/${email}`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect(`/reset_password/${email}`);
    }

    console.log('Password updated successfully:', hashedPassword); 
    console.log('User after update:', user);
    req.flash('error', 'Saved User Data!');
    res.redirect('/login');
  } catch (error) {
    console.error('Error in resetting password:', error);
    req.flash('error', 'Internal Server Error');
    res.redirect(`/reset_password/${email}`);
  }
};


 //signup

exports.getSignup = (req, res) => {
  const error = req.flash('error');
  res.render('signup', { error });
};

exports.postSignup = [
  check('username', 'This username must be 3+ characters long')
    .exists()
    .isLength({ min: 3 }),
  check('email', 'Email is not valid')
    .isEmail()
    .normalizeEmail(),
  async (req, res) => {
    const { email, username } = req.body;

    if(!email || !username){
      req.flash('error', 'Please enter details');
      return res.redirect('/signup');
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;

      req.flash('error', errorMessage);
      return res.redirect('/signup');
    }

    try {
      // Use findOne with a case-insensitive query to check for an existing user
      const userExists = await User.findOne({ email: { $regex: new RegExp(email, 'i') } });

      if (userExists) {
        req.flash('error', 'User with this email already exists!');
        return res.redirect('/signup');
      }

    

      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpExpiration = Date.now() + 300000;

      const newUser = new User({
        email,
        username,
        otp,
        otpExpiration,
      });

      await newUser.save();

     
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'OTP for Account Verification',
        text: `Your OTP for account verification is ${otp}. Please use it to verify your account.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
          req.flash('error', 'Error sending verification email. Please try again.');
          return res.redirect('/signup');
        } else {
          console.log('Email sent:', info.response);
          res.redirect(`/verify_otp?email=${email}`);
        }
      });
    } catch (error) {
      console.error('Error signing up:', error);
      req.flash('error', 'Internal Server Error. Please try again later.');
      res.redirect('/signup');
    }
  }
];

 exports.getUserLogin = (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  } else {
    const errorMessage = req.flash('error'); 
    res.render('login', { error: errorMessage });
  }
};

exports.postUserLogin = [
  check('email', 'Email is not valid')
  .isEmail()
  .normalizeEmail(),
  async (req, res) => {
  
  const { email, password } = req.body;


  try {
    if (!email || !password) {
      req.flash('error', 'Fill in all the details!');
      return res.redirect('/login');  // Add return statement here
    }
    const user = await User.findOne({ email });

    if (user) {
      if (user.blocked) {
        req.flash('error', 'Your account is blocked. Please contact the administrator for assistance!!!');
        return res.redirect('/login');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        req.session.user = user;
        return res.redirect('/');
      } else {
        req.flash('error', 'Invalid password or email');
        return res.redirect('/login');
      }
    } else {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return res.redirect('/login');
  }
}];



// Logout controller for user
exports.postUserLogout = (req, res) => {
  delete req.session.user;
  req.session.save((err) => {
    if (err) {
      console.error('Error saving session:', err);
    } else {
      res.redirect('/login');
    }
  });
};

