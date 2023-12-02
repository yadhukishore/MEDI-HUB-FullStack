// controllers/userAuthController.js
const User = require('../models/user');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const  isValidPassword  = require('../utils/passwordValid');

//for otp////
// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'arjunreddy8921@gmail.com',
        pass: 'jsds kafa dwcu mfce'
    }
  });
  

exports.getForgotPassword = (req, res) => {
  const error =req.query.error;

    res.render('forgot_password',{error});
  };

 exports.postForgotPassword=async(req,res)=>{
    try {
        // Check if the user with the provided email exists in the database
        const existingUser = await User.findOne({ email: req.body.email });
    
        if (!existingUser) {
          // If the user does not exist, return an error
          console.log('User not found');
          return res.render('forgot_password',{error:'User not found'})
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
          from: 'arjunreddy8921@gmail.com',
          to: req.body.email,
          subject: 'Reset Your Password',
          text: `Your OTP for resetting the password is ${otp}. Please use it to reset your password.`
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Error sending email:', error);
            res.render('forgot_password',{error:'Internal Server Error. Please try again Later!'})
          } else {
            console.log('Email sent:', info.response);
            res.redirect(`/verify_otp?email=${req.body.email}`);
          }
        });
      } catch (error) {
        console.error('Error in forgot password:', error);
        res.render('forgot_password',{error:' Server faild! Please try again Later!'})
      }
 } 

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
  
 exports.getResetPassword=(req,res)=>{
    const email = req.params.email;
    res.render('reset_password', { email, error: null }); // Passing 'error' with a default value of null
 };

 exports.postResetPassword = async(req,res)=>{
    try {
        const email = req.params.email;
        const { newPassword, confirmPassword } = req.body;
    
        // Validate that the passwords match
        if (newPassword !== confirmPassword) {
          const error = 'Passwords do not match';
          console.log(error); // Log the error to the console
          return res.render('reset_password', {
            email,
            error
          });
        }
       // Hash the new password before storing it in the database
       const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Update the user's password in the database
        const user = await User.findOneAndUpdate(
          { email },
          { $set: { password: hashedPassword } },
          { new: true }
        );
    
        if (!user) {
          const error = 'User not found';
          console.log(error); // Log the error to the console
          return res.render('reset_password', {
            email,
            error
          });
        }
    
        console.log('Password updated successfully:', hashedPassword); // Log the updated password to the console
    
        // Redirect to a success page or login page
        res.redirect('/login');
      } catch (error) {
        console.error('Error in resetting password:', error);
        res.status(500).send('Internal Server Error');
      }
 }

 //signup

 exports.getSignup=(req,res)=>{
  const error = req.query.error;
  res.render('signup', { error });
 }
// Signup  with OTP generation and verification
 exports.postSignup=async(req,res)=>{
    const { email, username, password } = req.body;

  try {
    // Check if the user already exists in the database
    const userExists = await User.findOne({ email });

    if (userExists) {
      // User with the provided email already exists
      return res.render('signup',{error:'User with this email already exists!'});
    }
 // Validate the password
 if (!isValidPassword(password)) {
  // Password does not meet the requirements
  return res.render('signup', { error: 'Poor Password. Password must be strong and not contain spaces.' });
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
      from: 'arjunreddy8921@gmail.com',
      to: email,
      subject: 'OTP for Account Verification',
      text: `Your OTP for account verification is ${otp}. Please use it to verify your account.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.render('signup', { error: 'Error sending verification email. Please try again.' });
      } else {
        console.log('Email sent:', info.response);
        // Redirect to the OTP verification page
        res.redirect(`/verify_otp?email=${email}`);
      }
    });
  } catch (error) {
    console.error('Error signing up:', error);
    res.render('signup', { error: 'Internal Server Error. Please try again later.' });
  }
 }

 exports.getUserLogin=(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('login', { error: req.query.error });
  }
 }
 exports.postUserLogin = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (user) {
        // Check if the user is blocked
        if (user.blocked) {
          return res.render('login',{error:" Your account is blocked. Please contact the administrator for assistance!!!"})
          // You can customize the error message or handle it in the frontend accordingly
        }
  
        // Proceed with password verification
        const passwordMatch = await bcrypt.compare(password, user.password);
  
        if (passwordMatch) {
          // User login successful
          req.session.user = user; // Store user in session
          res.redirect('/');
        } else {
          // Invalid password
          res.redirect('/login?error=invalid password or email ');
          // You can customize the error message or handle it in the frontend accordingly
        }
      } else {
        // User not found
        res.redirect('/login?error=notfound');
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


