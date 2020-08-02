define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var MTR = require("pages/materials/materials_list.js");
    var languageJSON = CONFIG.languageJson.material;

    exports.init = function () {
        selectLanguage();
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

        if ($("#mtr_edit").attr("edit_type") == "直播") {			//修改
            $("#mtr_alTitle").html(languageJSON.editLiveUrl);
            var mtrId;
            for (var x = 0; x < $(".mtr_cb").length; x++) {
                if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                    mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                }
            }

            var data = JSON.stringify({
                action: 'GetOne',
                //project_name: UTIL.getCookie("project_name"),
                project_name: CONFIG.projectName,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
            UTIL.ajax('post', url, data, function (msg) {
                var mtrName = msg.Material[0].Name
//	            var name = mtrName.substring(0, mtrName.indexOf('.'));
                var url = msg.Material[0].URL;
                $("#ULmtr_name").val(mtrName);
                $("#ULmtr_name").attr("mtrtype", mtrName);
                $("#ULmtr_address").val(url);
            });

            $("#ULmtr_add").click(function () {
                if (!inputCheck()) return;
                onSubmit(mtrId);
            })
        } else {													//添加
            $("#mtr_alTitle").html(languageJSON.addLiveUrl);
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

        var mtrName = $("#ULmtr_name").val();
        var mtrUrl = $("#ULmtr_address").val();

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
                duration: '0',
                create_time: getNowFormatDate(),
                CreateUser: CONFIG.userName
            };
            var data = JSON.stringify({
                action: action,
                //project_name: UTIL.getCookie("project_name"),
                project_name: CONFIG.projectName,
                material: material,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials';
            UTIL.ajax('post', url, data, function (msg) {
                if (msg.rescode == 200) {
                    $("#mtrLive").trigger("click");
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
            };
            var data = JSON.stringify({
                action: action,
                //project_name: UTIL.getCookie("project_name"),
                project_name: CONFIG.projectName,
                Data: Data,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
            UTIL.ajax('post', url, data, function (msg) {
                if (msg.rescode == 200) {
                    var pageNum = MTR.mtrList().pageNum;
                    MTR.loadPage(pageNum, "Live");
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
        if ($("#ULmtr_name").val() == "") {
            errormsg += languageJSON.al_inLiveName + "\n";
        }
        if ($("#ULmtr_address").val() == "") {
            errormsg += languageJSON.al_inLiveUrl;
        }
        if (errormsg != "") {
            alert(errormsg);
            return false;
        }else {
        	return true;
        }
    }
})
