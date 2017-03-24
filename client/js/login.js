import axios from 'Axios'
import $ from 'Jquery'
import md5 from 'Md5'

$(function(){
	var login = () => {
		var name = $('#name').val(),
			pwd = $('#pwd').val()
		if(!name || !pwd){
			alert('请填写用户名和密码！！')
			return ;
		} 
		pwd = md5(pwd)
		axios.post('/login',{name,pwd}).then(r => {
			if(r.code == 0){
				window.location.href = 'group/list';
			}else{
				alert(r.msg || '登录失败！！')
			}
		})
	}
	$('#loginbutton').click(login)
	document.onkeydown = function(e){ 
	    var ev = document.all ? window.event : e;
	    if(ev.keyCode==13) {
	    	login();
	    }
	}
})