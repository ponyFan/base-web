define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
	var MODULES = require("pages/funcmodule/list.js");


    exports.init = function () {
		//加载用户信息
		var ModuleName = MODULES.ModuleName;
		var ModuleID = MODULES.ModuleID;
		var UrlPath = MODULES.UrlPath;
        
		$("#ModuleNameU").val(ModuleName);
		$("#UrlPathU").val(UrlPath);
        //确定
        $("#func_module_update").click(function () {
        	var mModuleName = $("#ModuleNameU").val();
			var mUrlPath = $("#UrlPathU").val();

            var module = {
                UrlPath: mUrlPath,
				ModuleName: mModuleName			
            }
            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action:'PUT',
                Data: module
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v2/functionmodules/'+ModuleID;
            UTIL.ajax('post', url, data, function(msg){
                if(msg.rescode == 200){
					UTIL.cover.close();   
                	alert("修改功能模块成功");
                }else{
					alert("修改功能模块失败")
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
