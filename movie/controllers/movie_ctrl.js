'use strict'

var Movie = require('../models/movie');
var Category = require('../models/category');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

var doubanApi = {
	search_url: 'https://api.douban.com/v2/movie/search?q=',
	detail_url: 'https://api.douban.com/v2/movie/subject/'
}


exports.searchByName = function *(name) {
	// body...
	let regexSearch = new RegExp(name + '.*', 'i');
	let searchResults = yield Movie.find({title: regexSearch}).exec();
	return searchResults;
}

exports.searchByCategory = function *(categoryId) {
	let category = yield Category.find({_id: categoryId})
							.populate({
								path: 'movies',
								select: 'title poster'
							}).exec();
	return category;
}

exports.searchHotMovies = function *(limitNum) {
	let movies = yield Movie.find({})
						.sort({pv : -1})
						.limit(limitNum).exec();
	return movies;
	/*Movie.find({}).sort({pv : -1}).limit(limit).exec(function(err, movies) {
		if (!err) {
			return movies;
		}
	});*/
}

function parseResponse(type, resBody) {
	//console.log('parseResponse type : ' + type + ' type = 0 : ' + (type === '0'));
	if (type === '0') {
		let movies = [];
		if (resBody && resBody.subjects) {
			let movieSubjects = resBody.subjects;
			let objLen = movieSubjects.length;
			if (objLen > 2) {
				objLen = 2;
			}
			for (let i = 0; i < objLen; i ++) {
				let movieSubject = movieSubjects[i];
				let movie = new Movie({
					title : movieSubject.title,
					director : '小六知不道',
					summary : movieSubject.summary,
					poster : movieSubject.images.medium,
					year : movieSubject.year,
					douban_id : movieSubject.id,
					pv : 1
				});
				if (movieSubject.directors && movieSubject.directors.length > 0) {
					movie.director = movieSubject.directors[0].name;
				}
				movies.push(movie);
			}
		}
		return movies;
	} else {
		console.log(resBody);
		let movie = new Movie({
			title: resBody.title,
			director: '小六知不道',
			summary: resBody.summary,
			poster: resBody.images.medium,
			year: resBody.year,
			douban_id: resBody.id,
			country: resBody.countries[0],
			pv : 1
		})
		if (resBody.directors && resBody.directors.length > 0) {
			movie.director = resBody.directors[0].name;
		}
		return movie;
	}
}

function searchFromNet(opts) {
	return new Promise(function(resolve, reject) {
		let requestUrl;
		if (!opts) {
			throw new Error('opts is null');
		}
		//console.log('searchFromNet opts : ' + JSON.stringify(opts));
		if (opts.type === '0') {
			requestUrl = doubanApi.search_url + encodeURIComponent(opts.name);
		} else {
			requestUrl = doubanApi.detail_url + opts.id;
		}
		
		request({url: requestUrl, json: true}).then(function(response) {
			let responseBody = response.body;
			let movies = parseResponse(opts.type, responseBody);
			resolve(movies);
		})
	});
}

exports.colligateSearch = function *(name) {
	let regexSearch = new RegExp(name + '.*', 'i');
	let movies = yield Movie.find({title: regexSearch}).exec();
	if (movies && movies.length > 0) {
		let movie = movies[0];
		movie.pv ++;
		yield movie.save();
		return movie;
	}
	let searchResult;
	let searchOpts = {
		name: name,
		id: '',
		type: '0'
	}
	movies = yield searchFromNet(searchOpts);
	if (movies && movies.length > 0) {
		searchOpts.id = movies[0].douban_id;
		searchOpts.type = '1';
		searchResult = yield searchFromNet(searchOpts);
		searchResult.title = searchResult.title || movies[0].title;
		searchResult.summary = searchResult.summary || movies[0].summary;
		searchResult.poster = searchResult.poster || movies[0].poster;
		searchResult.douban_id = searchResult.douban_id || movies[0].douban_id;
		searchResult.director = searchResult.director || movies[0].director;
		yield searchResult.save();
	}
	return searchResult;
	
	/*Movie.find({title: regexSearch})
		.exec(function(err, movies) {
			if (movies && movies.length > 0) {
				movies.forEach(function(item) {
					item.pv ++;
					item.save();
				})
				return movies;
			} else {
				movies = [];
				let requestUrl = 'https://api.douban.com/v2/movie/search?q=' + encodeURIComponent(name);
				console.log('colligateSearch url ---> ' + requestUrl);
				request(requestUrl, function(err, response) {
					if (response && response.body) {
						let responseBody = JSON.parse(response.body);
						let movieSubjects = [];
						if (responseBody && responseBody.subjects) {
							movieSubjects = responseBody.subjects;
							if (movieSubjects.length > 0) {
								movieSubjects.forEach(function(item, index) {
									if (index > 2) {
										return false;
									} else {
										let movie = new Movie({
											title : item.title,
											director : item.directors[0].name || '小六知不道',
											summary : item.summary,
											poster : item.images.medium,
											year : item.year,
											douban_id : item.id,
											pv : 1
										});
										movies.push(movie);
										movie.save();
									}
								});
								console.log('request movies length : ' + movies.length);
							}
						}
					}

					return movies;
				})
			}
		})*/
}

