module.exports = function (r) {
	r.get('/', function *(next){
		this.body = {code : 0}
	})
}