'use strict';

var sha1 = require('sha1');
var rawbody = require('raw-body');
var WeChat = require('./wechat');
var utils = require('./utils');

var MsgGenerator = function(opts, handler) {
	//todo need refactor
	return function *(next) {
		console.log('---------------------');
		console.log(this.query);
		console.log('---------------------');

		let token = opts.testAppToken;//modify token
		let signature = this.query.signature;
		let nonce = this.query.nonce;
		let timestamp = this.query.timestamp;
		let echostr = this.query.echostr;
		let str = [token, timestamp, nonce].sort().join('');
		let sha = sha1(str);

		console.log('generator : this method : ' + this.method);
		if (this.method === 'GET') {
			if (sha === signature) {
				this.body = echostr + '';
				console.log('-----GET request From WeChat-----');
			} else {
				this.body = 'invalid request';
			}
		} else if (this.method === 'POST') {
			if (sha !== signature) {
				this.body = 'invalid request';
				console.log('verify signature error');
				return false;
			}

			let data = yield rawbody(this.req, {
				length: this.length,
				limit: '1mb',
				encoding: this.charset
			})
			//console.log('rawbody data : ' + data);

			let content = yield utils.parseXMLAsync(data);
			if (utils.isDebug()) {
				console.log(content);
			}

			let message = utils.formatMsg(content);
			if (utils.isDebug()) {
				console.log(message);
			}

			this.wechatMsg = message;

			yield handler.call(this, next);

		}
		
	}
};

var HtmlGenerator = function(handler) {
	return function *(next) {
		console.log('---------------------');
		console.log(this.query);
		console.log('---------------------');
		yield handler.call(this, next);
	}
}

exports = module.exports = {
	MsgGenerator: MsgGenerator,
	HtmlGenerator: HtmlGenerator
}

/*module.exports = function(opts, handler) {
	// body...
	//let weChat = new WeChat(opts);

	return function *(next) {
		console.log('---------------------');
		console.log(this.query);
		console.log('---------------------');

		let token = opts.testAppToken;//modify token
		let signature = this.query.signature;
		let nonce = this.query.nonce;
		let timestamp = this.query.timestamp;
		let echostr = this.query.echostr;
		let str = [token, timestamp, nonce].sort().join('');
		let sha = sha1(str);

		console.log('generator : this method : ' + this.method);
		if (this.method === 'GET') {
			if (sha === signature) {
				this.body = echostr + '';
				console.log('-----GET request From WeChat-----');
			} else {
				this.body = 'invalid request';
			}
		} else if (this.method === 'POST') {
			if (sha !== signature) {
				this.body = 'invalid request';
				console.log('verify signature error');
				return false;
			}

			let data = yield rawbody(this.req, {
				length: this.length,
				limit: '1mb',
				encoding: this.charset
			})
			//console.log('rawbody data : ' + data);

			let content = yield utils.parseXMLAsync(data);
			console.log(content);

			let message = utils.formatMsg(content);
			console.log(message);

			this.wechatMsg = message;

			yield handler.call(this, next);

		}
		
	}
}*/

