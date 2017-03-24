import 'babel-polyfill'
import $ from './jquery'
import './bootstrap'

//modal 弹出框 最新的在最顶端
$(document).on('show.bs.modal', '.modal', function (event) {
    var zIndex = 2050 + (10 * $('.modal:visible').length);
    $(this).css('z-index', zIndex);
});

var validateStr = {
    'positive_two':{//两位小数正数
        ex:/^(?!0+(?:\.0+)?$)(?:[1-9]\d*|0)(?:\.\d{1,2})?$/g,
        msg:'必须为正数(最多含有两位小数) 不可以为0'
    },
    'positive_two_can_0':{
        ex:/^(?:[1-9]\d*|0)(?:\.\d{1,2})?$/,
        msg:'必须为正数(最多含有两位小数) 可以为0'
    },
    'positive_int':{//正整数
        ex:/^([1-9][0-9]+|[0-9])$/g,
        msg:'必须为正整数'
    },
    'word_len_15':{
        ex:/^([\u2E80-\u9FFF]|\w| ){0,15}$/g,
        msg:'汉字、字母、下划线，不能超过15个'
    },
    'date':{
        ex:/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}(?::\d{1,2})*$/g,
        msg:'日期格式不正确'
    },
    'text_1_15':{
        ex:/^([\u2E80-\u9FFF]|\w| ){1,15}$/g,
        msg:"必须为1-15个字符"
    },
    'text_1_10':{
        ex:/^([\u2E80-\u9FFF]|\w| ){1,10}$/g,
        msg:"必须为1-15个字符"
    },
    'text_0_100':{
        ex:/^([\u2E80-\u9FFF]|\w| ){0,100}$/g,
        msg:"必须不超过100个字符"
    }
}

