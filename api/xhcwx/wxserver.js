//天天带你买 AppID ： wxc3c9bcb8facc6bfb

var wechat = require('co-wechat');

var config = require('../../config/index')
var xhcwx = require('../../server/lib/wxutil')
var groupServices = require('../../services/group')

var tuwen = 'https://wicdn.xiaohongchun.com/xhc-plat/1488186971764_wCFK2ZyaDn.jpg';

module.exports = wechat(config.xhcWX).middleware(function *(next) {

	// 微信输入信息都在this.weixin上
	var message = this.weixin;
	logger.debug(message);

	if (message.EventKey == config.xhcMenu.button[0].key) {//我要进群按钮事件
		
		if(this.wxsession && this.wxsession.expire > Date.now()){
			this.body = {
				content: '亲！你慢些偶！！！！请过一分钟再试吧！！',
			  	type: 'text'
			}
			return;
		}else{
			this.wxsession = {expire:Date.now() + 60 * 1000};
		}
		
		var group = yield groupServices.getGoodGroup();
		if(group.length){

			var token = yield xhcwx.getToken.call(this);

			var result = yield xhcwx.kefuSendArrMsg(token.access_token,[{
				touser : this.parames.openid,
				msgtype : 'text',
				text:{
		            "content":"欢迎加入我们的群组！！！！\n\n 识别下面的二维码偶！！！"
		        }
			}/*,{
		        touser : this.parames.openid,
		        msgtype : 'image',
		        image:{
		            "media_id":media.media_id
		        },
		        "customservice":{
		            "kf_account": config.wxkefu[0].kf_account
		        }
	        }*/])
			group = group[0]
			var media_id = '';
			if(group.qrcode_media_time < Date.now()){//media过期

				var media = yield xhcwx.uploadMedia(token.access_token,group.qrcode);
				
				logger.debug('media_id end:' + JSON.stringify(media))

				media_id = media.media_id;

				//缓存2天 更新二维码 清空这两个字段
				yield groupServices.editgroup({qrcode_media_time:Date.now() + config.wxexpir.media ,qrcode_media_id:media_id},` where id = ${group.id}`)

			}else{
				media_id = group.qrcode_media_id;//缓存的
			}

			this.body = {
			  type: "image",
			  content: {
			    mediaId: media_id
			  }
			};
		}else{
			
			this.body = {
			  content: '天天带你买！！全球最省钱！！\n\n 人气太爆棚啦！！群都满了！！\n\n 请稍后再试试吧！！',
			  type: 'text'
			};
		}
		
		return;
	}

	//普通消息
	this.body = {
	  content: '天天带你买！！全球最省钱！！',
	  type: 'text'
	};

	/*if(!this.wxsession[message.MsgId]){//防止重复收到消息 （请求会有3次尝试）普通消息
		this.wxsession[message.MsgId] = message;

		if (message.Content.length > 3){
			this.body = [{
				type:'news',
			    title: '快来跟我买',
			    description: '全球最省钱.....',
			    picurl: tuwen,
			    url: 'http://static.xiaohongchun.com/index'
			},{
				type:'news',
			    title: '快来跟我买',
			    description: '全球最省钱.....',
			    picurl: tuwen,
			    url: 'http://static.xiaohongchun.com/index'
			},{
				type:'news',
			    title: '快来跟我买',
			    description: '全球最省钱.....',
			    picurl: tuwen,
			    url: 'http://static.xiaohongchun.com/index'
			}]
		}else{
			this.body = {
			  content: '天天带你买！！全球最省钱！！',
			  type: 'text'
			};
		}
	}else{
		this.body = {
		  content: 'error please wait...',
		  type: 'text'
		};
	}*/
})