define(function (require, exports, module) {
    var UTIL = require('common/util'),
        CONFIG = require('common/config');

    var nDisplayItems = 10;
    var _pageNum = 1,
        _pageNO = 1,
        _checkList = [];

    exports.id;
    exports.mtrTypeId;

    exports.init = function () {
        selectLanguage();
        bindEvent();
        renderList();
    }

    function selectLanguage() {
        $('#term_sel_title').text('撤回资源');
    }

    function bindEvent() {
        $('#term_sel_cancel').on('click', function () {
            UTIL.cover.close();
        })

        $('#term_sel_save').on('click', function () {
            var termList = _checkList;

            cancelPublished(termList);
        })

        $('#term_sel_search').click(function () {
            var searchKeyword = $.trim($('#term_sel_search').val());
            if (!UTIL.isValidated('keyword', searchKeyword)) return;
            loadTermList(_pageNO);
        })
            .change(function () {
                var searchKeyword = $.trim($('#term_sel_search').val());
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                loadTermList(_pageNO);
            })

        // 全选，不全选
        $('#term－sel-list-select-all').click(function () {
            var check = $('#term－sel-list-select-all>i').hasClass('fa-square-o');
            $('#term－sel-list-select-all>i').toggleClass('fa-square-o', !check);
            $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', check);
            $('#term_sel_list tr input[type="checkbox"]').iCheck((check ? 'check' : 'uncheck'));
        })

    }

    function renderList(pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);

        $('#term_sel_list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        if (pageNum !== undefined) {
            _pageNO = pageNum;
        } else {
            _pageNO = 1;
        }

        var searchKeyword = $.trim($('#term_sel_search').val());
        var pager = {
            page: _pageNO,
            per_page: nDisplayItems,
            keyword: searchKeyword,
        };
        _url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        var data = JSON.stringify({
            action: 'query',
            project_name: CONFIG.projectName,
            material_type_id: exports.mtrTypeId,
            id: exports.id,
            pager: pager,
        });

        UTIL.ajax('post', _url, data, function (json) {
            if (json.total != undefined) {
                var totalPages = Math.ceil(json.total / nDisplayItems);
                totalPages = Math.max(totalPages, 1);
                $('#select-term-table-pager').jqPaginator({
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
                        if (type == 'change') {
                            _pageNum = num;
                            renderList(num);
                        }
                    }
                });
            } else {
                alert(languageJSON.obtainFailure);
            }

            var mtrData = json.terms;
            $('#term_sel_list').empty();

            _checkList.length = 0;

            mtrData.map(function (v) {
                var statusName = v.online == 0 ? '离线' : v.status == 'Running' ? '运行' : '休眠';
                var status = v.online == 0 ? 'offline' : v.status == 'Running' ? 'running' : 'shutdown';

                var checked = '';

                $('#term_sel_list').append('' +
                    '<tr tid="' + v.id + '" status="' + status + '">' +
                    '<td>' +
                    '<input type="checkbox" ' + checked + '>' +
                    '</td>' +
                    '<td>' + v.name + '</td>' +
                    '<td>' + statusName + '</td>' +
                    '<td>当前频道：' + ((v.current_play_info === '') ? '' : JSON.parse(v.current_play_info).ChannelName) + '</td>' +
                    '</tr>'
                );
            })

            // 复选
            // 复选全选按钮初始化
            var hasCheck = $('#term－sel-list-select-all>i').hasClass('fa-check-square-o');
            if (hasCheck) {
                $('#term－sel-list-select-all>i').toggleClass('fa-square-o', true);
                $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', false);
            }


            // 列表选择按钮添加icheck
            $('#term_sel_list tr input[type="checkbox"]').iCheck({
                checkboxClass: 'icheckbox_flat-blue',
                radioClass: 'iradio_flat-blue'
            })
                .on('ifChecked', function (event) {
                    _checkList.add($(this).parent().parent().parent().attr('tid'), $(this).parent().parent().parent().attr('status'));
                    onCheckBoxChange();
                })
                .on('ifUnchecked', function (event) {
                    _checkList.delete($(this).parent().parent().parent().attr('tid'));
                    onCheckBoxChange();
                });

            // 点击
            $('#term_sel_list tr').each(function (i, e) {

                // 点击整行
                $(e).click(function () {
                    $('#term_sel_list tr input[type="checkbox"]').iCheck('uncheck');
                    $(e).find('input[type="checkbox"]').iCheck('check');
                    _checkList.length = 0;
                    _checkList.add($(e).attr('tid'), $(e).attr('status'));
                    onCheckBoxChange();
                })

            })
            if (_checkList.length > 0) {
                onCheckBoxChange();
            }
        });
    }

    function cancelPublished(data) {

    }

    function onCheckBoxChange() {

        // 设置是否全选
        var ifSelAll = ($('#term_sel_list tr').length === _checkList.length);
        $('#term－sel-list-select-all>i').toggleClass('fa-square-o', !ifSelAll);
        $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', ifSelAll);
    }

    _checkList.add = function (id, status) {
        _checkList.push({ 'termID': '' + id, 'status': status });
    }

    _checkList.delete = function (id) {
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i].termID === id) {
                _checkList.splice(i, 1);
                return;
            }
        }
    }

})