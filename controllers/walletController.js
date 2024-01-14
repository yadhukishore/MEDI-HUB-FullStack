
const User = require("../models/user");
const { use } = require("../routes/user/userRoutes");

exports. getUserWalletBalance = async (req, res) => {
    try {
        // Assuming you store the user's ID in the session
        const userId = req.session.user._id;
        const user = await User.findById(req.session.user._id).populate('cart.product');
 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("TotWallet amount  : ",user.user_wallet);
        console.log("UserName : ",user.username);
 
        // Render the EJS template and pass the wallet balance to it
        res.render('userWallet', { user,walletBalance: user.user_wallet ,userName:user.username});
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
 };

// Define the route for the user wallet page



