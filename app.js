'use strict';

var Koa = require('koa');
var wechatGenerator = require('./wechat/generator');
var config = require('./config/config');
var wechatController = require('./wechat/wechat_controller');
var movieController = require('./movie/controllers/movie_ctrl');
var Router = require('koa-router');
var views = require('koa-views');
var log4js = require('koa-log4');

var mongoose = require('mongoose');
mongoose.connect(config.dbUrl);

var app = new Koa();
app.use(views(__dirname + '/movie/views', {
	extension: 'jade'
}));

//log
log4js.configure({
	appenders: [
		{type: 'console'},
		{
			type: 'file',
			absolute: true,
			filename: __dirname + '/config/logs/access.log',
			maxLogSize: 2048,
			backups: 2,
			category: 'wechat'
		}
	]
});
var logger = log4js.getLogger('wechat');
app.use(log4js.koaLogger(logger, {level: log4js.levels.INFO}));

var router = new Router();
router.get('/favicon.ico', function *(next) {
	this.status = 200;
	this.type = 'text/plain';
	this.body = 'hello guy';
});
router.get('/index', wechatGenerator.HtmlGenerator(wechatController.indexMovieController));
router.get('/movie', wechatGenerator.HtmlGenerator(wechatController.detailMovieController));
router.get('/voice2movie', wechatGenerator.HtmlGenerator(wechatController.detailMovieControllerByVoice));
router.get('/wx', wechatGenerator.MsgGenerator(config.wechat, wechatController.replyController));
router.post('/wx', wechatGenerator.MsgGenerator(config.wechat, wechatController.replyController));
app.use(router.routes()).use(router.allowedMethods());

//switch env
app.env = config.env;

app.listen(config.appPort);
console.log('app listening : ' + config.appPort + ' env : ' + app.env);//default:development
