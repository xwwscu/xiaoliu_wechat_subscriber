var mongoose = require('mongoose');
var categorySchema = require('../schemas/category');
var category = mongoose.model('Category', categorySchema);

module.exports = category;