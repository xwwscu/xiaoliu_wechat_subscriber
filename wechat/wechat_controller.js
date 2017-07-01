'use strict';

var config = require('../config/config');
var path = require('path');
var _ = require('lodash');
var tulingApi = require('./tuling');
var utils = require('./utils');
var movieController = require('../movie/controllers/movie_ctrl');
var replyResources = require('../asserts/resources');
var WeChat = require('./wechat');
var wechatApi = new WeChat(config.wechat);

exports.indexMovieController = function *(next) {
	let tokenData = yield wechatApi.fetchAccessToken();
	let ticketData = yield wechatApi.fetchJsTicket(tokenData.access_token);
	let params = utils.signJsTicketParam(ticketData.ticket, this.href);
	params.appid = config.wechat.testAppId;
	if (utils.isDebug()) {
		console.log('html template params : ' + JSON.stringify(params) + ' url : ' + this.href);
	}
	let hotMovies = yield movieController.searchHotMovies(6);
	if (utils.isDebug()) {
		console.log(hotMovies);
	}
	params.movies = hotMovies;
	yield this.render('/index', params);
}

exports.detailMovieController = function *(next) {
	let movie;
	let name = this.query.name || '弱点';
	if (utils.isDebug()) {
		console.log('html detailMovieController : ' + JSON.stringify(this.query) + ' url : ' + this.href);
	}
	movie = yield movieController.colligateSearch(name);
	if (utils.isDebug()) {
		console.log('colligateSearch movie : ' + JSON.stringify(movie));
	}
	if (movie) {
		yield this.render('/detail', movie);
	}
}

exports.detailMovieControllerByVoice = function *(next) {
	//route to detail movie ---need refactor
	let name = this.query.name || '弱点';
	name = name.replace(/。|？|，|；/g, "");
	if (utils.isDebug()) {
		console.log('detailMovieControllerByVoice search --->' + name + ' req method : ' + this.method);
	}
	let movie = yield movieController.colligateSearch(name);
	yield this.render('/detail', movie);
}

