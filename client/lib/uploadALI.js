/*
* 阿里云上传 sts 临时Token
* */
import $ from 'Jquery'

var defaultSetting = {
    fsize: 10 * 1024 * 1024 ,
}

var storeImg = 'xhc-plat/';//普通图片上传路径
var goodsmark = 'goodsmark/';//角标上传路径
var storeVideo = 'web_upload/';
var videoHost = 'http://wvcdn.xiaohongchun.com/mp4/';
var imgHost =  'http://wicdn.xiaohongchun.com/';
var talentVideoHost = 'https://xhc-video.oss-cn-beijing.aliyuncs.com/';

function upload(uploaded,setting){
    this.Expiration = '';
    this.files = [];
    this.loading = '';
    this.uploaded = uploaded;
    this.host = 'oss-cn-beijing';
    this.bucket = {
        img:'xhc-img',
        video:'xhc-video'
    }
    this.is_talent = false;
    this.path = setting['uploadPath'] || null;
    this.is_talent = setting.is_talent ? true: false;

    delete setting.uploadPath
    delete setting.is_talent
    
    if(this.path){
        if(!this.path.endsWith('/')){
            this.path += '/';
        }
    }

    this.opt = $.extend({},defaultSetting,setting);

    this.ossTs = {
        region: '',
        accessKeyId: '',
        accessKeySecret: '',
        stsToken:'',
        bucket: '',
        port : window.location.protocol == 'https:' ? 443 : 80,
    }
    this.uploadCount = 5;//上传失败 可重复上传次数
    this.init();
}

