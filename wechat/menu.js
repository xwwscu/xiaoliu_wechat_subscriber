'use strict';

module.exports = {
	'button': [{
		'name': '点击事件',
		'type': 'click',
		'key': 'menu_click'
	}, {
		'name': '弹出子菜单',
		'sub_button': [{
			'name': '跳转链接',
			'type': 'view',
			'url': 'https://www.baidu.com'
		}, {
			'name': '扫码推送事件',
			'type': 'scancode_push',
			'key': 'qr_scan'
		}, {
			'name': '扫码推送中',
			'type': 'scancode_waitmsg',
			'key': 'qr_scan_wait'
		}, {
			'name': '拍照上传',
			'type': 'pic_sysphoto',
			'key': 'pic_photo'
		}, {
			'name': '选择照片上传',
			'type': 'pic_photo_or_album',
			'key': 'pic_photo_album'
		}]
	}, {
		'name': '弹出子菜单2',
		'sub_button': [{
			'name': '微信相册发图',
			'type': 'pic_weixin',
			'key': 'pic_weixin'
		}, {
			'name': '地理位置上传',
			'type': 'location_select',
			'key': 'location_select'
		}, {
			'name': '下发图文消息',
			'type': 'view_limited',
			'media_id': 'TCOAbnIPYFyYt6VNfjeNFsolGxWz7bH1DGIBnwrFVHw'
		}]
	}]
}