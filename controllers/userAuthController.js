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
    // Check if the user with the provided email exists in the database
    const existingUser = await User.findOne({ email: req.body.email });

    if (!existingUser) {
      // If the user does not exist, return an error
      console.log('User not found');
      req.flash('error', 'User not found');
      return res.redirect('/forgot_password');
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Set OTP expiration time to 5 minutes (300 seconds)
    const otpExpiration = Date.now() + 300000;

    // Update the user's OTP and OTP expiration time in the database
    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      { $set: { otp, otpExpiration } },
      { new: true, upsert: true }
    );

    // Send the OTP to the user's email
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
    const error = req.query.error; // Assuming you handle errors with a query parameter
    res.render('verify_otp', { email, error });
 }

 exports.postVerifyOTP=async(req,res)=>{
    try {
        const { email, otp } = req.body;
    
        // Find the user by email
        const user = await User.findOne({ email });
    
        if (user) {
          // Check if the provided OTP matches the stored OTP
          if (user.otp === otp) {
            console.log('OTP Matched!');
            // Redirect to the reset password page
            res.redirect(`/reset_password/${email}`);
          } else {
            console.log('Invalid OTP');
            // Invalid OTP, redirect to the verification page with an error message
            res.render('verify_otp', { email, error: 'Invalid OTP. Please try again.' });
          }
        } else {
          console.log('User not found');
          // User not found, redirect to the verification page with an error message
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

      // Generate a new random 6-digit OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000);

      // Set OTP expiration time to 5 minutes (300 seconds)
      const otpExpiration = Date.now() + 300000;

      // Update the user's OTP and OTP expiration time in the database
      const user = await User.findOneAndUpdate(
          { email },
          { $set: { otp: newOtp, otpExpiration } },
          { new: true }
      );

      // Send the new OTP to the user's email
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
              // Redirect to the same verification page with a success message
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

// Signup with OTP generation and verification
exports.postSignup = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Check if the user already exists in the database
    const userExists = await User.findOne({ email });

    if (userExists) {
      // User with the provided email already exists
      req.flash('error', 'User with this email already exists!');
      return res.redirect('/signup');
    }

    // Validate the password
    if (!isValidPassword(password)) {
      // Password does not meet the requirements
      req.flash('error', 'Poor Password. Password must be strong and not contain spaces.');
      return res.redirect('/signup');
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Set OTP expiration time to 5 minutes (300 seconds)
    const otpExpiration = Date.now() + 300000;

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the provided details
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      otp,
      otpExpiration,
    });

    // Save the user to the database
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
        // Redirect to the OTP verification page
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
      // Check if the user is blocked
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
      // User not found
      req.flash('error', 'User not found');
      res.redirect('/login');
      // You can customize the error message or handle it in the frontend accordingly
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


