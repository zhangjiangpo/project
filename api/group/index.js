let group = require('../../services/group');
var fs = require('fs');
var path = require('path');
var qr = require('qr-image')
var c_config = require('../../config/client.index.js')
var sendEmail = require('../../server/lib/sendemail.js')

function isToday(time){
	time = new Date(time).toLocaleString();
	var dnow = new Date().toLocaleString();
	return dnow.substr(0,dnow.indexOf(' ')) == time.substr(0,time.indexOf(' '))
}

module.exports = function (r) {

	r.post('/changeinfo', function *(next){
		var param = {
			oldname : this.parames.oldname,
			name : this.parames.name || '',
			botname     : this.parames.botname,
			membernum  : this.parames.number || 0
		}
		if(!param.name || !param.botname ){
			this.body = {code:1100,msg:'缺少必须的参数！！'}
			return;
		}
		var sql = '';
		if(param.name != param.oldname && param.oldname != 'unknown'){//改名字
			yield group.editname(param.name,param.oldname,param.botname,param.membernum);
		}else{//进群
			var group_names = yield group.getgroupinfo(param.botname)
			var gn = group_names.find(r => r.name == param.name)
			if(gn){//已存在 更新membernum
				var dnow = Date.now();
				var data = {
					membernum:param.membernum,
					history_member:++gn.history_member,
				}

				//入群时间 无值 即 还没有人入群  或者时间记录的不是今天 
				if(!gn.join_time || gn.join_time && !isToday(Number(gn.join_time))){//今天第一个进群的人
					data['join_time'] = dnow;
					data['day_join_num'] = 1;
				}else{
					data['day_join_num'] = ++gn.day_join_num;
				}

				yield group.editmember(param.name,param.botname,data);
			}else{
				yield group.creategroup(param.name,param.botname,param.membernum,param.membernum);
			}
		}
		this.body = {code : 0}
	})

	r.post('/inputinfo', function *(next){
		var param = {
			name : this.parames.name || '',
			botname     : this.parames.botname || '',
			membernum  : this.parames.number || 0,
		}
		if(!param.name || !param.botname ){
			this.body = {code:1100,msg:'缺少必须的参数！！'}
			return;
		}
		var group_names = yield group.getgroupinfo(param.botname)
		if(group_names.find(r => r.name == param.name)){//已存在 更新membernum
			yield group.editmember(param.name,param.botname,{
				membernum:param.membernum
			});
		}else{
			yield group.creategroup(param.name,param.botname,param.membernum,param.membernum);
		}
		this.body = {code : 0}
		yield next;
	})

	//记录群组 消息
	r.post('/groupmsg',function*(n){
		var param = {
			username : this.parames.username || '',
			content : this.parames.content || '',
			create_time : Date.now()
		};
		var g_id = yield DB.PG.select(`select id from group_info where name = '${this.parames.group}'`);
		param['group_id'] = g_id && g_id[0] && g_id[0].id || '';

		yield group.addgroupmsg(param);
		this.body = {
			code : 0
		}

	})

	function getBotName(num){
		var botname = '';
		for(let key in c_config.botname_qrnum){
			if(c_config.botname_qrnum[key] == num){
				botname = key;
			}
		}
		return botname;
	}

	//登录成功 删除登录二维码
	r.post('/qrcode/del',function*(n){
		var num = this.parames.num;
		//SIO.emit('restarted', num);
		fs.unlinkSync(path.join(__dirname+'/../../static/xhc_img', 'qrcode_' + num + '.png'));
		yield sendEmail.send({
			subject:'微信机器人重启登录成功',
			html:`大家好:<br/><br/>机器人${getBotName(num)}已经重新登录成功！！`,
		})
		this.body = {
			code : 0
		}
	})
	//生成登录二维码 启动机器人消息
	r.post('/qrcode/string',function*(n){
		var string = this.parames.string;
		var num = this.parames.num;
		/*if(files){
			for(var item in files){
				var tmpath = files[item]['path'];
				var tmparr = files[item]['name'].split('.');
				var ext ='.'+tmparr[tmparr.length-1];
				var newpath =path.join(__dirname+'/../../static/xhc_img', 'qrcode.png');
				var stream = fs.createWriteStream(newpath);//创建一个可写流
				fs.createReadStream(tmpath).pipe(stream);//可读流通过管道写入可写流
			}
		}*/
		try {
	        var qr_svg = qr.image(string);
			qr_svg.pipe(fs.createWriteStream(path.join(__dirname+'/../../static/xhc_img', 'qrcode_' + num + '.png')));
	    } catch (e) {
	        console.log(e);
	    }
		yield sendEmail.send({
			content:`<img src="http://wxgroup.xhcshop.com/xhc_img/qrcode_${num}.png"/><br/><br/> 机器人：${getBotName(num)}`,
		})
		//SIO.emit('need restart', num);
		this.body = {
			code : 0
		}
	})
	//测试发送邮件
	r.get('/sendemail',function*(n){
		this.body = yield sendEmail.send({
			to:`<zhangjaingpo@xiaohongchun.com>`,
			content:`<img src="http://wxgroup.xhcshop.com/xhc_img/qrcode_1.png"/><br/><br/> 机器人：天天君`,
		})
	})

	r.get('/needrestart',function*(n){
		SIO.emit('need restart', '1'); // emit an event to the socket
		this.body = {code:0}
	})
	r.get('/restarted',function*(n){
		SIO.emit('restarted', '1'); // emit an event to all connected sockets
		this.body = {code:0}
	})
}