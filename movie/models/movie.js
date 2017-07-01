var mongoose = require('mongoose');
var movieSchema = require('../schemas/movie');
var movie = mongoose.model('Movie', movieSchema);

module.exports = movie;