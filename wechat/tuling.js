'use strict';

var crypto = require('crypto');
var utf8Format = require('utf8');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var config = require('../config/config');

var tulingApi = {
	secret: 'your secret',
	api_url: 'http://www.tuling123.com/openapi/api'
}

var cipherAlgorithm = 'aes-128-cbc';
var cipherEncoding = 'base64';

function isDebug() {
	if (config.env === 'production') {
		return false;
	}
	return true;
}

function getCrytoData(timestamp, info) {

	let appKey = config.tulingApiKey;
	let keyParam = tulingApi.secret + timestamp + appKey;
	let aesKey = crypto.createHash('md5').update(keyParam).digest('hex');
	//to crypto result keep same with tuling demo
	let fuckAesKey = crypto.createHash('md5').update(aesKey).digest();
	if (isDebug()) {
		console.log('getCrytoData keyParam : ' + keyParam + ' aesKey : ' + aesKey + ' fuckAesKey : ' + fuckAesKey);
	}
	let infoBody = JSON.stringify({'info': info});

	let cipherChunks = [];
	let cipher = crypto.createCipheriv(cipherAlgorithm, fuckAesKey, new Buffer(''));
	cipher.setAutoPadding(true);
    cipherChunks.push(cipher.update(infoBody, 'utf8', cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    let encryptResult = cipherChunks.join('');
    if (isDebug()) {
    	console.log('getCrytoData result ---> ' + encryptResult);
    }
    return encryptResult;
}

exports.getTulingReply = function(info) {
	// body...
	//let formatInfo = utf8Format.encode(info);
	//let requestUrl = tulingApi.api_url + '?key=' + config.tulingApiKey + '&info=' + formatInfo;
	let timestamp = new Date().getTime();
	let cryptoResult = getCrytoData(timestamp, info);
	let postBody = {};
	postBody.key = config.tulingApiKey;
	postBody.timestamp = timestamp;
	postBody.data = cryptoResult;
	if (isDebug()) {
		console.log('getTulingReply postBody : ' + JSON.stringify(postBody) + ' url : ' + tulingApi.api_url);
	}
	let requestOpts = {
		method: 'POST',
		url: tulingApi.api_url,
		body: postBody,
		json: true,
	}

	return new Promise(function(resolve, reject) {
		//let requestUrl = tulingApi.api_url + '?key=' + config.tulingApiKey + '&info=' + formatInfo;

		request(requestOpts)
			.then(function(response) {
				let data = response.body;
				if (isDebug()) {
					console.log('getTulingReply  reply : ' + JSON.stringify(response) + ' body : ' + JSON.stringify(data));
				}
				if (data && (typeof data === 'object')) {
					resolve(data);
				} else {
					throw new Error('getTulingReply error');
				}

			}).catch(function(error) {
				//reject(error);
				let errorData = {};
				errorData.code = '100000';
				errorData.text = '小六表示很困惑...';
				resolve(errorData);
			});
	});
}
