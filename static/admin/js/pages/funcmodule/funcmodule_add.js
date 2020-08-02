define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
	var MODULES = require("pages/funcmodule/list.js");


    exports.init = function () {
		$("#ModuleName").val("");
		$("#UrlPath").val("");
        //确定
        $("#func_module_create").click(function () {
        	var mName = $("#ModuleName").val();
			var mUrlPath = $("#UrlPath").val();
            var module = {
                UrlPath: mUrlPath,
				ModuleName: mName			
            }
            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action:'POST',
                Data: module
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v2/functionmodules';
            UTIL.ajax('post', url, data, function(msg){
                if(msg.rescode == 200){
					UTIL.cover.close();   
                	alert("添加功能模块成功");
                }else if(msg.rescode==500){
                	alert("功能模块已存在!");
                }else{
					alert("添加功能模块失败")
					}	
				MODULES.loadFuncModulePage(1);			
            });
        });
		 //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
        });
    }
})
