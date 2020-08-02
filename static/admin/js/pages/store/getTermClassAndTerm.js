define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        _pagesize,
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

        // �ر�
        $('#term_sel_cancel').click(function () {
            UTIL.cover.close();
        });

        // ����
        $('#term_sel_save').click(function () {
            if (_checkList.length === 0) {
                alert(languageJSON.al_selectTtT);
            } else {
                var termID = _checkList.join(",").split(",").map(function (v, i) {
                    return parseInt(v);
                });
                $('#liveTable tr .live_name').css('color', 'black');
                $('#liveTable').find('tr[termid=' + exports.Term+ '] td:first').css('color', 'purple');
                var data = [];
                data.action = "";
                if (exports.tps == "bindLive") {
                    //data.action = "setMaterialBindings";
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
     * �����л���
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
                var searchKeyword = $.trim($('#term_sel_search').val());
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                loadTermList(_pageNO, true);
            }
        }).change(function () {
            var searchKeyword = $.trim($('#term_sel_search').val());
            if (!UTIL.isValidated('keyword', searchKeyword)) return;
            loadTermList(_pageNO, true);
        });
        $("#term_sel_search").next().click(function () {
            var searchKeyword = $.trim($('#term_sel_search').val());
            if (!UTIL.isValidated('keyword', searchKeyword)) return;
            loadTermList(_pageNO, true);
        });

        //ȫѡ�� ȫ��ѡ
        $('#term-sel-list-select-all').click(function () {
            var check = $('#term-sel-list-select-all>i').hasClass('fa-square-o');
            check ? '' : _checkList.length = 0;
            $('#term-sel-list-select-all>i').toggleClass('fa-square-o', !check);
            $('#term-sel-list-select-all>i').toggleClass('fa-check-square-o', check);
            $('#term_sel_list tr input[type="checkbox"]').iCheck((check ? 'check' : 'uncheck'));
        })
    }

    function onCheckBoxChange() {
        // �����Ƿ�ȫѡ
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
        var bindKey = exports.tps == "bindLive" ? 1 : 0;
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "getBindings",
            "term_id": exports.Term,
            "what":"Material",
            "unbinding": bindKey,
            "Pager": {
                "per_page": _pagesize,
                "page": isSearch ? 1 : _pageNO,
                "keyword": searchKeyword,
            }
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/term';
        UTIL.ajax('post', url, data, function (data) {
            var totalPages = Math.ceil(data.total / _pagesize);
            totalPages = Math.max(totalPages, 1);

            $('#select-term-table-pager').jqPaginator({
                // totalPages: totalPages,
                totalCounts: data.total,
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
            var termID = data.ids;
            var liveName = data.names;
            var liveUrl = data.urls;
            $('#term_sel_list').empty();

            //  �����ѡLIST
            _checkList.length = 0;

            for (var i = 0; i < termID.length; i++) {
                var ckb = '';
                if (exports.tps == "bindingList") {
                    ckb = '';
                } else {
                    ckb = '<input type="checkbox" />';
                }
                $('#term_sel_list').append('' +
                    '<tr tid="' + termID[i] + '"><td>' + ckb + '</td>' +
                    '<td>' + liveName[i] + '</td>' +
                    '<td>' + liveUrl[i] + '</td>' +
                    '</tr>'
                );
            }

            // ��ѡȫѡ��ť��ʼ��
            var hasCheck = $('#term-sel-list-select-all>i').hasClass('fa-check-square-o');
            if (hasCheck) {
                $('#term-sel-list-select-all>i').toggleClass('fa-square-o', true);
                $('#term-sel-list-select-all>i').toggleClass('fa-check-square-o', false);
            }

            // �б�ѡ��ť���icheck
            $('#term_sel_list tr input[type="checkbox"]').iCheck({
                checkboxClass: 'icheckbox_flat-blue',
                radioClass: 'iradio_flat-blue'
            }).on('ifChecked', function (event) {
                _checkList.add($(this).parent().parent().parent().attr('tid'));
                onCheckBoxChange();
            }).on('ifUnchecked', function (event) {
                _checkList.delete($(this).parent().parent().parent().attr('tid'));
                onCheckBoxChange();
            });

            // ���
            $('#term_sel_list tr').each(function (i, e) {
                // �������
                $(e).click(function () {
                    $('#term_sel_list tr input[type="checkbox"]').iCheck('uncheck');
                    $(e).find('input[type="checkbox"]').iCheck('check');
                    _checkList.length = 0;
                    _checkList.add($(e).attr('tid'));
                    onCheckBoxChange();
                })
            });
            if (_checkList.length > 0) {
                onCheckBoxChange();
            }
        });
    }

    //function renderTermList(data) {
    //    // ��ҳ
        
    //}

});
