const nodemailer = require('nodemailer');
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(config.email_opt);

// setup email data with unicode symbols
var mailOptions = {
    from: '<zhangjiangpo@xiaohongchun.com>', // sender address
    to: '<wangyang@xiaohongchun.com>,<fanximei@xiaohongchun.com>,<wangmeiyi@xiaohongchun.com>,<sunyuwei@xiaohongchun.com>,<chenmengwen@xiaohongchun.com>,<xiaoxiao@xiaohongchun.com>,<zhangjiangpo@xiaohongchun.com>', // list of receivers
    subject: '微信机器人重启需要登录', // Subject line
    html: `大家好：<br/> <br/> 
	    &nbsp;&nbsp;&nbsp;&nbsp;微信机器人不小心崩溃了，已经重启成功！！<br/><br/> 
	    &nbsp;&nbsp;&nbsp;&nbsp;你可以在微信管理后台顶部 点击相应按钮获取登录二维码，然后用相应的微信扫描登录 <br/><br/> 
	    &nbsp;&nbsp;&nbsp;&nbsp;也可以直接扫描以下二维码登录：<br/> <br/> `, // plain text body
};
exports.send = function(option){
	// send mail with defined transport object
	var opt = Object.assign({},mailOptions,option);
	if(opt.content){
		opt.html += opt.content;
		delete opt.content;
	}
	return new Promise((resolve,reject)=> {
		transporter.sendMail(opt, (error, info) => {
			console.log(error, info)
		    if (error) {
		        reject({code:1010,msg:error});
		    }
		    resolve({code:0,msg:info});
		});
	})
}