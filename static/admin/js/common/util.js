define(function (require, exports, module) {
    var CONFIG = require("common/config.js");

    /**
     * AJAX请求（异步）
     * @param type
     * @param url
     * @param data
     * @param successFn
     * @param dataType
     */
    exports.ajax = function (type, url, data, successFn, dataType) {
        ajax(type, url, data, successFn, dataType);
    };

    /**
     * AJAX请求（同步）
     * @param type
     * @param url
     * @param data
     * @param successFn
     * @param dataType
     */
    exports.ajax2 = function (type, url, data, successFn, dataType) {
        ajax2(type, url, data, successFn, dataType);
    };

    exports.cover = {
        'load': function (url, layer) {
            if (!layer) {
                $('#cover_area').css('display', 'flex');
                $('#cover_area').load(url);
            } else if (layer == 2) {
                $('#cover_area2').css('display', 'flex');
                $('#cover_area2').load(url);
            } else if (layer == 3) {
                $('#cover_area_preview').css('display', 'flex');
                $('#cover_area_preview').load(url);
            } else if (layer == 4) {
                $('#dialog_meeting').css('display', 'flex');
                $('#dialog_meeting').load(url)
            }
        },
        'close': function (layer) {
            if (!layer) {
                $('#cover_area').css('display', 'none');
                $('#cover_area').empty();
            } else if (layer == 2) {
                $('#cover_area2').css('display', 'none');
                $('#cover_area2').empty();
            } else if (layer == 3) {
                $('#cover_area_preview').css('display', 'none');
                $('#cover_area_preview').empty();
            } else if (layer == 4) {
                $('#dialog_meeting').css('display', 'none');
                $('#dialog_meeting').empty();
            } 
        }
    };

    exports.getHashParameters = function () {
        var queryString = window.location.hash.match(/\?(.*)/);
        if (queryString === null) {
            return {};
        }
        queryString = queryString[1];
        var pairs = queryString.split('&');
        var ret = {};
        pairs.forEach(function (el, idx, arr) {
            var i = el.indexOf('='), k, v;
            if (i === -1) {
                k = el;
                v = '';
            } else if (i === el.length - 1) {
                k = el.substring(0, el.length - 1);
                v = '';
            } else {
                k = el.substring(0, i);
                v = el.substring(i + 1);
            }
            ret[k] = v;
        });
        return ret;
    };

    exports.setLocalParameter = function (name, value) {
        localStorage.setItem(name, value);
    };

    exports.getLocalParameter = function (name) {
        return localStorage.getItem(name);
    };

    //设置cookie
    exports.setCookie = function (name, value, days) {
        //var exp=new Date();
        //exp.setTime(exp.getTime() + days*24*60*60*1000);
        //var arr=document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
        document.cookie = name + "=" + escape(value);
    };

    exports.getCookie = function (name) {
        var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
        if (arr != null) {
            return unescape(arr[2]);
        }
    };

    exports.getRealURL = function (type, _url, successFn) {
        var realUrl = "";
        if (_url == "") return realUrl;
        if (type == "None") {
            realUrl = _url;
        } else if (type == "Qiniu") {
            var data = JSON.stringify({
                action: "getRealURL",
                project_name: CONFIG.projectName,
                URL: _url
            })
            data.user = CONFIG.userName;
            data.token = CONFIG.token;

            var ajax = $.ajax({
                type: 'post',
                url: CONFIG.serverRoot + '/backend_mgt/v1/qiniu/',
                data: data,
                timeout: CONFIG.letTimeout,
                async: false,//false代表只有在等待ajax执行完毕后才执行后面语句
                success: function (data) {
                    realUrl = JSON.parse(data).URL;
                    //successFn(realUrl);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    // XMLHttpRequest.status
                    // alert('连接服务器出错 ' + textStatus + errorThrown);
                    ajax.abort();
                }
            });
        }
        return realUrl;
    }

    function ajax(type, url, data, successFn, dataType) {
        var data = JSON.parse(data);
        data.user = CONFIG.userName;
        data.token = CONFIG.token;
        data = JSON.stringify(data);
        var dataType = (dataType === undefined ? 'json' : dataType);

        var ajax = $.ajax({
            type: type,
            url: url,
            dataType: dataType,
            data: data,
            timeout: CONFIG.letTimeout,
            success: function (data) {
                if (data.rescode != undefined && data.rescode == '401' && data.errInfo != undefined) {
                    if(data.errInfo == "Token Unauthorized!"){
                        alert(CONFIG.languageJson.index.errorRelogin)
                        window.location.href = "login.html";
                        return false;
                    }else{
                        alert(data.errInfo)
                    }
                }
                successFn(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // XMLHttpRequest.status
                // alert('连接服务器出错 ' + textStatus + errorThrown);
                if (ajax.abort().status === 500) {
                    location.hash = '#common/500';
                } else if (ajax.abort().status === 404) {
                    location.hash = '#common/404';
                }
                ajax.abort();
            }
        })
    }

    //非异步
    function ajax2(type, url, data, successFn, dataType) {
        var data = JSON.parse(data);
        data.user = CONFIG.userName;
        data.token = CONFIG.token;
        data = JSON.stringify(data);
        var dataType = (dataType === undefined ? 'json' : dataType);

        var ajax = $.ajax({
            type: type,
            url: url,
            dataType: dataType,
            data: data,
            timeout: CONFIG.letTimeout,
            async: false,//false代表只有在等待ajax执行完毕后才执行后面语句
            success: function (data) {
                if (data.rescode != undefined && data.rescode == '401' && data.errInfo != undefined && data.errInfo == "Token Unauthorized!") {
                    window.location.href = "login.html";
                    alert(CONFIG.languageJson.index.errorRelogin)
                    return false;
                }
                successFn(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // XMLHttpRequest.status
                // alert('连接服务器出错 ' + textStatus + errorThrown);
                if (ajax.abort().status === 500) {
                    location.hash = '#common/500';
                } else if (ajax.abort().status === 404) {
                    location.hash = '#common/404';
                }
                ajax.abort();
            }
        })
    }

    //校验输入框字符

    exports.isValidated = function(type, value) {
        var pattern = '';
        if (value == '') return true;
        switch (type) {
            case 'password':
                pattern = /^(\w){6,20}$/;
                break;
            case 'username':
                pattern = /^\\w + $/;
                break;
            case 'keyword':
                pattern = /^[^`~!@#$%^&*()+=|\\\][\]\{\};'\,<>/?]{1}[^`~!@$%^&()+=|\\\][\]\{\};'\,<>?]{0,19}$/;
                break;
            case 'telephone':
                pattern = /^[+]{0,1}(\d){1,3}[ ]?([-]?((\d)|[ ]){1,12})+$/
                break;
            case 'email':
                pattern = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
                break;
            case 'number':
                pattern = /^[0-9]*[1-9][0-9]*$/;
                break;
        }
        if (!pattern.test(value)) {
            alert('请输入正确格式的数据！');
            return false;
        }
        return true;
    }
    //  Date格式化为yyyy-MM-dd
    exports.formatDate = function (fmt,date) { //author: meizz 
        var o = {
            "M+": date.getMonth() + 1, //月份 
            "d+": date.getDate(), //日 
            "h+": date.getHours(), //小时 
            "m+": date.getMinutes(), //分 
            "s+": date.getSeconds(), //秒 
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
            "S": date.getMilliseconds() //毫秒 
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o){
            if (new RegExp("(" + k + ")").test(fmt)){
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
             
        return fmt;
    }

    exports.timestampToTime = function (timestamp) {
        var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        var Y = date.getFullYear() + '-';
        var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
        var D = (date.getDate() < 10 ? '0'+date.getDate() : date.getDate()) + ' ';
        var h = (date.getHours() < 10 ? '0'+date.getHours() : date.getHours()) + ':';
        var m = (date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()) + ':';
        var s = date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds();
        return Y+M+D+h+m+s;
    }

    //数组去重
    exports.uniq = function(array){
        var temp = [];
        var index = [];
        var l = array.length;
        for(var i = 0; i < l; i++) {
            for(var j = i + 1; j < l; j++){
                if (array[i] === array[j]){
                    i++;
                    j = i;
                }
            }
            temp.push(array[i]);
            index.push(i);
        }
        return temp;
    }
});