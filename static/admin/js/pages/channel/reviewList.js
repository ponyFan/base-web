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
    exports.init = function() {
        selectLanguage();
        bind();
        exports.loadPage(_pageNum, mtrType == undefined ? "Video" : mtrType);
    };

    function selectLanguage() {
        $("#material_title").text(languageJSON.adTitle);
        $("#mtrVideo").html('<i class="fa fa-video-camera"></i> ' + languageJSON.videoList);
        $("#mtrImage").html('<i class="fa fa-image"></i> ' + languageJSON.imageList);
        $("#mtr_approve").text(languageJSON.checkpass);
        $("#mtr_reject").text(languageJSON.checkdeny);
        $("#mtr_refresh").attr("title", languageJSON.refresh);
        localStorage.setItem('behavior', 'audit');
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
        _url = CONFIG.serverRoot + "/backend_mgt/advertisement_playlist";
        var data = JSON.stringify({
            action: "query",
            project_name: CONFIG.projectName,
            material_type_id: mtrTypeId,
            id: "*",
            behavior: "audit",
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
                // alert(languageJSON.obtainFailure)
            }
            if (json.adv_pls != undefined) {
                var mtrData = json.adv_pls;
                $("#adTable tbody").append("<tr>" + "<th></th>" + "<th>" + languageJSON.playlistName + "</th>" + "<th>" + languageJSON.attribute + "</th>" + "<th>" + languageJSON.status + "</th>" + "<th>" + languageJSON.publishedTerms + "</th>" + "<th>本次发布结果</th>" + "<th>" +languageJSON.operation+ "</th>" + "</tr>");
                if (mtrData.length != 0) {
                    for (var x = 0; x < mtrData.length; x++) {
                        var auditRec = mtrData[x].audit_record || '';
                        var auditResult = mtrData[x].audit_count + '审核中';
                        var operation = '' +
                        '<a class="playlistInfo"><button type="button" class="btn btn-default btn-xs">' + languageJSON.playlistInfo + '</button></a> ';;


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
            exports.loadPage(1, "Video");
            localStorage.setItem("mtrType", "Video")
        });
        $("#mtrImage").click(function() {
            exports.loadPage(1, "Image");
            localStorage.setItem("mtrType", "Image")
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
        $("#mtr_refresh").click(function() {
            exports.loadPage(1, mtrType)
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

        $('#mtr_approve').on('click', function(){
            approvedList();
        })

        $('#mtr_reject').on('click', function(){
            getRejectReason();
        })

        $('#saveReject').on('click', function(){
            rejectList();
        })

        $('#cancelReject').on('click', function(){
            closeRejectReason();
        })

        $('.rejectInfo textarea').on('keyup', function(){
            var _length = $(this).val().length;
            var remainLength = 150 -  _length;
            $('.remainChar').text('还剩'+remainLength+'个字');
        })

    }

    function bindListEvent() {
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
            mtrCb()
        });
        $(".icheckbox_flat-blue ins").click(function() {
            mtrCb()
        });
        $(".mtr_publishedTerms").on("click", function(e) {
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            showPublishedTerms(playlistId)
        })

        $(".mtr_operation .playlistInfo").on("click", function(e) {
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            showPlaylistInfo(playlistId)
        })

        $('.mtr_materials').on('click', function(e){
            var playlistId = $(e.target).parents("tr").attr("mtrid");
            lastPublished(playlistId, 'audit');
        })
    }

    function mtrChoise(obj) {
        $("#mtrChoise li").removeClass("active");
        obj.parent().attr("class", "active")
    }

    function mtrCb() {
        var Ck = $(".icheckbox_flat-blue.checked").length;
        var Uck = $(".icheckbox_flat-blue").length;
        if (Ck == 1) {
            var dlurl = $(".icheckbox_flat-blue.checked").parent().next().find("a").attr("url");
            var dlname = $(".icheckbox_flat-blue.checked").parent().next().find("a").text();
            $("#mtr_approve").removeAttr("disabled");
            $("#mtr_reject").removeAttr("disabled")
        } else {
            if (Ck == 0) {
                $("#mtr_approve").attr("disabled", true);
                $("#mtr_reject").attr("disabled", true);
            }
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

    function approvedList(){
        var mtrId, MaterialIDs = [];
        for (var x = 0; x < $(".mtr_cb").length; x++) {
            if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                MaterialIDs.push(Number(mtrId));
            }
        }
        if(MaterialIDs.length < 1) return;
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'publish_audit_pass',
            ids:MaterialIDs
        });
        var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        UTIL.ajax("post", url, data, function(res) {
            console.log('播单审核通过！')
            if(res.rescode =='200'){
                alert('播单审核通过！')
                $('#mtr_refresh').click();
            }
            // $('#mtr_refresh').click();
        })

    }

    function getRejectReason(){
        $('.rejectInfo').show();
        $('#cover_area').show();
    }

    function rejectList(){
        $('#cover_area').hide();
        var mtrId, MaterialIDs = [];
        var rejectReason = $('.rejectInfo textarea').val();
        for (var x = 0; x < $(".mtr_cb").length; x++) {
            if ($(".mtr_cb:eq(" + x + ")").get(0).checked) {
                mtrId = $(".mtr_cb:eq(" + x + ")").attr("mtrID");
                MaterialIDs.push(Number(mtrId));
            }
        }
        if(MaterialIDs.length < 1) return;
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'publish_audit_deny',
            ids:MaterialIDs,
            reason:rejectReason,
        });
        var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        UTIL.ajax("post", url, data, function(res) {
            if(res.rescode == '200'){
                alert('所选播单审核已否决!');
                closeRejectReason();
                $('#mtr_refresh').click();
            }
        })
    }
    
    function closeRejectReason(){
        $('.rejectInfo').hide();
        $('#cover_area').hide();
        $('.rejectInfo textarea').val('');
    }

    function showPlaylistInfo(id) {
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'query',
            id:id,
            behavior: 'audit',
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
                $('.infoBox .playlistName').text(msg.name);
                $('.infoBox .playlistAttri').text(msg.type + convertNumber(msg.priority));
                $('.infoBox .materials').text(msg.adv_count);
                $('.infoBox .creator').text(msg.creator_name);
                $('.infoBox .createTime').text('无');
                $('.infoBox .lastModified').text(msg.update_time);
                $('.infoBox .auditInfo').text(msg.audit_record);
            }
        })
        $('#cover_area').css('display', 'flex');
        $('.infoBox').css('top',window.scrollY + 200 + 'px').show();
        $('.infoBox .closeBox').off().on('click', function(){
            $('.infoBox, #cover_area').hide();
        })
    }

    function lastPublished(id, status) {
        UTIL.cover.load("resources/pages/terminal/getTermClassAndTerm.html");
        getClassAndTerm.playlistID = Number(id);
        getClassAndTerm.title = '审核中播单'
        getClassAndTerm.category = 'audit_check';
        
    }

    function showPublishedTerms(id) {
        UTIL.cover.load("resources/pages/terminal/getTermClassAndTerm.html");
        getClassAndTerm.playlistID = Number(id);
        getClassAndTerm.title = '已发布终端';
        getClassAndTerm.category = 'published';
    }

});