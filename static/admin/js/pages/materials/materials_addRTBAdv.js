define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var MTR = require("pages/materials/materials_list.js");
    var languageJSON = CONFIG.languageJson.material;

    exports.init = function () {
       // selectLanguage();
        loadPage();
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#lbl_name").html(languageJSON.liveName + ":");
        $("#lbl_url").html(languageJSON.liveUrl + ":");
        $("#ULmtr_add").html(languageJSON.submit);
    }

    function loadPage() {
        //关闭窗口
        $(".CA_close").click(function () {
            close();
        });

        if ($("#mtr_edit").attr("edit_type") == "广告") {			//修改
            //$("#mtr_alTitle").html(languageJSON.editLiveUrl);
            $("#mtr_alTitle").html('编辑互联网广告');
            var mtrId;
            for (var x = 0; x < $(".mtr_cb").length; x++) {
                if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                    mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                }
            }

            var data = JSON.stringify({
                action: 'GetOne',
                project_name: CONFIG.projectName,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
            UTIL.ajax('post', url, data, function (msg) {
                var mtrName = msg.Material[0].Name
                var url = msg.Material[0].URL;
                var duration = msg.Material[0].Duration;
                var arr = duration.split(':');
                duration = (+arr[0]) * 3600 + (+arr[1]) * 60 + (+arr[2]);
                $("#RTBAdvName").val(mtrName);
                $("#RTBAdvName").attr("mtrtype", mtrName);
                $("#RTBAdvAddress").val(url);
                $("#RTBAdvPeriod").val(duration);
            });

            $("#ULmtr_add").click(function () {
                if (!inputCheck()) return;
                onSubmit(mtrId);
            })
        } else {													//添加
            // $("#mtr_alTitle").html(languageJSON.addLiveUrl);
            $("#mtr_alTitle").html('添加互联网广告');
            $("#ULmtr_add").click(function () {
                if (!inputCheck()) return;
                onSubmit();
            })
        }
    }

    /**
     * 关闭窗口
     */
    function close() {
        UTIL.cover.close();
    }

    /**
     * 获取当前时间
     **/
    function getNowFormatDate() {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        var strHour = date.getHours();
        var strMin = date.getMinutes();
        var strSec = date.getSeconds();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        if (strHour >= 0 && strHour <= 9) {
            strHour = "0" + strHour;
        }
        if (strMin >= 0 && strMin <= 9) {
            strMin = "0" + strMin;
        }
        if (strSec >= 0 && strSec <= 9) {
            strSec = "0" + strSec;
        }
        var currentdate = date.getFullYear() + seperator1 + month
            + seperator1 + strDate + " " + strHour + seperator2
            + strMin + seperator2 + strSec;
        return currentdate;
    }

    function onSubmit(mtrId) {

        var mtrName = $("#RTBAdvName").val();
        var mtrUrl = $("#RTBAdvAddress").val();
        var duration = $("#RTBAdvPeriod").val();

        if (mtrId == null) {
            var action = "Post";
            var material = {
                name: mtrName,
                name_eng: '',
                url_name: mtrUrl,
                description: '',
                is_live: '1',
                Download_Auth_Type: 'None',
                Download_Auth_Paras: '',
                size: '0',
                md5: '',
                duration: duration,
                create_time: getNowFormatDate(),
                CreateUser: CONFIG.userName,
                type: '8'
            };
            var data = JSON.stringify({
                action: action,
                project_name: CONFIG.projectName,
                material: material,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials';
            UTIL.ajax('post', url, data, function (msg) {
                if (msg.rescode == 200) {
                    $("#mtrRTBAdv").trigger("click");
                    close();
                    alert(languageJSON.al_addSuc);
                } else {
                    alert(languageJSON.al_addFaild);
                }
            });
        } else {
            var action = "Put";
            var Data = {
                Name: mtrName,
                URL: mtrUrl,
                duration : duration
            };
            var data = JSON.stringify({
                action: action,
                project_name: CONFIG.projectName,
                Data: Data,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
            UTIL.ajax('post', url, data, function (msg) {
                if (msg.rescode == 200) {
                    var pageNum = MTR.mtrList().pageNum;
                    MTR.loadPage(pageNum, "RTBAdv");
                    close();
                    alert(languageJSON.al_editSuc);
                } else {
                    alert(languageJSON.al_editFaild);
                }
            });
        }


    }

    /**
     * 检测文本框事件
     */
    function inputCheck() {
        var errormsg = "";
        if ($("#RTBAdvName").val() == "") {
            errormsg += languageJSON.al_inLiveName + "\n";
        }
        if ($("#RTBAdvAddress").val() == "") {
            errormsg += languageJSON.al_inLiveUrl;
        }
        if ($("#RTBAdvPeriod").val() == "") {
            // errormsg += languageJSON.al_inLiveUrl;
            errormsg += '广告时长不能为空！';
        }
        if (errormsg != "") {
            alert(errormsg);
            return false;
        }else {
        	return true;
        }
    }
})
