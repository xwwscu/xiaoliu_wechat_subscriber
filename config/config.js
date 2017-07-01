'use strict';

var path = require('path');
var utils = require('../wechat/utils');

var wechat_token_file = path.join(__dirname, './wechat_token.txt');
var wechat_ticket_file = path.join(__dirname, './wechat_ticket.txt');

var config = {
	wechat: {
		appID: 'your appID',
		appSecret: 'your appSecret',
		token: 'your token',
		testAppId: 'testAppId',
		testAppSecret: 'testAppSecret',
		testAppToken: 'xwwwechattest',
		getAccessToken: function() {
			return utils.readFileAsync(wechat_token_file);
		},
		saveAccessToken: function(data) {
			data = JSON.stringify(data);
			utils.writeFileAsync(wechat_token_file, data);
		},
		getJsTicket: function() {
			return utils.readFileAsync(wechat_ticket_file);
		},
		saveJsTicket: function(ticketData) {
			let ticketDataStr = JSON.stringify(ticketData);
			utils.writeFileAsync(wechat_ticket_file, ticketDataStr);
		}
	},
	tulingApiKey: 'your tulingApiKey',
	dbUrl: 'mongodb://localhost/wechat',
	env: 'production',
	appPort: 3001
}
//var PORT = 3001;
//var env = 'development';
module.exports = config;
