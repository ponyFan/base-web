define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var MTR = require("pages/materials/materials_list.js");
    var languageJSON = CONFIG.languageJson.material;

    exports.init = function () {
        selectLanguage();
        var mtrId = $("input[type=checkbox]:checked").attr("mtrID");
        var programId = $("input[type=checkbox]:checked").attr("proID");
        $("#Emtr_name").focus();
        loadPage();

        //保存
        $("#Emtr_updata").click(function () {
        	if (!inputCheck()) return;
        	var mtrName = $("#Emtr_name").val() + "." + $("#Emtr_name").attr("mtrtype");
            if (MTR.mtrList().mtrType == "Office") {
                var data = JSON.stringify({
                    action: 'ChangeName',
                    project_name: CONFIG.projectName,
                    name: mtrName,
                    id: mtrId
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v2/officeaction/';
                UTIL.ajax('post', url, data, function(msg){
                    if(msg.rescode == 200){
                        MTR.loadPage(MTR.mtrList().pageNum, MTR.mtrList().mtrType);
                        close();
                        alert(languageJSON.al_editSuc);
                    }else{
                        alert(languageJSON.al_editFaild);
                    }
                });
            } else {
                
                var data = JSON.stringify({
                    action: 'Put',
                    project_name: CONFIG.projectName,
                    Data: {
                        Name: MTR.mtrList().mtrType == "Program" ? $("#Emtr_name").val() : mtrName
                    }
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
                UTIL.ajax('post', url, data, function(msg){
                    if(msg.rescode == 200){
                        if(MTR.mtrList().mtrType == "Program"){
                            var data = JSON.stringify({
                                Project: CONFIG.projectName,
                                Action: 'change',
                                id: programId,
                                Data: {
                                    Name: $("#Emtr_name").val(),
                                }
                            });
                            var url = CONFIG.serverRoot + '/backend_mgt/v2/programs/';
                            UTIL.ajax('post', url , data, function (res) {
                                if(res.rescode == '200'){
                                    console.log('修改成功');
                                }else{
                                    alert('修改失败!');
                                    return;
                                }

                            })
                        }
                        MTR.loadPage(MTR.mtrList().pageNum, MTR.mtrList().mtrType);
                        close();
                        alert(languageJSON.al_editSuc);
                    }else{
                        alert(languageJSON.al_editFaild);
                    }
                });
            }
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".resourceTitle").html(languageJSON.resoureEdit);
        $("#lbl_resourceName").html(languageJSON.name + ":");
        $("#Emtr_updata").html(languageJSON.save);
    }

    function loadPage() {
        //关闭窗口
        $(".CA_close").click(function () {
            close();
        });

        var mtrName = $("input[type=checkbox]:checked").parents("tr").find($(".mtr_name")).attr("title");
        if(MTR.mtrList().mtrType == "Program"){
            $("#Emtr_name").val(mtrName);
            return;
        };
        var name = mtrName.substring(0, mtrName.lastIndexOf('.'));
        $("#Emtr_name").val(name);
        $("#Emtr_name").attr("mtrtype", mtrName.substring(mtrName.lastIndexOf('.') + 1));
    }

    /**
     * 关闭窗口
     */
    function close() {
        UTIL.cover.close();
    }

    /**
     * 检测文本框事件
     */
    function inputCheck() {
        var errormsg = "";
        if ($("#Emtr_name").val() == "") {
            errormsg += languageJSON.al_inResourceName + "！\n";
        }
        if (errormsg != "") {
            alert(errormsg);
            return false;
        }else {
        	return true;
        }
    }
})
