var gulp = require('gulp');
var replace = require('gulp-replace');
var configSites = require('./config/client.index').sites;
var fs = require('fs');
var path = require('path');

const DEST = 'views/'
const CPPATH = [
	'client/html/root.html',
	'client/css/bootstrap.css',
	'client/css/animate.css',
	'client/css/stylenew.css'
]

function replaceHtml(path,dest){
	gulp.src(path)
    .pipe(replace(/link href=\"(\.\.\/)+/g, 'link haha href="' + configSites.CSS_PATH))
    .pipe(replace(/script type="text\/javascript" src=\"(\.\.\/)+/g, 'script type="text/javascript" src="' + configSites.JS_PATH))
    .pipe(replace(/\$\%/g, '<%'))
    .pipe(replace(/\%\$/g, '%>'))
    .pipe(gulp.dest(dest));
}
function copyHtmlAndCss(path,dest){
	gulp.src(path)
		.pipe(gulp.dest(dest))
}

gulp.task('replace', function() {
  // 将你的默认的任务代码放在这
  console.log('copy html and replace link and script Host ');
  replaceHtml('static/html/**/*.html',DEST);
  CPPATH.map(function(r){
  	copyHtmlAndCss(r,r.indexOf('.css') > -1 ? 'static/css/' : 'static/html/');
  })
});

gulp.task('watch',function(){
	gulp.watch('static/html/**/*.html', function(event) {
	  	console.log('File ' + event.path + ' was ' + event.type + ', running tasks replace...');
	  	var filePath = event.path;
	  	var delPath = filePath.replace('static/html/',DEST)
	  	try{
		  	if (fs.existsSync(delPath)) {
			  	fs.unlinkSync(delPath)
		    }
	    }catch(e){
	    	console.log('unlinkSync error!!');
	    	console.log(e);
	    }
		replaceHtml(filePath,DEST + path.dirname(filePath.split('static/html/')[1]));
	});
})