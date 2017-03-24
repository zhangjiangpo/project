var bunyan = require('bunyan');

var logConfig = {
    methods : ['debug','error'],
    debug : () => {
        return {
            level: 'debug',
            stream: process.stdout
        }
    },
    error : (logstr) => {
        return {
            level: 'error',
            path: './server/log/' + logstr + '_error.log'  
        }
    }
}

logConfig['config'] = {
    debug : () => [logConfig.debug()],
    error : (logstr) => [logConfig.debug(),logConfig.error(logstr)]
}

function log(){
    var log = {};
    logConfig.methods.forEach(r => {
        log[r] = (function(r){
            return function(){
                var lg = createLog(r);
                lg[r].call(lg,[].slice.call(arguments));
            }
        })(r)
    })
    return log;
}

function createLog(methods){
    var now = new Date();
    var logstr = now.getFullYear() + '_' + (now.getMonth() + 1) + "_" + now.getDate();
    
    var log = bunyan.createLogger({
        name: 'wxbot',
        //src:true,//记录日志调用源的位置（文件、行数、函数）
        streams: logConfig.config[methods](logstr)
    })
    return log;
}
module.exports = log();