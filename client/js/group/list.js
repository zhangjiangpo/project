
import axios from 'Axios'
import $ from 'Jquery'
import com from 'Common'
import upload from 'Upload'
import config from '../../../config/'

$(function(){
	var tmpl = (data) => {
		var ts = (obj) => {
			return `
				<tr>
			        <td>${obj.id}</td>
			        <td>${obj.name}</td>
			        <td>${obj.membernum}</td>
			        <td><img src="${obj.qrcode}" style="height:50px;"/></td>
			        <td>${obj.botname}</td>
			        <td>${obj.qrcode_create_time}<br/><br/><strong>${obj.qrcode_gq_time}</strong></td>
                    <td>${obj.history_member || 0}</td>
			        <td>
			            <div class="btn-group">
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
                    r.data.map(t => {
                        var qt = parseFloat(t['qrcode_create_time']);
                        t['qrcode_create_time'] = qt ? new Date(qt).Format('yyyy/MM/dd hh:mm') : ''
                        t['qrcode_gq_time'] = qt ? new Date(qt + config.wxexpir.qrcode ).Format('yyyy/MM/dd hh:mm') + ' 过期' : ''
                    })
                    _this.curDataArr = r.data;
					$(tmpl(r.data)).appendTo($("#list_banner"));
            	}
            })
        }
    }
    pc_banner.init();

})

