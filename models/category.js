//category.js

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true },

});

const categoryName = mongoose.model('categoryName', categorySchema);

module.exports = categoryName;