var util = (function() {
    var u = {
        qinuHost : 'http://static.xiaohongchun.com/',
        showMsg: function (content) {
            $.messager.show({
                title:'提示',
                msg:content,
                timeout:1000,
                showType:'center',
                style:{
                    right:100,
                    top:document.body.scrollTop+document.documentElement.scrollTop+200,
                    bottom:''
                }
            });
        },
        initForm: function ($form,data) {//编辑下初始化表单
            for(var name in data){
                var value = data[name];
                /*var input=$form.find('input[name="'+name+'"]');
                 if(input.attr('type')=='radio'){
                 $.each(input, function (index,item) {
                 if($(item).attr('value')==value){
                 $(item).attr('checked',true);
                 }
                 })
                 }else{
                 }*/
                var radio=$form.find('input[name="'+name+'"][type="radio"][value="'+value+'"]');
                if(radio&&radio.length){
                    $form.find('input[name="'+name+'"][type="radio"][value!="'+value+'"]').prop('checked',false);
                    radio.prop('checked',true);
                    radio.trigger('change');
                    continue;
                }
                var checkbox = $form.find('input[name="'+name+'"][type="checkbox"]');
                if(checkbox && checkbox.length){
                    checkbox.prop('checked',value?true:false);
                    continue;
                }
                var select=$form.find('select[name="'+name+'"]');//select2组件
                if(select&&select.length){
                    select.val(value).trigger('change');
                    continue;
                }
                var img=$form.find('img[name="'+name+'"]');//select2组件
                if(img&&img.length){
                    img.attr('src',value);
                }
                var textarea=$form.find('textarea[name="'+name+'"]');
                textarea.length ? textarea.val(value):'';

                var input=$form.find('input[name="'+name+'"]');
                input.length ? input.val(value):'';
            }
        },
        clearForm:function($form){
            $form[0].reset();
            //重置radio控件 表单重置不了编辑过的radio
            $form.find('input[type="radio"]').prop('checked',false);
            $form.find('input[type="radio"][value="1"]').prop('checked',true);
            $form.find('input[type="radio"][value="1"]').trigger('change');
            $form.find('input[type="hidden"]').val('');
            //图片置为空
            $form.find('img').attr('src','');
            var select=$form.find('select');//所有select2都重置
            $.each(select, function (index, item) {
                $(item).val(null).trigger('change');
            })
        },
        valueForm:function($form){
            //表单序列化
            var data=$form.serializeArray(),submitData={};
            data.forEach(function (item, index) {
                //添加过item.name  checkbox相同name serializeArray会生成多个
                submitData[item.name]=submitData[item.name]?(submitData[item.name]+','+item.value):item.value;
            });
            return submitData;
        },
        clearEmpty:function(obj){//删除值为空的对象属性
            if(typeof obj != 'object') return ;
            for(var r in obj){
                if(typeof obj[r] == 'string' && !obj[r]){
                    delete obj[r];
                }
            }
            return obj;
        },
        validateForm: function (form) {
            var inputs=form.find('input[validate],img[validate],select[validate],textarea[validate]'),re=true;

            var tipMsg='';

            $.each(inputs, function (index,item) {
                var exStr=$(item).attr('validate'),val=$(item).val().trim();
                tipMsg=$(item).attr('tipMsg');
                if(exStr=='empty'){
                    if(val==''||val==null){
                        re=false;
                        return false;
                    }
                }else if(exStr == 'img'){
                    if(!$(item).attr('src')){
                        re = false;
                        return false;
                    }
                }else{
                    var reg = null;
                    if(exStr && /text_\d+_\d+/.test(exStr)){
                        var t = exStr.split('_');
                        reg = "^([\\u2E80-\\u9FFF]|\\w|[,!?\".《》*@#\\$]| ){"+t[1]+","+t[2]+"}$";
                    }
                    var ex=new RegExp(reg ? reg : exStr ? validateStr[exStr].ex : /\w+/g);
                    tipMsg = tipMsg ? tipMsg : validateStr[exStr].msg;
                    if(!ex.test(val)){
                        re=false;
                        return false;
                    }
                }
            });
            if(!re){//报错
                alert(tipMsg);
            }
            return re;
        },
        easyWinScroll: function () {
            document.body.scrollTop = 0
            var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
            /*var top = $('.window-shadow').css('top');
            top = top?parseInt(top.substr(0,top.length - 2)):0;
            console.log(scrollTop+top);*/
            $('.window-shadow,.window.panel').css('top',scrollTop+50 + 'px');
            var parent = window.parent;
            if(parent){//弹出window里面有事件会触发弹出框上移
                parent.document.body.scrollTop = 0
                var scrollTop = parent.document.body.scrollTop || parent.document.documentElement.scrollTop;
                $(parent.document).find('.window-shadow,.window.panel').css('top',scrollTop+50 + 'px');
            }
        },
        //重复发请求 是否存在 (导出excel超时处理)
        repeatRequest : function(url,num,callback){
            var num = typeof num == 'number' ? num : 5;
            var _this = arguments.callee;
            setTimeout(function () {//十秒后发请求
                $.ajax({
                    url:url,
                    timeout: 1 * 60 * 60 * 1000,//一个小时内不重复发请求
                    dataType:'jsonp',
                    success:function(e){
                        callback?callback(true):'';
                    },
                    error:function(r,e,c){
                        if(r.status == 404 && num > 0){//若404 重复请求
                            _this(url,num - 1,callback?callback:'');
                        }else{
                            callback?callback(num <= 0 ? false : true):'';
                        }
                    }
                })
            },10000)
        },
        // 将实体转回为HTML
        escape:function(html){
            var elem = document.createElement('div')
            var txt = document.createTextNode(html)
            elem.appendChild(txt)
            return elem.innerHTML;
        },
        unescape:function(str) {
            var elem = document.createElement('div')
            elem.innerHTML = str
            return elem.innerText || elem.textContent
        }
    };
    return u;
})();

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var val = this.getTime(),nd = this;
    if(val && val.toString().length < 13){
        var of = 13 - val.toString().length;
        val *= Math.pow(10,of);
        nd = new Date(val);
    }
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (nd.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) {
            var match = RegExp.$1;
            fmt = fmt.replace(match, function() {
                if (match == "S") return ("000" + o[k]).substr(("" + o[k]).length);
                if (match.length == 1) return o[k];
                return ("00" + o[k]).substr(("" + o[k]).length);
            });
        }
    return fmt;
}

String.prototype.toTime = function() {
    return new Date(this).getTime();
}
/*$(document).on('keydown', function (event) {
    if(event.keyCode==13){//触发搜索页面按钮事件 btn-keydown-search
        $('.btn-keydown-search').trigger('click');
    }
})*/
module.exports = util;
