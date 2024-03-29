const mongoose = require('mongoose');

var bannerSchema = new mongoose.Schema(
    {
        banner_name: {
            type: String,
            required: true,
        },
        images: [
            {
                filename: String,
                originalname: String,
                path: String,
            },
        ],
        reference: {
            type: String,
            required: true,
        },
        banner_status: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Banner', bannerSchema);
