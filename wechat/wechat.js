'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var fs = require('fs');
var utils = require('./utils');
var _ = require('lodash');

var BASEURL = 'https://api.weixin.qq.com/cgi-bin/';
var BASEURL_MP = 'https://mp.weixin.qq.com/cgi-bin/';

var wechatApi = {
	access_token_url: BASEURL + 'token?grant_type=client_credential',
	temporary: {
		upload_material_url: BASEURL + 'media/upload?',
		fetch_material_url: BASEURL + 'media/get?'
	},
	permanent: {
		upload_material_url: BASEURL + 'material/add_material?',
		upload_news_url: BASEURL + 'material/add_news?',
		upload_news_pic_url: BASEURL + 'media/uploadimg?',
		fetch_material_url: BASEURL + 'material/get_material?',
		update_material_url: BASEURL + 'material/update_news?',
		delete_material_url: BASEURL + 'material/del_material?',
		get_material_size: BASEURL + 'material/get_materialcount?',
		batch_get_material_url: BASEURL + 'material/batchget_material?'
	},
	group: {
		create_group_url: BASEURL + 'groups/create?',
		get_group_url: BASEURL + 'groups/get?',
		check_group_url: BASEURL + 'groups/getid?',
		update_group_url: BASEURL + 'groups/update?',
		move_group_url: BASEURL + 'groups/members/update?',
		batch_update_group_url: BASEURL + 'groups/members/batchupdate?',
		delete_group_url: BASEURL + 'groups/delete?'
	},
	user: {
		fetch_user_info_url: BASEURL + 'user/info?',
		batch_fetch_user_info_url: BASEURL + 'user/info/batchget?',
		fetch_user_list_url: BASEURL + 'user/get?'
	},
	mass: {
		send_by_group_url: BASEURL + 'message/mass/sendall?',
		send_by_openId_url: BASEURL + 'message/mass/send?',
		delete_message_url: BASEURL + 'message/mass/delete?',
		preview_message_url: BASEURL + 'message/mass/preview?'
	},
	menu: {
		create_menu_url: BASEURL + 'menu/create?',
		get_menu_url: BASEURL + 'menu/get?',
		delete_menu_url: BASEURL + 'menu/delete?',
		get_selfmenu_info_url: BASEURL + 'get_current_selfmenu_info?'
	},
	qrcode: {
		create_qrcode_url: BASEURL + 'qrcode/create?',
		show_qrcode_url: BASEURL_MP + 'showqrcode?'
	},
	shorturl: {
		create_shorturl_url: BASEURL + 'shorturl?'
	},
	semantic_url: 'https://api.weixin.qq.com/semantic/search?',
	ticket: {
		get_js_ticket_url: BASEURL + 'ticket/getticket?'
	}
}

function WeChat(opts) {
	// body...
	this.appID = opts.testAppId;//modify appId
	this.appSecret = opts.testAppSecret;//modify appSecrete
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.getJsTicket = opts.getJsTicket;
	this.saveJsTicket = opts.saveJsTicket;
	this.fetchAccessToken();
}

WeChat.prototype.fetchAccessToken = function() {
	let that = this;

	if (that.access_token && that.expires_in) {
		if (that.isValidTokenOrTicket(that)) {
			return Promise.resolve(that);
		}
	}
	console.log('====== in Wechat fetchAccessToken =======');
	that.getAccessToken()
		.then(function(data) {
			let jsonData;
			try {
				if (utils.isDebug()) {
					console.log('WeChat getAccessToken data : ' + data + ' appId : ' + that.appID + ' appSecret : ' + that.appSecret);
				}
				jsonData = JSON.parse(data);
				if (utils.isDebug()) {
					console.log('WeChat getAccessToken json data : ' + JSON.stringify(jsonData));
				}
				if(!that.isValidTokenOrTicket(jsonData)) {
					return that.updateAccessToken();
				} else {
					return Promise.resolve(jsonData);
				}
			} catch(e) {
				return that.updateAccessToken();
			}
			
		})
		.then(function(data) {
			//console.log('getAccessToken stringify data : ' + JSON.stringify(data) + ' data : ' + data);
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;
			that.saveAccessToken(data);

			return Promise.resolve(data);
		});

}

WeChat.prototype.isValidTokenOrTicket = function(data) {
	if (!data || !data.expires_in) {
		return false;
	}
	
	let expires_in = data.expires_in;
	let nowTime = new Date().getTime();

	if (nowTime < expires_in) {
		return true;
	} else {
		return false;
	}
}