upload.prototype = {
    init: function () {
        this.tokenHanle();//请求token
        var _this = this;
        setInterval(function () {//49分钟重新请求一次(估计相应操作的shop或者app接口登录已经过期)
            _this.tokenHanle();
        },49 * 60 * 1000);
    },
    pushFiles: function (files) {
        this.files = this.files.concat(files);
    },
    //处理token
    tokenHanle: function () {
        var _this = this;
        if(window.ossTs){
            _this.ossTs = window.ossTs;
            return;
        }
        getToken(function (data) {
            _this.Expiration = data.Expiration;
            $.extend(_this.ossTs, {
                'region': _this.host,
                'accessKeyId': data.AccessKeyId,
                'accessKeySecret': data.AccessKeySecret,
                'stsToken':data.SecurityToken
            })
            window.ossTs = _this.ossTs;
        })
    },
    //是否过期
    expire: function (filename) {
        var _this = this;
        if(Date.parse(_this.Expiration) && Date.parse(_this.Expiration) < (Date.now() + 50 * 60 * 1000)){
            _this.tokenHanle();
        }
    },
    start: function () {
        var _this = this;
        if(!OSS){
            alert('下载OSS源文件失败!!');
            return ;
        }
        //var tempFileArr = [];
        var tasks = this.files.map((file,index) => {
            var isImg = false;
            var suf = get_suffix(file.name);
            if('.jpg,.gif,.png,.bmp,.jpeg'.indexOf(suf) >= 0) isImg = true;
            var opt = $.extend({},_this.ossTs,{
                bucket: isImg ? _this.bucket.img : _this.bucket.video
            })
            return new Promise((resolve,reject) => {
                var path = _this.path || (isImg ? (_this.opt.isMark ? goodsmark : storeImg) : storeVideo)
                new OSS.Wrapper(opt).multipartUpload( path + Date.now() + '_' + random_string(10) + suf, file ,{
                    progress: function (p) {
                        return function (done) {
                            console.log(p * 100 + '%');
                            done();
                        }
                    }
                }).then(function (result) {
                    if(result){
                        result['uploaded-name'] = result['name'];
                        result['name'] = file.name;
                        if ( _this.is_talent ) {
                            result['try_url'] = talentVideoHost + result['uploaded-name'];
                        } else {
                            result['try_url'] = !isImg ? (videoHost + result['uploaded-name'].replace(storeVideo,'')) : (imgHost + result['uploaded-name']);
                            //result.res && result.res.requestUrls && result.res.requestUrls.length && result.res.requestUrls[0].substr(0, result.res.requestUrls[0].indexOf('?'));
                        }
                        _this.loadedSuccess(result['try_url'], isImg, function (isSuccess,wh) {
                            if(isSuccess){//加载图片成功
                                result.url = result['try_url'];
                                result['success'] = true;
                                result['fileId'] = file.id;
                                result['wh'] = wh ? wh : {img_width:0,img_height:0};
                                console.log(file.name, 'url值取自res.requestUrls', result.res);
                            }else{//加载失败
                                resolve({success:false,fileId:file.id,filename:file.name});
                            }
                            resolve(result);
                        })
                    }
                }).catch(function (err) {
                    console.log(err);
                    _this.loading.hide();
                    alert(file.name + '上传异常(服务访问不到)!!');
                    reject({success:false,fileId:file.id,filename:file.name});
                });
            })
        })

        _this.loading.show();
        Promise.all(tasks).then(re => {
            _this.loading.hide();
            _this.files = [];
            var successRe = re.filter(function (r) {
                return r.url != undefined;
            })
            successRe.map(function(r){
                r['url'] = r['url'].replace('http://','https://');
            })
            console.log(successRe);
            _this.uploaded(successRe);
            /*if(tempFileArr.length){
                if(_this.uploadCount-- < 0){
                    return;
                }
                _this.files = tempFileArr;
                _this.loading.show();
                setTimeout(function () {//有文件上传失败,重试5次
                    _this.start();
                },5000);
            }else{
                _this.uploadCount = 5;
            }*/
        })
        /*tasks.forEach(r => {
            r.then(re => {
                _this.files = _this.files.filter(f =>{
                    return f.id != re.fileId;
                })
                if(!_this.files.length){//是否全部上传完毕
                    _this.loading.hide();
                }
                if(re && re.success){
                    _this.uploaded([re]);
                }else{
                    var name = re.filename || '';
                    alert(name + '上传失败');
                }
            })
        })*/
    },
    loadedSuccess: function (src, isImg, cb) {
        var _this = this;
        var img = isImg ? new Image() : document.createElement('VIDEO');
        console.log('加载!!');
        img.onload = img.onloadeddata = function () {
            console.log(src,img,'加载成功!!');
            var wh = {};
            wh['img_width'] = img && img.width || 0;
            wh['img_height'] = img && img.height || 0;
            cb?cb(true,wh):'';
        }
        img.onerror = function () {
            console.log(src,'加载失败!!');
            if(_this.uploadCount-- > 0){//请求地址不存在 重试5次
                setTimeout(function () {
                    upload.loadedSuccess.call(_this,src,isImg,cb);
                },10000);
            }else{
                _this.uploadCount = 5;
                cb?cb(false):'';
            }
        }
        img.setAttribute('src',src);
        if(!isImg){
            img.style.display = 'none';
            document.body.appendChild(img);
        }
    }
}
function readFile(file,cb){
    //file
    /*
     lastModified:1465904973000
     lastModifiedDate:Tue Jun 14 2016 19:49:33 GMT+0800 (CST)
     name:"后台_拼团订单列表信息.png"
     size:356508
     type:"image/png"
     webkitRelativePath:""
     * */
    if(typeof FileReader === 'undefined'){
        console.log('need FileReader!');
        return;
    }
    //var f = file.getNative();
    /*if (!/image\/\w+/.test(file.type)){//验证格式
     console.log('type is not img');
     return;
     }*/
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(e) {
        //e.target.result
        cb?cb(file,e.target.result):'';
    }
}
function get_suffix(filename) {
    let pos = filename.lastIndexOf('.')
    let suffix = ''
    if (pos != -1) {
        suffix = filename.substring(pos)
    }
    return suffix;
}
function random_string(len) {
    len = len || 32;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = chars.length;
    var pwd = '';
    for (let i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}
function getToken(cb){
    var xhr = new XMLHttpRequest();
    xhr.open('GET','//www.xiaohongchun.com/api2/fileupload/get_admin_temporary_token',false);
    xhr.onreadystatechange = function () {
        if(xhr.readyState == 4){
            if(xhr.status == 200){
                var data = JSON.parse(xhr.response);
                cb?cb(data.data && data.data.credentials):'';
            }else{
                alert('获取上传图片Token失败!!');
            }
        }
    }
    xhr.send(null);
}

var u ={
    upload:function(containerId,fileAdded,uploaded){
        if(!$('body').find('.gosspublic').length){
            $('<script class="gosspublic" src="//gosspublic.alicdn.com/aliyun-oss-sdk-4.5.0.min.js"></script>').appendTo($('body'));
        }
        var _this = this;
        if(arguments.length === 2){//只传两个参数 则直接上传
            uploaded = fileAdded;
            fileAdded = false;
        }
        var setting = {};
        if(typeof containerId === 'object'){
            setting = containerId;
            containerId = setting.containerId;
            delete setting['containerId'];
        }

        var inputFileId = 'input_file_'+random_string(10);//当前页面上传input file的ID

        $(`<form class="uploadForm">
            <a class="btn btn-white from-control" href="#" role="button">
                <span class="glyphicon glyphicon-upload" aria-hidden="true"></span>上传
            </a>
            <input type="file" id="${inputFileId}" multiple>
            <i class="loading"></i>
            </form>`)
            .appendTo($('#'+containerId));

        var uploaderRe = new upload(uploaded,setting);

        $('#'+containerId).on('mousedown',"#"+inputFileId,function(e){//点击清空缓存的文件
            $('.uploadForm').each(function(i,t){
                t.reset();
            })
        })
        var filesize = setting.fsize || defaultSetting.fsize;
        //file change 事件
        $('#'+containerId).on('change',"#"+inputFileId,function(e){
            var files = [].slice.call(this.files);
            var okFiles = [];
            //uploaderRe.pushFiles(files);
            uploaderRe.loading = $('#'+inputFileId).siblings('i.loading');
            /*if(!fileAdded) {
                uploaderRe.start();//直接上传
                //return;
            }*/
            uploaderRe.files = [];
            files.forEach(function(r){
                r['id'] = random_string(10);
                if(filesize < r.size){
                    alert(r.name + '太大,最大不能超过'+filesize/1024/1024+'M!!');
                    return;
                }
                //okFiles.push(r);
                uploaderRe.pushFiles(r);
                readFile(r,function(file, base64Url){
                    fileAdded?fileAdded(file.id, base64Url, file.name):'';
                });
            })
            if(!fileAdded){
                uploaderRe.start();
            }
        })

        return uploaderRe;
    }
}
//入口 u.upload
module.exports = u;