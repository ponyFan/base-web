'use strict';

define(function (require, exports, module) {

    // depend on these components
    var templates = require('common/templates'),
        config = require('common/config'),
        util = require('common/util'),
        toast = require('common/toast'),
        getClassAndTerm = require('pages/terminal/getTermClassAndTerm.js'),
        INDEX = require("../index.js"),
        currentMenu = INDEX.getCurrentMenu('频道管理'),
        MTRU = require("pages/materials/materials_upload.js");
    // global variables
    var requestUrl = config.serverRoot,
        projectName = config.projectName,
        nDisplayItems = 10,
        _pageNO = 1,
        last,
        languageJSON;
    var category = 'emergency_ch';
    var isAdVersion = false;
    var isShowRegular = -1;
    var isShowEmergency = -1;

    // 初始化页面
    exports.init = function () {
        selectLanguage();
        getJurisdiction();
        getSysInfo();
        // checkIsAd();
        //获取已选频道ids
        function getChannelIds() {
            var ids = new Array();
            $("#channel-table input[type='checkBox']:checked").each(function (i, e) {
                ids.push(Number($(e).parent().parent().parent().attr('chnID')));
            });
            return ids;
        }

        registerEventListeners();
        //筛选审核状态
        if (util.getLocalParameter('config_checkSwitch') == '1') {
            $('#chn_toBeCheckedDiv button').each(function (i, e) {
                $(this).click(function () {
                    $(this).siblings().removeClass('btn-primary');
                    $(this).siblings().addClass('btn-defalut');

                    var isFocus = $(this).hasClass('btn-primary');
                    $(this).removeClass(isFocus ? 'btn-primary' : 'btn-defalut');
                    $(this).addClass(isFocus ? 'btn-defalut' : 'btn-primary');
                    loadPage(1, 'regular');
                })
            });

            //提交审核
            $('#chn_submit').click(function () {

                if (!$('#chn_submit').attr('disabled')) {

                    var data = {
                        "project_name": config.projectName,
                        "action": "submitToCheck",
                        "ChannelIDs": getChannelIds()
                    }
                    util.ajax(
                        'POST',
                        config.serverRoot + '/backend_mgt/v2/channels/',
                        JSON.stringify(data),
                        function (data) {
                            if (data.rescode === '200') {
                                alert(languageJSON.al_sumbmit);
                                loadPage(_pageNO, 'regular');
                            } else {
                                alert(languageJSON.al_sumbmitFaild);
                            }
                        }
                    )
                }
            })

            //审核通过
            $('#chn_pass').click(function () {

                if (!$('#chn_pass').attr('disabled')) {
                    var data = {
                        "project_name": config.projectName,
                        "action": "checkPass",
                        "ChannelIDs": getChannelIds()
                    }
                    util.ajax(
                        'POST',
                        config.serverRoot + '/backend_mgt/v2/channels/',
                        JSON.stringify(data),
                        function (data) {
                            if (data.rescode === '200') {
                                alert(languageJSON.al_check);
                                loadPage(_pageNO, 'regular');
                            } else {
                                alert(languageJSON.al_checkFaild);
                            }
                        }
                    )
                }
            })

            //审核不通过
            $('#chn_unpass').click(function () {

                if (!$('#chn_unpass').attr('disabled')) {
                    var ids = getChannelIds();
                    var unpassChn = [];
                    for (var i = 0; i < ids.length; i++) {
                        //ids[i].failInfo="这里是审核不通过的反馈信息"
                        var a = {"channelID": ids[i], "failInfo": languageJSON.al_checkFailInfo}
                        unpassChn[i] = a;

                    }
                    var data = {
                        "project_name": config.projectName,
                        "action": "checkFailed",
                        "CheckFeedBack": unpassChn
                    }
                    util.ajax(
                        'POST',
                        config.serverRoot + '/backend_mgt/v2/channels/',
                        JSON.stringify(data),
                        function (data) {
                            if (data.rescode === '200') {
                                alert(languageJSON.al_check);
                                loadPage(_pageNO, 'regular');
                            } else {
                                alert(languageJSON.al_checkFaild);
                            }
                        }
                    )
                }
            })
        }

    };

    exports.loadPage = function () {
        loadPage(_pageNO, 'regular');
    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = config.languageJson.channel;
        $(".channel-box-title").html(languageJSON.title1);
        $(".channel-box-prompt").html('<i class="fa fa-info-circle"></i>&nbsp;' + languageJSON.prompt1);
        $("#mtrLisTitle").html(languageJSON.title2);
        $("#mtrAdTitle").html(languageJSON.title_1);
        $("#mtrEmergency").html(languageJSON.title_2);
        $("#channelSearch").attr("placeholder", languageJSON.pl_search);
        $(".btn-publish").html(languageJSON.publish);
        $(".btn-publish-later").html(languageJSON.prePublish);
        $(".btn-copy").html(languageJSON.copy);
        $(".btn-delete").html(languageJSON.delete);
        $(".btn-import-offline").html(languageJSON.importOffline);
        $(".btn-export-offline").html(languageJSON.exportOffline);
        $("#chn_submit").html(languageJSON.chn_submit);
        $("#chn_pass").html(languageJSON.chn_pass);
        $("#chn_unpass").html(languageJSON.chn_unpass);
        $("#chn_toBeCheckedDiv .btn-pendingSubmit").html(languageJSON.pendingSubmit);
        $("#chn_toBeCheckedDiv .btn-pendingAudit").html(languageJSON.pendingAudit);
        $("#chn_toBeCheckedDiv .btn-pass").html(languageJSON.pass);
        $("#chn_toBeCheckedDiv .btn-unpass").html(languageJSON.unpass);
        $(".btn-add-channel").html(languageJSON.addChannel);
    }

    function checkIsAd(){
        var data = JSON.stringify({
            Project: config.projectName,
            project_name: config.projectName,
            Action: 'get_function'
        })
        var url = config.serverRoot + '/backend_mgt/v1/projects';
        util.ajax('post', url, data, function (json) {
            if(json.rescode == '200'){
                isAdVersion = json.function.advertisement;
                if(isAdVersion) {
                    checkUserAuth();
                }else{              
                    $('#mtrChoise').find('li[typename="ads"]').remove();
                    $('#mtrChoise').find('li[typename="emergency"]').remove();
                    $('.btn-publish-unit').remove();               
                    checkCheck();
                }

            }
        })
    }

    function registerEventListeners() {
        $('#channel-table').delegate('input[type="checkbox"]', 'ifClicked', function (ev) {
            onSelectedItemChanged($(this.parentNode).hasClass('checked') ? -1 : 1);
        });
        // $('#channel-table').delegate('tr', 'click', function (ev) {
        //     var self = this;
        //     //$('#channel-table tr').each(function (idx, el) {
        //     //    $(el).iCheck('uncheck');
        //     //    $(this).find('a:nth(1)').click(function (e) {
        //     //        e.preventDefault();
        //     //        e.stopPropagation();
        //     //        showPublishInfo($(this).parent().parent());
        //     //    })
        //     //});
        //     $(self).iCheck('check');
        //     onSelectedItemChanged();
        // });


        $('#channel-table').delegate('.btn-channel-detail', 'click', function (ev) {
            var channelId = getChannelId(ev.target);
            ev.stopPropagation();
        });
        $('#channel-list-controls .select-all').click(function (ev) {
            var hasUncheckedItems = false;
            $('#channel-table div').each(function (idx, el) {
                if (!(hasUncheckedItems || $(el).hasClass('checked'))) {
                    hasUncheckedItems = true;
                }
            });
            $('#channel-table tr').each(function (idx, el) {
                $(el).iCheck(hasUncheckedItems ? 'check' : 'uncheck');
            });
            onSelectedItemChanged();
        });

        $('#channel-list-controls .btn-publish').click(publishChannel);
        $('#channel-list-controls .btn-publish-later').click(function () {
            publishChannelLater('regular')
        });

        $('#channel-list-controls .btn-publish-unit').click(function(){
            publishChannel('unit');
        });

        $('#channel-list-controls .btn-copy').click(copyChannel);
        $('#channel-list-controls .btn-delete').click(function () {
            deleteChannel('regular');
        });
        $('#channel-list-controls .btn-export-offline, #channel-ad-controls .btn-export-offline').click(exportOffline);
        $('#channel-ad-controls .btn-export-offline2').click(exportOffline2);
        importOffline();

        //搜索事件
        $("#channelSearch").keyup(function (event) {
            if (event.keyCode == 13) {
                if (!util.isValidated('keyword', $('#channelSearch').val() )) return;
                onSearch(event);
            }
        });
        $("#channelSearch").next().click(onSearch);
        function onSearch(event) {
            last = event.timeStamp;         //利用event的timeStamp来标记时间，这样每次的keyup事件都会修改last的值，注意last必需为全局变量
            setTimeout(function () {          //设时延迟0.5s执行
                if (last - event.timeStamp == 0) //如果时间差为0（也就是你停止输入0.5s之内都没有其它的keyup事件发生）则做你想要做的事
                {
                    $('#chn_toBeCheckedDiv button').removeClass('btn-primary').addClass('btn-defalut');
                    if (!util.isValidated('keyword', $('#channelSearch').val())) return;
                    var type = $('#mtrChoise .active').attr('typename');
                    _pageNO = 1;
                    switch(type){
                        case 'ads':
                            loadPage_ad(1, 'ads');
                            break;
                        case 'regular':
                            loadPage(1, 'regular');
                            break;
                        case 'emergency':
                            loadPage_emergency(1, 'emergency');
                            break;
                    };
                    
                }
            }, 500);
        }

        $('#mtrAdTitle').on('click', function () {
            //loadPage(_pageNO, 'ads');
            _pageNO = 1;
            loadPage_ad(_pageNO, 'ads');
            localStorage.setItem('ch_type', 'ads');
            localStorage.setItem('btnClick_type', 'ads');
        })
        $('#mtrLisTitle').on('click', function () {
            _pageNO = 1;
            loadPage(_pageNO, 'regular');
            localStorage.setItem('ch_type', 'normal');
            localStorage.setItem('btnClick_type', 'normal');
        })
        $('#mtrEmergency').on('click', function () {
            _pageNO = 1;
            loadPage_emergency(_pageNO, 'emergency');
            localStorage.setItem('ch_type', 'emergency');
            localStorage.setItem('btnClick_type', 'emergency');
        })

    }

    function showPublishInfo(ele) {
        var publishedInfo = require('pages/channel/publishedInfo.js');
        publishedInfo.chnName = ele.attr("chnName");
        publishedInfo.chnID = ele.attr("chnID");
        util.cover.load('resources/pages/channel/publishedInfo.html');
    }

    function publishChannel(isUnit) {
        var channelID = $(".checked").parent().parent().attr("chnID");
        var channelName = $(".checked").parent().parent().attr("chnname");
        util.cover.load('resources/pages/terminal/getTermClassAndTerm.html');
        getClassAndTerm.channelID = channelID;
        if(isUnit=='unit'){
            getClassAndTerm.title = '联屏发布';
            getClassAndTerm.category = 'unit_publish';
        }else{
            getClassAndTerm.title = languageJSON.title3 + '...';
            getClassAndTerm.category = '';
        }
        getClassAndTerm.save = function (data) {
            //var cList = JSON.stringify(data.categoryList);
            //var tList = JSON.stringify(data.termList);
            $('#term_sel_save').prop('disabled', true);
            var termList = data.termList.map(function(v) {
                return {
                    id:Number(v.termID),
                    name: v.name,
                }
            });
            var categoryList = data.categoryList.map(function(v){
                return {
                    id:Number(v.categoryID),
                    name: v.nodeContent
                }
            })
            var post_data = JSON.stringify({
                project_name: config.projectName,
                action: 'publish',
                recursive:data.action == "NoRecursive" ? 'False' : 'True',
                union_screen:isUnit == 'unit' ? 'True' : 'False',
                id: channelID,
                name: channelName,
                category_list: categoryList,
                term_list: termList
            });
            var url = config.serverRoot + '/backend_mgt/channels/';
            util.ajax('post', url, post_data, function (msg) {
                if (msg.rescode == 200) {
                    alert(languageJSON.al_publishSuc);
                    $('#term_sel_save').prop('disabled', false);
                    util.cover.close();
                    loadPage(_pageNO, 'regular');
                }
                else {
                    alert(languageJSON.al_publishFaild)
                    util.cover.close();
                }
            });
        }
    }

    function publishChannelLater(typeName) {
        var channelID = $(".checked").parent().parent().attr("chnID");
        util.cover.load('resources/pages/terminal/getTermClassAndTerm.html');
        getClassAndTerm.channelID = channelID;
        getClassAndTerm.title = languageJSON.title3 + '...';
        getClassAndTerm.save = function (data) {
            //var cList = JSON.stringify(data.categoryList);
            //var tList = JSON.stringify(data.termList);
            var post_data = JSON.stringify({
                project_name: config.projectName,
                action: 'publishPreDownloadChannel' + data.action,
                channelID: channelID,
                categoryList: data.categoryList,
                termList: data.termList
            });
            var url = config.serverRoot + '/backend_mgt/v2/termcategory';
            util.ajax('post', url, post_data, function (msg) {
                if (msg.rescode == 200) {
                    alert(languageJSON.al_prePublishSuc)

                }
                else {
                    alert(languageJSON.al_prePublishFaild)
                }
            });
            util.cover.close();
            if (typeName == 'emergency') {
                loadPage_emergency(_pageNO, typeName);
            } else {
                loadPage(_pageNO, typeName);
            }
        }
    }

    /**
     * 复制频道
     */
    function copyChannel() {
        var data = JSON.stringify({
            action: 'copychannel',
            project: projectName,
            id: getCurrentChannelId()
        });
        util.ajax('post', requestUrl + '/backend_mgt/v2/copy', data, function (res) {
            // alert(JSON.parse(res).rescode === 200 ? languageJSON.copySuc : languageJSON.copyFaild);
            if(res.rescode === 200){
                alert(languageJSON.copySuc)
                loadPage(_pageNO, 'regular');
            }
        });
    }

    /**
     * 删除频道
     */
    function deleteChannel(typeName) {
        var checkedName =''
        var checkedID = []
        var checked = $("#channel-table input[type='checkBox']:checked");
        $(checked).each(function(i){
            checkedName += (((i+1 )< 10 ? '0'+ (i+1) : (i+1)) + '. ' + $(this).parents('tr').attr('chnname') + '\n' )
            checkedID.push(parseInt($(this).parents('tr').attr('chnid')))
        })
        if (confirm(languageJSON.cf_delete + '\n' + checkedName)) {
            // var data = JSON.stringify({
            //     action: 'Delete',
            //     project_name: projectName
            // });
            // util.ajax('post', requestUrl + '/backend_mgt/v2/channels/' + getCurrentChannelId(), data, function (res) {
            //     alert(Number(res.rescode) === 200 ? languageJSON.deleteSuc : languageJSON.deleteFaild);
            //     loadPage(_pageNO, typeName);
            // });
            var data = JSON.stringify({
                action: 'MultiDelete',
                channel_ids: checkedID,
                project_name: projectName
            });
            util.ajax('post', requestUrl + '/backend_mgt/v2/channels', data, function (res) {
                alert(Number(res.rescode) === 200 ? languageJSON.deleteSuc : languageJSON.deleteFaild);
                loadPage(_pageNO, typeName);
            });
        }
    }

    /**
     * 导入离线包
     */
    function importOffline() {
        // 上传文件按钮点击
        $('#channel-list-controls .btn-import-offline, #channel-ad-controls .btn-import-offline').click(function () {
            $('#file').attr("accept", ".zip");
            $('#file').trigger("click");
            MTRU.uploadType("import");
        })
        $("#file").unbind("change").change(function () {
            console.log('导入离线包')
            if ($("#page_upload").children().length == 0) {
                INDEX.upl();
            } else {
                $("#page_upload").css("display", "flex");
                $("#upload_box").css("display", "block");
                MTRU.beginUpload();
            }
        });
    }

    /**
     * 生成离线包
     */
    function exportOffline() {
        var ids = [];
        if (confirm(languageJSON.cf_exportOffline)) {
            $(".chn_cb[type=checkbox]:checked").each(function (index, el) {
                ids.push(Number(el.value));
            })
            var data = JSON.stringify({
                action: 'offline',
                project: projectName,
                id: ids
            });
            util.ajax('post', requestUrl + '/backend_mgt/v2/channels/', data, function (res) {
                if (Number(res.rescode) == 200) {
                    if(localStorage.getItem('ch_type') == 'ads'){
                        loadPage_ad(_pageNO, 'ads');
                    }else{
                        loadPage(_pageNO, 'regular');
                    }
                } else {
                    alert(languageJSON.al_exportFaild);
                }
                // exports.channelListRefrash = window.setInterval(function () {
                //     loadPage(_pageNO, 'regular');
                // }, 30000);
            });
        }
    }

    function exportOffline2() {
        var ids = [];
        if (confirm(languageJSON.cf_exportOffline2)) {
            $(".chn_cb[type=checkbox]:checked").each(function (index, el) {
                ids.push(Number(el.value));
            })
            var data = JSON.stringify({
                action: 'offline2',
                project: projectName,
                id: ids
            });
            util.ajax('post', requestUrl + '/backend_mgt/v2/channels/', data, function (res) {
                if (Number(res.rescode) == 200) {
                    loadPage_ad(_pageNO, 'ads');
                } else {
                    alert(languageJSON.al_exportFaild);
                }
                // exports.channelListRefrash = window.setInterval(function () {
                //     loadPage_ad(_pageNO, 'ads');
                // }, 30000);
            });
        }
    }



    function onSelectedItemChanged(adjustCount) {
        var selectedCount = typeof(adjustCount) === 'number' ? adjustCount : 0;
        $('#channel-table div').each(function (idx, el) {
            if ($(el).hasClass('checked')) {
                selectedCount++;
            }
        });
        var hasUncheckedItems = selectedCount !== ($('#channel-table tr').size() - 1);
        $('#channel-list-controls .select-all>i')
            .toggleClass('fa-square-o', hasUncheckedItems)
            .toggleClass('fa-check-square-o', !hasUncheckedItems);
        $('#channel-list-controls .btn-delete').prop('disabled', selectedCount !== 1);

    }

    function getChannelId(el) {
        var idAttr;
        while (el && !(idAttr = el.getAttribute('chnid'))) {
            el = el.parentNode;
        }
        return Number(idAttr);
    }

    function getCurrentChannelId() {
        return Number($('#channel-table div.checked')[0].parentNode.parentNode.getAttribute('chnid'));
    }

    // 加载页面数据
    function loadPage(pageNum, channelType) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        // loading
        $("#channel-table tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        changeControl(channelType);
        var CheckLevel = -1;
        if ($('#chn_toBeCheckedDiv button.btn-primary').length > 0) {
            CheckLevel = $('#chn_toBeCheckedDiv button.btn-primary').attr('value');
        }

        var searchKeyword = $('#channelSearch').val();

        var pager = {
            page: String(pageNum),
            total: '0',
            per_page: String(nDisplayItems),
            orderby: 'ID',
            sortby: '',
            keyword: searchKeyword,
            status: ''
        };
        var data = JSON.stringify({
            action: 'GetPage',
            project_name: projectName,
            CheckLevel: CheckLevel,
            Pager: pager
        });
        util.ajax('post', requestUrl + '/backend_mgt/v2/channels/', data, render);
    }

    // 渲染界面
    function render(json) {
        //翻页
        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#channel-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.Pager.total,
            pageSize: nDisplayItems,
            visiblePages: config.pager.visiblePages,
            first: config.pager.first,
            prev: config.pager.prev,
            next: config.pager.next,
            last: config.pager.last,
            page: config.pager.page,
            currentPage: _pageNO,
            onPageChange: function (num, type) {
                _pageNO = num;
                if (type === 'change') {
                    $(".select-all i").attr("class", "fa fa-square-o");
                    loadPage(_pageNO, 'regular');
                }
            }
        });

        $("#channel-table tbody").empty();
        //拼接
        if (json.Channels != undefined) {
            var chnData = json.Channels;
            var check_th = '';
            if (util.getLocalParameter('config_checkSwitch') == '1') {
                check_th = '<th class="chn_check">' + languageJSON.checkStatus + '</th>';
            }

            $("#channel-table tbody").append('<tr>' +
                '<th class="chn_checkbox" style="width:32px;"></th>' +
                '<th class="chn_name">' + languageJSON.channelName + '</th>' +
                check_th +
                '<th class="chn_portStatus text-center">' + languageJSON.chn_portStatus + '</th>' +
                '<th class="chn_publishedInfo text-center">' + languageJSON.chn_publishedInfo + '</th>' +
                '<th class="chn_create">' + languageJSON.chn_create + '</th>' +
                '<th class="chn_createTime  create-time">' + languageJSON.chn_createTime + '</th>' +
                '<th class="chn_operation text-center">' + languageJSON.chn_operation + '</th>' +
                '</tr>');
            if (chnData.length != 0) {
                for (var x = 0; x < chnData.length; x++) {
                    var check_td = '';
                    var check_status = '';
                    var chn_operation_td = '';
                    var portStatus = '<span class="label label-warning">' + languageJSON.gainStatusFaild + '</span>';
                    switch (chnData[x].Status) {
                        case -1:
                            portStatus = '';
                            break;
                        case 1:
                            portStatus = '<span class="label label-warning">' + languageJSON.pendingProd + '</span>';
                            break;
                        case 2:
                            portStatus = '<span class="label label-primary">' + languageJSON.producing + '</span>';
                            break;
                        case 3:
                            portStatus = '<span class="label label-success">' + languageJSON.prodSuc + '</span>';
                            break;
                        case 4:
                            portStatus = '<span class="label label-danger">' + languageJSON.prodFaild + '</span>';
                            break;
                        default:
                            break;
                    }

                    if (chnData[x].URL != null & chnData[x].Status == 3) {
                        chn_operation_td = '<td class="chn_operation">' +
                            '<a class="download-offline" href="' + chnData[x].URL + '" download="' + chnData[x].Name + '"><button type="button" class="btn btn-default btn-xs">' + languageJSON.download + '</button></a>' +
                            '</td>';
                    } else {
                        chn_operation_td = '<td class="chn_operation"></td>';
                    }

                    if (util.getLocalParameter('config_checkSwitch') == '1') {
                        var checkStatus;
                        check_status = "check_status=" + chnData[x].CheckLevel;
                        switch (chnData[x].CheckLevel) {
                            case 0:
                                checkStatus = '<span class="label label-primary">' + languageJSON.pendingSubmit + '</span>';
                                break;
                            case 1:
                                checkStatus = '<span class="label label-warning">' + languageJSON.pendingAudit + '</span>';
                                break;
                            case 2:
                                checkStatus = '<span class="label label-success">' + languageJSON.pass + '</span>';
                                break;
                            case 3:
                                checkStatus = '<span class="label label-danger">' + languageJSON.unpass + '</span>';
                                break;
                            default:
                                break;
                        }
                        check_td = '<td class="chn_check">' + checkStatus + '</td>';
                    }

                    var published_total = chnData[x].PublishedTotal;
                    var published_finished = chnData[x].PublishedFinished;

                    var chntr = '<tr ' + check_status + ' chnID="' + chnData[x].ID + '" chnName="' + chnData[x].Name + '" chnCU="' + chnData[x].CreateUserName + '">' +
                        '<td class="chn_checkbox"><input type="checkbox" id="chn_cb" class="chn_cb" chnID="' + chnData[x].ID + '" url="' + chnData[x].URL + '" value="' + chnData[x].ID + '"></td>' +
                        '<td class="chn_name" title="' + chnData[x].Name + '"><b><a href="#channel/edit?id=' + chnData[x].ID + '">' + chnData[x].Name + '</a></b></td>' +
                        check_td +
                        '<td class="chn_portStatus text-center">' + portStatus + '</td>' +
                        '<td class="chn_publishedInfo text-center" chnName="' + chnData[x].Name + '" chnID="' + chnData[x].ID + '"><a class="pointer"><strong>' +
                        published_finished + '/' + published_total + '</strong></a></td>' +
                        '<td class="chn_create" title="' + chnData[x].CreateUserName + '">' + chnData[x].CreateUserName + '</td>' +
                        '<td class="chn_createTime  create-time" title="' + chnData[x].CreateTime + '">' + chnData[x].CreateTime + '</td>' +
                        chn_operation_td +
                        '</tr>';
                    $("#channel-table tbody").append(chntr);
                }
            } else {
                $("#channel-table tbody").empty();
                $('#channel-table-pager').empty();
                $("#channel-table tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
            checkCheckBtns();
        }

        //复选框样式
        $('#channel-table input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        });
        //常规频道-点击选中
        $(".icheckbox_flat-blue").parent().parent().click(function () {
            // $(".table-responsive input[type='checkbox']").iCheck("uncheck");
            if ($(this).find("input").prop("checked") == true) {
                $(this).find("input").prop("checked", false);
                $(this).find("div").prop("class", "icheckbox_flat-blue");
                $(this).find("div").prop("aria-checked", "false");
            } else {
                $(this).find("input").prop("checked", true);
                $(this).find("div").prop("class", "icheckbox_flat-blue checked");
                $(this).find("div").prop("aria-checked", "true");
            }
            checkCheckBtns();
        })

        $('#channel-table tr').each(function (idx, el) {
            $(el).iCheck('uncheck');
            $(this).find('a:nth(1)').click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                showPublishInfo($(this).parent().parent());
            })
        });

        $(".icheckbox_flat-blue ins").click(function () {
            checkCheckBtns();
        });

        //发布详情
        $('.chn_detail').click(function (e) {
            var self = $(this);
            e.preventDefault();
            e.stopPropagation();
            var chnID = self.parent().attr('chnID');
            exports.chnID = chnID;
            util.cover.load('resources/pages/channel/published_detail.html');
        })
    }


    function checkCheck() {
        if (util.getLocalParameter('config_checkSwitch') == '0') {
            $('#chn_submit').css('display', 'none');
            $('#chn_pass').css('display', 'none');
            $('#chn_unpass').css('display', 'none');
            $('#chn_toBeCheckedDiv').css('display', 'none');
        }
        else if (util.getLocalParameter('config_canCheck') == '0') {
            $('#chn_pass').css('display', 'none');
            $('#chn_unpass').css('display', 'none');
        }

        var fromProgram = localStorage.getItem('fromProgram');

        if(fromProgram == 'ads'){
            loadPage_ad(_pageNO, 'ads');
        }else if(fromProgram == 'emergency'){
            loadPage_emergency(_pageNO, 'emergency');
            localStorage.setItem('ch_type', 'emergency');
        }else{
            if(isAdVersion){
                isShowRegular == 1 ? loadPage(_pageNO, 'regular') : loadPage_ad(1, 'ads');
            }else{
                loadPage(_pageNO, 'regular');
            }
            localStorage.setItem('ch_type', 'normal');
        }
    }

    /**
 * 校验批量操作的审核功能
 * util.getLocalParameter('config_checkSwitch') 权限开关 {0:关闭, 1:开启}
 */
    function checkCheckBtns() {
        $("#channel-list-controls .btn-export-offline, #channel-ad-controls .btn-export-offline2, #channel-ad-controls .btn-export-offline").attr('disabled', true);
        if (util.getLocalParameter('config_checkSwitch') == '0') {
            var checked = $("#channel-table input[type='checkBox']:checked");
            //判断选中个数
            // console.log('判断选中个数:'+checked.length)
            if (checked.length != '1') {
                $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                $('#channel-list-controls .btn-publish').attr('disabled', true);
                $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                $('#channel-list-controls .btn-copy').attr('disabled', true);
                
                $("#channel-list-controls .btn-export-offline, #channel-ad-controls .btn-export-offline2, #channel-ad-controls .btn-export-offline").removeAttr('disabled');
                $('#channel_prepub, #channel_delete').attr('disabled', true);
                if (checked.length == 0) {
                    $('#channel-list-controls .btn-delete').prop('disabled', true);
                    $("#channel-list-controls .btn-export-offline, #channel-ad-controls .btn-export-offline2, #channel-ad-controls .btn-export-offline").attr('disabled', true);
                } else {
                    $('#channel-list-controls .btn-delete').removeAttr('disabled');
                    $("#channel-list-controls .btn-export-offline, #channel-ad-controls .btn-export-offline2, #channel-ad-controls .btn-export-offline").removeAttr('disabled');
                }
            } else {
                $('#channel-list-controls .btn-publish-later').attr('disabled', false);
                $('#channel-list-controls .btn-publish').attr('disabled', false);
                $('#channel-list-controls .btn-publish-unit').attr('disabled', false);
                $('#channel-list-controls .btn-copy').attr('disabled', false);
                $('#channel-list-controls .btn-delete').prop('disabled', false);
                $("#channel-list-controls .btn-export-offline, #channel-ad-controls .btn-export-offline2, #channel-ad-controls .btn-export-offline").removeAttr('disabled');
                $('#channel_prepub, #channel_delete').attr('disabled', false);
            }
        } else {
            if (util.getLocalParameter('config_canCheck') == '0') {
                var checked = $("#channel-table input[type='checkBox']:checked");
                //判断选中个数
                if (checked.length != '1') {
                    $('#chn_submit').attr('disabled', true);
                    $('#chn_pass').attr('disabled', true);
                    $('#chn_unpass').attr('disabled', true);
                    $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                    $('#channel-list-controls .btn-publish').attr('disabled', true);
                    $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                    $('#channel-list-controls .btn-copy').attr('disabled', true);
                    $('#channel-list-controls .btn-delete').prop('disabled', true);
                    if (checked.length == 0) {
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    } else {
                        $("#channel-list-controls .btn-export-offline").removeAttr('disabled');
                        checked.each(function (index, el) {
                            if ($(el).parents("tr").attr('check_status') != '2') {
                                $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                                return false;
                            }
                        })
                    }
                } else {
                    //已通过
                    if ($(checked).parent().parent().parent().attr('check_status') == '2') {
                        $('#chn_submit').attr('disabled', true);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', false);
                        $('#channel-list-controls .btn-publish').attr('disabled', false);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', false);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        if (config.userName == $(checked).parent().parent().parent().attr('chnCU')) {
                            $('#channel-list-controls .btn-delete').prop('disabled', false);
                        } else {
                            $('#channel-list-controls .btn-delete').prop('disabled', true);
                        }
                        $("#channel-list-controls .btn-export-offline").removeAttr('disabled');
                    }
                    //未通过
                    else if ($(checked).parent().parent().parent().attr('check_status') == '3') {
                        $('#chn_submit').attr('disabled', true);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                        $('#channel-list-controls .btn-publish').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        if (config.userName == $(checked).parent().parent().parent().attr('chnCU')) {
                            $('#channel-list-controls .btn-delete').prop('disabled', false);
                        } else {
                            $('#channel-list-controls .btn-delete').prop('disabled', true);
                        }
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    }
                    //待审核
                    else if ($(checked).parent().parent().parent().attr('check_status') == '1') {
                        $('#chn_submit').attr('disabled', true);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                        $('#channel-list-controls .btn-publish').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        if (config.userName == $(checked).parent().parent().parent().attr('chnCU')) {
                            $('#channel-list-controls .btn-delete').prop('disabled', false);
                        } else {
                            $('#channel-list-controls .btn-delete').prop('disabled', true);
                        }
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    }
                    //待提交
                    else {
                        $('#chn_submit').attr('disabled', false);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                        $('#channel-list-controls .btn-publish').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        if (config.userName == $(checked).parent().parent().parent().attr('chnCU')) {
                            $('#channel-list-controls .btn-delete').prop('disabled', false);
                        } else {
                            $('#channel-list-controls .btn-delete').prop('disabled', true);
                        }
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    }
                }
            } else {
                var checked = $("#channel-table input[type='checkBox']:checked");
                if (checked.length != '1') {
                    $('#chn_submit').attr('disabled', true);
                    $('#chn_pass').attr('disabled', true);
                    $('#chn_unpass').attr('disabled', true);
                    $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                    $('#channel-list-controls .btn-publish').attr('disabled', true);
                    $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                    $('#channel-list-controls .btn-copy').attr('disabled', true);
                    $('#channel-list-controls .btn-delete').prop('disabled', true);
                    if (checked.length == 0) {
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    } else {
                        $("#channel-list-controls .btn-export-offline").removeAttr('disabled');
                        checked.each(function (index, el) {
                            if ($(el).parents("tr").attr('check_status') != '2') {
                                $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                                return false;
                            }
                        })
                    }
                } else {
                    //已通过和未通过
                    if ($(checked).parent().parent().parent().attr('check_status') == '2') {
                        $('#chn_submit').attr('disabled', true);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', false);
                        $('#channel-list-controls .btn-publish').attr('disabled', false);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', false);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        $("#channel-list-controls .btn-export-offline").removeAttr('disabled');
                    }
                    else if ($(checked).parent().parent().parent().attr('check_status') == '3') {
                        $('#chn_submit').attr('disabled', true);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                        $('#channel-list-controls .btn-publish').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    }
                    //待审核
                    else if ($(checked).parent().parent().parent().attr('check_status') == '1') {
                        $('#chn_submit').attr('disabled', true);
                        $('#chn_pass').attr('disabled', false);
                        $('#chn_unpass').attr('disabled', false);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                        $('#channel-list-controls .btn-publish').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    }
                    //待提交
                    else {
                        $('#chn_submit').attr('disabled', false);
                        $('#chn_pass').attr('disabled', true);
                        $('#chn_unpass').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-later').attr('disabled', true);
                        $('#channel-list-controls .btn-publish').attr('disabled', true);
                        $('#channel-list-controls .btn-publish-unit').attr('disabled', true);
                        $('#channel-list-controls .btn-copy').attr('disabled', false);
                        $("#channel-list-controls .btn-export-offline").attr('disabled', true);
                    }
                }
            }
        }
    }

    //切换控制按钮
    function changeControl(channelType) {
        $("#mtrChoise li").removeClass('active');
        $("#mtrChoise li").each(function () {
            if ($(this).attr("typename") == channelType) {
                $(this).addClass("active");
            }
        })
        switch (channelType) {
            case 'regular':
                $('#channel-ad-controls, #channel-emergency-controls, .btn-export-offline2').hide();
                $('#channel-list-controls').show();
                $('.btn-publish').parent().show();
                break;
            case 'ads':
                $('#channel-list-controls, #channel-emergency-controls').hide();
                $('.btn-publish').parent().hide();
                $('#channel-ad-controls, .btn-export-offline2').show();
                break;
            case 'emergency':
                $('#channel-list-controls, #channel-ad-controls, .btn-export-offline2').hide();
                $('#channel-emergency-controls').show();
                $('.btn-publish').parent().show();
                
            default:
                break;
        }
    }

    function checkAdsBtn() {
        var checked = $("#channel-table input[type='checkBox']:checked");

    }

    //广告频道
    function loadPage_ad(pageNum, channelType) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $("#channel-table tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        changeControl(channelType);
        var pager = {
            page: pageNum,
            per_page: nDisplayItems,
            keyword: $('#channelSearch').val(),
        };
        var data = JSON.stringify({
            action: 'query',
            project_name: projectName,
            id: '*',
            pager: pager
        });
        util.ajax('post', requestUrl + '/backend_mgt/advertisement_channel', data, render_ad);
    }

    function render_ad(json) {
        //翻页
        if(json.total == undefined){
            var totalPages = 1;
        }else{
            var totalPages = Math.ceil(json.total / nDisplayItems);
            totalPages = Math.max(totalPages, 1);
        }
        $('#channel-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.total,
            pageSize: nDisplayItems,
            visiblePages: config.pager.visiblePages,
            first: config.pager.first,
            prev: config.pager.prev,
            next: config.pager.next,
            last: config.pager.last,
            page: config.pager.page,
            currentPage: _pageNO,
            onPageChange: function (num, type) {
                _pageNO = num;
                if (type === 'change') {
                    $(".select-all i").attr("class", "fa fa-square-o");
                    loadPage_ad(_pageNO, 'ads');
                }
            }
        });

        $("#channel-table tbody").empty();
        //拼接
        if (json.adv_cs != undefined) {
            var chnData = json.adv_cs;
            $("#channel-table tbody").append('<tr>' +
                '<th class="chn_checkbox" style="width:32px;"></th>' +
                '<th class="chn_name">' + languageJSON.channelName + '</th>' +
                '<th class="chn_portStatus text-center">' + languageJSON.chn_portStatus + '</th>' +
                '<th class="chn_counts">' + languageJSON.chn_counts + '</th>' +
                '<th class="chn_createTime  create-time">' + languageJSON.chn_createTime + '</th>' +
                '<th class="chn_operation text-center">' + languageJSON.chn_operation + '</th>' +
                '</tr>');
            if (chnData.length != 0) {
                for (var x = 0; x < chnData.length; x++) {

                    var chn_operation_td = '';
                    var portStatus = '<span class="label label-warning">' + languageJSON.gainStatusFaild + '</span>';
                    switch (chnData[x].status) {
                        case -1:
                            portStatus = '';
                            break;
                        case 1:
                            portStatus = '<span class="label label-warning">' + languageJSON.pendingProd + '</span>';
                            break;
                        case 2:
                            portStatus = '<span class="label label-primary">' + languageJSON.producing + '</span>';
                            break;
                        case 3:
                            portStatus = '<span class="label label-success">' + languageJSON.prodSuc + '</span>';
                            break;
                        case 4:
                            portStatus = '<span class="label label-danger">' + languageJSON.prodFaild + '</span>';
                            break;
                        default:
                            break;
                    }

                    if (chnData[x].url != null && chnData[x].status == 3) {
                        chn_operation_td = '<td class="chn_operation">' +
                            '<a class="download-offline" href="' + chnData[x].url + '" download="' + chnData[x].name + '"><button type="button" class="btn btn-default btn-xs">' + languageJSON.download + '</button></a>' +
                            '</td>';
                    } else {
                        chn_operation_td = '<td class="chn_operation"></td>';
                    }

                    var chntr = '<tr chnID="' + chnData[x].id + '" termid="' + chnData[x].term_id + '" chnName="' + chnData[x].name +  '">' +
                        '<td class="chn_checkbox"><input type="checkbox" id="chn_cb" class="chn_cb" chnID="' + chnData[x].id + '" value="' + chnData[x].id + '"></td>' +
                        '<td class="chn_name" title="' + chnData[x].name + '"><b><a href="#channel/adp_edit?id=' + chnData[x].channel_program_id + '">' + chnData[x].name + '</a></b></td>' +
                        '<td class="chn_portStatus text-center">' + portStatus + '</td>' +
                        '<td class="chn_counts" title="' + chnData[x].adv_pl_count + '">' + chnData[x].adv_pl_count + '</td>' +
                        '<td class="chn_createTime  create-time" title="' + chnData[x].create_time + '">' + chnData[x].create_time + '</td>' +
                        chn_operation_td +
                        '</tr>';
                    
                    $("#channel-table tbody").append(chntr);
                    $('#channel-table tr[chnID="' + chnData[x].id + '"]').data('publishid', chnData[x].publish_id)
                }
            } else {
                $("#channel-table tbody").empty();
                $('#channel-table-pager').empty();
                $("#channel-table tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
            checkCheckBtns();
        }else{
            $("#channel-table tbody").html('<h5 style="text-align:center;color:grey;">(空)</h5>');
        }

        //复选框样式
        $('#channel-table input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        });
        //广告频道-点击选中
        $(".icheckbox_flat-blue").parent().parent().click(function () {
            // $(".table-responsive input[type='checkbox']").iCheck("uncheck");
            if ($(this).find("input").prop("checked") == true) {
                $(this).find("input").prop("checked", false);
                $(this).find("div").prop("class", "icheckbox_flat-blue");
                $(this).find("div").prop("aria-checked", "false");
            } else {
                $(this).find("input").prop("checked", true);
                $(this).find("div").prop("class", "icheckbox_flat-blue checked");
                $(this).find("div").prop("aria-checked", "true");
            }
            checkCheckBtns();
        })

        $('#channel-table tr').each(function (idx, el) {
            $(el).iCheck('uncheck');
            // $(this).find('a:nth(1)').click(function (e) {
            //     e.preventDefault();
            //     e.stopPropagation();
            //     showPublishInfo($(this).parent().parent());
            // })
        });

        $(".icheckbox_flat-blue ins").click(function () {
            checkCheckBtns();
        })

        $('#channel-table tr a').on('click', function () {
            var _publishid = $(this).parents('tr').data('publishid');
            var adChannelName = $(this).parents('tr').attr('chnname');
            var _termid = $(this).parents('tr').attr('termid') 
            var _chnid = $(this).parents('tr').attr('chnid');
            localStorage.setItem('publishid', _publishid);
            localStorage.setItem('chnid', _chnid);
            localStorage.setItem('adChannelName', adChannelName);
            localStorage.setItem('term_id', _termid);
            localStorage.removeItem('adChannel');
        })

    }


    //紧急插播频道
    function loadPage_emergency(pageNum, typeName) {
        $("#channel-table tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        changeControl(typeName);
        renderEmergencyChannel(pageNum);
        bindEmergencyEvent();
    }

    function renderEmergencyChannel(pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        var pager = {
            page: pageNum,
            per_page: (nDisplayItems),
            keyword: $('#channelSearch').val()
        };
        var data = JSON.stringify({
            action: 'query',
            project_name: projectName,
            pager: pager
        });
        util.ajax('post', requestUrl + '/backend_mgt/emergency', data, function (json) {
            $("#channel-table tbody").empty();
            if (json.rescode == 200) {
                var totalPages = Math.ceil(json.total / nDisplayItems);
                totalPages = Math.max(totalPages, 1);
                $('#channel-table-pager').jqPaginator({
                    // totalPages: totalPages,
                    totalCounts: json.total,
                    pageSize: nDisplayItems,
                    visiblePages: config.pager.visiblePages,
                    first: config.pager.first,
                    prev: config.pager.prev,
                    next: config.pager.next,
                    last: config.pager.last,
                    page: config.pager.page,
                    currentPage: _pageNO,
                    onPageChange: function (num, type) {
                        _pageNO = num;
                        if (type === 'change') {
                            $(".select-all i").attr("class", "fa fa-square-o");
                            loadPage_emergency(_pageNO, 'emergency');
                        }
                    }
                });
                $("#channel-table tbody").empty();
                //拼接
                if (json.channels != undefined) {
                    var mtrData = json.channels;
                    $("#channel-table tbody").append('<tr>' +
                        '<th class="chn_checkbox" style="width:32px;"></th>' +
                        '<th class="chn_name">' + languageJSON.channelName + '</th>' +
                        '<th class="chn_createTime  create-time">' + languageJSON.chn_createTime + '</th>' +
                        '<th class="chn_publishedInfo text-center">' + languageJSON.chn_publishedInfo + '</th>' +
                        '<th class="chn_operation text-center">' + languageJSON.chn_operation + '</th>' +
                        '</tr>');
                    if (mtrData.length != 0) {
                        for (var x = 0; x < mtrData.length; x++) {
                            var isWithdraw = false, isCancel = false;
                            if (mtrData[x].status == '未激活') {
                                isCancel = true;
                            } else {
                                isWithdraw = true;
                            }
                            var mtrtr = '<tr chnid="' + mtrData[x].id + '">' +
                                '<td class="mtr_checkbox"><input type="checkbox" class="mtr_cb" chnid="' + mtrData[x].id + '"></td>' +
                                '<td class="channelName"><a href="#channel/edit?id=' + mtrData[x].id + '">' + mtrData[x].name + '</a></td>' +
                                '<td class="create-time chn_createTime"><span>' + mtrData[x].create_time + '</span ></td>' +
                                '<td class="chn_publishedInfo text-center">' + mtrData[x].status + '</td>' +
                                '<td class="chn_operation text-center"><button class="btn btn-default btn-xs activateCh">激活</button><button class="btn btn-default btn-xs cancelCh">取消</button><button class="btn btn-default btn-xs withdrawCh">撤回</button></td>' +
                                '</tr>';
                            $("#channel-table tbody").append(mtrtr);
                            $('tr[chnid="' + mtrData[x].id + '"] .cancelCh').prop('disabled', isCancel);
                            $('tr[chnid="' + mtrData[x].id + '"] .withdrawCh').prop('disabled', isWithdraw);
                        }
                        bindListEvent();

                    } else { 
                        $("#channel-table tbody").empty();
                        $('#channel-table-pager').empty();
                        $("#channel-table tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
                    }
                }
                //复选框样式
                $('#channel-table input[type="checkbox"]').iCheck({
                    checkboxClass: 'icheckbox_flat-blue',
                    radioClass: 'iradio_flat-blue'
                });
                //紧急插播-点击选中
                $(".icheckbox_flat-blue").parent().parent().click(function () {
                    // $(".table-responsive input[type='checkbox']").iCheck("uncheck");
                    if ($(this).find("input").prop("checked") == true) {
                        $(this).find("input").prop("checked", false);
                        $(this).find("div").prop("class", "icheckbox_flat-blue");
                        $(this).find("div").prop("aria-checked", "false");
                    } else {
                        $(this).find("input").prop("checked", true);
                        $(this).find("div").prop("class", "icheckbox_flat-blue checked");
                        $(this).find("div").prop("aria-checked", "true");
                    }
                    checkCheckBtns();
                })

                $('#channel-table tr').each(function (idx, el) {
                    $(el).iCheck('uncheck');
                    $(this).find('a:nth(1)').click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        showPublishInfo($(this).parent().parent());
                    })
                });

                $(".icheckbox_flat-blue ins").click(function () {
                    checkCheckBtns();
                })
                
            }
         });
    }

    function bindEmergencyEvent() {
        //$('#createEmergency').on('click', function () {
        //    localStorage.setItem('ch_type', 'emergency');
        //});

        $('#channel_prepub').off('click').on('click', function () {
            prepublish();
        });

        $('#channel_delete').off('click').on('click', function () {
            var chName = $('.icheckbox_flat-blue input:checked').parents('td').next().text();
            
            if (confirm('是否删除该紧急频道：' + chName )==true){
                deleteEmergencyChannel(chName);
            }else{
                return false;
            }
            
        })

    }

    function bindListEvent() {
        $('.activateCh').on('click', function () {
            var id = $(this).parents('tr').attr('chnid');
            var name = $(this).find('a').text();
            operationChannel(id,name, 'activate');
        })

        $('.cancelCh').on('click', function () {
            var id = $(this).parents('tr').attr('chnid');
            var name = $(this).find('a').text();
            operationChannel(id, name, 'cancel');
        })

        $('.withdrawCh').on('click', function () {
            var id = $(this).parents('tr').attr('chnid');
            var name = $(this).find('a').text();
            operationChannel(id, name, 'withdraw');
        })
    }

    function prepublish() {
        publishChannelLater('emergency');
    }

    function deleteEmergencyChannel(chName) {
        var id = getCurrentChannelId();
        var post_data = JSON.stringify({
            action: 'query_terms',
            project_name: projectName,
            id: id,
            active: -1, // 撤销
            category_id: 1,
            pager: {
                keyword: '',
                page: 1,
                per_page: 100000
            }
        })
        var url = requestUrl + '/backend_mgt/emergency';
        util.ajax('post', url, post_data, function (msg) {
            if (msg.rescode == 200) {
                console.log('查询成功!');
                var termLists = msg.terms;
                var data = JSON.stringify({
                    action: 'delete',
                    project_name: projectName,
                    id: id,
                    term_list: termLists,
                    category_list: [],
                    name: chName,
                });

                util.ajax('post', url, data, function (res) {
                    if (res.rescode == 200) {
                        console.log('删除成功！');
                        var _this = $('#channel-table tr[chnid="' + id + '"]')
                        _this.css('opacity', 0);
                        setTimeout(function () {
                            _this.remove();
                        }, 400)
                    }
                })
            }
         })
    }


    function operationChannel(id, name, type) {
        util.cover.load('resources/pages/terminal/getTermClassAndTerm.html');
        getClassAndTerm.playlistID = Number(id);
        var _action = '';
        if (type == 'activate') {
            getClassAndTerm.title = languageJSON.title5;
            _action = 'activate';
        } else if (type == 'cancel') {
            getClassAndTerm.title = languageJSON.title6;
            _action = 'deactivate';
        } else {
            getClassAndTerm.title = languageJSON.title7;
            _action = 'withdraw';
        }
        getClassAndTerm.category = category;
        getClassAndTerm.operation = type;
        getClassAndTerm.save = function (data) {
            var terms = data.termList.map(function (v) {
                return {
                    'id': Number(v.termID),
                    'name': v.name
                }
            })
            var category_ids = data.categoryList.map(function (v) {
                return {
                    'id': Number(v.categoryID),
                    'name': v.nodeContent
                }
            })
            var post_data = JSON.stringify({
                project_name: projectName,
                action: _action,
                category_list: category_ids,
                term_list: terms,
                name: name,
                id: id,
            });
            var url = requestUrl + '/backend_mgt/emergency';
            util.ajax('post', url, post_data, function (msg) {
                if (msg.rescode == 200) {
                    util.cover.close();
                    alert('操作成功');
                    loadPage_emergency(_pageNO, 'emergency');
                    // var _this = $('#channel-table tr[chnid="' + id + '"]');
                    // if (type == 'activate') {
                    //     _this.find('.cancelCh').prop('disabled', false);
                    //     _this.find('.withdrawCh').prop('disabled', true);
                    //     _this.find('.chn_publishedInfo ').text('已激活');
                    // } else if (type == 'cancel') {
                    //     _this.find('.cancelCh').prop('disabled', true);
                    //     _this.find('.withdrawCh').prop('disabled', false);
                    //     _this.find('.chn_publishedInfo ').text('未激活');
                    // } else {
                    //     return;
                    // }
                }
                else {
                    alert('操作失败!')
                    util.cover.close();
                }
            });
        }
    
    }

    function checkUserAuth () {
        var data = JSON.stringify({
            action: 'GetFunctionModules',
            project_name: projectName,
            UserName: config.userName,
        });
        var url = config.serverRoot + '/backend_mgt/v2/userdetails';
        util.ajax('post', url, data, function (json) {
            var jdtData = json.FunctionModules;
            // jdtData.map(function(v){
            //     if(v.ModuleID == 11){
            //         isShowRegular = v.ReadWriteAuth;
            //     }else if(v.ModuleID == 12){
            //         isShowEmergency = v.ReadWriteAuth;
            //     }
            // })
            // if(isShowRegular == 0){
            //     $('#mtrChoise').find('li[typename="regular"]').remove();
            // }
            // if(isShowEmergency == 0){
            //     $('#mtrChoise').find('li[typename="emergency"]').remove();
            // }
            checkCheck();
        })
    }

    function getJurisdiction(){
        if(currentMenu.menu.indexOf("常规频道") == '-1'){
            $('#mtrLisTitle').parent('li').remove()
        }
        if(currentMenu.menu.indexOf("广告频道") == '-1'){
            $('#mtrAdTitle').parent('li').remove()
        }
        if(currentMenu.menu.indexOf("紧急插播") == '-1'){
            $('#mtrEmergency').parent('li').remove()
        }
        var defaultClick = ''
        if(localStorage.getItem('btnClick_type')){
            if(localStorage.getItem('btnClick_type') == 'ads') {
                defaultClick = 'mtrAdTitle'
            }else if(localStorage.getItem('btnClick_type') == 'emergency'){
                defaultClick = 'mtrEmergency'
            }else if(localStorage.getItem('btnClick_type') == 'normal'){
                defaultClick = 'mtrLisTitle'
            }
        }
        // checkCheck()
        setTimeout(function(){
            if(defaultClick){
                $('#'+defaultClick).trigger("click")
            }else{
                //  默认点击第一个
                $('#mtrChoise').find('a:eq(0)').trigger("click")
            }
        },1)
    }

    //获取系统版本
    function getSysInfo(){
        var data = JSON.stringify({
            action: 'get_ims_version',
            project_name: projectName,
        });
        var url = config.serverRoot + '/backend_mgt/v2/sysinfo';
        util.ajax('post', url, data, function (json) {
            //  base_XXX        普通版
            //  adv_XXX         广告版
            var version = json.split('_');
            if(version[0] === 'adv'){
                //  联屏发布按钮
                $('.btn-publish-unit').show()
                //  预发布按钮
                $('.btn-publish-later').show()
            }
        })
    }

});