exports.replyController = function *(next) {
	// body...
	let message = this.wechatMsg;

	if (message.MsgType === 'event') {
		if (message.Event === 'subscribe') {
			if (message.EventKey) {
				console.log('scan 二维码 --- ' + message.EventKey + ' ticket : ' + message.ticket);
			}
			this.body = replyResources.wx_reply_res.subscribe;
		} else if (message.Event === 'unsubscribe') {
			console.log('scan 二维码 --- 残忍离开 ----');
			this.body = '';
		} else if (message.Event === 'LOCATION') {
			this.body = '小六知道你离他不远~';
		} else if (message.Event === 'CLICK') {
			this.body = 'click : ' + message.EventKey;
		} else if (message.Event === 'SCAN') {
			this.body = '你想让小六看啥?';
		} else if (message.Event === 'VIEW') {
			this.body = '你想去看啥?';
		} else if (message.Event === 'scancode_push') {
			this.body = '扫码推送喽';
		} else if (message.Event === 'scancode_waitmsg') {
			this.body = '扫码推送中...';
		} else if (message.Event === 'pic_sysphoto') {
			this.body = '打开系统相机了';
		} else if (message.Event === 'pic_weixin') {
			this.body = '打开微信相册了';
		} else if (message.Event === 'location_select') {
			this.body = '发送地理位置';
		}
	} else if (message.MsgType === 'text' || message.MsgType === 'voice') {
		let content;
		if (message.MsgType === 'voice') {
			content = message.Recognition;
			if (utils.isDebug()) {
				console.log('voice recognition : ' + content);
			}
		} else {
			content = message.Content;
		}
		let reply = '其实，小六也想对你说：' + message.Content;

		if (content === '1') {
			reply = '稍后给你看颜值';
		} else if (content === '2') {
			reply = '稍后给你唱首歌';
		} else if (content === '3') {
			reply = [{
				title: '小六的困惑',
				description: '北漂值不值',
				picUrl: 'http://image.tuandai.com/newfile/image/2016/20161107/20161107145937_2269.jpg',
				url: 'http://shoujiweishi.baidu.com'
			}]
		} 
		else if (content === '4') {
			reply = '满满的幸福哦~';
		} else if (content === '5') {
			reply = replyResources.wx_reply_res.advertisement;
		} 

		/*else if (content === '4') {
			reply = '满满的幸福';
			let data = yield wechatApi.uploadMaterial(true, path.join(__dirname, '../asserts/shouzhong.jpg'), {type: 'image'});
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content === '5') {
			let data = yield wechatApi.uploadMaterial(true, path.join(__dirname, '../asserts/xiaoshipin.mp4'), {type: 'video'});
			reply = {
				type: 'video',
				title: 'return video',
				description: 'test video',
				mediaId: data.media_id
			}
		} else if (content === '6') {
			let data = yield wechatApi.uploadMaterial(true, path.join(__dirname, '../asserts/shouzhong.jpg'), {type: 'image'});
			reply = {
				type: 'music',
				title: 'return music',
				description: 'test music',
				musicUrl: 'http://quku.cn010w.com/qkca1116sp/upload_quku3/20071019155043301.mp3',
				mediaId: data.media_id
			}
		} else if (content === '7') {
			let data = yield wechatApi.uploadMaterial(false, path.join(__dirname, '../asserts/shouzhong.jpg'), {type: 'image'});
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content === '8') {
			let data = yield wechatApi.uploadMaterial(false, path.join(__dirname, '../asserts/xiaoshipin.mp4'), 
				{type: 'video', description: {'title': 'permanent video', 'introduction': 'permanent video introduction'}});
			reply = {
				type: 'video',
				title: 'return video',
				description: 'test video',
				mediaId: data.media_id
			}
		} else if (content === '9') {
			let data = yield wechatApi.uploadMaterial(false, path.join(__dirname, '../asserts/shouzhong.jpg'), {type: 'image'});
			let material = {
				articles: [{
					title: 'test fetchMaterial',
					thumb_media_id: data.media_id,
					author: 'xiaoliu',
					digest: 'no digest',
					show_cover_pic: 1,
					content: 'no content',
					content_source_url: 'https://www.baidu.com'
				}]
			}
			let _data = yield wechatApi.uploadMaterial(false, material, {type: 'news'});
			let fetchData = yield wechatApi.fetchMaterial(false, {type: 'news', mediaId: _data.media_id});
			console.log(JSON.stringify(fetchData));
			let items = fetchData.news_item;
			let news = [];
			items.forEach(function(item) {
				news.push({
					title: item.titile,
					description: item.digest,
					picUrl: data.url,
					url: item.url
				});
			});

			reply = news;
		} else if (content === '10') {
			let materialSize = yield wechatApi.getMaterialSize();
			console.log('material size : ' + materialSize);

			let results = yield [
				wechatApi.batchGetMaterial({
					type: 'image',
					offset: 0,
					count: 10
				}),
				wechatApi.batchGetMaterial({
					type: 'video',
					offset: 0,
					count: 10
				}),
				wechatApi.batchGetMaterial({
					type: 'news',
					offset: 0,
					count: 10
				})
			];
			console.log('batchGetMaterial results : ' + JSON.stringify(results));
			reply = 'batch get material';
		} else if (content === '11') {
			let group = yield wechatApi.createGroup('test');
			console.log('create test group : ' + JSON.stringify(group));
			let groups = yield wechatApi.fetchGroups();
			console.log('current groups : ' +  JSON.stringify(groups));

			let checkGroup = yield wechatApi.checkGroup(message.FromUserName);
			console.log('check group : ' + JSON.stringify(checkGroup));

			reply = 'test group done';
		} else if (content === '12') {
			let user = yield wechatApi.fetchUserInfo(message.FromUserName);
			console.log('fetch user info : ' + JSON.stringify(user));

			let openIds = [{
				openid : message.FromUserName,
				lang: 'zh_CN'
			}];
			let users = yield wechatApi.fetchUserInfo(openIds);
			console.log('fetch user info ---> ' + JSON.stringify(users));

			reply = 'fetch user info suc';
		} else if (content === '13') {
			let userList = yield wechatApi.fetchUserList();
			console.log('fetch user list : ' + JSON.stringify(userList));
			reply = 'fetch user list len : ' + userList.total;
		} else if (content === '14') {
			let mpnews = {
				media_id: 'TCOAbnIPYFyYt6VNfjeNFsolGxWz7bH1DGIBnwrFVHw'
			}
			let msgData = yield wechatApi.sendByGroup('mpnews', mpnews);
			console.log('sendByGroup result : ' + JSON.stringify(msgData));
			reply = 'Yeah, sendByGroup suc!';
		}*/

		else {
			// tuling machine handler
			let defaultIconUrl = 'http://www.cy580.com/file/upload/201307/29/14-03-21-44-88802.png';
			let tulingReply = yield tulingApi.getTulingReply(content);
			let listData = tulingReply.list;
			if (listData && listData.length > 0) {
				let replyArrLen = listData.length;
				if (listData.length > 5) {
					replyArrLen = 5;
				}
				let replyArr = [];
				for(let i = 0; i < replyArrLen; i++) {
					let itemData = listData[i];
					let iconUrl = itemData.icon || defaultIconUrl;
					let item = {
						title: itemData.name || '这个东西',
						description: itemData.info || '你猜',
						picUrl: iconUrl,
						url: itemData.detailurl
					};
					replyArr.push(item);
				}
				reply = replyArr;
			} else {
				let replyUrl = tulingReply.url;
				let text = tulingReply.text;
				if (replyUrl) {
					reply = [{
						title: '小六回来啦',
						description: text,
						picUrl: 'http://www.cy580.com/file/upload/201307/29/14-03-21-44-88802.png',
						url: replyUrl
					}]
				} else {
					reply = text;
				}
			}
		}

		this.body = reply;
	} else {
		this.body = replyResources.wx_reply_res.err_or_def;
	}

	wechatApi.reply.call(this);

	yield next;
}