var config = require('../config/')

module.exports = {
	editname:(name,oldname,botname,membernum) => {
		return DB.PG.updateTable('group_info',{name,membernum},` where name = '${oldname}' and botname = '${botname}'`)
	},
	editmember:(name,botname,membernum,history_member) => {
		var data = {
			membernum:membernum
		}
		if(history_member){
			data['history_member'] = history_member;
		}
		return DB.PG.updateTable('group_info',data,` where name = '${name}' and botname = '${botname}'`)
	},
	editgroup:(param,where) => {
		return DB.PG.updateTable('group_info',param,where)
	},
	getgroupinfo:(botname) => {
		let where = ' where 1=1 ';
		let param = {};
		if(botname && botname != ''){
			where += ` and botname=:botname`;
			param['botname'] = botname;
		}
		let sql =`select name,history_member from group_info ${where}`;
		return DB.PG.select(sql,param)
	},
	getGoodGroup:() => {
		var nowD = Date.now() - config.wxexpir.qrcode;//原本7天过期，这里设置6天
		return DB.PG.select(`select id,name,qrcode,qrcode_media_id,qrcode_media_time from group_info where membernum < 100 and qrcode_create_time > ${nowD} and is_delete = 0 order by membernum desc,id asc limit 1 `)
	},
	creategroup:(name,botname,membernum,history_member) =>{
		history_member = history_member ? history_member : 0;
		let sql = `insert into group_info (name,botname,membernum,history_member) values (:name,:botname,:membernum,:history_member);`;
		return DB.PG.select(sql,{name,botname,membernum,history_member})
	}
}