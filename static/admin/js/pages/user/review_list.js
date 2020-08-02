define(function(require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require("common/templates");
    var languageJSON = CONFIG.languageJson.user;
    var nDisplayItems = 7;
    var _pageNum = 1;
    var SUSERS = [], userJson = [], rolData = [];
    var _URL = '/backend_mgt/audit_group';
    exports.init = function() {
        SUSERS = [], userJson = [], _pageNum = 1;
        var thisLi = null;
        selectLanguage();
        renderTags();
    };

    function selectLanguage() {
        //$("#reviewTitle").text(languageJSON.unitMtr);
    }


    function renderTags() {
        $("#list_box").css("display", "block");
        renderAllTags();
        bindMutexEvent()
    }

    function bindMutexEvent() {
        $(".addbox").off().on("click", function() {
            $(".addtag").addClass("showBox");
            
            $(".namebox").focus()
        });
        $(".namebox").off("blur").on("blur", function() {
            $(".addtag, .savename").removeClass("showBox")
        });
        $(".savename").off().on("click", function(e) {
            e.stopPropagation();
            var tagName = $(".namebox").val();
            addReviewTag(tagName);
            $(".namebox").val("");
            $('.addbox p').remove();
        });
        $(".namebox").off("keyup").on("keyup", function(event) {
            if ($(this).val().length > 0) {
                $(".savename").addClass("showBox");
                if (event.keyCode == 13) {
                    $(".savename").trigger("click")
                }
            } else {
                $(".savename").removeClass("showBox")
            }
        })
    }

    function addReviewTag(tagName) {
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "create",
            name: tagName
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                var _list = '<li mutexID="' + res.id + '" class="mutexBox">' + "<h3>" + tagName + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrSeq"></ul><ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                $("#reviewList").append(_list);
                $(".namebox").trigger("blur");
                var li = $('li[mutexID="' + res.id + '"]');
                bindMutexListEvent(li)
            }
        })
    }

    function bindMutexListEvent($li) {
        var _listID = Number($li.attr("mutexID"));
        var _mtrid = null;
        $li.find("h3 i").off("click").on("click", function() {
            var isConfirmed = confirm('确定要删除该审核管理组吗？');
            if(isConfirmed){
                var _isConfirmed = confirm('删除该审核管理组可能会影响到正常的审核流程，是否继续删除？');
                if(_isConfirmed) deleteReviewTag($li);
            }
        });
        $li.children(".addmtr").off("click").on("click", function() {
            thisLi = $li;
            addUser($li);
            SUSERS = [];
        });
        $li.find(".mtrlist i").off("click").on("click", function() {
            var ul_li = $(this).parent();
            deleteUser(_listID, ul_li)
        })

    }

    function deleteReviewTag(li) {
        var _listID = Number(li.attr("mutexID"));
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "delete",
            ids: [_listID]
        });
        
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                li.remove()
            }
        })
    }

    function addUser(li) {
        UTIL.cover.load('resources/pages/user/all_user.html');
        loadUserList(1);
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
        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#users-table-pager').jqPaginator({
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
            $("#usersTable tbody").append('<tr>' +
                '<th class="col-md-1"></th>' +
                '<th class="users_name">' + languageJSON.username + '</th>' +
                '</tr>');

            for(var x=0;x<rolData.length;x++){
                var roltr = '<tr userID="' + rolData[x].ID + '">' +
                    '<td class="user_checkbox"><input class="assign" type="checkbox" value="'+rolData[x].ID+'" userID="' +rolData[x].ID + '" userName="' + rolData[x].USERNAME + '"></td>' +
                    '<td class="user_name">' + rolData[x].USERNAME + '</td>' +
                    '</tr>';
                $("#usersTable tbody").append(roltr);
            }
            if (SUSERS != {}) {
                $("#usersTable input[type='checkbox']").each(function (ind1, el1) {
                    if (SUSERS[_pageNum] != undefined) {
                        $.each(SUSERS[_pageNum], function (ind2, el2) {
                            if (Number(el1.value) == Number(el2)) {
                                el1.checked = true;
                                return false;
                            }
                        })
                    }
                })
            }
            
            $('.mailbox-messages input[type="checkbox"]').iCheck({
                checkboxClass: 'icheckbox_flat-blue',
                radioClass: 'iradio_flat-blue'
            });
        }

        

        $('#users_save').off('click').on('click', function(){
            var datalist = [];

            var ids = [];
            $("#usersTable input[type='checkbox']:checked").map(function (index, el) {
                ids.push(el.value);
                $.each(rolData, function (ind2, el2) {
                    if (el2.ID == Number(el.value)) {
                        userJson.push(el2);
                        return false;
                    }
                })
            })
            SUSERS[_pageNum] = ids;

            var pageCount = totalPages;
            for (var i = 1; i < pageCount + 1; i++) {
                $.each(SUSERS[i], function (ind1, el1) {
                    $.each(userJson, function (ind2, el2) {
                        if (el1 == el2.ID) {
                            datalist.push(el2);
                            return true;
                        }
                    })
                })
            }
            datalist = unique(datalist);

            addUsertoTag(datalist);
            SUSERS = {};
            UTIL.cover.close();
        });

        $(".CA_close").off('click').click(function () {
            UTIL.cover.close();
        });

    }

    function deleteUser(listid, li) {
        var mtrid = {
            id:Number(li.attr("mtrid")),
            sequence:1
        };
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "remove",
            id: listid,
            members: [mtrid]
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                li.remove()
            }
        })
    }

    function renderAllTags() {
        $("#reviewList li:not(:first-child)").remove();
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "query"
        });
        
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                res.groups.map(function(v) {
                    var _list = '<li mutexID="' + v.id + '" class="mutexBox">' + "<h3>" + v.name + '<i class="fa fa-close"></i></h3><ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                    $("#reviewList").append(_list);
                    v.members.map(function(x, i) {
                        var _mtrlist = '<li mtrid="' + x.ID + '"><i class="fa fa-trash-o""></i>' + "<span>" + x.USERNAME + "</span><span>"+x.Description+"</span></li>";
                        $('li[mutexID="' + v.id + '"]').children(".mtrlist").append(_mtrlist);
                    });
                    var li = $('li[mutexID="' + v.id + '"]');
                    bindMutexListEvent(li)
                })
            }
        })
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
        var reviewListID = Number(thisLi.attr("mutexID"));
        var _members = data.map(function(v){
            return {
                id: +v.ID,
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
                data.map(function(v) {
                    var _reviewList = '<li mtrid="' + v.ID + '"><i class="fa fa-trash-o""></i>' + "<span>" + v.USERNAME + "</span></li>"
                    thisLi.children(".mtrlist").append(_reviewList);
                    var _li = $('li[mutexID="' + reviewListID + '"]');
                    bindMutexListEvent(_li)
                })
            } else {
                alert("添加用户失败!");
                UTIL.cover.close()
            }
        })
    }
});