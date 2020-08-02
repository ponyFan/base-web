define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var ROLES = require("pages/user/roles_list.js");
    var templates = require('common/templates');
    var nDisplayItems;
    //缓存数组
    var checkedArr = [];
    var uncheckedArr = [];
    var languageJSON = CONFIG.languageJson.user;

    exports.init = function () {
        selectLanguage();
        var _pageNO = Number(ROLES.pageNum);
        exports.loadUserPage(1); //加载默认页面
        //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
        });
        var rName = ROLES.roleName;
        var rID = Number(ROLES.roleID);
        //确定
        $("#users_updata").click(function () {
            var suc = true;
            var checked = $('.assign');
            for (var i = 0; i < checked.length; i++) {
                var cheDiv = checked.eq(i).parent();
                var flag = cheDiv.hasClass("checked");
                if (flag) {
                    var checked_id = checked.eq(i).attr("userID");
                    //var checked_name = checked.eq(i).attr("userName");
                    checkedArr.push(checked_id);
                }
            }
            for (var i = 0; i < checkedArr.length; i++) {
                var checked_id1 = checkedArr[i];
                if (checked_id1) {
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: 'UpdateUserRole',
                        Data: {
                            "RoleID": rID
                        }
                    });
                    var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails/' + checked_id1;
                    UTIL.ajax('post', url, data, function (msg) {
                        if (msg.rescode == 200) {
                        } else {
                            suc = false;
                        }
                        ;
                    });
                }
                else {
                }

            }
            var unchecked = $('.disassign');
            for (var j = 0; j < unchecked.length; j++) {
                var uncheDiv = unchecked.eq(j).parent();
                var flagg = uncheDiv.hasClass("checked");
                if (!flagg) {
                    var unchecked_id = unchecked.eq(j).attr("userID");
                    //var checked_name = checked.eq(i).attr("userName");
                    uncheckedArr.push(unchecked_id);
                }

            }
            for (var k = 0; k < uncheckedArr.length; k++) {
                var unchecked_id1 = uncheckedArr[k];
                if (unchecked_id1) {
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: 'UpdateUserRole',
                        Data: {
                            "RoleID": -1
                        }
                    });
                    var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails/' + unchecked_id1;
                    UTIL.ajax('post', url, data, function (msg) {
                        if (msg.rescode == 200) {
                        } else {
                            suc = false;
                        }
                        ;
                    });
                }
                else {
                }

            }
            if (suc) {
                alert(languageJSON.al_assignSuc)
            } else {
                alert(languageJSON.al_assignFaild)
            }
            checkedArr = [];
            uncheckedArr = [];
            ROLES.loadRolesPage(_pageNO);
            UTIL.cover.close();
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".modal-title").html(languageJSON.assignUser);
        $("#users_updata").html(languageJSON.submit);
    }

    /**
     * 加载页面数据
     * @param pageNum
     */
    exports.loadUserPage = function (pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        var pageNum = pageNum;
        $("#usersTable tbody").html("");
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'GetUsersAll',
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
        //翻页
        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#users-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.Pager.total,
            pageSize: nDisplayItems,
            visiblePages: CONFIG.pager.visiblePages,
            // first: CONFIG.pager.first,
            prev: CONFIG.pager.prev,
            next: CONFIG.pager.next,
            // last: CONFIG.pager.last,
            page: CONFIG.pager.page,
            currentPage: Number(json.Pager.page),
            onPageChange: function (num, type) {
                if (type === 'change') {
                    var checked = $('.assign');
                    for (var i = 0; i < checked.length; i++) {
                        var cheDiv = checked.eq(i).parent();
                        var flag = cheDiv.hasClass("checked");
                        if (flag) {
                            var checked_id = checked.eq(i).attr("userID");
                            //var checked_name = checked.eq(i).attr("userName");
                            checkedArr.push(checked_id);
                        }
                    }
                    var unchecked = $('.disassign');
                    for (var j = 0; j < unchecked.length; j++) {
                        var uncheDiv = unchecked.eq(j).parent();
                        var flag3 = uncheDiv.hasClass("checked");
                        if (!flag3) {
                            var unchecked_id = unchecked.eq(j).attr("userID");
                            //var checked_name = checked.eq(i).attr("userName");
                            uncheckedArr.push(unchecked_id);
                        }
                    }
                    exports.loadUserPage(num);
                }
            }
        });
        //拼接
        if (json.Users != undefined) {
            var rolData = json.Users;
            $("#usersTable tbody").append('<tr>' +
                '<th class="col-md-1"></th>' +
                '<th class="users_name">' + languageJSON.username + '</th>' +
                // '<th class="users_ID">用户ID</th>'+
                '</tr>');
            //获取当前角色已绑定的用户
            var userList = [];
            var rID = Number(ROLES.roleID);
            var udata = JSON.stringify({
                project_name: CONFIG.projectName,
                action: 'GetUsers',
                Pager: {
                    "total": -1,
                    "per_page": 999,
                    "page": 1,
                    "orderby": "",
                    "sortby": "desc",
                    "keyword": ""
                }
            })
            var uurl = CONFIG.serverRoot + '/backend_mgt/v2/roles/' + rID;
            UTIL.ajax('post', uurl, udata, function (msg) {
                if (msg.Users != undefined) {
                    for (var n = 0; n < msg.Users.length; n++) {
                        var uname = msg.Users[n].USERNAME;
                        userList.push(uname);
                    }
                }
                //console.log(userList)
                for (var i = 0; i < rolData.length; i++) {
                    var userName = rolData[i].USERNAME;
                    var userID = rolData[i].ID;
                    var hasUser = false;
                    for (var x = 0; x < userList.length; x++) {
                        if (userList[x] == userName) {
                            hasUser = true;
                            break;
                        }
                    }
                    for (var l = 0; l < checkedArr.length; l++) {
                        if (checkedArr[l] == userID) {
                            hasUser = true;
                            break;
                        }
                    }
                    for (var m = 0; m < uncheckedArr.length; m++) {
                        if (uncheckedArr[m] == userID) {
                            hasUser = false;
                            break;
                        }
                    }
                    if (userID === 1) {
                        var roltr = '<tr userID="' + userID + '">' +
                            '<td class="user_checkbox"><input disabled="disabled" class="disassign" type="checkbox" checked="checked" userID="' + userID + '"></td>' +
                            '<td class="user_name">' + userName + '</td>' +
                            // '<td class="user_id">ID：' + userID + '</td>' +
                            '</tr>';
                        $("#usersTable tbody").append(roltr);
                    }
                    else if (hasUser == true) {
                        var roltr = '<tr userID="' + userID + '">' +
                            '<td class="user_checkbox"><input class="disassign" type="checkbox" checked="checked" userID="' + userID + '"></td>' +
                            '<td class="user_name">' + userName + '</td>' +
                            //  '<td class="user_id">ID：' + userID + '</td>' +
                            '</tr>';
                        $("#usersTable tbody").append(roltr);
                    } else {
                        var roltr = '<tr userID="' + userID + '">' +
                            '<td class="user_checkbox"><input class="assign" type="checkbox" userID="' + userID + '" userName="' + userName + '"></td>' +
                            '<td class="user_name">' + userName + '</td>' +
                            //  '<td class="user_id">ID：' + userID + '</td>' +
                            '</tr>';
                        $("#usersTable tbody").append(roltr);
                    }
                }
                //复选框样式
                $('.mailbox-messages input[type="checkbox"]').iCheck({
                    checkboxClass: 'icheckbox_flat-blue',
                    radioClass: 'iradio_flat-blue'
                });
            });
        }

    }
})
