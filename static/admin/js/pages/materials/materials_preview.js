define(function (require, exports, module) {
    var UTIL = require("common/util.js");
    var CONFIG = require("common/config.js");
    var MTR = require("pages/materials/materials_list.js");
    var MTRCTRL = require("pages/channel/mtrCtrl.js");
    var ADDMTR = require("pages/channel/addMtr.js");
    var ADEDIT = require("pages/channel/adEdit.js");
    var UNIT = require("pages/unit/unit.js");

    var zdata; //即将预览的文件
    var index = 0;
    var currentPage = 1,
        totalPage;
    var languageJSON = CONFIG.languageJson.material;
    exports.init = function () {
        zdata = '';
        //关闭预览
        $(".mtrView_close").each(function () {
            $(this).click(function () {
                MTR.viewData = undefined;
                MTRCTRL.viewData = undefined;
                ADDMTR.viewData = undefined;
                $("#mtrPrevieBg").html('');
                UTIL.cover.close(3);
            });
        });

        if (MTR.viewData != undefined) {
            zdata = MTR.viewData;
        } else if (MTRCTRL.viewData != undefined) {
            zdata = MTRCTRL.viewData;
        } else if (ADDMTR.viewData != undefined) {
            zdata = ADDMTR.viewData;
        } else if (ADEDIT.viewData != undefined){
            zdata = ADEDIT.viewData;
        }
        if (zdata.Download_Auth_Type == undefined) {
            var mtrUrl = UTIL.getRealURL(zdata.download_auth_type, zdata.url);
        } else {
            var mtrUrl = UTIL.getRealURL(zdata.Download_Auth_Type, zdata.URL);
        }
        if (zdata.Type_ID == undefined) {
            var id = zdata.resource_id;
            var typeId = zdata.type_id;
            var typeName = zdata.type_name;
        } else {
            var id = zdata.ID;
            var typeId = zdata.Type_ID;
            var typeName = zdata.Type_Name;
        }
        index = 0;
        if (checkUrl('adEdit') && $('#mtrChoise_box').length == 0 && ADEDIT.viewData == undefined) {
            mtrUrl = ADEDIT.url;
            typeId = ADEDIT.mtrType == 'Video' ? 1 : 2;
        }
        if(checkUrl('unit')){
            mtrUrl = UNIT.url;
            typeId = +UNIT.mtrType;
        }
        if (typeId == 1) {            //视频
            $("#mtrView_videoArea").css("display", "block");
            $("#mtrView_video").attr("src", mtrUrl);
            $("#mtrView_videoArea").find("embed").attr("src", mtrUrl);
            document.getElementById("mtrView_video").addEventListener('error', function () {
                alert('该视频资源编码格式不支持，或已经被删除！')
                return false
            });
            // document.getElementById("mtrView_video").addEventListener('canplaythrough', function () {
            //     index++;
            // });
            // var t = setInterval(function () {
            //     console.log(index)
            //     if (index == 0) {
            //         $("#mtrView_video").attr("src", mtrUrl);
            //         $("#mtrView_videoArea").find("embed").attr("src", mtrUrl);
            //     } else {
            //         clearInterval(t);
            //     }
            // }, 1000);
        } else if (typeId == 2) {      //图片
            if (imgSizeFlag(zdata.Size)) {
                if (confirm(languageJSON.cf_preview + "？")) {
                    $("#mtrView_picArea").css("display", "inline");
                    $("#mtrView_picArea").find("img").attr("src", mtrUrl);
                } else {
                    MTR.viewData = undefined;
                    MTRCTRL.viewData = undefined;
                    ADDMTR.viewData = undefined;
                    $("#mtrPrevieBg").remove();
                    UTIL.cover.close(3);
                }
            } else {
                $("#mtrView_picArea").css("display", "inline");
                $("#mtrView_picArea").find("img").attr("src", mtrUrl);
            }
        } else if (typeId == 3) {     //音频
            $("#mtrView_audioArea").css("display", "block");
            $("#mtrView_audio").attr("src", mtrUrl);
            $("#mtrView_audioArea").find("embed").attr("src", mtrUrl);
            document.getElementById("mtrView_audio").addEventListener('error', function () {
                alert('该音频资源不存在！')
                return false
            });
            // document.getElementById("mtrView_audio").addEventListener('canplaythrough', function () {
            //     index++;
            // });
            // var t = setInterval(function () {
            //     if (index == 0) {
            //         $("#mtrView_audio").attr("src", mtrUrl);
            //         $("#mtrView_audioArea").find("embed").attr("src", mtrUrl);
            //     } else {
            //         clearInterval(t);
            //     }
            // }, 1000);
        } else if (typeName == "Office") {       //Office
            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: "getone",
                officeid: id
            })
            var _url = CONFIG.serverRoot + '/backend_mgt/v2/officeaction/';
            UTIL.ajax('post', _url, data, function (msg) {
                zdata = msg;
                totalPage = Object.keys(zdata).length;
                $("#mtrView_officeArea").css("display", "inline");
                for (var i = 0; i < totalPage; i++) {
                    $("#mtrView_officeArea").find($(".carousel-inner")).append("<div class='item' data-pause>"
                        + "<img src='" + zdata[i] + "' alt='" + (i + 1) + "'>"
                        + "<div class='carousel-caption'><div id='currentPage'>" + (i + 1) + "&nbsp;/&nbsp;" + totalPage +"</div></div>"
                        + "</div>")
                    loadImage(zdata[i], function() {});
                    if (i == 0) {
                        $(".item:eq(0)").addClass("active");
                    }
                }
                $('#mtrViewCarousel').carousel({
                    interval: false
                })
            });
        }
    }

    /**
     * 图片预加载
     * @param url
     * @param callback
     */
    function loadImage(url, callback) {
        var img = new Image(); //创建一个Image对象，实现图片的预下载
        img.src = url;

        if (img.complete) { // 如果图片已经存在于浏览器缓存，直接调用回调函数
            callback.call(img);
            return; // 直接返回，不用再处理onload事件
        }

        img.onload = function () { //图片下载完毕时异步调用callback函数。
            callback.call(img);//将回调函数的this替换为Image对象
        };
    };

    function imgSizeFlag(size) {
        if (size != undefined) {
            var units = size.substring(size.length - 2);
            var iSize = size.substring(0, size.length - 2);
            if (units == 'KB' && Number(iSize > 5000)) {
                return true;
            } else if (units == 'MB' && Number(iSize > 5)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }

    }

    function checkUrl(URL) {
        return window.location.hash.indexOf(URL) > -1 ? true : false;
    }
})