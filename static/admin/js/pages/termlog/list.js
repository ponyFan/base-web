define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var nDisplayItems ;
    var pageNumC = 1;
    var last;
    var languageJSON;

    exports.mac;
    /* = function(mac){
     termMac = mac;
     exports.loadTermlogPage(1); //加载默认页面
     $('#termlogSearch').val(termMac);
     //搜索
     $('#termlogSearch').bind('input propertychange', function () {
     onSearch($('#termlogSearch').val());
     });
     }*/

    exports.init = function () {
        selectLanguage();
        if (exports.mac !== '' && exports.mac !== undefined) {
            $('#termlogSearch').val(exports.mac);
            exports.mac = '';
            onSearchPage($('#termlogSearch').val());
        } else {
            termMac = typeof($('#termlogSearch').val()) === 'string' ? $('#termlogSearch').val() : '';
            exports.loadTermlogPage(1); //加载默认页面
        }


        //搜索
        $("#termlogSearch").keyup(function (event) {
            if (event.keyCode == 13) {
                var searchKeyword = $('#termlogSearch').val();
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                onSearch(event);
            }
        });
        $("#termlogSearch").next().click(onSearch);
        function onSearch(event) {
            last = event.timeStamp;         //利用event的timeStamp来标记时间，这样每次的keyup事件都会修改last的值，注意last必需为全局变量
            setTimeout(function () {          //设时延迟0.5s执行
                if (last - event.timeStamp == 0) //如果时间差为0（也就是你停止输入0.5s之内都没有其它的keyup事件发生）则做你想要做的事
                {
                    var searchKeyword = $('#termlogSearch').val();
                    if (!UTIL.isValidated('keyword', searchKeyword)) return;
                    exports.loadTermlogPage(1);
                }
            }, 500);
        }

        checkUserAuth();
    }

    /**
     * 加载页面数据
     * @param pageNum
     */
    exports.loadTermlogPage = function (pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $("#termlogLisTitle").html("");
        $("#termlogTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $(".fa.fa-check-square-o").attr("class", "fa fa-square-o");
        $("#termlogLisTitle").html(languageJSON.termLog);

        pageNumC = pageNum;
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'getTermLog',
            termMAC: $('#termlogSearch').val(),
            Pager: {
                "total": -1,
                "per_page": nDisplayItems,
                "page": pageNum,
                "orderby": "",
                "sortby": "desc",
                "keyword": ""
            }
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/termlog';
        UTIL.ajax('post', url, data, render);
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.termLog;
        $(".termLog-title").html(languageJSON.title);
        $(".termlog-title-right").html('<i class="fa fa-info-circle"></i>&nbsp;' + languageJSON.title_right);
        $("#termlogSearch").attr("placeholder", languageJSON.pl_search);
    }

    function onSearchPage() {
        termMac = typeof($('#termlogSearch').val()) === 'string' ? $('#termlogSearch').val() : '';
        exports.loadTermlogPage(1);
    }

    function render(json) {
        //翻页
        var totalPages = Math.ceil(json.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#termlog-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.total,
            pageSize: nDisplayItems,
            visiblePages: CONFIG.pager.visiblePages,
            first: CONFIG.pager.first,
            prev: CONFIG.pager.prev,
            next: CONFIG.pager.next,
            last: CONFIG.pager.last,
            page: CONFIG.pager.page,
            currentPage: Number(pageNumC),
            onPageChange: function (num, type) {
                if (type === 'change') {
                    exports.loadTermlogPage(num);
                }
            }
        });
        $("#termlogTable tbody").html('');
        //拼接
        if (json.content != undefined) {
            var rolData = json.content;
            $("#termlogTable tbody").append('<tr>' +
                '<th class="termName">' + languageJSON.termName + '</th>' +
                '<th class="termID">' + languageJSON.termMac + '</th>' +
                '<th class="termIP">IP</th>' +
                //'<th class="level">等级</th>'+
                '<th class="eventType">' + languageJSON.eventType + '</th>' +
                '<th class="event">' + languageJSON.event + '</th>' +
                '<th class="date">' + languageJSON.date + '</th>' +
                '</tr>');
            if (rolData.length != 0) {
                for (var x = 0; x < rolData.length; x++) {
                    var eventTypes = rolData[x].eventType;
                    if (rolData[x].eventType == "play")
                        eventTypes = languageJSON.play;
                    else if (rolData[x].eventType == "pause")
                        eventTypes = languageJSON.pause;
                    else if (rolData[x].eventType == "stop")
                        eventTypes = languageJSON.stop;

                    var eventS = rolData[x].event;
                    var eventJson = JSON.parse(eventS);
                    if (eventS.indexOf("\"Operate\":\"play\"") != -1)
                        eventS = languageJSON.startPlay + "：" + eventJson['Name']
                    else if (eventS.indexOf("\"Operate\":\"stop\"") != -1)
                        eventS = languageJSON.stopPlay + "：" + eventJson['Name']
                    if (rolData[x].termName == null)
                        rolData[x].termName = "";

                    var roltr = '<tr termID="' + rolData[x].termID + '">' +
                        '<td class="termName">' + rolData[x].termName + '</td>' +
                        '<td class="termID">' + rolData[x].termID + '</td>' +
                        '<td class="termIP">' + rolData[x].termIP + '</td>' +
                        //'<td class="level">' + rolData[x].level + '</td>' +
                        '<td class="eventType">' + eventTypes + '</td>' +
                        '<td class="event" style="width:300px;overflow:hidden;text-overflow:ellipsis;">' + eventS + '</td>' +
                        '<td class="date">' + rolData[x].date + '</td>' +
                        '</tr>';
                    $("#termlogTable tbody").append(roltr);
                }
            } else {
                $("#termlogTable tbody").empty();
                $('#termlog-table-pager').empty();
                $("#termlogTable tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
        }
    }

    
    function checkUserAuth () {
        var data = JSON.stringify({
            action: 'GetFunctionModules',
            project_name: CONFIG.projectName,
            UserName: CONFIG.userName,
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails';
        UTIL.ajax('post', url, data, function (json) {
            var jdtData = json.FunctionModules;
            jdtData.map(function(v){
                if(v.ModuleID == 14){
                    isShowSearch = v.ReadWriteAuth;
                }
            })
            if(isShowSearch == 0){
                $('.box-tools').remove();
            }
        })
    }
})
