
var _request = require('request');

//获取url参数
function getParms(url){
    var re={};
    if(url.indexOf('?')>=0){
        var url_a=url.split('?');
        re['url']=url_a[0];
        var url_b=url_a[1].split('&');
        /*$.each(url_b, function (i, item) {
            var it=item.split('=');
            re[it[0]]=it[1];
        });*/
        url_b.map( r => {
            var t = r.split('=');
            re[t[0]] = t[1];
        })
    }else{
        re['url']=url;
    }
    return re;
}

function request(url,options){
    return new Promise((resolve,reject) => {
        _request(url,options, function (error,response,body) {
            if(error){
                reject(error);
            }else{
                resolve(response);
            }
        })
    })
}

for (var attr in _request) {
    if (_request.hasOwnProperty(attr)) {
        if (['get','post','put','patch','head','del'].indexOf(attr) > -1) {
            //trunkify request's convenience methods
            request[attr] = (function(attr) {
                return function (uri, options) {
                    return new Promise( (resolve,reject) => {
                        options = Object.assign({headers:{"content-Type":"application/json"}},options || {});
                        if(options.formData){
                            _request[attr]({url:uri, formData:options.formData}, callback)
                        }else{
                            _request[attr](uri, options, callback)
                        }
                        
                        function callback(error, response, body) {
                            if(body && typeof body === 'string'){
                                body = JSON.parse(body);
                            }
                            var requestinfo = {
                                method: attr,
                                url:uri,
                                option:JSON.stringify(options),
                                error:error,
                                res:JSON.stringify(body)
                            };
                            if(error){
                                logger.error(JSON.stringify(Object.assign({errorType:1,errorMsg:"请求服务失败"},requestinfo)))
                                reject(new Error());
                            }else{
                                resolve(body,response);
                            }
                        }
                    })
                }
            })(attr);
        } else {
            request[attr] = _request[attr];
        }
    }
}


module.exports = request;
