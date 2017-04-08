var config = {
  port:8010,
  sites:{
        JS_PATH: "http://127.0.0.1:8010/"
        , CSS_PATH: "http://127.0.0.1:8010/"
    }
    , api: {
        baseurl : 'http://127.0.0.1:8010/'
        , cbaseurl : ''
    }
    ,sapi:{
        baseurl:'http://127.0.0.1:8010/'
        , cbaseurl:''
    }
    ,PGDAO:{
        host: '172.22.149.240', // Server hosting the postgres database
        user: 'postgres', //env var: PGUSER
        password: 'xhcwxboT', //env var: PGPASSWORD
        database: 'postgres', //env var: PGDATABASE
        port: 5432, //env var: PGPORT
        max: 10, // max number of clients in the pool
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    },
    redis:{
        host: "127.0.0.1",
        port: 6379
    }
    ,
    xhcWX:{//重庆小红唇
        appsecret : '79d1easdfasdfd13c2db6asdfasdfa1089e073b6asdfasdfd505ca84',
        token: '443920f9asdfasdfa1334e9ab8b48asdfasdf28e7925b7f9',//xiaohongchun md5
        appid: 'wxdc28asdfasdf167ea28aasdfasdasdfasdffc2ba',
        encodingAESKey: 'PuywxWasdfasdfc8J13aF3asdfasdf39VTzBqzK7CsRwAuhxwUasdfasdf8blRwewLo',//随机生成
        checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
    },
    xhcMenu : {
        "button":[{
            "type":"click",
            "name":"我要进群",
            "key":"XHC_I_JOIN_GROUP"
        }/*,{
              "type":"view",
              "name":"关于我们",
              "key":"http://static.xiaohongchun.com/index"
          }
          {
               "name":"菜单",
               "sub_button":[
               {    
                   "type":"view",
                   "name":"搜索",
                   "url":"http://www.soso.com/"
                },
                {
                   "type":"view",
                   "name":"视频",
                   "url":"http://v.qq.com/"
                },
                {
                   "type":"click",
                   "name":"赞一下我们",
                   "key":"V1001_GOOD"
                }]
           }*/]
    },
    wxkefu:[{
         "kf_account" : "kefu1@xhckefu",
         "nickname" : "kefu_1",
         "password" : "pswmd5",
    }],
    wxexpir:{//缓存过期时间
        qrcode : 6 * 24 * 3600 * 1000,//6天（7天）二维码
        media  : 2 * 24 * 60 * 60 * 1000,//2天（3天）上传的素材图片
    },
    email_opt:{
        service: 'smtp.exmail.qq.com',
        auth: {
            user: 'alsdjkf@xiaohongchun.com',
            pass: ''
        }
    }
}
module.exports = config;