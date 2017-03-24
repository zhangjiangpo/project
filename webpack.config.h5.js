var webpack = require('webpack');
var path = require('path');
var glob = require('glob');
var fs = require('fs');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');


var configSet = require('./config/index');

var time = Date.now();

var bind = (handeld,methd) => {
	return () => {
		return handeld.apply(methd,[].slice.call(arguments));
	}
}

var paths = {
	vendor_h5 : './client/js/h5/common/com*.js',
	entry : './client/js/h5/**/*.js',
	htmlToView : './client/html/h5/**/*.html',
	css : './client/css/**/*.css',
	getBaseDirName: (file,ex,str) => {
		return path.join(path.dirname(file), path.basename(file,ex)).replace(str,'');
	},
	getEntryJs : function(files){
		var entries = {}, entry, dirname, basename;
		var _this = this;
		files = files.filter(r => r.indexOf('/h5/common') < 0)//h5的common不作为入口
	    files.map((r,i) => {
	        dirname = path.dirname(r);
	        basename = path.basename(r, '.js');
	        entries[_this.getBaseDirName(r,'.js','client/js/')] = r;
	    })

	    return entries;
	},
	getVendorJs : files => {

	},
	getHtml : files => {

	},
	getNames : p => glob.sync(p,{nodir:true,cwd:process.cwd()})
}

var config = {
	entry:Object.assign({},{
		vendor_h5: paths.getNames(paths.vendor_h5),
	},paths.getEntryJs(paths.getNames(paths.entry))),
	output:{
		filename:'js/[name].js?v=[chunkhash]',
		path: path.resolve(__dirname , 'static'),
	},
	resolve:{
		alias:{
			Axios : path.resolve(__dirname, './client/common/axiosConfig.js'),
			Jquery : path.resolve(__dirname, './client/common/jquery.js'),
			Jquerytmpl : path.resolve(__dirname, './client/lib/jquerytmpl.js'),
			Ladda : path.resolve(__dirname, './client/lib/Ladda.js'),
			Upload : path.resolve(__dirname, './client/lib/uploadALI.js'),
			Md5 : path.resolve(__dirname, './client/lib/md5.js'),

			h5Common : path.resolve(__dirname, './client/js/h5/common/common.js'),
		}
	},
	module:{
		loaders:[{
			test: /\.css$/,
			loader: ExtractTextPlugin.extract("style-loader", "css-loader")
		},{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/,
		}]
	},
	plugins:[
		new webpack.optimize.CommonsChunkPlugin({
			names:['vendor_h5']
		}),
		new ExtractTextPlugin('css/[name].css?v=[contenthash]'),
	]
}
var plugins = [];
/*paths.getNames(paths.css).map(r => {
	plugins.push(new ExtractTextPlugin(paths.getBaseDirName(r,'','client/')));
})*/
if(process.env.NODE_ENV == 'production'){
	plugins.push(new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false
		}
	}))
}

paths.getNames(paths.htmlToView).map(r => {
	let baseDirName = paths.getBaseDirName(r,'','client/')
	var chunks = [];

	var sourceJs = baseDirName.replace(/html/g,'js').replace('js/','').replace('.js','');
	if(fs.existsSync(sourceJs + '.js')){//若有js逻辑代码 则加载 还有公共js
		chunks.push('vendor_h5');
		chunks.push(sourceJs);
	}
	plugins.push(new HtmlWebpackPlugin({
			inject:'body',
			template: r,
			filename: baseDirName,
			chunks:chunks
		})
	)
})

config.plugins = config.plugins.concat(plugins);

module.exports = config;