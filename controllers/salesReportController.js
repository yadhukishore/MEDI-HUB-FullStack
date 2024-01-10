// controllers/salesReport.js
const Order = require("../models/order");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

// Function to fetch sales data from the database
const sales_report = async (selectedYear, selectedMonth) => {
    console.log('Fetching sales report...');
    try {

        const salesReport = await Order.aggregate([
            {
                $match: {
                    status: "Delivered",
                    createdAt: {
                        $gte: new Date(selectedYear, selectedMonth - 1, 1), // Start of selected month
                        $lt: new Date(selectedYear, selectedMonth, 1), // Start of next month or end of the selected month
                    }
                }
            },
            {
                $unwind: "$products"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "products.product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    'product.name': 1,
                    'createdAt': 1,
                    'products.quantity': 1,
                    'products.price': 1,
                    'total': { $multiply: ['$products.quantity', '$products.price'] }, 
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                        year: { $year: '$createdAt' },
                    },
                    totalSales: { $sum: '$total' },
                }
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                    '_id.day': 1
                }
            }
        ]);
        console.log("SalesReporttt:", salesReport);
        return salesReport;
    } catch (error) {
        console.error('Error fetching sales report:', error);
        throw error;
    }
};






exports.getAdminDash = async (req, res) => {
    try {
        const { year, month } = req.query;
        const salesReport = await sales_report(year, month);

        // Formating all dates
        salesReport.forEach((sales) => {
            if (sales.createdAt) {
                sales.createdAt = sales.createdAt.toLocaleDateString();
            }
        });
        let admin = res.locals.admin;
        res.render('admin/adminDash', { footer: true, admin: true, Admin: admin, salesReport });
    } catch (error) {
        console.error('Error rendering sales report:', error);
        res.status(500).send('Internal Server Error');
    }
};

// API endpoint to fetch sales data in JSON format
exports.getSalesData = async (req, res) => {
    try {
        const { year, month } = req.query;
        const salesReport = await sales_report(year, month);
        res.json(salesReport);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
