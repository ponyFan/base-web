'use strict';

define(function(require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var getClassAndTerm = require("pages/terminal/getTermClassAndTerm.js");
    var templates = require("common/templates");
    var showTermTemp = require("pages/channel/showTermTemp.js");
    var cancelPublished = require("pages/channel/cancelPublished.js");
    var playlistAttr = require("pages/channel/playlistAttr.js");
    var nDisplayItems,
        last;
    var _pageNum = 1;
    var category = "term_ads";
    var mtrType;
    var mtrTypeId = -1;
    var mutexList = null;
    var languageJSON = CONFIG.languageJson.adPlan;
    
    exports.init = function () {
        selectLanguage();
        bind();
        exports.loadPage(_pageNum, mtrType == undefined ? "Video" : mtrType)
    };

    function selectLanguage() {
        $("#material_title").text(languageJSON.adTitle);
        $("#mtrVideo").html('<i class="fa fa-video-camera"></i> ' + languageJSON.videoList);
        $("#mtrImage").html('<i class="fa fa-image"></i> ' + languageJSON.imageList);
        $("#mtr_copy").text(languageJSON.copy);
        $("#mtr_delete").text(languageJSON.delete);
        $("#mtr_approve").text(languageJSON.checkpass);
        $("#mtr_reject").text(languageJSON.checkdeny);
        $("#addList").text(languageJSON.addList);
        $("#publishPlaylist").text(languageJSON.publishList);
        $("#mtr_refresh").attr("title", languageJSON.refresh);
        localStorage.setItem('behavior', 'edit');
    }
    exports.loadPage = function(pageNum, typeName, isSearch) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $("#adTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $("#list_box").css("display", "block");
        $("#mtrLisTitle").empty();
        $(".checkbox-toggle").data("clicks", false);
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        $("#materials-table-pager").show();
        $("#mutexList, .emergency-controls").hide();
        $("#adTable, .mailbox-controls, .box-tools").show();
        localStorage.setItem("mtrType", typeName ? typeName : "Video");
        mtrCb();
        if (pageNum != undefined) {
            _pageNum = pageNum
        }
        $("#mtrChoise li").removeClass("active");
        $("#mtrChoise li").each(function() {
            if ($(this).attr("typename") == typeName) {
                $(this).addClass("active")
            }
        });
        mtrType = typeName;
        switch (typeName) {
            case "Video":
                $("#mtrSearch").attr("placeholder", languageJSON.searchVideo);
                mtrTypeId = 1;
                break;
            case "Image":
                $("#mtrSearch").attr("placeholder", languageJSON.searchImage);
                mtrTypeId = 2;
                break
        }
        var status = "";
        if ($("#mtr_toBeCheckedDiv button.btn-primary").length > 0) {
            status = $("#mtr_toBeCheckedDiv button.btn-primary").attr("value")
        }
        var pager = {
            page: isSearch ? 1 : _pageNum,
            per_page: nDisplayItems,
            keyword: $("#mtrSearch").val()
        };
        var _url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
        var data = JSON.stringify({
            action: "query",
            project_name: CONFIG.projectName,
            material_type_id: mtrTypeId,
            id: "*",
            behavior: "edit",
            pager: pager
        });
        UTIL.ajax("post", _url, data, function(json) {
            $("#adTable tbody").empty();
            if (json.total != undefined) {
                var totalPages = Math.ceil(json.total / nDisplayItems);
                totalPages = Math.max(totalPages, 1);
                $("#materials-table-pager").jqPaginator({
                    // totalPages: totalPages,
                    totalCounts: json.total,
                    pageSize: nDisplayItems,
                    visiblePages: CONFIG.pager.visiblePages,
                    first: CONFIG.pager.first,
                    prev: CONFIG.pager.prev,
                    next: CONFIG.pager.next,
                    last: CONFIG.pager.last,
                    page: CONFIG.pager.page,
                    currentPage: isSearch ? 1 : _pageNum,
                    onPageChange: function(num, type) {
                        if (type == "change") {
                            _pageNum = num;
                            exports.loadPage(num, mtrType, false)
                        }
                    }
                })
            } else {
                alert(languageJSON.obtainFailure)
            }
            if (json.adv_pls != undefined) {
                var mtrData = json.adv_pls;
                $("#adTable tbody").append("<tr>" + "<th></th>" + "<th>" + languageJSON.playlistName + "</th>" + "<th>" + languageJSON.attribute + "</th>" + "<th>" + languageJSON.status + "</th>" + "<th>" + languageJSON.publishedTerms + "</th>" + "<th>" + languageJSON.publishResults + "</th>" + "<th>" +languageJSON.operation+ "</th>" + "</tr>");
                if (mtrData.length != 0) {
                    for (var x = 0; x < mtrData.length; x++) {
                        var auditRec = mtrData[x].audit_record || '';
                        var auditResult = '';
                        var operation = '' +
                        '<a class="playlistInfo"><button type="button" class="btn btn-default btn-xs">' + languageJSON.playlistInfo + '</button></a> ' +
                        '<a class="withdrawTerm"><button type="button" class="btn btn-default btn-xs">' + languageJSON.withdrawTerms + '</button></a> ';
                        if(mtrData[x].state == '未审核'){
                            auditResult = '未发布';
                        }else if(mtrData[x].state == '已通过'){
                            auditResult = mtrData[x].publish_success_count + '成功' + ' ' + mtrData[x].publish_fail_count + '失败';
                        }else{
                            auditResult = mtrData[x].audit_count + '审核中';
                            operation = '<a class="playlistInfo"><button type="button" class="btn btn-default btn-xs">' + languageJSON.playlistInfo + '</button></a> ';
                        }

                        var mtrtr = '<tr mtrID="' + mtrData[x].id + '">' + '<td class="mtr_checkbox"><input type="checkbox" class="mtr_cb" mtrID="' + mtrData[x].id + '"></td>' + '<td class="ad_name"><a href="#channel/adEdit?id=' + mtrData[x].id + '">' + mtrData[x].name + "</a></td>" + '<td class="mtr_attr"><span>' + mtrData[x].type + convertNumber(mtrData[x].priority) + "</span ></td>" + '<td class="mtr_adstatus" title="'+auditRec+'"><span></span></td>'+'<td class="mtr_publishedTerms">' + mtrData[x].term_count + "</td>" + '<td class="mtr_materials">' + auditResult + "</td>" + '<td class="mtr_operation">' + operation + "</td>" + "</tr>";
                        $("#adTable tbody").append(mtrtr);
                        var _this = $('tr[mtrid="' + mtrData[x].id + '"]');
                        var mtr_attr = $(_this).find(".mtr_attr span").text();
                        var mtr_adstatus = mtrData[x].state;
                        addBackgroundColor($(_this), mtr_attr, mtr_adstatus)
                    }
                } else {
                    $("#adTable tbody").empty();
                    $("#materials-table-pager").empty();
                    $("#adTable tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + "）</h5>")
                }
            }
            bindListEvent()
        })
    };

    function bind() {
        $("#mtrVideo").click(function() {
            $('.box-footer').show()
            exports.loadPage(1, "Video");
            localStorage.setItem("mtrType", "Video")
        });
        $("#mtrImage").click(function() {
            $('.box-footer').show()
            exports.loadPage(1, "Image");
            localStorage.setItem("mtrType", "Image")
        });
        $("#mtrMutex").click(function() {
            $('.box-footer').hide()
            renderMutex("Mutex")
        });
        $("#mtrSearch").keyup(function(event) {
            if (event.keyCode == 13) {
                var searchKeyword = $("#mtrSearch").val();
                if (!UTIL.isValidated("keyword", searchKeyword)) return;
                onSearch(event)
            }
        });
        $("#mtrSearch").next().click(onSearch);

        function onSearch(event) {
            last = event.timeStamp;
            setTimeout(function() {
                if (last - event.timeStamp == 0) {
                    var searchKeyword = $("#mtrSearch").val();
                    if (!UTIL.isValidated("keyword", searchKeyword)) return;
                    exports.loadPage(1, mtrType)
                }
            }, 500)
        }
        $("#mtr_delete").click(function() {
            var w = false;
            var MaterialIDs = [];
            for (var x = 0; x < $(".mtr_cb").length; x++) {
                if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                    w = true;
                    break
                }
            }
            if (w) {
                if (confirm(languageJSON.cf_delResource)) {
                    var mtrId;
                    for (var x = 0; x < $(".mtr_cb").length; x++) {
                        if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                            mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                            MaterialIDs.push(Number(mtrId))
                        }
                    }
                    if ($(".mtr_cb:checked").length == $(".mtr_cb").length || _pageNum != 1) {
                        _pageNum--
                    }
                    if (_pageNum < 1) {
                        _pageNum = 1
                    }
                    var data = JSON.stringify({
                        action: "delete",
                        project_name: CONFIG.projectName,
                        ids: MaterialIDs
                    });
                    var _url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
                    UTIL.ajax("post", _url, data, function() {
                        exports.loadPage(_pageNum, mtrType)
                    })
                }
            }
        });
        $("#mtr_refresh").click(function() {
            exports.loadPage(1, mtrType)
        });
        $("#showStatus").on("change", function(e) {
            var status = $(e.target).val();
            filterList(status)
        });
        $(".checkbox-toggle").click(function() {
            var clicks = $(this).data("clicks");
            if (clicks) {
                $(".mailbox-messages input[type='checkbox']").iCheck("uncheck");
                $(".fa", this).removeClass("fa-check-square-o").addClass("fa-square-o")
            } else {
                $(".mailbox-messages input[type='checkbox']").iCheck("check");
                $(".fa", this).removeClass("fa-square-o").addClass("fa-check-square-o")
            }
            $(this).data("clicks", !clicks);
            mtrCb()
        });

        $("#pub_normal").click(function() {
            publishPlaylist()
        });

        $('#pub_unit').click(function(){
            publishUnitPlaylist();

        });

        $('#submitReview').click(function(){
            submitReview();
        })

        $("#mtr_copy").on("click", function() {
            copyPlaylist()
        });
        $("#ad-material-list a").on("click", function() {
            var page = "resources/pages/channel/playlistAttr.html";
            playlistAttr.plsType = $(this).attr("id").split("_")[1];
            UTIL.cover.load(page)
        })

    }

    function bindListEvent() {
        
        $('#adTable .ad_name a').on('click', function(e){
            e.stopPropagation();
            playlistAttr.plsType = '';
            var status = $(e.target).parents('tr').find('.mtr_adstatus').text();
            if(status == '审核中') localStorage.setItem('behavior', 'edit');
        })

        $('.mailbox-messages input[type="checkbox"]').iCheck({
            checkboxClass: "icheckbox_flat-blue",
            radioClass: "iradio_flat-blue"
        });
        $(".icheckbox_flat-blue").parent().parent().click(function() {
            // $(".mailbox-messages input[type='checkbox']").iCheck("uncheck");
            if ($(this).find("input").prop("checked") == true) {
                $(this).find("input").prop("checked", false);
                $(this).find("div").prop("class", "icheckbox_flat-blue");
                $(this).find("div").prop("aria-checked", "false")
            } else {
                $(this).find("input").prop("checked", true);
                $(this).find("div").prop("class", "icheckbox_flat-blue checked");
                $(this).find("div").prop("aria-checked", "true")
            }
            var audit_deny = false, submit_deny = true;
            //if($(this).children('.mtr_adstatus').text() == '已通过') audit_deny = false;
            //if($(this).children('.mtr_adstatus').text() == '未审核') submit_deny = false;
            if($(this).children('.mtr_adstatus').text() == '审核中') audit_deny = true;

            mtrCb(audit_deny, submit_deny)
        });
        $(".icheckbox_flat-blue ins").click(function() {
            var audit_deny = false, submit_deny = false;
            var submitList = [], auditList = [];
            for (var x = 0; x < $(".mtr_cb").length; x++) {
                var adStatus = $(".mtr_cb:eq(" + x + ")").parents('tr').children('.mtr_adstatus').text();
                if ($(".mtr_cb:eq(" + x + ")").get(0).checked && adStatus == '审核中') {
                    auditList.push(1)
                }
            }
            auditList.length == $(".icheckbox_flat-blue.checked").length ? audit_deny = true : audit_deny = false;
            mtrCb(audit_deny, submit_deny)
        });

        $('.mtr_publishedTerms').on('click', function(e){
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            showPublishedTerms(playlistId)
        })

        $(".mtr_operation .withdrawTerm").on("click", function(e) {
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            withdrawPlaylist(playlistId, 'withdraw')
        })

        $(".mtr_operation .playlistInfo").on("click", function(e) {
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            showPlaylistInfo(playlistId)
        })

        $('.mtr_materials').on('click', function(e){
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            var playlistName = $(e.target).parents("tr").find('.ad_name').text();
            var playlistStatus = $(e.target).parents("tr").find('.mtr_adstatus').text();
            var publishedInfo = require('pages/channel/publishedInfo.js');
            publishedInfo.plName = playlistName;
            publishedInfo.plId = playlistId;
            if(playlistStatus == '未审核'){
                return;
            }else if(playlistStatus == '审核中'){
                withdrawPlaylist(playlistId, 'audit')
                return;
            }else{
                publishedInfo.plStatus = '已通过'
            }
            UTIL.cover.load('resources/pages/channel/publishedInfo.html');
        })
    }

    function mtrChoise(obj) {
        $("#mtrChoise li").removeClass("active");
        obj.parent().attr("class", "active")
    }

    function checkDelBtns() {
        var flag = true;
        $("#adTable input[type='checkBox']:checked").each(function(i, e) {
            var publishTerms = $(e).parents('tr').find(".mtr_publishedTerms").text();
            var status = $(e).parents('tr').find(".mtr_adstatus").text();
            if ( publishTerms > 0) {
                $("#mtr_delete").attr("disabled", true);
                flag = false;
            }
            if ( status == '审核中') {
                $("#mtr_delete").attr("disabled", true);
                $("#mtr_copy").attr("disabled", true);
                flag = false;
            }

        })
        if(flag) $("#mtr_delete").removeAttr("disabled");
    }

    function mtrCb(audit, submit) {
        checkDelBtns();
        var Ck = $(".icheckbox_flat-blue.checked").length;
        var Uck = $(".icheckbox_flat-blue").length;
        var submitList = [];
        if (Ck == 1) {
            $("#mtr_copy").removeAttr("disabled");
            audit ? $("#publishPlaylist").attr('disabled', true) : $("#publishPlaylist").removeAttr("disabled");     
        } else {
            if (Ck == 0) {
                $("#mtr_delete, #mtr_copy, #publishPlaylist, #submitReview").attr("disabled", true);
                return
            }
            $("#publishPlaylist").attr("disabled", true);
            
        }
        if (Uck != 0) {
            if (Ck == Uck) {
                $(".fa.fa-square-o").attr("class", "fa fa-check-square-o");
                $(".checkbox-toggle").data("clicks", true)
            } else {
                $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
                $(".checkbox-toggle").data("clicks", false)
            }
        }
    }
    exports.mtrList = function() {
        var listData = {
            pageNum: _pageNum,
            mtrType: mtrType
        };
        return listData
    };

    function convertNumber(num) {
        var result = "";
        switch (num) {
            case 0:
                break;
            case 1:
                result = "-优先1";
                break;
            case 2:
                result = "-优先2";
                break;
            case 3:
                result = "-优先3";
                break
        }
        return result
    }

    function addBackgroundColor(ele, attr, status) {
        var attrCls = "";
        var statusCls = "";
        var _i = '';
        switch (attr) {
            case "常规":
                attrCls = "attr_1";
                break;
            case "垫播":
                attrCls = "attr_2";
                break;
            case "均插":
                attrCls = "attr_3";
                break;
            case "常规-优先1":
                attrCls = "attr_4";
                break;
            case "常规-优先2":
                attrCls = "attr_5";
                break;
            case "常规-优先3":
                attrCls = "attr_6";
                break
        }
        switch (status) {
            case "未审核":
                statusCls = "status_1";
                _i = "<i class='fa fa-file-o'>未审核</i>"
                break;
            case "已通过":
                statusCls = "status_2";
                _i = "<i class='fa fa-check'>已通过</i>"
                break;
            case "不通过":
                statusCls = "status_3";
                _i = "<i class='fa fa-close'>不通过</i>"
                break;
            case "审核中":
                statusCls = "status_4";
                _i = "<i class='fa fa-gear'>审核中</i>"
                break
        }
        ele.find(".mtr_attr span").addClass(attrCls);
        ele.find(".mtr_adstatus span").addClass(statusCls).empty().append(_i);
    }

    function filterList(status) {}

    function copyPlaylist() {
        var w = false;
        var MaterialIDs = [];
        for (var x = 0; x < $(".mtr_cb").length; x++) {
            if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                w = true;
                break
            }
        }
        if (w) {
            var mtrId;
            for (var x = 0; x < $(".mtr_cb").length; x++) {
                if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                    mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                    MaterialIDs.push(Number(mtrId))
                }
            }
            if ($(".mtr_cb:checked").length == $(".mtr_cb").length || _pageNum != 1) {
                _pageNum--
            }
            if (_pageNum < 1) {
                _pageNum = 1
            }
            var data = JSON.stringify({
                action: "copy",
                project_name: CONFIG.projectName,
                ids: MaterialIDs
            });
            var _url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
            UTIL.ajax("post", _url, data, function(res) {
                if(res.rescode == '200'){
                    alert("复制成功！");
                    exports.loadPage(_pageNum, mtrType)
                }
            })
        }
    }

    function addPlaylist() {
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "create",
            material_type_id: mtrType == "Video" ? 1 : 2,
            name: "",
            type: "",
            priority: 0,
            location: 0,
            start_time: "",
            end_time: ""
        });
        var _url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
        UTIL.ajax("post", _url, data, function(res) {
            if (res.rescode == "200") {
                alert("创建成功")
            }
        })
    }
    //发布到终端
    function publishPlaylist() {
        var playlistId = $(".checked").parent().parent().attr("mtrid");
        UTIL.cover.load("resources/pages/terminal/getTermClassAndTerm.html");
        getClassAndTerm.playlistID = playlistId;
        getClassAndTerm.title = languageJSON.title3;
        getClassAndTerm.category = category;
        getClassAndTerm.save = function(data) {

            $('#term_sel_save').prop('disabled', true);
            var terms = data.termList.map(function(v) {
                return Number(v.termID)
            });
            var category_ids = data.categoryList.map(function(v) {
                return Number(v.categoryID)
            });
            var post_data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: "publish_1",
                category_ids: category_ids,
                term_ids: terms
            });
            var url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
            UTIL.ajax("post", url, post_data, function(msg) {
                if (msg.rescode == 200) {
                    $('#term_sel_save').prop('disabled', false);
                    UTIL.cover.close();
                    msg.category_ids = category_ids;
                    msg.term_ids = terms
                    showTermlist(msg)
                } else {
                    alert("发布失败!");
                    UTIL.cover.close()
                }
            })
        }
    }
    //联屏发布
    function publishUnitPlaylist(){
        var playlistId = +$(".checked").parent().parent().attr("mtrid");
        UTIL.cover.load("resources/pages/terminal/getTermClassAndTerm.html");
        getClassAndTerm.playlistID = playlistId;
        getClassAndTerm.title = '联屏发布';
        getClassAndTerm.category = 'unit_publish';
        getClassAndTerm.save = function(data) {

            $('#term_sel_save').prop('disabled', true);

            var unitTerm = data.termList.map(function(v) {
                return {
                    id:Number(v.termID),
                    name: v.name,
                    term_ids:v.terms.split('.').map(function(v){return Number(v)})
                }
            });
            var post_data = JSON.stringify({
                project_name: CONFIG.projectName,
                // action: "union_screen_publish",
                action: "publish_audit_submit",
                ids:[playlistId],
                union_screen_terms:unitTerm
            });
            var url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
            UTIL.ajax("post", url, post_data, function(msg) {
                if (msg.rescode == 200) {
                    UTIL.cover.close();
                    var failMsg = msg.fail.map(function(v){
                        return v.info;
                    });
                    failMsg.join('\n');
                    alert('成功发布: ' + msg.success_count + '个联屏终端' + '\n' + '发布失败: ' + failMsg);
                    $('#term_sel_save').prop('disabled', false);
                } else {
                    alert("发布失败!");
                    UTIL.cover.close()
                }
            })
        }

    }

    function submitReview(){
        var w = false;
        var MaterialIDs = [];
        for (var x = 0; x < $(".mtr_cb").length; x++) {
            if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                w = true;
                break
            }
        }
        if (w) {
            if (confirm('确认提交审核所选播单吗？')) {
                var mtrId;
                for (var x = 0; x < $(".mtr_cb").length; x++) {
                    if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                        mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                        MaterialIDs.push(Number(mtrId))
                    }
                }
                if ($(".mtr_cb:checked").length == $(".mtr_cb").length || _pageNum != 1) {
                    _pageNum--
                }
                if (_pageNum < 1) {
                    _pageNum = 1
                }
                var post_data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: "audit_submit",
                    ids: MaterialIDs
                });
                var url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
                UTIL.ajax("post", url, post_data, function(msg) {
                    if (msg.rescode == 200) {
                        alert("提交审核成功！");
                        $('#mtr_refresh').click();

                    } else {
                        alert(msg.error);
                    }
                })
            }
        }

    }

    function showTermlist(data) {
        UTIL.cover.load("resources/pages/channel/showTermTemp.html");
        showTermTemp.data = data
    }

    function withdrawPlaylist(id, status) {
        UTIL.cover.load("resources/pages/terminal/getTermClassAndTerm.html");
        if(status == 'audit'){
            getClassAndTerm.playlistID = Number(id);
            getClassAndTerm.title = '审核中播单'
            getClassAndTerm.category = 'audit_check';
        }else{
            getClassAndTerm.playlistID = Number(id);
            getClassAndTerm.title = languageJSON.title4;
            getClassAndTerm.category = category;
            getClassAndTerm.save = function(data) {
                var terms = data.termList.map(function(v) {
                    return Number(v.termID)
                });
                var category_ids = data.categoryList.map(function(v) {
                    return Number(v.categoryID)
                });
                var post_data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: "cancel",
                    category_ids: category_ids,
                    term_ids: terms,
                    id: id
                });
                var url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
                UTIL.ajax("post", url, post_data, function(msg) {
                    if (msg.rescode == 200) {
                        UTIL.cover.close();
                        alert("撤销成功")
                    } else {
                        alert("撤销失败!");
                        UTIL.cover.close()
                    }
                })
            }
        }
    }

    function showPublishedTerms(id){
        UTIL.cover.load("resources/pages/terminal/getTermClassAndTerm.html");
        getClassAndTerm.playlistID = Number(id);
        getClassAndTerm.title = '已发布终端';
        getClassAndTerm.category = 'published';
    }

    function showPlaylistInfo(id) {
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'query',
            id:id,
            behavior: 'edit',
            material_type_id: mtrTypeId,
            pager: {
                keyword: '',
                page:1,
                per_page:10
            }

        });
        var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        UTIL.ajax('post', url, data, function (res) {
            if(res.rescode == '200'){
                var msg = res.adv_pls[0];
                var auditText = '';
                $('.infoBox .playlistName').text(msg.name);
                $('.infoBox .playlistAttri').text(msg.type + convertNumber(msg.priority));
                $('.infoBox .materials').text(msg.adv_count);
                $('.infoBox .creator').text(msg.creator_name);
                $('.infoBox .createTime').text('无');
                $('.infoBox .lastModified').text(msg.update_time);
                
                if(msg.audit_record) auditText = '<p class="auditInfo">' + msg.audit_record.replace(/;/g,'<br>' ) + '</p>';
                $('.infoBox .auditInfo').remove();
                $('.infoBox .itemsAudit').append(auditText);
            }
        })
        $('#cover_area').css('display', 'flex');
        $('.infoBox').css('top',window.scrollY + 200 + 'px').show();
        $('.infoBox .closeBox').off().on('click', function(){
            $('.infoBox, #cover_area').hide();
        })
    }


    function renderMutex(typeName) {
        $("#adTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $("#list_box").css("display", "block");
        $("#mtrLisTitle").empty();
        $(".checkbox-toggle").data("clicks", false);
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        $("#materials-table-pager, .emergency-controls, .box-tools").hide();
        $("#mtrChoise li").removeClass("active");
        $("#mtrChoise li").each(function() {
            if ($(this).attr("typename") == typeName) {
                $(this).addClass("active")
            }
        });
        $("#mutexList").show();
        $("#adTable, .mailbox-controls").hide();
        renderMutexTags();
        bindMutexEvent()
    }

    function bindMutexEvent() {
        // $(".addbox").off().on("click", function() {
        //     $(".addtag, .userTips").addClass("showBox");
        //     $(".namebox").focus();
        //     if($('.namebox').val().length > 0) $(".savename").addClass("showBox");
        // });
        $('#mutexList').off().on('click',function(e){
            if($(e.target).hasClass('addbox') || $(e.target).parent().hasClass('addbox')){
                //  点击添加框-显示输入框
                $(".addtag, .userTips").addClass("showBox");
                $(".namebox").focus()
            }else{
                //  点击添加框以外地方-隐藏输入框
                $(".namebox").val('')
                $(".addtag, .savename, .userTips").removeClass("showBox")
            }
        })
        // $(".namebox").off("blur").on("blur", function() {
        //     $(".addtag, .savename, .userTips").removeClass("showBox")
        // });
        $(".savename").off().on("click", function(e) {
            e.stopPropagation();
            var tagName = $(".namebox").val();
            if(!tagName.replace(/(^\s*)|(\s*$)/g,"")){
                alert('标签名称不能为空！')
                $(".namebox").val('').focus()
                return
            }
            addMutexTag(tagName);
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

    function addMutexTag(tagName) {
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "create",
            name: tagName
        });
        var url = CONFIG.serverRoot + "/backend_mgt/advertisement_mutex";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                var _list = '<li mutexID="' + res.id + '" class="mutexBox">' + "<h3 title=" + tagName + ">" + tagName + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                $("#mutexList").append(_list);
                // $(".namebox").trigger("blur");
                alert('标签添加成功')
                $(".namebox").val("");
                $('.addbox p').remove();
                $(".addtag, .savename, .userTips").removeClass("showBox")
                var li = $('li[mutexID="' + res.id + '"]');
                bindMutexListEvent(li)
            }
        })
    }

    function bindMutexListEvent($li) {
        var _listID = Number($li.attr("mutexID"));
        $li.find("h3 i").on("click", function() {
            if(confirm('是否删除此互斥标签？') == true){
                deleteMutexTag($li)
            }else{
                return false
            }
        });
        $li.children(".addmtr").on("click", function() {
            addMutexMaterial($li)
        });
        $li.find(".mtrlist i").on("click", function() {
            var ul_li = $(this).parent();
            deleteMutexMaterial(_listID, ul_li)
        })
    }

    function deleteMutexTag(li) {
        var _listID = Number(li.attr("mutexID"));
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "delete",
            ids: [_listID]
        });
        var url = CONFIG.serverRoot + "/backend_mgt/advertisement_mutex";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                li.remove()
            }
        })
    }

    function addMutexMaterial(li) {
        var page = "resources/pages/channel/addMtr.html";
        UTIL.cover.load(page);
        mutexList = li
    }

    function deleteMutexMaterial(listid, li) {
        var mtrid = {
            id:Number(li.attr("mtrid")),
            sequence:0
        };
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "remove",
            id: listid,
            members: [mtrid]
        });
        var url = CONFIG.serverRoot + "/backend_mgt/advertisement_mutex";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                li.remove()
            }
        })
    }

    function renderMutexTags() {
        $("#mutexList li:not(:first-child)").remove();
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "query"
        });
        var url = CONFIG.serverRoot + "/backend_mgt/advertisement_mutex";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                res.groups.map(function(v) {
                    var _list = '<li mutexID="' + v.id + '" class="mutexBox">' + "<h3 title="+v.name+">" + v.name + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                    $("#mutexList").append(_list);
                    v.members.map(function(x) {
                        var _mtrlist = '<li mtrid="' + x.ID + '"><i class="fa fa-trash-o""></i>' + "<span>" + x.Name + "</span>" + "<span>" + x.Duration + "</span>" + "</li>";
                        $('li[mutexID="' + v.id + '"]').children(".mtrlist").append(_mtrlist)
                    });
                    var li = $('li[mutexID="' + v.id + '"]');
                    bindMutexListEvent(li)
                })
            }
        })
    }
    exports.addMaterials = function(mtrData) {
        var mutexListID = Number(mutexList.attr("mutexID"));
        var mtrIDs = [];
        mtrData.map(function(v) {
            mtrIDs.push({
                id:v.ID,
                sequence:0
            })
        });
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "add",
            id: mutexListID,
            members: mtrIDs
        });
        var url = CONFIG.serverRoot + "/backend_mgt/advertisement_mutex";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                mtrData.map(function(v) {
                    var _mtrlist = '<li mtrid="' + v.ID + '"><i class="fa fa-trash-o""></i>' + "<span>" + v.Name + "</span>" + "<span>" + v.Duration + "</span>" + "</li>";
                    mutexList.children(".mtrlist").append(_mtrlist);
                    var li = $('li[mutexID="' + mutexListID + '"]');
                    // bindMutexListEvent(li)
                    var _listID = Number(li.attr("mutexID"));
                    li.find(".mtrlist i").off("click").on("click", function() {
                        var ul_li = $(this).parent();
                        deleteMutexMaterial(_listID, ul_li)
                    })
                })
            }
        })
    }
});