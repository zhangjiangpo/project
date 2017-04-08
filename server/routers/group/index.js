var groupServices = require('../../../services/group')
var xhcwx = require('../../lib/wxutil')

var authlogin = require('../../lib/auth')

function isToday(time){
	time = new Date(time).toLocaleString();
	var dnow = new Date().toLocaleString();
	return dnow.substr(0,dnow.indexOf(' ')) == time.substr(0,time.indexOf(' '))
}

module.exports = function (r) {
	r.use(authlogin.authHash());

	r.get('/list', function *(next){
	//	var data = yield DB.PG.select('select * from admin where id = :id',{id:1});
		yield this.render('group/list');
	})

	r.get('/getlist',function*(next){
		var param = this.parames;
		var where = ` where 1=1 `
		if(param.status){
			where += ` and is_delete=${param.status}`;
		}
		var data = yield DB.PG.select(`select * from group_info ${where} order by id desc`);
		
		var t = [];
		//每日进群人数 刷新
		data.map(r => {
			if(r.join_time && !isToday(Number(r.join_time))){//记录的进群时间不是今天 清空
				t.push(r.id)
				r.day_join_num = 0;
			}
		})
		if(t.length){
			yield DB.PG.updateTable('group_info',{day_join_num:0},
				t.length == 1 ? ` where id = ${t[0]} ` : ` where id in (${t.join(',')})`
			)
		}
		
		this.body = {
			code : 0 ,
			data : data
		}
	})
	r.get('/group/data',function*(n){
		var g_id = this.parames.g_id || -1;
		var dy = new Date().toLocaleString();
		dy = dy.substr(0,dy.indexOf(' '));
		dy = new Date(dy).getTime();
		var start_time = this.parames.start_time || dy;
		var end_time = this.parames.end_time || Date.now();

		var result = yield DB.PG.select(`select id,username,group_id,create_time from group_msg 
			where group_id = :g_id and create_time > :start_time and create_time<=:end_time`,
			{g_id,start_time,end_time});
		var re = {
			g_msg_num:result.length,
			g_member_num:0,
		},pepole = {};
		result && result.map(r => {
			if(!pepole[r.username]){
				pepole[r.username] = 1;
				re.g_member_num++;
			}else{
				pepole[r.username]++;
			}
		})
		this.body = Object.assign({
			detail:pepole,
			code : 0,
		},re)
	})

	r.post('/edit',function*(next){
		var param = this.parames;
		if(param.change == 1){
			yield groupServices.editgroup({
				qrcode : param.qrcode,
				qrcode_create_time : Date.now(),
				qrcode_media_time:0,
				qrcode_media_id:'',
				membernum:param.membernum
			},` where id = ${param.id}`)
		}
		this.body = {
			code : 0
		}
	})

	r.post('/del',function*(next){
		var param = this.parames;
		var status = param.status != undefined ? param.status : 1;
		yield groupServices.editgroup({
			is_delete: status
		},` where id = ${param.id}`)
		this.body = {
			code : 0
		}
	})

	r.get('/goodgroup',function*(next){//测试用例

		var group = yield groupServices.getGoodGroup();

		if(group.length){
			logger.debug(JSON.stringify(group));
			group = group[0]
			if(group.qrcode_media_time < Date.now()){//media过期

				var token = yield xhcwx.getToken.call(this);

				var media = yield xhcwx.uploadMedia(token.access_token,group.qrcode);
				
				logger.debug('media_id end:' + JSON.stringify(media))

				media_id = media.media_id;

				//缓存2.5天 更新二维码 清空这两个字段
				yield groupServices.editgroup({qrcode_media_time:Date.now() + 2.5 * 24 * 60 * 60 * 1000,qrcode_media_id:media_id},` where id = ${group.id}`)

			}else{
				logger.debug(JSON.stringify('获取缓存二维码： '+ group.qrcode_media_id));
			}
		}

		this.body = {
			code : 0
		}
	})
}