WeChat.prototype.updateAccessToken = function() {
	let appID = this.appID;
	let appSecret = this.appSecret;
	let requestUrl = wechatApi.access_token_url + '&appid=' + appID + '&secret=' + appSecret;
	if (utils.isDebug()) {
		console.log('updateAccessToken request : ' + requestUrl);
	}
	return new Promise(function(resolve, reject) {
		request({url: requestUrl, json: true}).then(function(response) {
			let data = response.body;
			if (utils.isDebug()) {
				console.log('updateAccessToken response : ' + response + ' data : ' + data + ' string : ' + JSON.stringify(response));
			}
			let nowTime = new Date().getTime();
			let expires_in = nowTime + (data.expires_in - 20) * 1000;
			data.expires_in = expires_in;
			resolve(data);
		});
	});
}

WeChat.prototype.fetchJsTicket = function(access_token) {//fetchJsTicket
	let that = this;
	
	console.log('====== in Wechat fetchJsTicket ======= token ' + access_token);
	return that.getJsTicket()
				.then(function(data) {
					let jsonData;
					try {
						if (utils.isDebug()) {
							console.log('WeChat fetchJsTicket data : ' + data);
						}
						jsonData = JSON.parse(data);
						
						if(!that.isValidTokenOrTicket(jsonData)) {
							return that.updateJsTicket(access_token);
						} else {
							return Promise.resolve(jsonData);
						}
					} catch(e) {
						return that.updateJsTicket(access_token);
					}
					
				})
				.then(function(data) {
					//console.log('getAccessToken stringify data : ' + JSON.stringify(data) + ' data : ' + data);
					that.saveJsTicket(data);

					return Promise.resolve(data);
				});

}

WeChat.prototype.updateJsTicket = function(access_token) {
	let requestUrl = wechatApi.ticket.get_js_ticket_url + 'access_token=' + access_token + '&type=jsapi';
	if (utils.isDebug) {
		console.log('updateJsTicket request : ' + requestUrl);
	}
	return new Promise(function(resolve, reject) {
		request({url: requestUrl, json: true}).then(function(response) {
			let data = response.body;
			if (utils.isDebug()) {
				console.log('updateJsTicket response : ' + response + ' data : ' + data + ' string : ' + JSON.stringify(response));
			}
			let nowTime = new Date().getTime();
			let expires_in = nowTime + (data.expires_in - 20) * 1000;
			data.expires_in = expires_in;
			resolve(data);
		});
	});
}

WeChat.prototype.fetchMaterial = function(isTemporary, fetchOpts) {
	
	if (!fetchOpts) {
		throw new Error('upload material method opts is null');
	}

	let that = this;
	let fetchUrl = wechatApi.temporary.fetch_material_url;
	let mediaId = fetchOpts.mediaId;
	let type = fetchOpts.type || 'image';
	if (!isTemporary) {
		fetchUrl = wechatApi.permanent.fetch_material_url;
	}
		
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = fetchUrl + 'access_token=' + tokenData.access_token;
				let requestOptions = {
					method: 'POST',
					json: true
				}
				if (isTemporary) {
					requestUrl += '&media_id=' + mediaId;
					requestOptions.method = 'GET';
					if (type === 'video') {
						requestUrl = requestUrl.replace('https://', 'http://');
					}
				} else {
					let form = {
						media_id: mediaId,
						access_token: tokenData.access_token
					}
					requestOptions.body = form;
				}
				requestOptions.url = requestUrl;
				if (utils.isDebug()) {
					console.log('fetchMaterial request : ' + requestUrl);
				}
				request(requestOptions)
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('fetchMaterial error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.uploadMaterial = function(isUploadTemporary, material, uploadOpts) {
	
	if (!uploadOpts) {
		throw new Error('upload material method opts is null');
	}

	let that = this;
	let uploadUrl = wechatApi.temporary.upload_material_url;
	let form = {};
	let type = uploadOpts.type;

	if (!isUploadTemporary) {
		uploadUrl = wechatApi.permanent.upload_material_url;
		_.extend(form, uploadOpts);
	}
	if (type === 'pic') {
		uploadUrl = wechatApi.permanent.upload_news_pic_url;
	} else if (type === 'news') {
		uploadUrl = wechatApi.permanent.upload_news_url;
		form = material;
	} else {
		form.media = fs.createReadStream(material);
	}
		
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = uploadUrl + 'access_token=' + tokenData.access_token;
				if (isUploadTemporary) {
					requestUrl = requestUrl + '&type=' + type;
				} else {
					form.access_token = tokenData.access_token;
				}
				if (utils.isDebug()) {
					console.log('uploadMaterial request : ' + requestUrl);
				}
				let requestOptions = {
					method: 'POST',
					url: requestUrl,
					json: true
				}
				if (type === 'news') {
					requestOptions.body = form;
				} else {
					requestOptions.formData = form;
				}
				request(requestOptions)
					.then(function(response) {
						let data = response.body;
						if (utils.isDebug()) {
							console.log('uploadMaterial response : ' + response + ' data : ' + data + ' string : ' + JSON.stringify(response));
						}
						if (data) {
							resolve(data);
						} else {
							throw new Error('uploadMaterial error');
						}
					}).catch(function(err) {
						reject(err);
					});
			})

	});
}

