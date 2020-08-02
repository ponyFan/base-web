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
        $("#lbl_name").html(languageJSON.name + ":");
        $("#lbl_webUrl").html(languageJSON.webUrl + ":");
        $("#ULmtr_add").html(languageJSON.submit);
    }

    function loadPage() {
        //关闭窗口
        $(".CA_close").click(function () {
            close();
        });

        if ($("#mtr_edit").attr("edit_type") == "直播") {			//修改
            $("#mtr_alTitle").html(languageJSON.al_editWebUrl);
            var mtrId;
            for (var x = 0; x < $(".mtr_cb").length; x++) {
                if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                    mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                }
            }

            var data = JSON.stringify({
                action: 'GetOne',
                project_name: UTIL.getCookie("project_name"),
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
            $("#mtr_alTitle").html(languageJSON.al_addWebUrl);
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

    function onSubmit(_mtrId) {
        var mtrName = $("#ULmtr_name").val();
        var mtrUrl = $("#ULmtr_address").val();
        var url = CONFIG.serverRoot + "/backend_mgt/v1/webmaterials";
        if (_mtrId == null) {
            var data = JSON.stringify({
                action: "Post",
                project: CONFIG.projectName,
                name: mtrName,
                content: mtrUrl,
                Is_Live: 1
            })
        } else {
            var data = JSON.stringify({
                action: "Update",
                project: CONFIG.projectName,
                name: mtrName,
                ID: _mtrId,
                content: mtrUrl,
                Is_Live: 1
            })
        }
        UTIL.ajax('POST', url, data, function (msg) {
            if (msg.rescode == 200) {
                if (UTIL.getLocalParameter('config_checkSwitch') == '0' && _mtrId != null) {         //未开启权限
                    var data2 = JSON.stringify({
                        action: "UpdateWebMaterialInternal",
                        project_name: CONFIG.projectName,
                        material_type: "WebText",
                        webmaterialID: _mtrId
                    });
                    UTIL.ajax(
                        'POST',
                        CONFIG.serverRoot + '/backend_mgt/v2/channels/',
                        data2,
                        function (data) {
                            if (data.rescode === '200') {
                                alert(languageJSON.al_saveSuc);
                                backList();
                            } else {
                                alert(languageJSON.al_saveFaild);
                            }
                        }
                    )
                } else {
                    alert(languageJSON.al_saveSuc);
                    backList();
                }
            } else {

                alert(languageJSON.al_saveFaild);
            }
        })
    }

    /**
     * 检测文本框事件
     */
    function inputCheck() {
        var errormsg = "";
        if ($("#ULmtr_name").val() == "") {
            errormsg += languageJSON.al_inName + "！\n";
        }
        if ($("#ULmtr_address").val() == "") {
            errormsg += languageJSON.al_inUrl+ "！";
        }
        if (errormsg != "") {
            alert(errormsg);
            return false;
        }else {
        	return true;
        }
    }

    /**
     * 返回
     */
    function backList() {
        MTR.loadPage(undefined, "WebText");
        close();
    }
})
