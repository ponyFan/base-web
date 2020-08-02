define(function (require, exports, module) {
    // 广告计划-发布结果
    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        languageJSON = CONFIG.languageJson.termList;

    var nDisplayItems,
        last,
        _pageNO = 1;

    exports.chnName;
    exports.chnID;
    exports.plStatus;
    exports.plName;
    exports.plId;

    exports.init = function () {
        selectLanguage();

        $('#chn-close').click(function () {
            UTIL.cover.close();
        });

        // serach
        $("#term_search").keyup(function (event) {
            if (event.keyCode === 13) {
                var searchKeyword = $.trim($('#term_search').val());
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                exports.plStatus == '已通过' ? loadTermsByStatus(1) : loadTermList(1);
            }
        });
        $("#term_search").next().click(onSearch);

        function onSearch(event) {
            last = event.timeStamp;         //利用event的timeStamp来标记时间，这样每次的keyup事件都会修改last的值，注意last必需为全局变量
            setTimeout(function () {          //设时延迟0.5s执行
                if (last - event.timeStamp === 0) //如果时间差为0（也就是你停止输入0.5s之内都没有其它的keyup事件发生）则做你想要做的事
                {
                    //初始化状态
                    var searchKeyword = $.trim($('#term_search').val());
                    if (!UTIL.isValidated('keyword', searchKeyword)) return;
                    exports.plStatus == '已通过' ? loadTermsByStatus(1) : loadTermList(1);
                }
            }, 500);
        }

        $('#term-published-finished').click();
    }

    function selectLanguage() {
        $("#term_search").attr("placeholder", CONFIG.languageJson.termList.searchByName);
        if(exports.plStatus == '已通过'){
            $('#chn-name').html(exports.plName);
            $('#select-term-finished').text('成功');
            $('#select-term-no-finished').text('失败');
            bindTermByStatusEvent();
        }else{
            $('#chn-name').html(exports.chnName);
            bindTermEvent();
        }

    }

    function bindTermEvent(){
        $('#term-published-finished').click(function () {
            var check = $('#term-published-finished>i').hasClass('fa-square-o');
            $('#term-published-finished>i').toggleClass('fa-square-o', !check);
            $('#term-published-finished>i').toggleClass('fa-check-square-o', check);
            $('#term-published-no-finished>i').toggleClass('fa-square-o', check);
            $('#term-published-no-finished>i').toggleClass('fa-check-square-o', !check);

            loadTermList(1)
        });

        $('#term-published-no-finished').click(function () {
            var check = $('#term-published-no-finished>i').hasClass('fa-square-o');
            $('#term-published-no-finished>i').toggleClass('fa-square-o', !check);
            $('#term-published-no-finished>i').toggleClass('fa-check-square-o', check);
            $('#term-published-finished>i').toggleClass('fa-square-o', check);
            $('#term-published-finished>i').toggleClass('fa-check-square-o', !check);

            loadTermList(1);
        });
    }

    function bindTermByStatusEvent(){
        $('#term-published-finished').click(function () {
            var check = $('#term-published-finished>i').hasClass('fa-square-o');
            $('#term-published-finished>i').toggleClass('fa-square-o', !check);
            $('#term-published-finished>i').toggleClass('fa-check-square-o', check);
            $('#term-published-no-finished>i').toggleClass('fa-square-o', check);
            $('#term-published-no-finished>i').toggleClass('fa-check-square-o', !check);

            loadTermsByStatus(1)
        });

        $('#term-published-no-finished').click(function () {
            var check = $('#term-published-no-finished>i').hasClass('fa-square-o');
            $('#term-published-no-finished>i').toggleClass('fa-square-o', !check);
            $('#term-published-no-finished>i').toggleClass('fa-check-square-o', check);
            $('#term-published-finished>i').toggleClass('fa-square-o', check);
            $('#term-published-finished>i').toggleClass('fa-check-square-o', !check);

            loadTermsByStatus(1);
        });
    }

    // -1 : 所有终端, 0 : 未完成, 1 : 已完成
    function loadTermList(pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $('#term_list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        var status = -1;
        var checkFinished = $('#term-published-finished>i').hasClass('fa-check-square-o');
        var checkNoFinished = $('#term-published-no-finished>i').hasClass('fa-check-square-o');
        if (checkFinished) {
            status = 1
        } else if (checkNoFinished){
            status = 0
        } else{
            status = -1
        }
        console.log(status)
        if (pageNum !== undefined) {
            _pageNO = pageNum;
        } else {
            _pageNO = 1;
        }

        var searchKeyword = $.trim($('#term_search').val());
        var pager = {
            page: _pageNO,
            total: '0',
            per_page: String(nDisplayItems),
            orderby: 'ID',
            sortby: '',
            keyword: searchKeyword,
        };
        var data = JSON.stringify({
            action: 'GetTermList',
            channel_id: exports.chnID,
            status: status,
            project_name: CONFIG.projectName,
            user: CONFIG.userName,
            Pager: pager
        });

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/channels/',
            data,
            render
        );
    }

    // 已通过播单
    function loadTermsByStatus(pageNum){
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $('#term_list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        var status = '';
        var checkFinished = $('#term-published-finished>i').hasClass('fa-check-square-o');
        var checkNoFinished = $('#term-published-no-finished>i').hasClass('fa-check-square-o');
        if (checkFinished) {
            status = 'success';
        } else {
            status = 'fail';
        }

        if (pageNum !== undefined) {
            _pageNO = pageNum;
        } else {
            _pageNO = 1;
        }

        var searchKeyword = $.trim($('#term_search').val());
        var pager = {
            page: _pageNO,
            per_page: nDisplayItems,
            keyword: searchKeyword,
            result: status
        };
        var data = JSON.stringify({
            action: 'query_publish_result',
            id: +exports.plId,
            project_name: CONFIG.projectName,
            pager: pager
        });

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/advertisement_playlist/',
            data,
            renderTermByStatus
        );
    }

    function render(json) {
        //翻页
        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#term-table-pager').jqPaginator({
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
                _pageNO = num;
                if (type === 'change') {
                    loadTermList(_pageNO);
                }
            }
        });

        $("#term_list").empty();
        //拼接
        if (json.Terms != undefined) {
            var termList = json.Terms;

            $("#term_list").append('<tr>' +
                '<th class="term-name">' + languageJSON.termName + '</th>' +
                '<th class="term-mac text-center">' + languageJSON.termMac + '</th>' +
                '<th class="term-download text-center">' + languageJSON.download + '</th>' +
                '</tr>');
            if (termList.length != 0) {
                for (var x = 0; x < termList.length; x++) {

                    // 这里需要对频道版本和channelid进行判断
                    var downloadStatus = JSON.parse(termList[x].CurrentChannelDownloadInfo),
                        playInfo,
                        downloadDisplay = "visible";
                    if (downloadStatus.AllFiles === 0) {
                        if (termList[x].CurrentPlayInfo !== "") {
                            playInfo = JSON.parse(termList[x].CurrentPlayInfo);
                            if (parseInt(exports.chnID) === playInfo.ChannelID) {
                                downloadStatus = '100%';
                            } else {
                                downloadStatus = '0%';
                            }
                        } else {
                            downloadStatus = '100%';
                        }
                    } else {
                        downloadStatus = Math.floor(downloadStatus.DownloadFiles / downloadStatus.AllFiles * 100) + '%';
                        if (termList[x].CurrentPlayInfo !== "") {
                            playInfo = JSON.parse(termList[x].CurrentPlayInfo);
                            if (parseInt(exports.chnID) !== playInfo.ChannelID && downloadStatus.DownloadFiles === downloadStatus.AllFiles) {
                                downloadStatus = '0%';
                            }
                        }
                    }

                    var chntr = '<tr>' +
                        '<td class="term-name">' + termList[x].Name + '</td>' +
                        '<td class="term-mac text-center">' + termList[x].MAC + '</td>' +
                        '<td  style="padding-top:11px;text-align:  center;display:  flex;justify-content:  center;">' +
                        '<div>' +
                        // '<span title="' + downloadNum + '" style="font-size: 12px; color: grey;">' + languageJSON.download + '：' + downloadStatus + '</span>' +
                        '<div style="visibility:' + downloadDisplay + ';width: 100px; height: 10px;/* margin-top: 0px;*/float: left" class="progress progress-striped">' +
                        '<div class="progress-bar progress-bar-success" role="progressbar" ' +
                        'aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" ' +
                        'style="width: ' + downloadStatus + ';">' +
                        '<span class="sr-only">' + downloadStatus + '</span>' +
                        '</div>' +
                        '</div>' +
                        '<div style="color: #000;float: left;margin-left: 5px">' + downloadStatus + '</div>' +
                        '</div>' +
                        // '<span title="' + preloadNum + '" style="font-size: 12px; color: grey; position:relative; top:6px; line-height:31px;">' + languageJSON.preDownload + '：' + preloadStatus + '</span>' +
                        // '<div style="visibility:' + preloadDisplay + '; height: 10px; margin-top: 0px;" class="progress progress-striped">' +
                        // '<div class="progress-bar progress-bar-success" role="progressbar" ' +
                        // 'aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" ' +
                        // 'style="width: ' + preloadStatus + ';">' +
                        // '<span class="sr-only">' + preloadStatus + languageJSON.list_done + '</span>' +
                        // '</div>' +
                        // '</div>' +
                        '</td>' +
                        '</tr>';
                    $("#term_list").append(chntr);
                }
            } else {
                $("#term_list").empty();
                $(".term-table-pager").empty();
                $("#term_list").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
        }
    }

    function renderTermByStatus(json) {
        //翻页
        var totalPages = Math.ceil(json.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#term-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.total,
            pageSize: nDisplayItems,
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
                    loadTermsByStatus(_pageNO);
                }
            }
        });

        $("#term_list").empty();
        //拼接
        if (json.data != undefined) {
            var termList = json.data;

            $("#term_list").append('<tr>' +
                '<th class="term-name">' + languageJSON.termName + '</th>' +
                '<th class="term-mac text-center">状态</th>' +
                '</tr>');
            if (termList.length != 0) {
                for (var x = 0; x < termList.length; x++) {

                    var chntr = '<tr>' +
                        '<td class="term-name">' + termList[x].term_name + '</td>' +
                        '<td class="term-mac text-center">' + termList[x].info + '</td>' +
                        '</tr>';
                    $("#term_list").append(chntr);
                }
            } else {
                $("#term_list").empty();
                $(".term-table-pager").empty();
                $("#term_list").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
        }else{
            $("#term_list").html('<h5 style="text-align:center;color:grey;">(空)</h5>');
        }
    }

});