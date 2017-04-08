
var path = require('path');
var koa = require('koa');
var fs = require('fs');

var render = require('koa-ejs');
var router = require('koa-router');
var cors = require('koa-cors');
var glob = require('glob');
var body = require('koa-bodyparser');
var static = require('koa-static');
var koa_logger = require('koa-logger');
var logger = require('./server/lib/logbunyan');

var PGDAO = require('./server/lib/dbdao')
var wxServer = require('./api/xhcwx/wxserver')
var session = require('koa-generic-session')
var RedisStore = require('koa-redis');
//var sio_redis = require('socket.io-redis');

var Mybody = require('./server/lib/my_body_parse.js');


var config = require('./config');
/*switch(process.env.NODE_ENV){
    case 'development':
        config = require('./config');break;
    case 'test':
        config = require('./config/index.test');break;
}

var VERSION = Number(fs.readFileSync('./.version'));
fs.writeFile('./.version',(VERSION + 1).toString() , 'utf8');
*/
global.config = config;
global.logger = logger;
global.DB = {
    PG : PGDAO.PG(config.PGDAO , logger)
}



const PORT = config.port || 8010;
const ROUTERS = ['/server/routers/','/api/'];
global.LOGIN_COOKIE = {};
global.baseurl = '';
global.cbaseurl = '';

var app = koa();

var server = require('http').createServer(app.callback());

/*global.SIO = require('socket.io')(server);
SIO.adapter(sio_redis(config.redis));
SIO.on('connection', function(s){
    console.log('socket connect success');
});*/

app.keys = ['keys', 'keykeys'];

app.use(static(path.join(__dirname, 'static')))
    .use(body())
    .use(session({
        ttl: 6000 * 1000,
        store: new RedisStore(config.redis)
    }))
    .use(cors({origin:'*'}))
    .use(koa_logger())
    .use(Mybody())
    .use(function *(next) {
        this['parames'] = Object.assign({}, this.request.body, this.query);
        console.log('parames : ',this['parames'])
        //console.log(yield this.sessionStore.get('count'))
        //yield this.sessionStore.set('count',JSON.stringify({count:1}));
        yield *next;
    });
    //.use(setUrlHost());
var locals = {
    VERSION : 1
};

Object.assign( locals , config );

render(app, {
    root: path.join(__dirname, './views'),
    layout: 'root',
    viewExt: 'html',
    cache: false,
    debug: true,
    locals: locals
});

function loadRoute(prefix,filepath){
    var r = new router({
        prefix:prefix
    });
    require(filepath)(r);
    /*r.stack.map(t => {
        t.stack.unshift(function*(next){
            this.routerName = t.path;
            this.routerMethod = t.methods.join(',');
            yield next;
        })
    })*/
    app.use(r.routes()).use(r.allowedMethods());
}

function getFilePath(rootPath){
    return glob.sync("**/*.js",{nodir:true,cwd:process.cwd()+rootPath}).map( r => {
        r = rootPath + r;
        var p = r.replace(ROUTERS[0],'/');//路径去掉前缀 （./server/routers/admin/index.js 变 /admin/index.js 但api的不变）
        p = p.replace('.js','');//去掉扩展名
        p = p.replace('/index','');//文件名index的 不加入路由前缀
        return {route : '.' + r , prefix : p};
    })
}
ROUTERS.map(t => {
    getFilePath(t).map(r => {
        loadRoute(r.prefix,r.route)
    })
})
app.use(function*(next){
    if(this.body){//若匹配到路由 则停止 不进行公众号中间件
        return;
    }
    yield *next;
})
app.use(wxServer);

//app.listen(PORT);
server.listen(PORT);
console.log("server on port :%s",PORT);
