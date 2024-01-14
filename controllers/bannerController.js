const Banner = require('../models/banner');
const upload = require('../middleware/multer'); 

exports.renderBannerManagementPage = async (req, res) => {
    try {
        // Fetch all banners
        const banners = await Banner.find();
        res.render('admin/banner', { banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.createBanner = async (req, res) => {
    try {
        console.log("Going to create banner");
         // Extract banner data from the request body
         const { banner_name, reference } = req.body;
         const banner_status = req.body.banner_status === 'on';

        // Create a new banner
        const banner = new Banner({
            banner_name,
            reference,
            banner_status,
            images: req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                path: file.path,
            })),
        });
        console.log("Banner:\n",banner);

        // Save the banner to the database
        await banner.save();
        console.log("SAvedd>>>");

        res.redirect('/admin/banner');
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        // Delete the banner with the specified ID
        await Banner.findByIdAndDelete(req.params.id);

        res.redirect('/admin/banner');
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.bannerFetchFunction = async(req, res) => {
    try {
        console.log("Called AJAX", req.body.status);
        const banner = await Banner.findById(req.params.id);
        console.log(banner);
 
        // Toggle the status
        banner.banner_status = !banner.banner_status;
 
        const val = await banner.save();
        console.log("Saved toDB", val);
        res.json(banner);
    } catch (error) {
        res.status(500).send(error);
    }
 }
 
