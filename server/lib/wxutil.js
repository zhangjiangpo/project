var request = require('../../server/lib/request');
var _request = require('request');
var config = require('../../config/')
//var formstream = require('formstream')
var path = require('path')
const atkey = 'wx_access_token';//缓存token

var get_image = function ( url ){
    return new Promise( (resolve, reject) => {
        _request({
            url:url,
            method:'GET',
            encoding:null,
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve( {body} );
            } else {
                reject( error );
            }
        })
    });
}

 var xhcwx = {
    getToken : function * (next) {
        var act = yield this.sessionStore.get(atkey);
    	if(act){
            console.log('cache token :' + JSON.stringify(act));
			return JSON.parse(act)
    	}else{
            console.log('get token');
        	var re = yield request.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.xhcWX.appid}&secret=${config.xhcWX.appsecret}`)
        	yield this.sessionStore.set(atkey,JSON.stringify(Object.assign({},re,{expires_in : Date.now() + re.expires_in * 1000})));
            return re;
    	}
    },
    createmenu : (token,menu) => {
        return request.post(`https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`,{body:JSON.stringify(menu)});
    },
    uploadMedia : function * (token,picurl) {
        //var img = yield get_image(picurl);
        var formData = {
            media: {
                value:  _request(picurl),
                options: {
                  filename: 'erweima.jpg',
                  contentType: 'image/jpg'
                }
            }
        };
        /*var form = formstream();
        form.stream('media',img.body,path.basename(picurl));
        var opt = {
            dataType: 'json',
            type: 'POST',
            timeout: 60000, // 60秒超时
            headers: form.headers(),
            stream: form
        }*/
        return yield request.post(`https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${token}&type=image`,
            {formData:formData}
        )
    },
    createKeFu : (token,options) => {
        var opt = config.wxkefu[0];
        var data = Object.assign({},opt,options || {})
        return request.post(`https://api.weixin.qq.com/customservice/kfaccount/add?access_token=${token}`,{body: JSON.stringify(data)})
    },
    kefuSendMsg : (token,options) => {//客服发消息 
        var opt = {
            touser : 'OPENID',
            msgtype : 'text',// image/voice/news
            /*
            text:{
                 "content":"Hello World"
            },
            image:{
                 "media_id":"MEDIA_ID"
            },
            "voice":{
              "media_id":"MEDIA_ID"
            },
            "news":{
                "articles": [{
                     "title":"Happy Day",
                     "description":"Is Really A Happy Day",
                     "url":"URL",
                     "picurl":"PIC_URL"
                 },
                 {
                     "title":"Happy Day",
                     "description":"Is Really A Happy Day",
                     "url":"URL",
                     "picurl":"PIC_URL"
                 }]
            },
            customservice : { //某个客服
                 "kf_account": "test1@kftest"
            }*/
        }
        var data = Object.assign({},opt,options);
        return request.post(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`,{ body : JSON.stringify(data)})
    },
    kefuSendArrMsg : (token,arr) => {
        var s = arr.map(r => {
            xhcwx.kefuSendMsg(token,r);
        })
        return Promise.all(s);
    }
 }
 module.exports = xhcwx;