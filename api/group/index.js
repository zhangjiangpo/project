let group = require('../../services/group');

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
		if(param.name != param.oldname && param.oldname != 'unknown'){
			yield group.editname(param.name,param.oldname,param.botname,param.membernum);
		}else{
			var group_names = yield group.getgroupinfo(param.botname)
			var gn = group_names.find(r => r.name == param.name)
			if(gn){//已存在 更新membernum
				yield group.editmember(param.name,param.botname,param.membernum,++gn.history_member);
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
			yield group.editmember(param.name,param.botname,param.membernum);
		}else{
			yield group.creategroup(param.name,param.botname,param.membernum,param.membernum);
		}
		this.body = {code : 0}
		yield next;
	})
}