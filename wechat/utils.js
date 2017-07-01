'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var xml2js = require('xml2js');
var template = require('./template');
var crypto = require('crypto');
var config = require('../config/config');

exports.readFileAsync = function(fpath, encoding) {
	return new Promise(function(resolve, reject) {
		fs.readFile(fpath, encoding, function(err, content) {
			if (err) {
				reject(err);
			} else {
				//console.log('readFileAsync data : ' + content);
				resolve(content)
			}
		});
	});
};

exports.writeFileAsync = function(fpath, data) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(fpath, data, function(err, content) {
			if (err) {
				reject(err);
			} else {
				resolve(content);
			}
		})
	});
};

exports.parseXMLAsync = function(xml) {
	return new Promise(function(resolve, reject) {
		xml2js.parseString(xml, {trim: true}, function(err, content) {
			if (err) {
				reject(err);
			} else {
				resolve(content);
			}
		});
	});
};

function formatMessage(data) {
	let message = {};
	if (typeof data === 'object') {
		let keys = Object.keys(data);
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i];
			let value = data[key];

			if (!(value instanceof Array) || value.length === 0) {
				continue;
			}
			if (value.length === 1) {
				let val = value[0];
				if (typeof val === 'object') {
					message[key] = formateMessage(val);
				} else {
					message[key] = (val || '').trim();
				}
			} else {
				message.key = [];
				for (let j = 0; j < value.length; j++) {
					message[key].push(formateMessage(value[j]));
				}
			}
		}
	}
	return message;
}

exports.formatMsg = function(msgData) {
	//console.log(msgData.xml);
	return formatMessage(msgData.xml);
}

exports.genTemplateMsg = function(content, message) {
	let info = {};
	let type = 'text';
	let fromUserName = message.FromUserName;
	let toUserName = message.ToUserName;
	if (Array.isArray(content)) {
		type = 'news';
	}

	type = content.type || type;
	info.msgType = type;
	info.content = content;
	info.createTime = new Date().getTime();
	info.toUserName = fromUserName;
	info.fromUserName = toUserName;
	
	return template.compileWXXMLTemplate(info);
}

function createNonce() {
	return Math.random().toString(36).substr(10, 25);
}

function createTimeStamp() {
	return parseInt((new Date()).getTime() / 1000, 10) + '';
}

function _sign(nonceStr, timeStamp, ticket, url) {
	let params = [
		'noncestr=' + nonceStr,
		'jsapi_ticket=' + ticket,
		'timestamp=' + timeStamp,
		'url=' + url
	];
	let sortedParamStr = params.sort().join('&');
	console.log('sign string : ' + sortedParamStr);
	let sha1Obj = crypto.createHash('sha1');
	sha1Obj.update(sortedParamStr);
	return sha1Obj.digest('hex');
}

exports.signJsTicketParam = function(ticket, url) {
	let nonceStr = createNonce();
	let timestamp = createTimeStamp();
	let signature = _sign(nonceStr, timestamp, ticket, url);
	return {
		noncestr: nonceStr,
		timestamp: timestamp,
		signature: signature
	};
}

exports.genWXHtmlTemplate = function(params) {
	return template.compileWXHTMLTemplate(params);
}

exports.isDebug = function() {
	if (config.env === 'production') {//production
		return false;
	}
	return true;
}



