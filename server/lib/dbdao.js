var pg = require('pg').native;
var Pool = pg.Pool;

var DBHandle = {
	sqlHanle : (sql,param) => {
		var result = {
			sql : sql,
		}
		if(param != undefined && param.constructor == Object){
			var arr = [],paramIndex=1;
			Object.keys(param).map((r,i) => {
				if(result.sql.indexOf(':' + r) > -1){
					result.sql = result.sql.replace(new RegExp(':' + r + '\\b','g'), '$' + paramIndex++);
					arr.push(param[r]);
				}
			})
			result['param'] = arr;
		}
		return result;
	},
	updateFormat : (tablename,param,where) => {

		var sql = `update ${tablename} set `;
		if(param != undefined && param.constructor == Object){
			var a = [];
			Object.keys(param).map((r,i) => {
				a.push(`${r} = :${r}`)
			})
			sql += a.join(',')
		}
		return DBHandle.sqlHanle(sql + where,param);
	},
	insertFormat : (tablename,param) => {
		var sql = `insert into ${tablename} `;
		var column = [],value = [];
		if(param != undefined && param.constructor == Object){
			Object.keys(param).map((r,i) => {
				column.push(r);
				value.push(':'+r);
			})
		}
		sql += `(${column.join(',')}) values (${value.join(',')})`
		return DBHandle.sqlHanle(sql,param);
	}
}

var DBdao = {
	PG:(config, logger) => {
		var pool = new Pool(config);
		pool.connect().then(c => {
			logger.debug('PG connect success!!');
			c.release();
		})
		pool.on('error', function (err, client) {
		  logger.error('idle client error', err.message, err.stack);
		})
		return {
			select : (sql,param) => {
				return new Promise((resolve,reject) => {
					pool.connect().then(c => {
						var sqlP = DBHandle.sqlHanle(sql,param);
						logger.debug(sqlP)
						c.query(sqlP.sql, sqlP.param).then(r => {
							c.release();
							resolve(r.rows || []);
						}).catch(e => {
							c.release()
							logger.error(e);
							reject(e)
						})
					})
				})
			},
			/*
				tablename string 
				where string
				param object(解析为key =:key)
			*/
			updateTable : (tablename,param,where) => {
				return new Promise((resolve,reject) => {
					pool.connect().then(c => {
						var sqlP = DBHandle.updateFormat(tablename,param,where);
						logger.debug(sqlP)
						c.query(sqlP.sql, sqlP.param).then(r => {
							c.release();
							resolve(r.rows || []);
						}).catch(e => {
							c.release()
							logger.error(e);
							reject(e)
						})
					})
				})
			},
			/*
				tablename string 
				param object(解析为key =:key)
			*/
			insertTable : (tablename,param) => {
				return new Promise((resolve,reject) => {
					pool.connect().then(c => {
						var sqlP = DBHandle.insertFormat(tablename,param);
						logger.debug(sqlP)
						c.query(sqlP.sql, sqlP.param).then(r => {
							c.release();
							resolve(r.rows || []);
						}).catch(e => {
							c.release()
							logger.error(e);
							reject(e)
						})
					})
				})
			},
		}
	}
}
module.exports = DBdao;