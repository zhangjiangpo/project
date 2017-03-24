/**
 * Created by apple on 16/7/1.
 */
var authlogin = require('../lib/auth')

module.exports = function(route){

    route.get('/',function*(next){
        yield this.render('login')
    })

    route.post('/', function *() {
        var params = this.parames;
        var result = yield DB.PG.select('select name,pwd from admin where name =:name and pwd = :pwd',params);
        if(result.length){
        	authlogin.createAuth(this,result[0]);
            this.body = {code : 0}
        }else{
            this.body = {
                code : 110,
                msg : '用户名或密码不正确！！'
            }
        }
    })
}