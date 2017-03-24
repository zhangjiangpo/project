var config = require('../../config/index');
var xhcwx = require('../../server/lib/wxutil')
const menu = config.xhcMenu;
module.exports = (r) => {

  //上传图片
  r.get('/upload',function*(next){
    var picurl = 'https://wicdn.xiaohongchun.com/xhc-plat/1488176329640_djNFce5XDi.png';
    
    var token = yield xhcwx.getToken.call(this);

    var re = yield xhcwx.uploadMedia(token.access_token,picurl)

    console.log('upload media',re);
    
    this.body = {code : 0}

  })

  //客服发送消息
  r.get('/sendmsg',function*(next){

    var opt = {
      touser : this.parames.openid || 'oEadUweaSZpCHk6KwuI0QnH6eKSo',
      msgtype : 'text',
      text:{
          "content":"欢迎加入我们的群组！！！！\n\n 识别下面的二维码偶！！！"
      } 
    }
    var opt1 = {
      touser : this.parames.openid || 'oEadUweaSZpCHk6KwuI0QnH6eKSo',
      msgtype : 'image',
      image:{
          "media_id":"UN7u5vDvfutieTZ4wOBnoIfSIr9Ofan2ut84sKy4ZYR4kdS9gRt2QcgBQaF1y0Ju"
      },
      "customservice":{
          "kf_account": config.wxkefu[0].kf_account
      }
    }

    var token = yield xhcwx.getToken.call(this);
    var re = yield xhcwx.kefuSendArrMsg(token.access_token,[opt,opt1])
    logger.debug('sendmsg' + JSON.stringify(re))
    this.body = {code : 0}
  })

  //创建客服
  r.get('/createkefu',function*(next){

    var token = yield xhcwx.getToken.call(this);
    var re = yield xhcwx.createKeFu(token.access_token,config.wxkefu[0])
    logger.debug('createkefu' + JSON.stringify(re))
    this.body = {code : 0}
  })
  
  //创建自定义菜单
  r.get('/createmenu',function*(next){

    var result = yield xhcwx.getToken.call(this);
    
    if(result && result.access_token){
      
        var cre = yield xhcwx.createmenu(result.access_token,menu);
        logger.debug(cre);
        if(cre.errcode == 0 && cre.errmsg == 'ok'){
          this.body = {
            code : 0
          }
        }else{
          this.body = {
            code : 1124,
            msg : 'create menu failed' + (cre.errmsg || '')
          }
        }
    }else{
      this.body = {
        code : 1123,
        msg : 'get token failed' + (result.errmsg || '')
      }
    }
  })
 }