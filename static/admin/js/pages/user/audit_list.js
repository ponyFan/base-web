define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require('common/templates');

    //缓存分配用户数组
    var userListArr = [];
    var isSelected = [];//  已选中用户
    var nDisplayItems = 7;
    var _pageNum = 1;
    var SUSERS = [], userJson = [], rolData = [];
    var _URL = '/backend_mgt/audit_group';
    var languageJSON = CONFIG.languageJson.user;

    exports.init = function () {
        SUSERS = [], userJson = [], _pageNum = 1;
        var thisTr = null;
        selectLanguage();
        exports.loadAuditPage(); //加载默认页面
        //添加
        $("#audit_add").click(function () {
            addAudit()
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {

    }

    exports.loadAuditPage = function () {
        loadAuditPage();
    };
    // 加载页面数据
    exports.loadAuditPage = function () {
        // loading
        $("#auditTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "query"
        });
        
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                var rolData = res.groups;
                $("#auditTable tbody").html('');
                $("#auditTable tbody").append('<tr>' +
                  '<th class="audit_name" style="width:150px;">审核组名</th>' +
                  '<th class="users">成员</th>' +
                  '<th class="" style="width:50px;text-align:center;">操作</th>' +
                  '</tr>');
                for (var x = 0; x < rolData.length; x++) {
                    var auditID = rolData[x].id;
                    var users = rolData[x].members;
                    userListArr[x] = users;

                    var roleName = rolData[x].name;

                    if (users.length == 0) {
                        var users1 = languageJSON.clickAssign
                    } else {
                        var uArray = users;
                        var users1 = "";
                        for (var n = 0; n < uArray.length; n++) {
                            if(uArray[n].USERNAME){
                                var uString = '<i class="fa fa-user"></i>' + uArray[n].USERNAME + '&nbsp;';
                                users1 = users1 + uString;
                            }
                        }
                    }
                    var deleteTd = ''
                    if (auditID !== 1) {
                        deleteTd = '<a class="roles_delete"><i class="glyphicon glyphicon-trash user-delete"></i></a>'
                    }
                    var roltr = '<tr class="rol-row" num="' + x + '" rolesID="' + rolData[x].id + '" rolesName="' + roleName + '">' +
                        '<td class="roles_name" style="width:30%"><a class="role_name">' + roleName + '</a></td>' +
                        // '<td class="roles_id">ID：' + rolData[x].id + '</td>' +
                        '<td class="users"><div class="roles_assign" title="' + languageJSON.assignUser + '"  style="max-width:500px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;color:#3c8dbc;">' + users1 + '</div></td>' +
                        '<td style="text-align:center;">' + deleteTd + '</td>' +
                        '</tr>';
                    $("#auditTable tbody").append(roltr);
                }
                bindEvent();
            }
        })


    }

    function bindEvent(){
        $(".roles_delete").click(function () {
            var self = $(this);
            var currentID = self.parent().parent().attr("rolesID");
            if (confirm('确认删除该审核组？')) {
                if(confirm('删除该审核管理组可能会影响到正常的审核流程，是否继续删除？')){
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: "delete",
                        ids: [currentID]
                    });
                    var url = CONFIG.serverRoot + _URL;
                    UTIL.ajax('post', url, data, function (msg) {
                        if (msg.rescode == 200) {
                            alert(languageJSON.al_delSuc)
                        } else {
                            alert(languageJSON.al_delFaild)
                        }
                        ;
                        exports.loadAuditPage(); //刷新页面
                    });
                }
            }
        });
        //编辑
        $(".role_name").click(function () {
            var self = $(this);
            var currentID = self.parent().parent().attr("rolesID");
            UTIL.cover.load('resources/pages/user/audit_edit.html');
            exports.groupID = currentID
            exports.groupName = self.text()
        });
        //分配用户
        $(".roles_assign").click(function () {
            thisTr = $(this).parents('tr');
            isSelected = []
            $.each(userListArr[thisTr.attr('num')],function(i,n){
                if(n.ID && (n.ID !='None')) isSelected.push( n.ID )
            })
            console.log('已选中用户：'+isSelected)
            
            UTIL.cover.load('resources/pages/user/all_user.html');
            SUSERS = [];
            setTimeout(function(){
                loadUserList(1);
            },100)
        });
    }

    function addAudit() {
        UTIL.cover.load('resources/pages/user/audit_edit.html');


    }

    function loadUserList(pageNum){
        var pageNum = pageNum;
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
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
        var number = thisTr.attr('num');
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
                    var ids = [];
                    $("#usersTable input[type='checkbox']:checked").map(function (index, el) {
                        ids.push(el.value);
                        $.each(json.Users, function (ind, el2) {
                            if (el2.ID == Number(el.value)) {
                                userJson.push(el2);
                                return false;
                            }
                        })
                    })
                    SUSERS[_pageNum] = ids;
                    _pageNum = num;
                    loadUserList(_pageNum);
                }
            }
        });
        if (json.Users != undefined) {
            rolData = json.Users;
            $("#usersTable thead").html('').append('<tr>' +
                '<th class="col-md-1"></th>' +
                '<th class="users_name">' + languageJSON.username + '</th>' +
                '</tr>');
            // console.log('当前页面用户：')
            // console.log(rolData)
            // console.log('已选中用户：')
            // console.log(userListArr[number])
            // console.log('操作勾选用户：')
            // console.log(SUSERS)
            for(var x=0;x<rolData.length;x++){
                var checked = '', assign = 'assign';
                var isDuplicated = userListArr[number].filter(function(v){
                    return v.ID == rolData[x].ID
                })
                if(isDuplicated.length){
                    checked="checked";
                    assign = 'disassign';
                } 
                var roltr = '<tr userID="' + rolData[x].ID + '">' +
                    '<td class="user_checkbox"><input class="'+ assign +'" '+checked+' type="checkbox" value="'+rolData[x].ID+'" userID="' +rolData[x].ID + '" userName="' + rolData[x].USERNAME + '"></td>' +
                    '<td class="user_name">' + rolData[x].USERNAME + '</td>' +
                    '</tr>';
                $("#usersTable tbody").append(roltr);
            }

            // if (SUSERS != {}) {
            //     $("#usersTable input[type='checkbox']").each(function (ind1, el1) {
            //         if (SUSERS[_pageNum] != undefined) {
            //             $.each(SUSERS[_pageNum], function (ind2, el2) {
            //                 if (Number(el1.value) == Number(el2)) {
            //                     el1.checked = true;
            //                     return false;
            //                 }
            //             })
            //         }
            //     })
            // }
            $('.mailbox-messages input[type="checkbox"]').iCheck({
                checkboxClass: 'icheckbox_flat-blue',
                radioClass: 'iradio_flat-blue'
            });
            $('#usersTable input').on('ifChecked', function(event){
                //  选中-添加ID到isSelected
                isSelected.push(event.currentTarget.value) 
                console.log('选中用户：'+isSelected)
            });
            $('#usersTable input').on('ifUnchecked', function(event){
                //  取消选中-消除ID到isSelected
                $.each(isSelected,function(i,n){
                    if(n == event.currentTarget.value) isSelected.splice(i, 1)
                })
                console.log('选中用户：'+isSelected)
            });
        }

        

        $('#users_save').off('click').on('click', function(){
            //  删除原用户,删除成功，添加新用户
            deleteUser();
            UTIL.cover.close();
        });
        $(document).off('click','.CA_close').on('click','.CA_close',function(){
            UTIL.cover.close();
        })
        // $(".CA_close").off('click').click(function () {
        //     UTIL.cover.close();
        // });
    }

    function unique(array) {
        var obj = {};

        for (var i = 0, len = array.length; i < len; i++) {
            obj[array[i]['ID']] = array[i];
        }

        array = new Array();

        for (var key in obj) {
            array.push(obj[key]);
        }
        return array;
    }

    function addUsertoTag(data){
        var reviewListID = Number(thisTr.attr("rolesid"));
        var _members = data.map(function(v){
            return {
                id: +v,
                sequence:1
            }
        })
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "add",
            id: reviewListID,
            members: _members,
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(msg) {
            if (msg.rescode == 200) {
                UTIL.cover.close();
                exports.loadAuditPage();
            } else {
                alert("添加用户失败!");
                UTIL.cover.close()
            }
        })
    }

    function deleteUser() {
        var number = thisTr.attr('num');
        var auditID = thisTr.attr('rolesid');
        mtrid = userListArr[number].map(function(v){
            return {
                id: v.ID,
                sequence:1
            }
        })
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "remove",
            id: auditID,
            members: mtrid
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                //  添加新用户
                addUsertoTag(isSelected.sort());
            }
        })
    }
})
