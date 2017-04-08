
import axios from 'Axios'
import $ from 'Jquery'
import com from 'Common'
import upload from 'Upload'
import config from '../../../config/'
import config_client from '../../../config/client.index.js'

//var socket_io = require('socket.io-client')(config.sapi);//http://wxgroup.xhcshop.com/config.sapi

$(function(){
	var tmpl = (data) => {
		var ts = (obj) => {
			return `
				<tr>
                    <td>${obj.xuhao}</td>
			        <td>${obj.id}</td>
			        <td>${obj.name}</td>
			        <td>${obj.membernum}</td>
			        <td><img src="${obj.qrcode}" style="height:50px;"/></td>
			        <td>${obj.botname}</td>
			        <td>${obj.qrcode_create_time}<br/><br/><strong>${obj.qrcode_gq_time}</strong></td>
                    <td>${obj.day_join_num || 0}</td>
                    <td>${obj.history_member || 0}</td>
			        <td>
			            <div class="btn-group">
                            <button p_id="${obj.id}" class="btn-white btn btn-sm see" role='opt'>
                                统计数据
                            </button>
			                <button p_id="${obj.id}" class="btn-white btn btn-sm edit" role='opt'>
			                    修改
			                </button>
			                <button status="${obj.is_delete}" p_id="${obj.id}" class="btn-white btn btn-sm del" role='opt'>
			                    ${obj.is_delete == 0 ? '删除' : '恢复'}
			                </button>
			            </div>
			        </td>
			    </tr>
			`;
		}	
		return data.map(r => {
			return ts(r);
		}).join('')
	}

    var imgurl_hz = 1;
    var botnames_obj = {};

    var pc_banner = {
        curDataArr:[],
        init: function () {
            var _this=this;
            _this.render();
            $('#create_new').on('click', function () {
                com.clearForm($('#form_banner'));
                $('#modalcreate').modal('show');
                //
            })
            $('#list_banner').on('click','button[role="opt"]', function () {//
                var $t = $(this);
                var id = $t.attr('p_id');
                if($t.hasClass('edit')){//编辑
                    $('#modalcreate').modal('show');
                    com.initForm($('#form_banner'),_this.getCurData(id));
                }else if($t.hasClass('del')){//删除
                    var isOk = window.confirm('你确定该操作吗?!');
                    var status = $t.attr('status') == '0' ? 1 : 0 ;
                    if(isOk){
                        axios.post('group/del', {id,status}).then(data =>{
                            if (data.code == 0) {
                                _this.render();
                            } else {
                                alert('删除失败!!');
                            }
                        })
                    }
                }else if($t.hasClass('see')){//查看统计数据
                    com.loading('show');
                    axios.get('group/group/data',{params:{g_id:id}}).then(data => {
                        com.loading('hide');
                        if(data.code == 0){
                            $('#groupdata').modal('show');
                            var detail = [];
                            data.detail && Object.keys(data.detail).map(r => {
                                detail.push(r + ' (' + data.detail[r] + ') ')
                            })
                            data['detail'] = detail.length && detail.join(' , ');
                            com.initForm($('#form_data'),data);
                        }else{
                            alert('查询失败！！')
                        }
                    })
                }
            })

            $('#search_status').change(function(){
                _this.render();
            })

            //var saveBtn = $("#save_banner").ladda();
            $('#save_banner').click(function(){
                if(com.validateForm($('#form_banner'))) {
                    var data = com.valueForm($('#form_banner'));
                    var cd = _this.getCurData(data.id);
                    //saveBtn.ladda('start');
                    data['change'] = cd.qrcode != data.qrcode ? 1 : 0;
                    if(data.change == 0){
                        alert('没有修改任何数据！！');
                        return;
                    }

                    axios.post('group/edit', data).then(data =>{
                        //saveBtn.ladda('stop');
                        if (data.code == 0) {
                            alert('操作成功!');
                            $('#modalcreate').modal('hide');
                            _this.render();
                        } else {
                            alert('保存失败!!');
                        }
                    })

                }
            })
            upload.upload('img_com', function (data) {
                var url = data[0].url;
                $('#img').attr('src',url);
                $('#img_hidden').val(url);
            });
            var getRandom = () => {
                var str = '';
                var rd = 'abcdefghijklmnopqrstuvwxyz1234567890';
                for(let i =0 ; i< 10; i++){
                    str += rd.charAt(Math.floor(Math.random() * rd.length));
                }
                return '?v=' + str + imgurl_hz++;
            }

            //获取二维码图片
            $('.qrcode_show').on('click','button',(e) => {
                var imgurl = $(e.target).attr('imgurl');
                $('#qrimg').attr('src',imgurl + getRandom());
                $('#qrshow').modal('show');
            })
            //刷新二维码
            $('#reshqr').click(() => {
                var imgurl = $('#qrimg').attr('src');
                imgurl = imgurl.substr(0,imgurl.lastIndexOf('?'))
                $('#qrimg').attr('src','');
                setTimeout(() => {
                    $('#qrimg').attr('src',imgurl + getRandom());
                })
            })

            setInterval(() => {
                $('.qrcode_show').find('button').each((i,r) => {
                    var il = $(r).attr('imgurl') + getRandom();
                    var img = new Image();
                    img.onload = () => {
                        if(!$(r).find('i').length){
                            $(r).html($(r).html() + '<i style="color:red">重启</i>')
                        }
                    }
                    img.onerror = () => {
                        if($(r).find('i').length){
                            $(r).find('i').remove();
                        }
                    }
                    img.src = il;
                })
            },5000)

            /*socket_io.on('connect',function(d){
                socket_io.on('need restart',function(num){
                    var r = $('.qrcode_show button.button_'+num);
                    r.html(r.html() + '<i style="color:red">重启</i>')
                })
                socket_io.on('restarted',function(num){
                     $('.qrcode_show button.button_'+num).find('i').remove();
                })
            })
            socket_io.on('connect_error',function(err){
                //alert(JSON.stringify(err));
                console.log(err);
            })*/
        },
        getCurData:function(id){
            return this.curDataArr.find(function(r){
                return r.id == id;
            })
        },
        render: function () {
            var _this=this;
            $('#list_banner').html('');
            axios.get('group/getlist',{params:{status:$('#search_status').val()}}).then(r => {
            	if(r.code == 0){
                    var botnames = [];
                    r.data.map((t,i) => {
                        var qt = parseFloat(t['qrcode_create_time']);
                        t['qrcode_create_time'] = qt ? new Date(qt).Format('yyyy/MM/dd hh:mm') : ''
                        t['qrcode_gq_time'] = qt ? new Date(qt + config.wxexpir.qrcode ).Format('yyyy/MM/dd hh:mm') + ' 过期' : ''
                        if(!botnames.find(s => s == t.botname)){
                            botnames.push(t.botname)
                        }
                        t['xuhao'] = i + 1;
                    })
                    botnames.map(s => {
                        if(botnames_obj[s] == undefined){
                            botnames_obj[s] = 0;
                        }
                    })
                    for(let key in botnames_obj){
                        if(!botnames_obj[key]){
                            botnames_obj[key] = 1;
                            $('<button type="button" imgurl="../../xhc_img/qrcode_'+config_client.botname_qrnum[key]+'.png" class="btn btn-white button_'+config_client.botname_qrnum[key]+'">'+key+'</button>')
                                .appendTo($('.qrcode_show'))
                        }
                    }
                    _this.curDataArr = r.data;
					$(tmpl(r.data)).appendTo($("#list_banner"));
            	}
            })
        }
    }
    pc_banner.init();

})

