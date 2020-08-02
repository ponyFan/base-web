define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require('common/templates');
    var nDisplayItems = 10;


    exports.init = function () {
        exports.loadFuncModulePage(1); //加载默认页面
        
        //添加
        $("#funcmodule_add").click(function () {
            //var page = "resources/pages/materials/materials_edit.html"
            //INDEX.coverArea(page);
			UTIL.cover.load('resources/pages/funcmodule/func_module_add.html');
        })
        
        //添加
        /*$("#user_add").click(function () {
			UTIL.cover.load('resources/pages/user/user_add.html');
        })*/
    }

    // 加载页面数据
    exports.loadFuncModulePage = function (pageNum) {
        // loading
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $("#funcModuleTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $("#funcModuleLisTitle").html("");
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        $("#funcModuleLisTitle").html("功能模块列表");
        
        
        var data = JSON.stringify({
        	project_name: CONFIG.projectName,
            action: 'GetPage',
            Pager: {
				"total":-1,
				"per_page":nDisplayItems,
				"page":pageNum,
				"orderby":"",
				"sortby":"desc",
				"keyword":""
   			 }
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/functionmodules';
        UTIL.ajax('post', url, data, render);
    }

    function render(json) {
        //翻页
        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#funcModule-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.Pager.total,
            pageSize: nDisplayItems,
			visiblePages: CONFIG.pager.visiblePages,
			first: CONFIG.pager.first,
		    prev: CONFIG.pager.prev,
			next: CONFIG.pager.next,
			last: CONFIG.pager.last,
            page: CONFIG.pager.page,
            currentPage: Number(json.Pager.page),
            onPageChange: function (num, type) {
                if (type === 'change') {
					exports.loadFuncModulePage(num);
                }
            }
        });
        $("#funcModuleTable tbody").html("");
        //拼接
        if (json.FunctionModules != undefined) {
            var rolData = json.FunctionModules;
			$("#funcModuleTable tbody").append('<tr>'+                              
                                    '<th class="ModuleID">ID</th>'+
                                    '<th class="ModuleName">模块名</th>'+
									//'<th class="UrlPath">模块权限路径</th>'+
									'<th class=""></th>'+
                                '</tr>');
            for (var x = 0; x < rolData.length; x++) {
                var roltr = '<tr UrlPath="' + rolData[x].UrlPath + '"  ModuleID="' + rolData[x].ModuleID + '"  ModuleName = "' + rolData[x].ModuleName + '">' +
                    '<td class="ModuleID">' + rolData[x].ModuleID + '</td>' +
                    '<td class="ModuleName"><a class="module_name">' + rolData[x].ModuleName + '</a></td>' + 
                    //'<td class="UrlPath">' + rolData[x].UrlPath + '</td>' + 
                    '<td><a class="func_module_delete">删除</a></td>' +
                    '</tr>';
                $("#funcModuleTable tbody").append(roltr);
            }
            
            //删除
			$(".func_module_delete").click(function () {
				var self = $(this);
				var currentID = self.parent().parent().attr("ModuleID");
				if (confirm("确定删除该功能模块？")) {
					var data = JSON.stringify({
						project_name: CONFIG.projectName,
						action: 'DELETE'		
					});
					var url = CONFIG.serverRoot + '/backend_mgt/v2/functionmodules/' + currentID;
					UTIL.ajax('post', url, data, function (msg) {
						if(msg.rescode==200){alert("删除成功")}else{alert("删除失败")};
                        exports.loadFuncModulePage(1); //刷新页面
                    });
				}
        	});
            
            //编辑
			$(".module_name").click(function(){
				var self = $(this);
				var mName = self.html();
				var ModuleID = self.parent().parent().attr("ModuleID");
				var UrlPath = self.parent().parent().attr("UrlPath");
				exports.ModuleName = mName;
				exports.ModuleID = ModuleID;
				exports.UrlPath = UrlPath;
				UTIL.cover.load('resources/pages/funcmodule/func_module_edit.html');
				});
        }
    }
})
