/**
 * Created by apple on 16/6/30.
 */
var crypto = require('crypto');

const XHC = "xhc_";

function getRandom(len){
    if(typeof len === "number" && len > 0){
        var source = "1234567890abcdefghijklmnopqrstuvwxyz";
        var re = [];
        while(len){
            var random = Math.floor(Math.random()*36);
            re.push(source.charAt(random))
            len--;
        }
        return re.join('');
    }
}

module.exports = {
    createHash: function (value) {
        return crypto.createHash('md5').update(value).digest('hex');
    },
    createAuth: function (ctx,params) {
        /*parms:{ key: key,
         ucode: uname,
         pwd: pwd,
         yb: yb,
         sign:sign}*/
        var expires = new Date(Date.now()+20*60*1000);
        var key = this.createHash(XHC + params.name + params.pwd);

        ctx.cookies.set('key',key,{httpOnly:true,expires:expires});
        ctx.cookies.set('sign',params.name,{httpOnly:true,expires:expires});
    },
    authHash: function () {
        var _this = this;
        return function *(next){
            console.log(this.cookies.get('sign'));
            var loginCookie = {
                key:this.cookies.get('key'),
                sign:this.cookies.get('sign')
            };
            if(this.path === '/login' || this.path.indexOf('/xhc_img/')>-1){
                return;
            }
            if(!loginCookie.key || !loginCookie.sign){
                this.redirect('/login?redirect='+this.path);
                return;
            }
            var admin = yield DB.PG.select('select name,pwd from admin where name =:name ',{name:loginCookie.sign})
            if (!admin.length) {
                this.redirect('/login?redirect='+this.path);
                return;
            }
            var key = _this.createHash(XHC + admin[0].name + admin[0].pwd);
            if(key !== loginCookie.key) {
                this.redirect('/login?redirect='+this.path);
                return;
            }else{
                global.LOGIN_COOKIE = loginCookie;
                _this.createAuth(this,admin[0]);
                //this.parames['loginCookie'] = loginCookie;
                try{
                    yield * next;
                }catch (error){
                    logger.error(error);
                    if(error.message){
                        var er = JSON.parse(error.message);
                        if(er.errorType == 2){//请求借口错误 返回错误信息 页面定位到other/error
                            yield this.render('other/error',{error:er.res || er.error});
                            return false;
                        }
                    }
                    this.body = {
                        'msg':error.toString()
                    }
                }
            }
        }
    }
}
