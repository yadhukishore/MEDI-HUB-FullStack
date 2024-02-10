// controllers/adminDashbord.js
const Order = require("../models/order");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const User = require("../models/user");

const handleError = (err, res) => {
    console.error('Error:', err);
    res.status(500).render('error', { statusCode: 500, message: err.message });
   };
  


const sales_report = async (selectedYear, selectedMonth) => {
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
        return salesReport;
    } catch (error) {
        console.error('Error fetching sales report:', error);
        throw error;
    }
};


const getTotalUsers =async () => {
    try {
        const totalUsers = await User.countDocuments();
        return totalUsers;
    } catch (error) {
        console.error('Error fetching total users:', error);
        throw error;
    }
};


const getTotalOrders = async () => {
    try {
        const totalOrders = await Order.countDocuments();
        return totalOrders;
    } catch (error) {
        console.error('Error fetching total orders:', error);
        throw error;
    }
};


const getAdminDash =[
    adminAuthMiddleware,
    async(req, res) => {
    try {
        const { year, month } = req.query;
        const salesReport = await sales_report(year, month);

        // Formating all dates
        salesReport.forEach((sales) => {
            if (sales.createdAt) {
                sales.createdAt = sales.createdAt.toLocaleDateString();
            }
        });
        const totalUsers = await getTotalUsers();
        const totalOrders = await getTotalOrders();
        

        let admin = res.locals.admin;
        res.render('admin/adminDash', { footer: true, admin: true, Admin: admin, salesReport, totalUsers, totalOrders });
    } catch (error) {
        console.error('Error rendering sales report:', error);
        handleError(error, res);    }
}];

const getSalesData = [
    adminAuthMiddleware,
    async(req, res) => {
    try {
        const { year, month } = req.query;
        const salesReport = await sales_report(year, month);
        res.json(salesReport);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        handleError(error, res);
        }
}];

const renderPieChartPage = [
    adminAuthMiddleware,
    async (req, res) => {
    try {
        const categoriesDelivered = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $unwind: '$products' },
            { $group: { _id: '$products.name', count: { $sum: 1 } } }
        ]);

        const labels = categoriesDelivered.map(c => c._id);
        const data = categoriesDelivered.map(c => c.count);
        console.log("labels: ",labels);
        console.log("data: ",data);

        res.render('admin/adminDashPie', { labels, data }); 
    } catch (error) {
        console.error('Error fetching delivered orders by category:', error);
        handleError(error, res);
        }
}];


const renderBarChart =[
    adminAuthMiddleware,
    async(req, res) => {
    try {
      
        const usersPerMonth = await User.aggregate([
            {
                $group: {
                 _id: { $month: "$createdAt" },
                 count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);
        
        // Convert the result to the format required by Chart.js
        const labels = usersPerMonth.map(u => new Date(0, u._id - 1).toLocaleString('default', { month: 'long' }));
        const data = usersPerMonth.map(u => u.count);
  
        res.render('admin/barChartDash', { labels, data });
    } catch (err) {
        console.error(err);
        handleError(err, res);
        }
 }];

 module.exports = {
    getAdminDash,
    getSalesData,
    renderPieChartPage,
    renderBarChart
};
 