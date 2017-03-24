module.exports = function (r) {
	r.get('list', function *(next){
		console.log(this.parames)
		var data = yield DB.PG.select('select * from admin where id = :id',{id : this.parames.id || 1});
		yield this.render('admin/list');
	})
}