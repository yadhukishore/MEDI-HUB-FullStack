// controllers/userAuthController.js
const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const  isValidPassword  = require('../utils/passwordValid');

//for otp////
// Nodemailer configuration
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

exports.postSignup = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      req.flash('error', 'User with this email already exists!');
      return res.redirect('/signup');
    }

    if (!isValidPassword(password)) {
      req.flash('error', 'Poor Password. Password must be strong and not contain spaces.');
      return res.redirect('/signup');
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpExpiration = Date.now() + 300000;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      otp,
      otpExpiration,
    });

    await newUser.save();

    // Send the OTP to the user's email (similar to forgot password logic)
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
};

 exports.getUserLogin = (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  } else {
    const errorMessage = req.flash('error'); 
    res.render('login', { error: errorMessage });
  }
};

exports.postUserLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {

      if (user.blocked) {
        req.flash('error', 'Your account is blocked. Please contact the administrator for assistance!!!');
        return res.redirect('/login');
      }
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        req.session.user = user; 
        res.redirect('/');
      } else {
       
        req.flash('error', 'Invalid password or email');
        res.redirect('/login');
      }
    } else {
      req.flash('error', 'User not found');
      res.redirect('/login');y
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.redirect('/login');
  }
};


 exports.postUserLogout=(req,res)=>{
    req.session.destroy((err) => {
        if (err) {
          console.error('Error logging out:', err);
        } else {
          res.redirect('/login');
        }
      });
 }


