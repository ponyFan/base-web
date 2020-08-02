// import { Module } from "module";

define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var ROLES = require("pages/user/roles_list.js");
    var getClass = require('pages/terminal/getMultipleTermClass.js');
    var languageJSON = CONFIG.languageJson.user;
    var isAdVersion = false;
    exports.init = function () {
        selectLanguage();
        // checkIsAd();
        getSysInfo();
        var rName = ROLES.roleName;
        var rID = Number(ROLES.roleID);
        var _pageNO = Number(ROLES.pageNum);
        var isNew = true;
        //var loadType = ROLES.loadType;
        var type = ROLES.type;
        var cIDArr = [];
        var cNameArr = [];
        getClass.categoryData = [];
        if (type == "edit") {
            if (rName) {
                $("#role_name").val(rName);
                if (rID == 1) {
                    $("#role_name").attr("disabled", true);
                }
            }
            isNew = false;
            //获取用户审核路径
            getUserReviewTree(rID);
        }
        else {
            $("#role_name").val();
            $("#term").val();
            $(".modal-title").html(languageJSON.addRole);
            rID = NaN;
        }

        //获取角色的终端树
        var term_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'GetRoleTgCategory'
        })
        var term_url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
        UTIL.ajax('post', term_url, term_data, function (msg) {
            if (msg.rescode === '200') {
                var termArr = [];
                for (var x = 0; x < msg.RoleTgCategory.length; x++) {
                    var categoryID = msg.RoleTgCategory[x].TermCategoryID;
                    var categoryName = msg.RoleTgCategory[x].Name;
                    if (categoryName === "null") {
                        categoryName = "";
                    } else if (categoryName == "全部终端" && categoryID == 1) {
                        categoryName = CONFIG.languageJson.termList.allTerm;
                    } else if (categoryName == "未分类终端" && categoryID == 2) {
                        categoryName = CONFIG.languageJson.termList.uncategorizedTerm;
                    }
                    termArr.push(categoryName);

                    getClass.categoryData.push({
                        categoryID: Number(categoryID),
                        name: categoryName
                    })
                }
                var termString = termArr + "";
                $("#term").val(termString);
            } else {
                $("#term").val(languageJSON.failedGetTerminalNodes);
            }
        })
        //获取角色的功能模块及读写权限
        exports.loadModulePage();//加载功能模块默认页面

        

        //确定
        $("#role_updata").click(function () {
            //判断角色名是否为空
            var flag5 = true;
            var roleName = $("#role_name").val();
            if (roleName === "") {
                alert(languageJSON.al_noRoleName + "！");
                $("#role_name").focus();
                return false
            } else {
                //判断角色名是否存在
                var newName = $("#role_name").val();
                if (!UTIL.isValidated('keyword', newName)) return;
                var data1 = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: 'GetByRoleNameCount',
                    RoleName: newName,
                    RoleID: -1
                })
                var url1 = CONFIG.serverRoot + '/backend_mgt/v2/roles';
                UTIL.ajax('post', url1, data1, function (msg) {
                    if (msg.RoleCount !== 0 && newName != rName && type == "edit") {
                        alert(languageJSON.al_RoleNameExist + "！")
                        $("#role_name").focus();
                        return false;
                    } else if (type == "add" && msg.RoleCount !== 0) {
                        alert(languageJSON.al_RoleNameExist + "！");
                        $("#role_name").focus();
                        return false;
                    } else {
                        //角色名可用
                        var name = {
                            RoleName: newName
                        }
                        if (type == "edit") {
                            var data2 = JSON.stringify({
                                project_name: CONFIG.projectName,
                                action: 'Put',
                                Data: name
                            });
                            var url2 = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
                            UTIL.ajax('post', url2, data2, function (msg) {
                                console.log('修改角色名')
                                if (msg.rescode == 200) {
                                    //更新终端权限，模块权限，审核路径
                                    var ajax_data = JSON.stringify({
                                        project_name: CONFIG.projectName,
                                        action: 'updateTreeRoleInfo',
                                        roleID: rID,
                                        categoryList: getClass.categoryData
                                    })
                                    var url = CONFIG.serverRoot + '/backend_mgt/v2/termcategory';
                                    UTIL.ajax('post', url, ajax_data, function (msg) {
                                        console.log('更新终端树')
                                        if (msg.rescode == 200) {
                                            UTIL.cover.close(2);
                                        }
                                    })
                                    var module = $('.module');
                                    var FunctionModules = [];
                                    for (var i = 0; i < module.length; i++) {
                                        var cheDiv = module.eq(i).parent();
                                        var flag = cheDiv.hasClass("checked");
                                        var module_id = module.eq(i).attr("moduleID");
                                        if (flag) {
                                            var auth = 1;
                                        }
                                        else {
                                            var auth = 0;
                                        }
                                        var obj = {ModuleID: module_id, ReadWriteAuth: auth};
                                        FunctionModules.push(obj);
                                    };
        
                                    var data_new = JSON.stringify({
                                        project_name: CONFIG.projectName,
                                        action: 'update_authority',
                                        authorities: getChecked()
                                    });
                                    var url_new = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
                                    UTIL.ajax('post', url_new, data_new, function (msg) {
                                        console.log('更新模块权限')
                                        if (msg.rescode == 200) {
        
                                        }
                                    });
                                    if(isAdVersion){
                                        //更新用户审核路径
                                        updateUserReviewTree(rID);
                                    }
                                    alert(languageJSON.editSuc + "！")
                                    UTIL.cover.close();
                                    ROLES.loadRolesPage(_pageNO);
                                }
                            });
                        } else {
                            //创建新角色
                            var data = JSON.stringify({
                                project_name: CONFIG.projectName,
                                action: 'Post',
                                Data: name
                            });
                            var url = CONFIG.serverRoot + '/backend_mgt/v2/roles';
                            UTIL.ajax('post', url, data, function (msg) {
                                if (msg.rescode == 200) {
                                    rID = Number(msg.RoleID);
                                    var data2 = JSON.stringify({
                                        project_name: CONFIG.projectName,
                                        action: 'Put',
                                        Data: name
                                    });
                                    var url2 = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
                                    UTIL.ajax('post', url2, data2, function (msg) {
                                        if (msg.rescode == 200) {
                                            var ajax_data = JSON.stringify({
                                                project_name: CONFIG.projectName,
                                                action: 'updateTreeRoleInfo',
                                                roleID: rID,
                                                categoryList: getClass.categoryData
                                            })
                                            var url = CONFIG.serverRoot + '/backend_mgt/v2/termcategory';
                                            UTIL.ajax('post', url, ajax_data, function (msg) {
                                                if (msg.rescode == 200) {
                                                    UTIL.cover.close(2);
                                                }
                                            })
                                            var module = $('.module');
                                            var FunctionModules = [];
                                            for (var i = 0; i < module.length; i++) {
                                                var cheDiv = module.eq(i).parent();
                                                var flag = cheDiv.hasClass("checked");
                                                var module_id = module.eq(i).attr("moduleID");
                                                if (flag) {
                                                    var auth = 1;
                                                }else {
                                                    var auth = 0;
                                                }
                                                var obj = {ModuleID: module_id, ReadWriteAuth: auth};
                                                FunctionModules.push(obj);
                                            };
                                            var data_new = JSON.stringify({
                                                project_name: CONFIG.projectName,
                                                action: 'update_authority',
                                                authorities: getChecked()
                                            });
                                            var url_new = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
                                            UTIL.ajax('post', url_new, data_new, function (msg) {
                                                if (msg.rescode == 200) {
                
                                                }
                                            });
                                            if(isAdVersion){
                                                //更新用户审核路径
                                                updateUserReviewTree(rID);
                                            }
                                            alert(languageJSON.addSuc + "！");
                                            UTIL.cover.close();
                                            ROLES.loadRolesPage(1);
                                        }
                                    })
                                }
                            });
                        }
                    }
                })
            }
        })
        //终端分类选择
        $("#term_list").click(function () {
            rID ? rID : rID = "";
            getClass.title = languageJSON.pleaseSelect;
            getClass.roleID = rID;
            getClass.save = function (data) {
                cIDArr = [];
                cNameArr = [];
                for (var i = 0; i < data.length; i++) {
                    cIDArr.push(data[i].categoryID);
                    cNameArr.push(data[i].name);
                    // cNameArr.push(data[i].nodeContent);
                    // delete data[i].nodeContent;
                }
                getClass.categoryData = data;
                var cNameStr = cNameArr.join();
                $("#term").val(cNameStr);
                UTIL.cover.close(2);
            }
            getClass.close = function () {
                UTIL.cover.close(2);
            }
            UTIL.cover.load('resources/pages/terminal/getMultipleTermClass.html', 2);
        })

        //关闭窗口
        $(".CA_close").click(function () {
            ROLES.roleID = NaN;
            UTIL.cover.close();
            ROLES.loadRolesPage(_pageNO); //刷新页面
        });

        //添加审核组
        $('.reviewList').on('change', function(){
            $('.addReviewList').append('<div listid="'+$(this.selectedOptions[0]).attr('listid')+'" class="reviewListName">'+$(this).val()+'<i class="fa fa-trash"></i></div><i class="fa fa-arrow-down"></i>');
            $(this).val('default');
            $('.reviewListName i').on('click', function(){
                $(this).parent().next('i').remove();
                $(this).parent().remove();
            })
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".modal-title").html(languageJSON.editRole);
        $("#lbl_role").html(languageJSON.roleName);
        $("#lbl_termPermission").html(languageJSON.termPermission);
        $("#lbl_funcPermission").html(languageJSON.funcPermission);
        $("#lbl_modulePermission").html(languageJSON.modulePermission);
        $("#term_list").html(languageJSON.select);
        $("#role_updata").html(languageJSON.submit);
    }

    exports.loadModulePage = function () {
        var rID = Number(ROLES.roleID);
        var type = ROLES.type;
        if (type == "add") {
            rID = NaN;
        }
        Vue.filter('isAllChecked',function(items){
            let list = items.authorities
            let flag = true
            for(let i=0;i<list.length;i++){
                if(!list[i].Selected){
                    flag = false
                }
            }
            return flag
        })
        var app  = new Vue({
            el: '#powerTable',
            data:{
                powerList:[]
                // checkedIDs:[]
            },
            methods:{
                isAllChecked:function(items){
                    let list = items.authorities
                    let flag = true
                    for(let i=0;i<list.length;i++){
                        if(!list[i].Selected){
                            flag = false
                        }
                    }
                   return flag
                },
                checkedAll:function(items){
                    let list = items.authorities
                    let flag = this.isAllChecked(items)
                    //已经全选
                    if(flag == true){
                        for(let i=0;i<list.length;i++){
                            list[i].Selected =false
                        }
                    }else{
                        for(let i=0;i<list.length;i++){
                            list[i].Selected =true
                        }
                    }
                },
                getChecked:function(){
                    let list = this.powerList
                    let checkedList = []
                    for(let i=0;i<list.length;i++){
                        //菜单ID
                        if(list[i].selected == 1){
                            checkedList.push(list[i].id)
                        }
                        //权限ID
                        for(let j=0;j<list[i].authorities.length;j++){
                            if(list[i].authorities[j].Selected == 1){
                                checkedList.push(list[i].authorities[j].ID)
                            }
                        }
                    }
                    return checkedList
                }
            },
            mounted:function(){
                window.getChecked = this.getChecked
            }
        })
        $("#moduleTable tbody").html("");
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        var authArr = [];
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'GetRoleModule'
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
        UTIL.ajax('post', url, data, function (redata) {
            //拼接
            if (redata.RoleModules != undefined) {
                var rolData = redata.RoleModules;
                for (var i = 0; i < rolData.length; i++) {
                    var auth = rolData[i].ReadWriteAuth;
                    var ModuleID = rolData[i].ModuleID;
                    var ModuleName = rolData[i].ModuleName;
                    if (auth == 1) {
                        authArr.push(ModuleID);
                    }
                }
            }
            // var data1 = JSON.stringify({
            //     "project_name": CONFIG.projectName,
            //     "action": "GetPage",
            //     "Pager": {
            //         "total": -1,
            //         "per_page": 100,
            //         "page": 1,
            //         "orderby": "",
            //         "sortby": "desc",
            //         "keyword": ""
            //     }
            // })
            // var url1 = CONFIG.serverRoot + '/backend_mgt/v2/functionmodules';
            // UTIL.ajax('post', url1, data1, function (data) {
            //     if (data.FunctionModules != undefined) {
            //         var rolData = data.FunctionModules;
            //         for (var i = 0; i < rolData.length; i++) {
            //             var auth = rolData[i].ReadWriteAuth;
            //             var ModuleID = rolData[i].ModuleID;
            //             var ModuleName = rolData[i].ModuleName;
            //             var menuJSON = CONFIG.languageJson.index.menu
            //             switch (ModuleID) {
            //                 case 1:
            //                     ModuleName = menuJSON.console;
            //                     break;
            //                 case 2:
            //                     ModuleName = menuJSON.channelList;
            //                     break;
            //                 case 3:
            //                     ModuleName = menuJSON.resourceList;
            //                     break;
            //                 case 5:
            //                     ModuleName = menuJSON.layoutList;
            //                     break;
            //                 case 6:
            //                     ModuleName = menuJSON.administratorTools;
            //                     break;
            //                 case 7:
            //                     ModuleName = menuJSON.audit;
            //                     break;
            //                 default:
            //                     break;
            //             }
            //             var flag1 = false;
            //             // console.log(authArr)
            //             for (var y = 0; y < authArr.length; y++) {
            //                 if (ModuleID == authArr[y]) {
            //                     flag1 = true
            //                 };
            //             }
            //             if (flag1) {
            //                 if(!isAdVersion){
            //                     if(ModuleID == 11 || ModuleID == 12) continue
            //                 }
            //                 var roltr = '<tr moduleID="' + ModuleID + '">' +
            //                     '<td class="module_checkbox"><input checked="checked" class="module" type="checkbox" moduleID="' + ModuleID + '"   moduleName="' + ModuleName + '"></td>' +
            //                     '<td class="module_name">' + ModuleName + '</td>' +
            //                     //'<td class="module_id">ID：' + ModuleID + '</td>' +
            //                     '</tr>';
            //                 $("#moduleTable tbody").append(roltr);

            //             } else {
            //                 var roltr = '<tr moduleID="' + ModuleID + '">' +
            //                     '<td class="module_checkbox"><input class="module" type="checkbox" moduleID="' + ModuleID + '"   moduleName="' + ModuleName + '"></td>' +
            //                     '<td class="module_name">' + ModuleName + '</td>' +
            //                     // '<td class="module_id">ID：' + ModuleID + '</td>' +
            //                     '</tr>';
            //                 $("#moduleTable tbody").append(roltr);

            //             }
            //         }
            //     }
            //     //复选框样式
            //     $('.mailbox-messages input[type="checkbox"]').iCheck({
            //         checkboxClass: 'icheckbox_flat-blue',
            //         radioClass: 'iradio_flat-blue'
            //     });
            //     //根据审核开关状态隐藏/显示审核权限列
            //     //hasCheckList();
            // })
            
            //权限列表
            if(!isNaN(rID)){
                var url_new = CONFIG.serverRoot + '/backend_mgt/v2/roles/'+rID;
            }else{
                var url_new = CONFIG.serverRoot + '/backend_mgt/v2/roles/query_authority';
            }
            var data_new = JSON.stringify({
                "project_name": CONFIG.projectName,
                "action": "query_authority",
            })
            
            UTIL.ajax('post', url_new, data_new, function (redata) {
                if(redata.authorities){
                    app.powerList = redata.authorities
                }
            })
        });
    }

    function hasCheckList() {
        var checkTr = $('#moduleTable tr[moduleid="7"]'); //moduleid = 7 审核权限
        if (UTIL.getLocalParameter('config_checkSwitch') == '0') {
            checkTr.hide();
        } else {
            return;
        }
    }

    function getReviewLists(){
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'query'
        })
        var url = CONFIG.serverRoot + '/backend_mgt/audit_group';
        UTIL.ajax('post', url, data, function (msg) {
            if(msg.rescode == '200'){
                var groups = msg.groups;
                var _option = '';
                for(var i = 0; i< groups.length;i++){
                    _option += '<option listid="'+groups[i].id+'" value="'+groups[i].name+'">'+groups[i].name+'</option>';
                }
                $('.reviewList').append(_option);
            }
        })
    }

    function getUserReviewTree(userid){
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'get_audit_path'
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + userid;
        UTIL.ajax('post', url, data, function(msg){
            if(msg.rescode == '200'){
                var reviewTree = msg.audit_groups;
                if(!reviewTree) return;
                var _reviewList = '';
                for(var i = 0; i< reviewTree.length; i++){
                    _reviewList += '<div listid="'+reviewTree[i].ID+'" class="reviewListName">'+reviewTree[i].Name+'<i class="fa fa-trash"></i></div><i class="fa fa-arrow-down"></i>'
                }
                $('.addReviewList').append(_reviewList);
                $('.reviewListName i').on('click', function(){
                    $(this).parent().next('i').remove();
                    $(this).parent().remove();
                })
            }
        })
    }

    function updateUserReviewTree(userid){
        var listIDs = [];
        $('.addReviewList').children('.reviewListName').each(function(i,v){
            return listIDs.push(+$(v).attr('listid'));
        })

        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'update_audit_path',
            audit_groups: listIDs
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + userid;
        UTIL.ajax('post', url, data, function(msg){
            console.log('更新用户审核路径');
            if(msg.rescode = '200'){
                
            }
        })
    }

    function checkIsAd(){
        var data = JSON.stringify({
            Project: CONFIG.projectName,
            project_name: CONFIG.projectName,
            Action: 'get_function'
        })
        var url = CONFIG.serverRoot + '/backend_mgt/v1/projects';
        UTIL.ajax('post', url, data, function (json) {
            if(json.rescode == '200'){
                isAdVersion = json.function.advertisement;
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
                $('#lbl_funcReview').show()
                $('.reviewFlow').show()
                //获取审核组
                getReviewLists();
            }else{
                isAdVersion = false
            }
        })
    }
})
