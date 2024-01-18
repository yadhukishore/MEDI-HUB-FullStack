const Banner = require('../models/banner');
const upload = require('../middleware/multer'); 

exports.renderBannerManagementPage = async (req, res) => {
   try {
       const banners = await Banner.find().select('banner_name reference banner_status images');
       res.render('admin/banner', { banners });
   } catch (error) {
       res.status(500).send('Internal Server Error');
   }
};

exports.createBanner = async (req, res) => {
   try {
       const { banner_name, reference } = req.body;
       const banner_status = req.body.banner_status === 'on';

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

       await banner.save();
       res.redirect('/admin/banner');
   } catch (error) {
       res.status(500).send('Internal Server Error');
   }
};

exports.deleteBanner = async (req, res) => {
   try {
       await Banner.findByIdAndDelete(req.params.id);
       res.redirect('/admin/banner');
   } catch (error) {
       res.status(500).send('Internal Server Error');
   }
};

exports.bannerFetchFunction = async(req, res) => {
   try {
       const banner = await Banner.findById(req.params.id);
       banner.banner_status = !banner.banner_status;
       await banner.save();
       res.json(banner);
   } catch (error) {
       res.status(500).send(error);
   }
}
