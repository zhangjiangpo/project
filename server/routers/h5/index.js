/**
 * Created by apple on 16/7/1.
 */
var services = require('../../../services/group')

module.exports = function(route){

    route.get('/group',function*(next){
        var result = yield services.getGoodGroup();
        var qrcode = result && result.length ? result[0].qrcode : '';
        yield this.render('h5/group',{layout:false,qrcode:qrcode})
    })

}