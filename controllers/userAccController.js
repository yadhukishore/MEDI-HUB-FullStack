// controllers/userAccController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Middleware
const verifyLoginAcc = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to view your account details.');
        res.redirect('/login');
    }
};
exports.verifyLoginAcc = verifyLoginAcc;

exports.getAccountDetails = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user._id).populate('cart.product');
            res.render('./userAccount/accountDetails.ejs', { user });
        } else {
           req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.redirect('/login');
    }
};

exports.postAccountDetails =  async (req, res) => {
    try {
        const userId = req.session.user._id;

        await User.findByIdAndUpdate(userId, {
            username: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
        });

        console.log(req.body.fullName); 
        console.log(req.body.email);    
        console.log(req.body.phone);    

        req.flash('success', 'Account details updated successfully.');
        res.redirect('/userAccount');
    } catch (error) {
        console.error('Error updating user details:', error);
        req.flash('error', 'Error updating account details.');
        res.redirect('/userAccount');
    }
};

exports.postChangePassword = async(req,res)=>{
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        const isPasswordMatch = await bcrypt.compare(req.body.currentPassword, user.password);
        if(!isPasswordMatch){
            req.flash('passwordError','Current password is incorrt!');
            return res.redirect('/userAccount');
        }
        if (req.body.newPassword !== req.body.confirmPassword) {
            req.flash('passwordError', 'New password and confirm password do not match!');
            return res.redirect('/userAccount');
        }
        const hashedPassword = await bcrypt.hash(req.body.newPassword,10);
        await User.findByIdAndUpdate(userId,{password:hashedPassword})
        req.flash('success', 'Password changed successfully.');
        res.redirect('/userAccount');

    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error', 'Error changing password.');
        res.redirect('/userAccount');
    }
};


exports.getUserAddress = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user._id).populate('cart.product');
            res.render('./userAccount/userAddress.ejs',{user});
        } else {
            req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.redirect('/login');
    }
   

};

exports.getAddAddress =  async (req, res) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user._id).populate('cart.product');
            res.render('./userAccount/add_address.ejs', { user });
        } else {
            req.flash('error', 'Please log in to view your account details.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.redirect('/login');
    }
};

exports.postAddAddress =  async (req, res) => {
try {
    
    if (req.session.user) {
        const userId = req.session.user._id;

        const newAddress = {
            state: req.body.state,
            city: req.body.city,
            pincode: req.body.pincode,
            landmark: req.body.landmark,
            fullAddress: req.body.address,
            isDefault: req.body.isDefault === 'on', // Convert 'on' to true, undefined to false
        };

         if (newAddress.isDefault) {
            await User.updateOne(
                { _id: userId },
                { $set: { 'addresses.$[].isDefault': false } }
            );
        }
      
        await User.updateOne(
            { _id: userId },
            { $push: { addresses: newAddress } }
        );

        req.flash('success', 'Address added successfully.');
        console.log("Address added!");
        res.redirect('/userAccount');
    } else {
        req.flash('error', 'Please log in to view your account details.');
        res.redirect('/login');
    
    }

} catch (error) {
    console.error('Error adding address:', error);
    res.redirect('/login');
}

};

exports.deleteAddress =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true } // To get the updated user document
        );
        req.flash('success', 'Address Deleted!!!');
        console.log("Address Deleted!!!!");
        res.redirect('/userAccount'); 
    } catch (error) {
        console.error('Error deleting address:', error);
        res.redirect('/userAccount');
    }
};


exports.getEditAddress =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;

        const user = await User.findById(userId);
        const address = user.addresses.id(addressId);

        res.render('./userAccount/edit_address.ejs', { user, address });
    } catch (error) {
        console.error('Error fetching address for edit:', error);
        res.redirect('/userAccount');
    }
};

exports.postEditAddress  =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;

        const user = await User.findById(userId);
        const address = user.addresses.id(addressId);

        address.state = req.body.state;
        address.city = req.body.city;
        address.pincode = req.body.pincode;
        address.landmark = req.body.landmark;
        address.fullAddress = req.body.fullAddress;

        await user.save();
        console.log("Edited address and saved!");

        res.redirect('/userAccount');  
    } catch (error) {
        console.error('Error updating address:', error);
        res.redirect('/userAccount');
    }

};