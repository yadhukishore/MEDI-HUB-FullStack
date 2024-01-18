
const User = require("../models/user");
const { use } = require("../routes/user/userRoutes");

exports. getUserWalletBalance = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(req.session.user._id).populate('cart.product');
 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("TotWallet amount  : ",user.user_wallet);
        res.render('userWallet', { user,walletBalance: user.user_wallet ,userName:user.username});
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
 };