WeChat.prototype.updateMaterial = function(mediaId, news) {
	
	let that = this;
	let form = {
		media_id: mediaId
	}
	_.extend(form, news);
		
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.permanent.update_material_url + 'access_token=' + 
					tokenData.access_token + '&media_id=' + mediaId;
				if (utils.isDebug()) {
					console.log('fetchMaterial request : ' + requestUrl);
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('updateMaterial error');
						}
					}).catch(function(err) {
						reject(err);
					});
			})

	});
}

WeChat.prototype.getMaterialSize = function() {
	let that = this;

	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.permanent.get_material_size + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('getMaterialSize request : ' + requestUrl);
				}
				request({method: 'GET', url: requestUrl, json: true})
					.then(function(response) {
						if (utils.isDebug()) {
							console.log('getMaterialSize response : ' + JSON.stringify(response));
						}
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('updateMaterial error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.batchGetMaterial = function(options) {
	let that = this;
	options.type = options.type || 'image';
	options.offset = options.offset || 0;
	options.count = options.count || 1;

	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.permanent.batch_get_material_url + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('getMaterialSize request : ' + requestUrl);
				}
				request({method: 'POST', url: requestUrl, body: options, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('updateMaterial error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.deleteMaterial = function(mediaId) {
	
	let that = this;
	let form = {
		media_id: mediaId
	}
		
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.permanent.delete_material_url + 'access_token=' + 
					tokenData.access_token + '&media_id=' + mediaId;
				if (utils.isDebug()) {
					console.log('fetchMaterial request : ' + requestUrl);
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('deleteMaterial error');
						}
					}).catch(function(err) {
						reject(err);
					});
			})

	});
}

