const User = require("../models/user");
const Order = require("../models/order");
const Product = require("../models/product");
const Coupon = require('../models/coupenSchema');

exports.getInvoiceData = async (req, res) => {
    try {
        console.log("<<<<<<INVOICE>>>>>>>>>");
        const order = await Order.findById(req.params.orderId)
            .populate('products.product')
            .populate({
                path: 'user',
                populate: {
                    path: 'addresses',
                },
            });

        if (!order || !order.user) {
            throw new Error('Order or user not found');
        }
        console.log("orders from invoice->",order);

        const user = order.user;
        console.log("userr<<",user);

        if (!user.addresses || user.addresses.length === 0) {
            throw new Error('User address not found');
        }

        const userAddress = user.addresses[0]; // Assuming you want the first address

        console.log("userAddress;>",userAddress);
     
     

        // Set a default tax rate or calculate it based on your business logic
        const taxRate = 18; // Change this to your actual tax rate

        // Prepare data for the invoice
        const invoiceData = {
           // If not using the free version, set your API key
    // "apiKey": "123abc", // Get apiKey through: https://app.budgetinvoice.com/register
    
    // Customize enables you to provide your own templates
    // Please review the documentation for instructions and examples
    "customize": {
        //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
    },
    "images": {
        // The logo on top of your invoice
        "logo": "https://www.medihub.ug/static/media/toplogo.dc9f2c6c.png",
        // The invoice background
        "background": "",
    },
    // Your own data
    "sender": {
        "company": "MEDI HUB",
        "address": "CHALAKUDY,MH-Road",
        "zip": "680 777",
        "city": "Thrissur",
        "country": "INDIA"
        //"custom1": "custom value 1",
        //"custom2": "custom value 2",
        //"custom3": "custom value 3"
    },
    // Your recipient
    "client": {
        "company": user.username,
        "address": userAddress.fullAddress || 'N/A',
        "zip":  userAddress.pincode || 'N/A',
        "city": userAddress.city || 'N/A',
        "country":  userAddress.state || 'N/A',
        // "custom1": "custom value 1",
        // "custom2": "custom value 2",
        // "custom3": "custom value 3"
    },
    "information": {
        // Invoice number
        "number": `IN${order._id}`,
        // Invoice data
        "date": new Date().toLocaleDateString(),
        // Invoice due date
        "due-date": order.deliveryDate.toLocaleDateString(),
    },
    // The products you would like to see on your invoice
    // Total values are being calculated automatically
    "products": order.products.map(product => ({
        "quantity": product.quantity,
        "description": product.product.name,
        "tax-rate": 0,
        "price": product.price,
     })),
    // The message you would like to display on the bottom of your invoice
    "bottom-notice": "Thankyou for Purchasing!",
    // Settings to customize your invoice
    "settings": {
        "currency": "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
        // "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')        
        // "margin-top": 25, // Defaults to '25'
        // "margin-right": 25, // Defaults to '25'
        // "margin-left": 25, // Defaults to '25'
        // "margin-bottom": 25, // Defaults to '25'
        // "format": "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
        // "height": "1000px", // allowed units: mm, cm, in, px
        // "width": "500px", // allowed units: mm, cm, in, px
        // "orientation": "landscape", // portrait or landscape, defaults to portrait
    },
    // Translate your invoice to your preferred language
    "translate": {
        // "invoice": "FACTUUR",  // Default to 'INVOICE'
        "number": "Invoice Id", // Defaults to 'Number'
        "date": "Date", // Default to 'Date'
        "due-date": "Delivary date", // Defaults to 'Due Date'
        // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
        // "products": "Producten", // Defaults to 'Products'
        // "quantity": "Aantal", // Default to 'Quantity'
        // "price": "Prijs", // Defaults to 'Price'
        // "product-total": "Totaal", // Defaults to 'Total'
        // "total": "Totaal", // Defaults to 'Total'
        // "vat": "btw" // Defaults to 'vat'
    },
        };
        console.log("-----------invoiceData----<",invoiceData);
        res.json(invoiceData);
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
