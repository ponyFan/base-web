define(function (require, exports, module) {

    var TREE = require("common/treetree.js"),
        CONFIG = require("common/config.js"),
        UTIL = require("common/util.js"),
        SINGLETERMCLASS = require("pages/terminal/getSingleTermClass.js"),
        _tree,
        _timerLoadTermList,
        _pagesize,
        // _pagesize = 50,
        _pageNO = 1,
        _checkList = [],
        _snapTermID,
        _termStatusCount,
        _editTreeClassInput,
        last,
        languageJSON = CONFIG.languageJson.termList;
    exports.init = function () {
        selectLanguage();
        initTree();
        initEvent();
        window.onpopstate = function(){
            localStorage.removeItem('renderDone');
            window.onpopstate = undefined
        };
        localStorage.setItem('behavior', 'edit');
    }

    exports.loadTermList = function () {
        loadTermList(_pageNO);
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".termTree-title").html(languageJSON.termTreeTitle);
        $(".term-box-title").html(languageJSON.termBoxTitle);
        $("#tct_edit").attr("title", languageJSON.edit);
        $("#tct_delete").attr("title", languageJSON.delete);
        $("#tct_add").attr("title", languageJSON.add);
        $("#tct_config").attr("title", languageJSON.batchConfiguration);
        $("#term_search").attr("placeholder", languageJSON.searchByIP);
        $("#term_batch_move").html(languageJSON.termMove);
        $("#term_batch_delete").html(languageJSON.delete);
        $("#term_batch_start").html(languageJSON.awaken);
        $("#term_batch_stop").html(languageJSON.dormancy);
        $("#term-status .term-btn-running").html(languageJSON.running + '（<span id="term_running"></span>）');
        $("#term-status .term-btn-shutdown").html(languageJSON.dormancy + '（<span id="term_shutdown"></span>）');
        $("#term-status .term-btn-offline").html(languageJSON.offline + '（<span id="term_offline"></span>）');
        $("#term_batch_move").html(languageJSON.termMove);
    }

    function setBatchBtn() {
        if (_checkList.length === 0) {
            $('#term_batch_move').addClass('disabled');
            $('#term_batch_delete').addClass('disabled');
            $('#term_batch_start').addClass('disabled');
            $('#term_batch_stop').addClass('disabled');
        }
        else {
            $('#term_batch_move').removeClass('disabled');
            $('#term_batch_delete').removeClass('disabled');

            if (_checkList.hasOffline() || _checkList.hasRunning()) {
                $('#term_batch_start').addClass('disabled');
            } else {
                $('#term_batch_start').removeClass('disabled');
            }

            if (_checkList.hasOffline() || _checkList.hasShutdown()) {
                $('#term_batch_stop').addClass('disabled');
            } else {
                $('#term_batch_stop').removeClass('disabled');
            }
        }
    }

    function initEvent() {

        // 终端配置按钮点击
        $('#tct_config').click(function () {
            var li = $('#termclass-tree').find('.focus');
            // 未选中分类不能配置
            if (li.length === 0) {
                return;
            }
            var configTermClass = require('pages/terminal/configTermClass.js');
            configTermClass.classID = Number(li.attr("node-id"));
            configTermClass.className = $('#termlist-title').html();
            configTermClass.requireJS = "pages/terminal/list.js";
            UTIL.cover.load('resources/pages/terminal/configTermClass.html');
        })

        // refresh
        $('#term_refresh').click(function () {
            if ($('#term-status button.btn-primary').length > 0) {
                $('#term-status button.btn-primary').addClass('btn-defalut');
                $('#term-status button.btn-primary').removeClass('btn-primary');
            }
            loadTermList(_pageNO);
        })

        // serach
        $("#term_search").keyup(function (event) {
            if (event.keyCode == 13) {
                var searchKeyword = $.trim($('#term_search').val());
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                onSearch(event);
            }
        });
        $("#term_search").next().click(onSearch);
        function onSearch(event) {
            last = event.timeStamp;         //利用event的timeStamp来标记时间，这样每次的keyup事件都会修改last的值，注意last必需为全局变量
            setTimeout(function () {          //设时延迟0.5s执行
                if (last - event.timeStamp == 0) //如果时间差为0（也就是你停止输入0.5s之内都没有其它的keyup事件发生）则做你想要做的事
                {
                    //初始化状态
                    var searchKeyword = $.trim($('#term_search').val());
                    if (!UTIL.isValidated('keyword', searchKeyword)) return;
                    $('#term-status button').removeClass('btn-primary').addClass('btn-defalut');
                    _pageNO = 1;
                    loadTermList(_pageNO);
                }
            }, 500);
        }

        // 筛选终端
        $('#term-status button').each(function (i, e) {
            $(this).click(function () {
                $(this).siblings().removeClass('btn-primary');
                $(this).siblings().addClass('btn-defalut');

                var isFocus = $(this).hasClass('btn-primary');
                $(this).removeClass(isFocus ? 'btn-primary' : 'btn-defalut');
                $(this).addClass(isFocus ? 'btn-defalut' : 'btn-primary');
                loadTermList(1);
            })
        })

        // 全选，不全选
        $('#term-list-select-all').click(function () {
            var check = $('#term-list-select-all>i').hasClass('fa-square-o');
            $('#term-list-select-all>i').toggleClass('fa-square-o', !check);
            $('#term-list-select-all>i').toggleClass('fa-check-square-o', check);
            $('#term_list tr input[type="checkbox"]').iCheck((check ? 'check' : 'uncheck'));
        })
        setBatchBtn();

        // 批量删除
        $('#term_batch_delete').click(function () {

            if ($(this).hasClass('disabled')) {
                return;
            }
            
            if (confirm(languageJSON.cf_delete)) {
                var data = {
                    "project_name": CONFIG.projectName,
                    "action": "deleteTerms",
                    "termList": _checkList
                }

                UTIL.ajax(
                    'POST',
                    CONFIG.serverRoot + '/backend_mgt/v2/term',
                    JSON.stringify(data),
                    function (data) {
                        if (data.rescode === '200') {
                            // 复原筛选框
                            if ($('#term-status button.btn-primary').length > 0) {
                                $('#term-status button.btn-primary').addClass('btn-defalut');
                                $('#term-status button.btn-primary').removeClass('btn-primary');
                            }
                            loadTermList();
                        } else {
                            alert(languageJSON.al_delError + data.errInfo);
                        }
                    }
                )
            }

        })

        // 批量唤醒
        $('#term_batch_start').click(function () {

            if ($(this).hasClass('disabled')) {
                return;
            }

            if (confirm(languageJSON.cf_awaken)) {
                var data = {
                    "project_name": CONFIG.projectName,
                    "action": "termPowerOnMulti",
                    "termList": _checkList
                }

                UTIL.ajax(
                    'POST',
                    CONFIG.serverRoot + '/backend_mgt/v2/term',
                    JSON.stringify(data),
                    function (data) {
                        if (data.rescode === '200') {
                            alert(languageJSON.al_comSuc);
                            loadTermList();
                        } else {
                            alert(languageJSON.al_comFaild + data.errInfo);
                        }
                    }
                )
            }

        })

        // 批量休眠
        $('#term_batch_stop').click(function () {

            if ($(this).hasClass('disabled')) {
                return;
            }

            if (confirm(languageJSON.cf_dormancy)) {
                var data = {
                    "project_name": CONFIG.projectName,
                    "action": "termPowerOffMulti",
                    "termList": _checkList
                }

                UTIL.ajax(
                    'POST',
                    CONFIG.serverRoot + '/backend_mgt/v2/term',
                    JSON.stringify(data),
                    function (data) {
                        if (data.rescode === '200') {
                            alert(languageJSON.al_comSuc);
                            loadTermList();
                        } else {
                            alert(languageJSON.al_comFaild + data.errInfo);
                        }
                    }
                )
            }

        })

        // 批量移动
        $('#term_batch_move').click(function () {

            if ($(this).hasClass('disabled')) {
                return;
            }

            SINGLETERMCLASS.save = function (id) {

                var data = {
                    "project_name": CONFIG.projectName,
                    "action": "changeTermsCategory",
                    "categoryID": id,
                    "termList": _checkList
                }

                UTIL.ajax('POST',
                    CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                    JSON.stringify(data),
                    function (data) {
                        if (data.rescode !== '200') {
                            alert(languageJSON.al_comFaild)
                        } else {
                            UTIL.cover.close();
                            // 复原筛选框
                            if ($('#term-status button.btn-primary').length > 0) {
                                $('#term-status button.btn-primary').addClass('btn-defalut');
                                $('#term-status button.btn-primary').removeClass('btn-primary');
                            }
                            loadTermList(_pageNO);
                        }
                    }
                )
            }
            SINGLETERMCLASS.title = languageJSON.termMove;
            UTIL.cover.load('resources/pages/terminal/getSingleTermClass.html');

        })
    }

    _checkList.add = function (id, status) {
        _checkList.push({'termID': id, 'status': status});
    }

    _checkList.delete = function (id) {
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i].termID === id) {
                _checkList.splice(i, 1);
                return;
            }
        }
    }

    // hasOffline
    _checkList.hasOffline = function () {
        var boolean = false;
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i].status === 'offline') {
                boolean = true;
                break;
            }
        }
        return boolean;
    }

    // hasRunning
    _checkList.hasRunning = function () {
        var boolean = false;
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i].status === 'running') {
                boolean = true;
                break;
            }
        }
        return boolean;
    }

    // hasShutdown
    _checkList.hasShutdown = function () {
        var boolean = false;
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i].status === 'shutdown') {
                boolean = true;
                break;
            }
        }
        return boolean;
    }

    function onCheckBoxChange() {

        // 设置是否全选
        var ifSelAll = ($('#term_list tr').length === _checkList.length);
        $('#term-list-select-all>i').toggleClass('fa-square-o', !ifSelAll);
        $('#term-list-select-all>i').toggleClass('fa-check-square-o', ifSelAll);
    }

    function loadTermList(pageNum) {
        _pagesize = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);

        var dom = $('#termclass-tree').find('.focus');

        // 未选中分类不加载
        if (dom.length === 0) {
            return;
        }
        $('#termlist-title').html(_tree.getFocusName(dom));

        // loading
        $('#term_list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        if (pageNum !== undefined) {
            _pageNO = pageNum;
        } else {
            _pageNO = 1;
        }

        /*if(_timerLoadTermList){
         clearInterval(_timerLoadTermList);
         }

         if($('#termclass-tree').length > 0){
         _timerLoadTermList = setInterval(function(){loadTermList()}, CONFIG.termListLoadInterval);
         }
         else{
         return;
         }*/

        // loadlist start
        var searchKeyword = $.trim($('#term_search').val());
        var termClassId = $('#termclass-tree').find('.focus').attr('node-id');

        if (termClassId === '') {
            //新建终端分类时, 创建空列表页
            loadEmptyList();
            return;
        }
        //新建终端分类时, 创建空列表页 结束

        var status = '';
        if ($('#term-status button.btn-primary').length > 0) {
            status = $('#term-status button.btn-primary').attr('value');
        }

        var data = {
            "project_name": CONFIG.projectName,
            "action": "getTermList",
            "categoryID": termClassId,
            "Pager": {
                "total": -1,
                "per_page": _pagesize,
                "page": _pageNO,
                "orderby": "",
                "sortby": "",
                "keyword": searchKeyword,
                "status": status
            }
        }

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
            JSON.stringify(data),
            function (data) {
                if (data.rescode != 200) {
                    alert(languageJSON.al_getListFaild + '：' + rescode.errInfo);
                    return;
                }

                // 记录终端状态数
                if ($('#term-status button.btn-primary').length === 0) {
                    _termStatusCount = {
                        total: data.totalStatistic.totalTermNum,
                        online: data.totalStatistic.onlineTermNum,
                        shutdown: data.totalStatistic.shutdownTermNum,
                        running: data.totalStatistic.onlineTermNum - data.totalStatistic.shutdownTermNum,
                        offline: data.totalStatistic.totalTermNum - data.totalStatistic.onlineTermNum,
                        downloadFileNum: data.totalStatistic.downloadFileNum,
                        downloadAllFileNum: data.totalStatistic.downloadAllFileNum,
                        preDownloadFileNum: data.totalStatistic.preDownloadFileNum,
                        preDownloadAllFileNum: data.totalStatistic.preDownloadAllFileNum
                    };
                }

                // set pagebar
                var totalCounts = Math.max(data.totalStatistic.totalTermNum, 1);

                $('#term-table-pager').jqPaginator({
                    totalCounts: totalCounts,
                    pageSize: _pagesize,
                    visiblePages: CONFIG.pager.visiblePages,
                    first: CONFIG.pager.first,
                    prev: CONFIG.pager.prev,
                    next: CONFIG.pager.next,
                    last: CONFIG.pager.last,
                    page: CONFIG.pager.page,
                    currentPage: _pageNO,
                    onPageChange: function (num, type) {
                        _pageNO = num;
                        if (type === 'change') {
                            loadTermList(_pageNO);
                        }
                    }
                });

                // term_status
                $('#term_status').html('' +
                    languageJSON.online + '（' + _termStatusCount.online + '/' + _termStatusCount.total + '） ' +
                    languageJSON.download + '（' + _termStatusCount.downloadFileNum + '/' + _termStatusCount.downloadAllFileNum + '） ' +
                    languageJSON.preDownload + '（' + _termStatusCount.preDownloadFileNum + '/' + _termStatusCount.preDownloadAllFileNum + '）'
                );

                // term_online_status
                $('#term_running').html(_termStatusCount.running + '/' + _termStatusCount.total);
                $('#term_shutdown').html(_termStatusCount.shutdown + '/' + _termStatusCount.total);
                $('#term_offline').html(_termStatusCount.offline + '/' + _termStatusCount.total);

                // term_list
                var tl = data.termList.terms;
                $('#term_list').empty();
                if (tl.length != 0) {
                    for (var i = 0; i < tl.length; i++) {

                        var downloadStatus = JSON.parse(tl[i].CurrentChannelDownloadInfo),
                            downloadNum,
                            downloadDisplay = "visible";
                        if (downloadStatus.AllFiles === 0) {
                            downloadNum = languageJSON.noTownloadTask;
                            downloadStatus = '-';
                            downloadDisplay = 'hidden';
                        } else {
                            downloadNum = languageJSON.downloaded + "：" + downloadStatus.DownloadFiles + '，' + languageJSON.notDownloaded + "：" + (downloadStatus.AllFiles - downloadStatus.DownloadFiles);
                            downloadStatus = Math.floor(downloadStatus.DownloadFiles / downloadStatus.AllFiles * 100) + '%';
                        }

                        var preloadStatus = JSON.parse(tl[i].PreDownloadInfo),
                            preloadNum,
                            preloadDisplay = "visible";
                        if (preloadStatus.AllFiles === 0) {
                            preloadNum = languageJSON.noTownloadTask;
                            preloadStatus = '-';
                            preloadDisplay = 'hidden';
                        } else {
                            preloadNum = languageJSON.downloaded + "：" + preloadStatus.DownloadFiles + '，' + languageJSON.notDownloaded + "：" + (preloadStatus.AllFiles - preloadStatus.DownloadFiles);
                            preloadStatus = Math.floor(preloadStatus.DownloadFiles / preloadStatus.AllFiles * 100) + '%';
                        }

                        var statusName = (tl[i].Online === 0) ? languageJSON.offline : ((tl[i].Status === 'Running') ? languageJSON.running : languageJSON.dormancy);
                        var status = (tl[i].Online === 0) ? 'offline' : ((tl[i].Status === 'Running') ? 'running' : 'shutdown');
                        var PUstatus = tl[i].PUStatus ? tl[i].PUStatus : 0;
                        var PUStatusName = (PUstatus === 0) ? '' : (PUstatus == 1) ? languageJSON.running : (PUstatus == 2) ? languageJSON.dormancy : languageJSON.offline;
                        var snap = (tl[i].Online === 0) ? '' : '<button style=" position:relative; margin-top:-16px; margin-left:10px;" class="snap btn btn-default btn-xs pull-right"><a style="font-size:12px; color:#333" title="' + languageJSON.list_querySreen + '"><i class="fa fa-camera"></i></a></button>';
                        var download = (tl[i].Online === 0) ? '' : '<button style=" position:relative; margin-top:-16px;" class="download btn btn-default btn-xs pull-right"><a style="font-size:12px; color:#333" title="' + languageJSON.download + '"><i class="fa fa-tasks"></i></a></button>';
                        var diskArr = tl[i].DiskInfo.split("MB");
                        var diskinfo1 = diskArr[0];
                        var diskinfo2 = diskArr[1].substring(1);
                        var restdisk = Number(diskinfo2) - Number(diskinfo1);
                        var categoryIdArray = tl[i].CategoryId;
                        var pathName = '';
                        categoryIdArray.map(function (v, i) {
                            pathName += v + '_';
                        });
                        var channelType = tl[i].Channel_Type;
                        var channelID = channelType == 'advertisement' ? tl[i].Channel_Program_ID : tl[i].Channel_ID;
                        //console.log(restdisk)
                        var diskinfo = restdisk + "MB/" + diskinfo2 + "MB";
                        var TermPassword = tl[i].TermPassword ? tl[i].TermPassword : ''
                        //  图标
                        var iconHtml = '';
                        if(PUstatus == '0'){
                            //  无外设
                            // iconHtml += '<i class="fa fa-television term-icon ' + status + '" style="position:relative; left:10px;"></i>'
                            var position = (tl[i].Online === 0) ? '-66px -36px' : ((tl[i].Status === 'Running') ? '-66px 0' : '-66px -18px');
                            iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat '+position+';"></div>'
                        }else if(PUstatus == '1'){
                            //  外设 -正常
                            if(status == 'running'){
                                iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat 0 0;"></div>'
                            }else if(status == 'shutdown'){
                                iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat 0 -18px;"></div>'
                            }
                        }else if(PUstatus == '2'){
                            //  外设 -休眠
                            if(status == 'running'){
                                iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat -44px 0;"></div>'
                            }else if(status == 'shutdown'){
                                iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat -44px -18px;"></div>'
                            }
                        }else if(PUstatus == '-1'){
                            //  外设 -异常
                            if(status == 'running'){
                                iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat -22px 0;"></div>'
                            }else if(status == 'shutdown'){
                                iconHtml += '<div class="terminalStatus" style="background:url(resources/img/terminalStatus.png) no-repeat -22px -18px;"></div>'
                            }
                        }
                        $('#term_list').append('' +
                            '<tr path="' + pathName + '" chnType="' +channelType+ '" channel="' + tl[i].Channel_Name + '" version="' + tl[i].TermVersion + '" chnID="' + channelID + '" preChnID="' + tl[i].PreDownload_Channel_ID + '" preChannel="' + tl[i].PreDownload_Channel_Name + '" tid="' + tl[i].ID + '" tname="' + tl[i].Name + '" tpassword= "'+ TermPassword +'" ip="' + tl[i].IP + '" mac="' + tl[i].MAC + '" disk="' + tl[i].DiskInfo + '" cpu="' + tl[i].Cpu + '" mem="' + tl[i].Mem + '" status="' + status + '">' +
                            '<td style="width:36px; padding-leftt:12px;"><input type="checkbox" style="left:4px;"></td>' +
                            '<td style="width:36px; padding-right:0; padding-left:0">'+iconHtml+'</td>' +
                            '<td style="padding-left:0;"><a class="pointer"><strong>' + tl[i].Name + '&nbsp</strong><small class="term-status-small">(' + statusName + ')</small></a><br/><small>' + languageJSON.disk + '：</small><small>' + diskinfo + '</small><br/><small>CPU：</small><small>' + tl[i].Cpu + '%</small><br/><small>' + languageJSON.RAM + '：</small><small>' + tl[i].Mem + '</small></td>' +
                            // (PUStatusName? " 外设-"+PUStatusName:"")+
                            //'<td style="line-height:26px; padding-top:10px;">' + languageJSON.list_currentPath + '：' +
                            //pathName +
                            //'<br />' + languageJSON.list_currentChannel+ '：' +
                            '<td style="line-height:26px; padding-top:10px;">' + languageJSON.list_currentChannel + '：' +
                            ((tl[i].CurrentPlayInfo === '') ? '' : (JSON.parse(tl[i].CurrentPlayInfo).ChannelName === undefined ? '' : JSON.parse(tl[i].CurrentPlayInfo).ChannelName)) +
                            '<br />' + languageJSON.list_currentLayout + '：' +
                            ((tl[i].CurrentPlayInfo === '') ? '' : (JSON.parse(tl[i].CurrentPlayInfo).ProgramName === undefined ? '' : JSON.parse(tl[i].CurrentPlayInfo).ProgramName)) +
                            '<br />' + languageJSON.list_currentVideo + '：' +
                            ((tl[i].CurrentPlayInfo === '') ? '' : (JSON.parse(tl[i].CurrentPlayInfo).ProgramPlayInfo === undefined ? '' : JSON.parse(tl[i].CurrentPlayInfo).ProgramPlayInfo)) +
                            '</td>' +
                            '<td  style=" padding-top:11px;">' +
                            '<span title="' + downloadNum + '" style="font-size: 12px; color: grey;">' + languageJSON.download + '：' + downloadStatus + '</span>' +
                            '<div style="visibility:' + downloadDisplay + '; height: 10px; margin-top: 0px;" class="progress progress-striped">' +
                            '<div class="progress-bar progress-bar-success" role="progressbar" ' +
                            'aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" ' +
                            'style="width: ' + downloadStatus + ';">' +
                            '<span class="sr-only">' + downloadStatus + languageJSON.list_done + '</span>' +
                            '</div>' +
                            '</div>' +
                            '<span title="' + preloadNum + '" style="font-size: 12px; color: grey; position:relative; top:6px; line-height:31px;">' + languageJSON.preDownload + '：' + preloadStatus + '</span>' +
                            '<div style="visibility:' + preloadDisplay + '; height: 10px; margin-top: 0px;" class="progress progress-striped">' +
                            '<div class="progress-bar progress-bar-success" role="progressbar" ' +
                            'aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" ' +
                            'style="width: ' + preloadStatus + ';">' +
                            '<span class="sr-only">' + preloadStatus + languageJSON.list_done + '</span>' +
                            '</div>' +
                            '</div>' +
                            '</td>' +

                            '<td  style="padding-top:30px; float:right; position:relative">' +
                            snap + '<button style=" position:relative; margin-top:-16px;margin-left: 10px;" class="log btn btn-default btn-xs pull-right"><a style="font-size:12px; color:#333" title="' + languageJSON.list_queryLog + '"><i class="fa fa-file-text-o"></i></a></button>' +
                            download + '</br>' +
                            '<small style="white-space:nowrap; float:right; color: #9c9c9c">IP：' + tl[i].IP + '</small></br>' +
                            '<small  style="white-space:nowrap; float:right; color: #9c9c9c">version：' + tl[i].TermVersion + '</small>' +
                            '</td>' +
                            '</tr>'
                        )
                    }
                    localStorage.setItem('renderDone', true);
                } else {
                    $('#term-table-pager').jqPaginator('destroy');

                    $("#term_list").append('<h5 style="text-align:center;color:grey;">(' + languageJSON.empty + ')</h5>');
                }


                // 复选
                // 复选全选按钮初始化
                var hasCheck = $('#term-list-select-all>i').hasClass('fa-check-square-o');
                if (hasCheck) {
                    $('#term-list-select-all>i').toggleClass('fa-square-o', true);
                    $('#term-list-select-all>i').toggleClass('fa-check-square-o', false);
                }

                // 清空已选list
                _checkList.length = 0;

                // 列表选择按钮添加icheck，单击
                $('#term_list tr input[type="checkbox"]').iCheck({
                    checkboxClass: 'icheckbox_flat-blue',
                    radioClass: 'iradio_flat-blue'
                })
                    .on('ifChecked', function (event) {
                        _checkList.add($(this).parent().parent().parent().attr('tid'), $(this).parent().parent().parent().attr('status'));
                        onCheckBoxChange();
                        setBatchBtn();
                    })
                    .on('ifUnchecked', function (event) {
                        _checkList.delete($(this).parent().parent().parent().attr('tid'));
                        onCheckBoxChange();
                        setBatchBtn();
                    });

                // 点击
                $('#term_list tr').each(function (i, e) {
                    // 点击整行
                    $(e).click(function () {
                        // $('#term_list tr input[type="checkbox"]').iCheck('uncheck');
                        // $(e).find('input[type="checkbox"]').iCheck('check');
                        if($(e).find("input[type='checkbox']").prop("checked") == true){
                            $(e).iCheck('uncheck');
                        }else{
                            $(e).iCheck('check');
                        }
                        //获取选中终端
                        getCheckList()
                        // _checkList.length = 0;
                        // _checkList.add($(e).attr('tid'), $(e).attr('status'));
                        onCheckBoxChange();
                        setBatchBtn();
                    })

                    // 编辑
                    $(this).find('a:nth(0)').click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var configOneTerm = require('pages/terminal/configOneTerm.js');
                        var li = $(this).parent().parent();
                        configOneTerm.pathName = li.attr("path");
                        configOneTerm.termID = Number(li.attr("tid"));
                        configOneTerm.termName = li.attr("tname");
                        configOneTerm.TermPassword = li.attr("tpassword");
                        configOneTerm.diskInfo = li.attr("disk");
                        configOneTerm.CPU = li.attr("cpu");
                        configOneTerm.IP = li.attr("ip");
                        configOneTerm.Mem = li.attr("mem");
                        configOneTerm.MAC = li.attr("mac");
                        configOneTerm.channel = li.attr("channel");
                        configOneTerm.preChannel = li.attr("preChannel");
                        configOneTerm.termState = li.attr("status");
                        configOneTerm.channelType = li.attr("chnType");
                        configOneTerm.channelId = li.attr("chnID");
                        configOneTerm.requireJS = "pages/terminal/list.js";
                        UTIL.cover.load('resources/pages/terminal/configOneTerm.html');
                    })

                    // 日志
                    $(this).find('button.log').click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var termlog = require('pages/termlog/list.js');
                        termlog.mac = $(this).parent().parent().attr("mac");
                        window.location.hash = 'termlog/list';
                    })

                    $(this).find('button.download').click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var ele = $(this).parent().parent();
                        var version = ele.attr('version');
                        // 判断当前的版本是否在3214以上，如果在这之下就要提示当前版本不支持该操作
                        if (version !== undefined) {
                            var start = version.indexOf('(') + 1;
                            var end = version.indexOf(')');
                            var versionCode = parseInt(version.substring(start, end));
                            if (versionCode < 3215) {
                                alert(languageJSON.version3215Msg);
                                return;
                            }
                        }

                        var termID = ele.attr('tid');
                        var termName = ele.attr('tname');
                        var chnID = ele.attr("chnID");
                        var chnName = ele.attr("channel");
                        var preChnID = ele.attr('preChnID');
                        var preChnName = ele.attr('preChannel');
                        var mac = ele.attr('mac');


                        var data = {
                            "project_name": CONFIG.projectName,
                            "action": "getDownloadTask",
                            "ID": termID
                        };
                        UTIL.ajax(
                            'POST',
                            CONFIG.serverRoot + '/backend_mgt/v2/term',
                            JSON.stringify(data),
                            function (data) {
                                if (data.rescode !== '200') {
                                    alert(languageJSON.al_ssFaild);
                                } else {
                                    var downloadInfo = require('pages/terminal/downloadInfo.js');
                                    downloadInfo.termID = termID;
                                    downloadInfo.MAC = mac;
                                    downloadInfo.termName = termName;
                                    downloadInfo.chnID = chnID;
                                    downloadInfo.chnName = chnName;
                                    downloadInfo.preChnID = preChnID;
                                    downloadInfo.preChnName = preChnName;
                                    UTIL.cover.load("resources/pages/terminal/downloadInfo.html");
                                    // window.location.hash = 'terminal/downloadInfo';
                                    // $('#page_box').load('resources/pages/terminal/downloadInfo.html');
                                }
                            }
                        )
                    })

                    // 截屏
                    $(this).find('button.snap').click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        _snapTermID = Number($(this).parent().parent().attr("tid"));
                        var data = {
                            "project_name": CONFIG.projectName,
                            "action": "termSnapshot",
                            "ID": _snapTermID,
                            "uploadURL": CONFIG.Resource_UploadURL
                        }
                        UTIL.ajax(
                            'POST',
                            CONFIG.serverRoot + '/backend_mgt/v2/term',
                            JSON.stringify(data),
                            function (data) {
                                if (data.rescode !== '200') {
                                    alert(languageJSON.al_ssFaild);
                                } else {
                                    var snap = require('pages/terminal/snap.js');
                                    snap.termID = _snapTermID;
                                    UTIL.cover.load('resources/pages/terminal/snap.html');
                                }
                            }
                        )
                    })
                })

                // 设置批量按钮
                setBatchBtn();

            }
        )

        function loadEmptyList() {
            // set pagebar
            try {
                $('#term-table-pager').jqPaginator('destroy');
            } catch (error) {
                // console.error("$('#term-table-pager').jqPaginator 未创建");
            }

            var totalCounts = 1;

            $('#term-table-pager').jqPaginator({
                totalCounts: totalCounts,
                pageSize: _pagesize,
                visiblePages: CONFIG.pager.visiblePages,
                first: CONFIG.pager.first,
                prev: CONFIG.pager.prev,
                next: CONFIG.pager.next,
                last: CONFIG.pager.last,
                page: CONFIG.pager.page,
                currentPage: _pageNO,
                onPageChange: function (num, type) {
                    _pageNO = num;
                    if (type === 'change') {
                        loadTermList(_pageNO);
                    }
                }
            });

            _termStatusCount = {
                total: 0,
                online: 0,
                shutdown: 0,
                running: 0,
                offline: 0,
                downloadFileNum: 0,
                downloadAllFileNum: 0,
                preDownloadFileNum: 0,
                preDownloadAllFileNum: 0
            };

            // term_status
            $('#term_status').html('' +
                languageJSON.online + '（0/0） ' +
                languageJSON.download + '（0/0） ' +
                languageJSON.preDownload + '（0/0）'
            );

            // term_online_status
            $('#term_running').html('0/0');
            $('#term_shutdown').html('0/0');
            $('#term_offline').html('0/0');

            // 复选
            // 复选全选按钮初始化
            var hasCheck = $('#term-list-select-all>i').hasClass('fa-check-square-o');
            if (hasCheck) {
                $('#term-list-select-all>i').toggleClass('fa-square-o', true);
                $('#term-list-select-all>i').toggleClass('fa-check-square-o', false);
            }

            // 清空已选list
            _checkList.length = 0;
            $('#term_list').empty();

        }
    }

    function initTree() {

        var dataParameter = {
            "project_name": CONFIG.projectName,
            "action": "getTree"
        };

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
            JSON.stringify(dataParameter),
            function (data) {
                if (data.rescode === '200') {
                    data = data.TermTree.children;
                    _tree = {domId: 'termclass-tree', checkMode: 'single'};
                    _tree = TREE.new(_tree);
                    _tree.createTree($('#' + _tree.domId), data);

                    // 选中、打开第一个结点
                    var li = $('#' + _tree.domId).find('li:nth(0)');
                    _tree.setFocus(li);
                    _tree.openNode(li);

                    // alert('loadtermlist: '+$('#termclass-tree').find('.focus').attr('node-id'))
                    loadTermList();

                    // 终端分类列表各项点击
                    $('#termclass-tree li > a').each(function (i, e) {
                        $(this).click(function (e) {
                            // alert('loadtermlist: '+$(this).parent().attr('node-id'))
                            // 复原筛选框
                            if ($('#term-status button.btn-primary').length > 0) {
                                $('#term-status button.btn-primary').addClass('btn-defalut');
                                $('#term-status button.btn-primary').removeClass('btn-primary');
                            }
                            loadTermList();
                        })
                    })

                    // 添加终端分类按钮点击
                    $('#tct_add').click(function () {
                        var li = $('#termclass-tree').find('.focus');

                        // 如果正在有添加中，不响应
                        if (li.children('a').find('div input').length > 0) {
                            return;
                        }

                        var newNode = [
                            {
                                "children": [],
                                "id": "",
                                "name": languageJSON.uncategorizedTermCf
                            }
                        ]
                        // 如果分类有子分类
                        var ul;
                        if (li.hasClass('treeview')) {
                            ul = li.children('ul');
                        }
                        // 如果分类下无子分类
                        else {
                            _tree.addParentCss(li);
                            ul = $('<ul class="tree-menu-2"></ul>');
                            li.append(ul);
                        }
                        _tree.createNode(ul, newNode);
                        var dom = ul.children('li:nth(' + (ul.children().length - 1) + ')');
                        _tree.openNode(li);
                        _tree.setFocus(dom);
                        // alert('loadtermlist: '+dom.attr('node-id'));
                        // 复原筛选框
                        if ($('#term-status button.btn-primary').length > 0) {
                            $('#term-status button.btn-primary').removeClass('btn-primary');
                            $('#term-status button.btn-primary').addClass('btn-defalut');
                        }
                        loadTermList();
                        _tree.showEditInput(dom, function (input) {
                            input.blur(function (e) {
                                addTermClassName(input);
                            })
                        });

                        function addTermClassName(input) {

                            var change = $.trim(input.val());
                            var a = input.parent().parent();
                            var t = a.children('span');

                            // 终端组分类名称为空时设置名称为：未命名终端分类
                            // return
                            if (change === '') {
                                alert('终端组分类名称不能为空！')
                                //移除添加框，焦点返回父级
                                var focus = $('#termclass-tree').find('.focus');
                                _tree.setFocus(focus.parent().parent());
                                loadTermList();
                                if(focus.siblings().length == 0){
                                    focus.parent().parent().find('i').removeClass('glyphicon-chevron-right')
                                    focus.parent().parent().removeClass('treeview')
                                    focus.parent().parent().find('ul').remove()
                                }
                                focus.remove();
                                return
                                // input.remove()
                            }
                            
                            // 提交终端组分类名称新建
                            var parentId = input.parent().parent().parent().parent().parent().attr('node-id');
                            var data = {
                                "project_name": CONFIG.projectName,
                                "action": "addCategory",
                                "parentCategoryID": Number(parentId),
                                "name": change
                            }

                            _editTreeClassInput = input;

                            UTIL.ajax(
                                'POST',
                                CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                                JSON.stringify(data),
                                function (data) {
                                    var a = _editTreeClassInput.parent().parent();
                                    var input = a.children('div').children('input');
                                    var t = a.children('span');

                                    var li = a.parent();
                                    if (data.rescode == '200') {
                                        t.html(' ' + $.trim(input.val()));
                                        $('#termlist-title').html($.trim(input.val()));
                                        t.css('display', 'inline-block');
                                        input.parent().remove();
                                        li.attr('node-id', data.categoryID);
                                        a.click(function (e) {
                                            _tree.setFocus(li);
                                            // alert('loadtermlist: '+li.attr('node-id'));
                                            // 复原筛选框
                                            if ($('#term-status button.btn-primary').length > 0) {
                                                $('#term-status button.btn-primary').removeClass('btn-primary');
                                                $('#term-status button.btn-primary').addClass('btn-defalut');
                                            }
                                            loadTermList();
                                        })
                                    } else {
                                        //移除添加框，焦点返回父级
                                        var focus = $('#termclass-tree').find('.focus');
                                        _tree.setFocus(focus.parent().parent());
                                        loadTermList();
                                        if(focus.siblings().length == 0){
                                            focus.parent().parent().find('i').removeClass('glyphicon-chevron-right')
                                            focus.parent().parent().removeClass('treeview')
                                            focus.parent().parent().find('ul').remove()
                                        }
                                        focus.remove();
                                    }
                                }
                            );
                        }

                    })

                    // 删除终端分类按钮点击
                    $('#tct_delete').click(function () {
                        var focus = $('#termclass-tree').find('.focus');

                        // 不能删除“全部”
                        if (focus.attr('node-id') == 1) {
                            alert(languageJSON.al_deleteRoot);
                        } else {
                            if (confirm(languageJSON.cf_deleteCf1 + '"' + $.trim(focus.children('a').find('span').html()) + '" ? （' + languageJSON.cf_deleteCf2 + '）')) {
                                if (confirm(languageJSON.cf_deleteCf3 + '"' + $.trim(focus.children('a').find('span').html()) + '"' + languageJSON.cf_deleteCf4 + '? （' + languageJSON.cf_deleteCf2 + '）')) {

                                    var nodeId = focus.attr('node-id');
                                    if (nodeId == "1" || nodeId == "2") {
                                        alert(languageJSON.al_forbidDelete)
                                        return false;
                                    }
                                    var data = {
                                        "project_name": CONFIG.projectName,
                                        "action": "delCategory",
                                        "categoryID": Number(nodeId)
                                    }

                                    UTIL.ajax(
                                        'POST',
                                        CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                                        JSON.stringify(data),
                                        function (data) {
                                            if (data.rescode == '200') {
                                                var focus = $('#termclass-tree').find('.focus');
                                                _tree.setFocus(focus.parent().parent());
                                                // alert('loadtermlist: '+focus.parent().parent().attr('node-id'));
                                                // 复原筛选框
                                                if ($('#term-status button.btn-primary').length > 0) {
                                                    $('#term-status button.btn-primary').removeClass('btn-primary');
                                                    $('#term-status button.btn-primary').addClass('btn-defalut');
                                                }
                                                loadTermList();
                                                if(focus.siblings().length == 0){
                                                    focus.parent().parent().find('i').removeClass('glyphicon-chevron-right')
                                                    focus.parent().parent().removeClass('treeview')
                                                    focus.parent().parent().find('ul').remove()
                                                }
                                                focus.remove();
                                            }
                                        }
                                    );
                                }
                            }
                        }

                    })

                    // 编辑终端分类按钮点击
                    $('#tct_edit').click(function () {
                        var p = $('#termclass-tree').find('.focus');

                        _tree.showEditInput(p, function (input) {
                            input.blur(function (e) {
                                if (!UTIL.isValidated('keyword', $.trim(input.val()))) return;
                                editTermClassName(input);
                            })
                        });

                        function editTermClassName(input) {
                            var change = $.trim(input.val());
                            var a = input.parent().parent();
                            var t = a.children('span');

                            // 终端组分类名称为空时恢复原名称，不提交修改
                            if (change === '') {
                                t.css('display', 'inline-block');
                                input.parent().remove();
                            }
                            // 终端组分类名称未改变时不提交修改
                            else if (change === $.trim(t.html())) {
                                t.css('display', 'inline-block');
                                input.parent().remove();
                            }
                            // 提交终端组分类名称修改
                            else {
                                var nodeId = a.parent().attr('node-id');
                                if (nodeId == "1" || nodeId == "2") {
                                    alert(languageJSON.al_forbidUpdate)
                                    t.css('display', 'inline-block');
                                    input.parent().remove();
                                    return false;
                                }
                                var data = {
                                    "project_name": CONFIG.projectName,
                                    "action": "changeCategoryName",
                                    "categoryID": nodeId,
                                    "newName": change
                                }
                                _editTreeClassInput = input;

                                UTIL.ajax(
                                    'POST',
                                    CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                                    JSON.stringify(data),
                                    function (data) {
                                        var a = _editTreeClassInput.parent().parent();
                                        var input = a.children('div').children('input');
                                        var t = a.children('span');
                                        if (data.rescode == '200') {
                                            t.html(' ' + $.trim(input.val()));
                                            t.css('display', 'inline-block');
                                            input.parent().remove();
                                            var dom = $('#termclass-tree').find('.focus');
                                            $('#termlist-title').html(_tree.getFocusName(dom));
                                        } else {
                                            t.css('display', 'inline-block');
                                            input.parent().remove();
                                        }
                                    }
                                );
                            }
                        }
                    })
                } else {
                    alert(languageJSON.al_getListFaild);
                }
            }
        );
    }
    function getCheckList (){
        _checkList.length = 0;
        $('.table-striped tr').each(function(i,e){
            if($(e).find("input[type='checkbox']").prop("checked") == true){
                _checkList.add($(e).attr('tid'), $(e).attr('status'))
            }
        })
    }
});