WeChat.prototype.createGroup = function(name) {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.group.create_group_url + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('createGroup request : ' + requestUrl);
				}
				let form = {
					group: {
						name: name
					}
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('createGroup error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.fetchGroups = function() {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.group.get_group_url + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('fetchGroups request : ' + requestUrl);
				}
				request({method: 'GET', url: requestUrl, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('fetchGroups error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.checkGroup = function(openId) {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.group.check_group_url + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('checkGroup request : ' + requestUrl);
				}
				let form = {
					openid: openId
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('checkGroup error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.updateGroup = function(groupId, newGroupName) {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.group.update_group_url + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('updateGroup request : ' + requestUrl);
				}
				let form = {
					group: {
						id: groupId,
						name: newGroupName
					}
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('updateGroup error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.moveGroup = function(openIds, newGroupId) {
	let that = this;

	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl;
				let form = {
					to_groupid: newGroupId
				};
				if (_.isArray(openIds)) {
					requestUrl = wechatApi.group.batch_update_group_url + 'access_token=' + 
						tokenData.access_token;
					form.openid_list = openIds;
				} else {
					requestUrl = wechatApi.group.move_group_url + 'access_token=' + 
						tokenData.access_token;
					form.openid = openIds;
				}
				if (utils.isDebug()) {
					console.log('batchUpdateGroup request : ' + requestUrl);
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('batchUpdateGroup error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.deleteGroup = function(groupId) {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.group.delete_group_url + 'access_token=' + 
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('deleteGroup request : ' + requestUrl);
				}
				let form = {
					group: {
						id: groupId
					}
				}
				request({method: 'POST', url: requestUrl, body: form, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('deleteGroup error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.fetchUserInfo = function(openIds, langs) {
	let that = this;
	langs = langs || 'zh_CN';
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl;
				let requestOpts = {
					method: 'GET',
					json: true
				}
				if (_.isArray(openIds)) {
					requestUrl = wechatApi.user.batch_fetch_user_info_url + 'access_token=' + 
						tokenData.access_token;
					requestOpts.method = 'POST';
					requestOpts.body = {
						user_list: openIds
					};
				} else {
					requestUrl = wechatApi.user.fetch_user_info_url + 'access_token=' + 
						tokenData.access_token + '&openid=' + openIds + '&lang=' + langs;
				}
				requestOpts.url = requestUrl;
				if (utils.isDebug()) {
					console.log('fetchUserInfo request : ' + requestUrl);
				}
				request(requestOpts)
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('fetchUserInfo error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.fetchUserList = function(openId) {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.user.fetch_user_list_url + 'access_token=' + 
						tokenData.access_token;
				if (openId) {
					requestUrl += '&next_openid=' + openId;
				}
				if (utils.isDebug()) {
					console.log('fetchUserList request : ' + requestUrl);
				}
				let requestOpts = {
					method: 'GET',
					url: requestUrl,
					json: true
				}
				request(requestOpts)
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('fetchUserList error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.sendByGroup = function(type, message, groupId) {
	let that = this;
	let msg = {
		filter: {},
		msgtype: type
	}
	if (!groupId) {
		msg.filter.is_to_all = true;
	} else {
		msg.filter = {
			is_to_all: false,
			group_id: groupId
		};
	}
	msg[type] = message;

	let requestOpts = {
		method: 'POST',
		body: msg,
		json: true
	}

	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.mass.send_by_group_url + 'access_token=' + 
						tokenData.access_token;
				if (utils.isDebug()) {
					console.log('sendByGroup request : ' + requestUrl);
				}
				requestOpts.url = requestUrl;
				request(requestOpts)
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('sendByGroup error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.createMenu = function(menu) {
	let that = this;
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.menu.create_menu_url + 'access_token=' + 
						tokenData.access_token;
				if (utils.isDebug()) {
					console.log('createMenu request : ' + requestUrl);
				}
				request({method: 'POST', url: requestUrl, body: menu, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('createMenu error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.deleteMenu = function() {
	let that = this;
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.menu.delete_menu_url + 'access_token=' +
					tokenData.access_token;
				if (utils.isDebug()) {
					console.log('deleteMenu request url : ' + requestUrl);
				}
				request({url: requestUrl, json: true})
					.then(function(response) {
						let responseBody = response.body;
						if (responseBody) {
							resolve(responseBody);
						} else {
							throw new Error('delete menu error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.createQrcode = function(qr) {
	let that = this;
	if (!qr) {
		throw new Error('createQrcode invalid arguments');
	}
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.qrcode.create_qrcode_url + 'access_token=' + 
						tokenData.access_token;
				if (utils.isDebug()) {
					console.log('createQrcode request : ' + requestUrl);
				}
				request({method: 'POST', url: requestUrl, body: qr, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('createQrcode error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.showQrcode = function(ticket) {
	if (!ticket) {
		throw new Error('showQrcode invalid arguments');
	}
	return wechatApi.qrcode.show_qrcode_url + 'ticket=' + encodeURI(ticket);
}

WeChat.prototype.createShortUrl = function(action, longUrl) {
	let that = this;
	action = action || 'long2short';
	
	return new Promise(function(resolve, reject) {

		that.fetchAccessToken()
			.then(function(tokenData) {
				let requestUrl = wechatApi.shorturl.create_shorturl_url + 'access_token=' + 
						tokenData.access_token;
				if (utils.isDebug()) {
					console.log('createShortUrl request : ' + requestUrl);
				}
				let formBody = {
					action: action,
					long_url: longUrl
				}
				request({method: 'POST', url: requestUrl, body: formBody, json: true})
					.then(function(response) {
						let data = response.body;
						if (data) {
							resolve(data);
						} else {
							throw new Error('createShortUrl error');
						}
					}).catch(function(err) {
						reject(err);
					});
			});
	});
}

WeChat.prototype.reply = function() {
	let replyContent = this.body;
	let message = this.wechatMsg;
	let xml = utils.genTemplateMsg(replyContent, message);

	this.status = 200;
	this.type = 'application/xml';
	this.body = xml;
}

module.exports = WeChat;
