'use strict';

var ejs = require('ejs');
var heredoc = require('heredoc');

var msgTemplate = heredoc(function() {/*
	<xml>
	<ToUserName><![CDATA[<%= toUserName %>]]></ToUserName>
	<FromUserName><![CDATA[<%= fromUserName %>]]></FromUserName>
	<CreateTime><%= createTime %></CreateTime>
	<MsgType><![CDATA[<%= msgType %>]]></MsgType>
	<% if (msgType === 'text') { %>
		<Content><![CDATA[<%- content %>]]></Content>
	<% } else if (msgType === 'image') { %>
		<Image>
		<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
		</Image>
	<% } else if (msgType === 'voice') { %>
		<Voice>
		<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
		</Voice>
	<% } else if (msgType === 'video') { %>
		<Video>
		<MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
		<Title><![CDATA[<%= content.title %>]]></Title>
		<Description><![CDATA[<%= content.description %>]]></Description>
		</Video> 
	<% } else if (msgType === 'music') { %>
		<Music>
		<Title><![CDATA[<%= content.title %>]]></Title>
		<Description><![CDATA[<%= content.description %>]]></Description>
		<MusicUrl><![CDATA[<%= content.musicUrl %>]]></MusicUrl>
		<HQMusicUrl><![CDATA[<%= content.hqMusicUrl %>]]></HQMusicUrl>
		<ThumbMediaId><![CDATA[<%= content.mediaId %>]]></ThumbMediaId>
		</Music>
	<% } else if (msgType === 'news') { %>
		<ArticleCount><%= content.length %></ArticleCount>
		<Articles>
		<% content.forEach(function(item) { %>
		<item>
		<Title><![CDATA[<%= item.title %>]]></Title> 
		<Description><![CDATA[<%= item.description %>]]></Description>
		<PicUrl><![CDATA[<%= item.picUrl %>]]></PicUrl>
		<Url><![CDATA[<%= item.url %>]]></Url>
		</item>
		<% }) %>
		</Articles>
	<% } %>
	
	</xml>
*/});

var htmlTemplate = heredoc(function() {/*
	<!DOCTYPE html>
	<html>
		<head>
			<title>小六搜电影</title>
			<meta name="viewport" content="initial-scale=1, maximum-scale=1, mimimum-scale=1">
		</head>
		<body>
			<h1>点击标题开始录音</h1>
			<p id='title'></p>
			<div id='poster'></div>
			<div id='year'></div>
			<div id='directors'></div>
			<script src="http://zeptojs.com/zepto-docs.min.js"></script>
			<script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
			<script>
				wx.config({
				    debug: false,
				    appId: '<%= appid %>',
				    timestamp: '<%= timestamp %>',
				    nonceStr: '<%= noncestr %>',
				    signature: '<%= signature %>',
				    jsApiList: [
				    	'startRecord',
				    	'stopRecord',
				    	'onVoiceRecordEnd',
				    	'translateVoice',
				    	'previewImage',
				    	'onMenuShareTimeline'
				    ]
				});
				wx.ready(function() {
					window.alert('wechat is ready');
					let shareInfo = {
						title: '小六搜电影',
					    link: 'https://www.baidu.com',
					    imgUrl: '',
					    success: function () { 
					        window.alert('分享成功');
					    },
					    cancel: function () { 
					        window.alert('分享失败');
					    }
					}
					let isRecording = false;
					let imageSlides = {
						current: '',
						urls: []
					};
					$('h1').tap(function() {
						window.alert('tap head');
						if (!isRecording) {
							isRecording = true;
							wx.startRecord({
								cancel: function() {
									window.alert('用不了语音啦');
								},
								fail: function() {
									window.alert('这次没录好...');
								}
							})
						} else {
							wx.stopRecord({
								success: function(res) {
									isRecording = false;
									let localId = res.localId;
									wx.translateVoice({
										localId: localId,
										isShowProgressTips: 1,
										success: function(res) {
											let text = res.translateResult;
											$.ajax({
												type: 'get',
												url: 'https://api.douban.com/v2/movie/search?q=' + text,
												dataType: 'jsonp',
												jsonp: 'callback',
												success: function(data) {
													let subject = data.subjects[0];
													$('#title').html(subject.title);
													$('#year').html(subject.year);
													$('#directors').html(subject.directors[0].name);
													$('#poster').html('<img src="' + subject.images.medium + '"/>');
													imageSlides.current = subject.images.large;
													data.subjects.forEach(function(item) {
														imageSlides.urls.push(item.images.large);
													})
													shareInfo.title = subject.title;
													shareInfo.imageUrl = subject.images.large;
												}
											})
										},
										fail: function() {
											window.alert('小六表示很困惑...');
										}
									})
								},
								fail: function() {
									window.alert('请重新点击标题');
								}
							})
						}
					})
					
					wx.onMenuShareTimeline(shareInfo);

					$('#poster').tap(function() {
						wx.previewImage(imageSlides);
					})
				});
				wx.error(function(res) {
					console.log('wechat on error : ' + res);
					window.alert('wechat on error');
				})
			</script>
		</body>
	</html>
*/});

var compiledWXXMLTemplate = ejs.compile(msgTemplate);
var compiledWXHTMLTemplate = ejs.compile(htmlTemplate);

exports = module.exports = {
	compileWXXMLTemplate: compiledWXXMLTemplate,
	compileWXHTMLTemplate: compiledWXHTMLTemplate
}

