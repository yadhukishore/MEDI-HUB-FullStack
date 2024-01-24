const Coupen = require('../models/coupenSchema');
const mongoose = require('mongoose');


exports.render_coupen_page = async (req, res) => {
    try {
        console.log("Entered main coupon page");
        const coupons = await Coupen.find({ is_delete: false }).exec();
        res.render('admin/adminCoupen', { coupons });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { statusCode: 500, message: 'Coupon Server Error' });
    }
};
exports.getCreate_coupon = async (req, res) => {
    try {
        console.log("Entered add coupen render page");
        const coupons = await Coupen.find({ is_delete: false }).exec();
        res.render('admin/adminAddcoupen', { coupons });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { statusCode: 500, message: 'createCoupon Server Error' });
    }
};

exports.render_edit_coupon_page = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const coupon = await Coupen.findById(couponId).exec();
        res.render('admin/adminEditCoupon', { coupon });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { statusCode: 500, message: 'Edit Coupon Server Error' });
    }
};

exports.create_coupon = async (req, res) => {
    console.log("Entered create coupen");
    const coupen = new Coupen({
        coupon_code: req.body.coupon_code,
        discount: req.body.discount,
        start_date: req.body.start_date,
        exp_date: req.body.exp_date,
       
        min_amount: req.body.min_amount,
        used_count: req.body.used_count,
        description: req.body.description,
    });

  
    try {
        // Creating coupon in the database
        const createCoupen = await coupen.save();
        console.log("Saved coupon:-",createCoupen);

        res.redirect(`/admin/coupon?coupon=${JSON.stringify(createCoupen)}`);

    } catch (error) {
        console.error(error);

        res.json({ success: false, error: error.message });
    }
};


exports.post_edit_coupon = async (req, res) => {
    const couponId = req.params.couponId;

    try {
        const existingCoupon = await Coupen.findById(couponId).exec();

        existingCoupon.coupon_code = req.body.coupon_code;
        existingCoupon.discount = req.body.discount;
        existingCoupon.start_date = req.body.start_date;
        existingCoupon.exp_date = req.body.exp_date;

        existingCoupon.min_amount = req.body.min_amount;
        existingCoupon.used_count = req.body.used_count;
        existingCoupon.description = req.body.description;

        const updatedCoupon = await existingCoupon.save();

        res.redirect(`/admin/coupon?coupon=${JSON.stringify(updatedCoupon)}`);
    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

exports.deleteCoupon = async(req, res) => {
    const couponId = req.params.couponId;
    
    try {
        
        const updatedCoupon = await Coupen.findByIdAndUpdate(
            couponId,
            { is_delete: true },
            { new: true } // To return the updated document
        );

        if (!updatedCoupon) {
            console.log("Coupon not found");
            return res.status(404).send('Coupon not found');
            
        }

        res.redirect('/admin/coupon');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { statusCode: 500, message: 'Delete Coupon Server Error' });
    }
};