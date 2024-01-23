const Order = require("../models/order");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");


exports.getSalesReport = async (req, res) => {
    try {
        const selectedInterval = req.query.interval || 'all';
        let endDate = new Date();

        if (selectedInterval === 'all') {
            startDate = new Date(1900, 0, 1); // Set the start date to January 1, 1900
         }
        else if (selectedInterval === 'thisMonth') {
            startDate = new Date();
            startDate.setDate(1); // Set the start day to the first day of the current month
         }
         

       else if (selectedInterval === 'lastMonth') {
            startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
        } else if (selectedInterval === 'lastYear') {
            startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            startDate.setMonth(0); // Set the start month to January
            startDate.setDate(1); // Set the start day to the first day of January
        }

       
        const salesData = await Order.find({
            status: 'Delivered',
            createdAt: { $gte: startDate, $lte: endDate },
        }).populate('user').populate({
            path: 'products.product',
            populate: { path: 'category', model: 'categoryName' },
        });

        res.render('admin/salesReport', {
            orders: salesData,
            selectedInterval, 
        });
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).send("Internal Server Error");
    }
};
