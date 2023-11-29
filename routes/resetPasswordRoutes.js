// routes/resetPasswordRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // If you haven't already required it in your main app file
const User = require('../models/user'); // Adjust the path based on your file structure

// Forgot Password Page
router.get('/forgot_password', (req, res) => {
    res.render('forgot_password');
});

// Handle Forgot Password Form Submission
router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    // TODO: Generate and send OTP to the user's email (you can use a library like nodemailer)

    // Render the OTP verification page
    res.render('verify_otp');
});

// Verify OTP Page
router.get('/verify_otp', (req, res) => {
    res.render('verify_otp');
});

// Handle OTP Verification Form Submission
router.post('/verify_otp', async (req, res) => {
    const { otp } = req.body;

    // TODO: Verify the OTP entered by the user

    // Render the password reset page
    res.render('reset_password');
});

// Handle Password Reset Form Submission
router.post('/reset_password', async (req, res) => {
    const { newPassword, confirmPassword } = req.body;

    // TODO: Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
        // Handle password mismatch error
        return res.redirect('/reset_password'); // Redirect back to the reset password page
    }

    // TODO: Update the user's password in the database
    // You should identify the user based on the OTP verification step

    // Redirect to the login page after password reset
    res.redirect('/login');
});

module.exports = router;
