define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        _pagesize ,
        _pageNO = 1,
        _checkList = [],
        languageJSON;

    exports.save;
    exports.title;
    exports.tps;
    exports.Term;

    exports.init = function () {
        selectLanguage();
        initEvent();

        if (exports.tps == "bindingList") {
            $('#term_sel_save').css("visibility", "hidden");
            $("#term-sel-list-select-all").css("visibility", "hidden");
        } else {
            $('#term_sel_save').css("visibility", "visible");
            $("#term-sel-list-select-all").css("visibility", "visible");
        }

        // 关闭
        $('#term_sel_cancel').click(function () {
            UTIL.cover.close();
        });

        // 保存
        $('#term_sel_save').click(function () {
            if (_checkList.length === 0) {
                alert(languageJSON.al_selectTtT);
            } else {
                var termID = _checkList.join(",").split(",").map(function (v, i) {
                    return parseInt(v);
                });
                $('#liveTable tr .live_name').css('color', 'black');
                $('#liveTable').find('tr[termid=' + exports.Term + '] td:first').css('color', 'purple');
                var data = [];
                data.action = "";
                if (exports.tps == "bindLive") {
                    data.action = "setBindings";
                }
                if (exports.tps == "unbind") {
                    data.action = "removeBindings";
                }
                data.termID = termID;
                exports.save(data);
            }
        });

        loadTermList(1, true);
    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.store;
        $("#term_sel_save").html(languageJSON.save);
        $("#term_sel_cancel").html(languageJSON.cancel);
        $("#select-termlist-title").html(languageJSON.all);
        $("#term_sel_search").attr("placeholder", languageJSON.pl_liveSearch);
        $('#term_sel_title').html(exports.title);
    }

    function initEvent() {
        // serach
        $("#term_sel_search").keyup(function (event) {
            if (event.keyCode == 13) {
                loadTermList(_pageNO, true);
            }
        }).change(function () {
            loadTermList(_pageNO, true);
        });
        $("#term_sel_search").next().click(function () {
            loadTermList(_pageNO, true);
        });

    }

    function onCheckBoxChange() {
        // 设置是否全选
        var ifSelAll = ($('#term_sel_list tr').length === _checkList.length);
        $('#term-sel-list-select-all>i').toggleClass('fa-square-o', !ifSelAll);
        $('#term-sel-list-select-all>i').toggleClass('fa-check-square-o', ifSelAll);
    }

    _checkList.add = function (id) {
        _checkList.push(id);
    };
    _checkList.delete = function (id) {
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i] === id) {
                _checkList.splice(i, 1);
            }
        }
    };

    function loadTermList(pageNum, isSearch) {
        _pagesize = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        // loading
        $('#term_sel_list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        if (pageNum !== undefined) {
            _pageNO = pageNum;
        } else {
            _pageNO = 1;
        }

        var searchKeyword = $.trim($('#term_sel_search').val());

        var bindKey = exports.tps == "bindLive" ? 0 : 1;
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "getBindings",
            "term_id": exports.Term,
            "what": "MeetingRoom",
          //  "unbinding": bindKey,
            //"Pager": {
            //    "per_page": _pagesize,
            //    "page": isSearch ? 1 : _pageNO,
            //    "keyword": searchKeyword,
            //}
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/term';
        UTIL.ajax('post', url, data, function (data) {
            var _data = JSON.stringify({
                "project_name": CONFIG.projectName,
                "action": "query_bound",
                "bound": bindKey,
                "bindings": data.ids,
                "Pager": {
                    "per_page": _pagesize,
                    "page": isSearch ? 1 : _pageNO,
                    "keyword": searchKeyword,
                }
            })
            var _url = CONFIG.meetingRoot + '/backend_mgt/meeting_room';
            UTIL.ajax('post', _url, _data, function (res) {
                if (res.rescode == 404) {
                    var _parameters = JSON.stringify({
                        "project_name": CONFIG.projectName,
                        "action": "removeBindings",
                        "term_id": exports.Term,
                        "what": "MeetingRoom",
                        "bindings": data.ids,
                    }) 
                    var url_remove = CONFIG.serverRoot +  '/backend_mgt/v2/term';
                    UTIL.ajax('post', url_remove, _parameters, function (json) {
                        if (json.rescode == 200) {
                            alert("该终端绑定的会议室已被删除，请重新绑定！");
                            var obj = $('#liveTable tr[termid=' + exports.Term + '] .live_operation');
                            obj.find('.binding button')[0].disabled = false;
                            obj.find('.unbind button')[0].disabled = true;
                            obj.find('.bindingList button')[0].disabled = true;

                        }
                    })
                } else {
                    var totalPages = Math.ceil(res.total / _pagesize);
                    totalPages = Math.max(totalPages, 1);

                    $('#select-term-table-pager').jqPaginator({
                        // totalPages: totalPages,
                        totalCounts: res.total,
                        pageSize: _pagesize,
                        visiblePages: 5,
                        first: CONFIG.pager.first,
                        prev: CONFIG.pager.prev,
                        next: CONFIG.pager.next,
                        last: CONFIG.pager.last,
                        page: CONFIG.pager.page,
                        currentPage: isSearch ? 1 : _pageNO,
                        onPageChange: function (num, type) {
                            _pageNO = num;
                            if (type === 'change') {
                                loadTermList(_pageNO, false);
                            }
                        }
                    });

                    // term_sel_list
                    var termID = res.ids;
                    var liveName = res.names;
                    var liveCapacity = res.capacity;
                    $('#term_sel_list').empty();

                    //  清空已选LIST
                    _checkList.length = 0;

                    for (var i = 0; i < termID.length; i++) {
                        var ckb = '';
                        if (exports.tps == "bindingList") {
                            ckb = '';
                        } else {
                            ckb = '<input type="radio" name="iCheck">';
                        }
                        $('#term_sel_list').append('' +
                            '<tr tid="' + termID[i] + '"><td>' + ckb + '</td>' +
                            '<td>' + liveName[i] + '</td>' +
                            '<td>' + liveCapacity[i] + '</td>' +
                            '</tr>'
                        );
                    }

                    // 列表选择按钮添加icheck
                    $('#term_sel_list tr input[type="radio"]').iCheck({
                        checkboxClass: 'icheckbox_flat-blue',
                        radioClass: 'iradio_square-blue'
                    }).on('ifChecked', function (event) {
                        _checkList.length = 0;
                        _checkList.add($(this).parent().parent().parent().attr('tid'));
                    })

                    // 点击
                    $('#term_sel_list tr').each(function (i, e) {
                        // 点击整行
                        $(e).click(function () {
                            $('#term_sel_list tr input[type="checkbox"]').iCheck('uncheck');
                            $(e).find('input[type="checkbox"]').iCheck('check');
                            _checkList.length = 0;
                            _checkList.add($(e).attr('tid'));
                        })
                    });
                }
            })
        });
    }
    

});