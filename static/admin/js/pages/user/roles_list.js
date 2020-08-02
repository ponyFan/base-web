define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require('common/templates');
    var nDisplayItems ;
    var _pageNO = 1;
    var isAdVersion = false;
    //缓存分配用户数组
    var userListArr = [];
    var languageJSON = CONFIG.languageJson.user;

    exports.init = function () {
        selectLanguage();
        getSysInfo();
        exports.loadRolesPage(1); //加载默认页面
        //添加
        $("#roles_add").click(function () {
            exports.type = "add";
            UTIL.cover.load('resources/pages/user/roles_edit.html');
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#roleTitle").html(languageJSON.rolePermission);
        $("#roles_add").html(languageJSON.createRole);
    }

    exports.loadRolesPage = function () {
        loadRolesPage(_pageNO);
    };
    // 加载页面数据
    exports.loadRolesPage = function (pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        _pageNO = pageNum;
        // loading
        $("#rolesTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $("#rolesLisTitle").html("");
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        $("#rolesLisTitle").html(languageJSON.allRole);
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'GetPage',
            Pager: {
                "total": -1,
                "per_page": nDisplayItems,
                "page": pageNum,
                "orderby": "",
                "sortby": "desc",
                "keyword": ""
            }
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/roles';
        UTIL.ajax('post', url, data, render);


    }

    function render(json) {
        $("#rolesTable tbody").html('');
        //翻页
        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#roles-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.Pager.total,
            pageSize: nDisplayItems,
            visiblePages: CONFIG.pager.visiblePages,
            first: CONFIG.pager.first,
            prev: CONFIG.pager.prev,
            next: CONFIG.pager.next,
            last: CONFIG.pager.last,
            page: CONFIG.pager.page,
            currentPage: _pageNO,
            onPageChange: function (num, type) {
                if (type === 'change') {
                    _pageNO = num;
                    exports.loadRolesPage(_pageNO);
                }
            }
        });
        //拼接
        if (json.Roles != undefined) {
            var rolData = json.Roles;
            $("#rolesTable tbody").append('<tr>' +
                '<th class="roles_name" style="width:150px;">' + languageJSON.roleName + '</th>' +
                '<th class="users">' + languageJSON.user + '</th>' +
                '<th class="" style="width:150px;text-align:center;">'+languageJSON.operation+'</th>' +
                '</tr>');
            for (var x = 0; x < rolData.length; x++) {
                //var stringArry;
                var rID = rolData[x].RoleID;
                var users = rolData[x].Users;
                userListArr[x] = users;

                var roleName = rolData[x].RoleName;
                if (rID == 1) {
                    roleName = languageJSON.administrator;
                }
//				var data = JSON.stringify({
//					project_name: 'newui_dev',
//					action: 'GetUsers',
//					Pager: {
//						"total":-1,
//						"per_page":10,
//						"page":1,
//						"orderby":"",
//						"sortby":"desc",
//						"keyword":""
//					 }
//				});
                //var url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
//				UTIL.ajax('post', url, data, function(cbdata){
//					var nameArry = [];
//					var users = cbdata.Users;		
//					for(var i=0;i<users.length;i++){
//						nameArry[i] = users[i].USERNAME;
//						}	
//					stringArry = nameArry.join();	
//					//alert(stringArry);				
//					});

                //alert(stringArry);
                if (users === "") {
                    var users1 = languageJSON.clickAssign
                } else {
                    var uArray = users.split(",");
                    var users1 = "";
                    for (var n = 0; n < uArray.length; n++) {
                        var uString = '<i class="fa fa-user"></i>' + uArray[n] + '&nbsp;';
                        users1 = users1 + uString;
                    }
                }
                // 超级管理员-不可编辑权限
                var roltr = ''
                if(rID !== 1){
                    var deleteTd = '<a class="roles_delete"><button type="button" class="btn btn-default btn-xs"><i class="glyphicon glyphicon-trash user-delete"></i></button></a>'
                    roltr = '<tr class="rol-row" num="' + x + '" rolesID="' + rolData[x].RoleID + '" rolesName="' + roleName + '">' +
                            '<td class="roles_name" style="width:30%"><a class="role_name">' + roleName + '</a></td>' +
                            // '<td class="roles_id">ID：' + rolData[x].RoleID + '</td>' +
                            '<td class="users"><a class="roles_assign" title="' + languageJSON.assignUser + '"  style="width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + users1 + '</a></td>' +
                            '<td style="text-align:Center;"><a class="copy_edit"><button type="button" class="btn btn-default btn-xs">' + languageJSON.copyRole + '</button></a> ' + deleteTd + '</td>' +
                            '</tr>';
                } else {
                    roltr = '<tr class="rol-row" num="' + x + '" rolesID="' + rolData[x].RoleID + '" rolesName="' + roleName + '">' +
                            '<td class="roles_name" style="width:30%">' + roleName + '</td>' +
                            // '<td class="roles_id">ID：' + rolData[x].RoleID + '</td>' +
                            '<td class="users">' + users1 + '</td>' +
                            '<td style="text-align:Center;"></td>' +
                            '</tr>';
                }
                
                $("#rolesTable tbody").append(roltr);
            }
            //复制
            $(".copy_edit").click(function () {
                var self = $(this);
                var currentID = self.parent().parent().attr("rolesID");
                var currentName = self.parent().parent().find('a.role_name').text();
                copyRole(currentID,currentName)
            })
            //删除
            $(".roles_delete").click(function () {
                var self = $(this);
                var currentID = self.parent().parent().attr("rolesID");
                if (confirm(languageJSON.cf_delRole + "？")) {
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: 'Delete'
                    });
                    var url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + currentID;
                    UTIL.ajax('post', url, data, function (msg) {
                        if (msg.rescode == 200) {
                            alert(languageJSON.al_delSuc)
                        } else {
                            alert(languageJSON.al_delFaild)
                        }
                        ;
                        exports.loadRolesPage(_pageNO); //刷新页面
                    });
                }
            });
            exports.pageNum = _pageNO;
            //编辑
            $(".role_name").click(function () {
                var self = $(this);
                exports.type = "edit";
                var rName = self.html();
                var currentID = self.parent().parent().attr("rolesID");
                exports.roleName = rName;
                exports.roleID = currentID;
                //exports.loadType = "editRole";
                UTIL.cover.load('resources/pages/user/roles_edit.html');
            });
            //分配用户
            $(".roles_assign").click(function () {
                var self = $(this);
                var number = self.parent().parent().attr("num");
                userList = userListArr[number];
                exports.uList = userList;
                var rName = self.parent().parent().attr("rolesName");
                exports.roleName = rName;
                var currentID = self.parent().parent().attr("rolesID");
                exports.roleID = currentID;
                UTIL.cover.load('resources/pages/user/roles_assign.html');
            });
        }
    }
    function copyRole(copyID, name){
        //  查询角色名是否可用
        var data1 = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'GetByRoleNameCount',
            RoleName: name+'-复制',
            RoleID: -1
        })
        var url1 = CONFIG.serverRoot + '/backend_mgt/v2/roles';
        UTIL.ajax('post', url1, data1, function (msg) {
            if (msg.RoleCount !== 0) {
                alert(languageJSON.al_RoleNameExist + "！");
                return false;
            }else{
                //  角色名可用
                //  创建角色-获取新建角色ID
                var data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: 'Post',
                    Data: {"RoleName":name+'-复制'}
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v2/roles';
                UTIL.ajax('post', url, data, function (msg) {
                    if (msg.rescode == 200) {
                        rID = Number(msg.RoleID);
                        //  复制终端权限
                        copyTerminal(rID,copyID)
                        //  复制模块权限
                        copyModule(rID,copyID)
                        //  复制审核路径
                        if(isAdVersion){
                            copyAuditPath(rID,copyID)
                        }
                        alert('角色复制成功')
                        _pageNO = 1
                        exports.loadRolesPage(_pageNO);
                    }
                })

            }
        })
    }
    //  复制终端权限
    function copyTerminal(rID,copyID){
        var ajax_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'updateTreeRoleInfo',
            roleID: rID,
            refer_role_id: copyID
        })
        var url = CONFIG.serverRoot + '/backend_mgt/v2/termcategory';
        UTIL.ajax('post', url, ajax_data, function (msg) {
            if (msg.rescode != 200) {
                console.log('复制终端权限失败')
            }
        })
    }
    //  复制模块权限
    function copyModule(rID,copyID){
        var data_new = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'update_authority',
            refer_role_id: copyID
        });
        var url_new = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
        UTIL.ajax('post', url_new, data_new, function (msg) {
            if (msg.rescode != 200) {
                console.log('复制模块权限失败')
            }
        });
    }
    //  复制审核路径
    function copyAuditPath(rID,copyID){
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'update_audit_path',
            refer_role_id: copyID
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
        UTIL.ajax('post', url, data, function(msg){
            console.log('更新用户审核路径');
            if(msg.rescode != '200'){
                console.log('复制审核路径失败')
            }
        })
    }
    //获取系统版本
    function getSysInfo(){
        var data = JSON.stringify({
            action: 'get_ims_version',
            project_name: CONFIG.projectName
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/sysinfo';
        UTIL.ajax('post', url, data, function (json) {
            //  base_XXX        普通版
            //  adv_XXX         广告版
            var version = json.split('_');
            if(version[0] === 'adv'){
                isAdVersion = true
            }else{
                isAdVersion = false
            }
        })
    }
})
