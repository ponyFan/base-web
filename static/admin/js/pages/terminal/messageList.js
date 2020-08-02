'use strict';

define(function (require, exports, module) {

    // depend on these components
    var templates = require('common/templates'),
        config = require('common/config'),
        util = require('common/util');

    // global variables
    var requestUrl = config.serverRoot,
        projectName = config.projectName,
        nDisplayItems = 10,
        _pageNO = 1,
        languageJSON = config.languageJson.termList;

    //查看类型 {null: 全部, 0: 未处理, 1: 已处理}
    var status = 'null';


    // 初始化页面
    exports.init = function () {
        selectLanguage();
        loadPage(_pageNO);
        registerEventListeners();

        $('#msg_refresh').click(function () {
            refrash();
        })

        $("#msg-status").change(function (a) {
            status = $(this).val();
            loadPage(_pageNO);
        })
    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#msgTitle").html(languageJSON.message_center);
        $("#msgListTitle").html(languageJSON.message_list);
        $("#message-list-controls .btn-delete").html(languageJSON.delete);
        $("#message-list-controls .btn-mark").html(languageJSON.marked_as_rocessed);
        $("#msg-status").html('<option value=null>' + languageJSON.all + '</option>' +
            '<option value=0>' + languageJSON.untreated + '</option>' +
            '<option value=1>' + languageJSON.treated + '</option>')
    }

    /**
     * 加载页面数据
     * @param pageNum
     */
    function loadPage(pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $('#message-table>tbody').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        var data = {
            action: 'listAlarm',
            project: projectName,
            page: String(pageNum),
            per_page: nDisplayItems,
        };
        if (status != 'null') data.Status = Number(status);
        var _url = requestUrl + '/backend_mgt/v2/sysinfo/'
        util.ajax('post', _url, JSON.stringify(data), render);
    }

    /**
     * 渲染界面
     * @param json
     */
    function render(json) {
        var totalPages = Math.ceil(json.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#message-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.total,
            pageSize: nDisplayItems,
            visiblePages: config.pager.visiblePages,
            first: config.pager.first,
            prev: config.pager.prev,
            next: config.pager.next,
            last: config.pager.last,
            page: config.pager.page,
            currentPage: Number(_pageNO),
            onPageChange: function (num, type) {
                _pageNO = num;
                if (type === 'change') {
                    loadPage(_pageNO);
                }
            }
        });

        $('#message-table>tbody').html('');
        $("#message-table>tbody").append('<tr>' +
            '<th class="mod_checkbox" style="width:32px;"></th>' +
            '<th class="">' + languageJSON.termMac + '</th>' +
            '<th class="text-center">' + languageJSON.status + '</th>' +
            '<th class="text-center create-time">' + languageJSON.time + '</th>' +
            '<th class="">' + languageJSON.contect + '</th>' +
            '</tr>');
        if (json.res != 0) {
            json.res.forEach(function (el, idx, arr) {
                var data = {
                    id: el.ID,
                    termMac: el.TermMac,
                    statusClass: el.Status == 1 ? 'success' : 'danger',
                    status: el.Status == 1 ? languageJSON.treated : languageJSON.untreated,
                    error: el.Error,
                    errTime: el.ErrTime
                };
                $('#message-table>tbody').append(templates.message_table_row(data));
            });
        } else {
            $("#message-table>tbody").empty();
            $('#message-table-pager').empty();
            $("#message-table>tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
        }
        onSelectedItemChanged();

        $('#message-table input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        });
    }

    /**
     * 刷新页面
     */
    function refrash() {
        _pageNO = 1;
        loadPage(_pageNO);
    }

    function registerEventListeners() {
        $('#message-table').delegate('input[type="checkbox"]', 'ifClicked', function (ev) {
            onSelectedItemChanged($(this.parentNode).hasClass('checked') ? -1 : 1);
        });
        $('#message-table').delegate('tr', 'click', function (ev) {
            var self = this;
            $('#message-table tr').each(function (idx, el) {
                $(el).iCheck('uncheck');
            });
            $(self).iCheck('check');
            onSelectedItemChanged();
        });
        // $('#message-table').delegate('.btn-message-detail', 'click', function (ev) {
        //     var messageId = getmessageId(ev.target);
        //     console.log(messageId);
        //     ev.stopPropagation();
        // });
        $('#message-list-controls .select-all').click(function (ev) {
            var hasUncheckedItems = false;
            $('#message-table div').each(function (idx, el) {
                if (!(hasUncheckedItems || $(el).hasClass('checked'))) {
                    hasUncheckedItems = true;
                }
            });
            $('#message-table tr').each(function (idx, el) {
                $(el).iCheck(hasUncheckedItems ? 'check' : 'uncheck');
            });
            onSelectedItemChanged();
        });
        $('#message-list-controls .btn-delete').click(onDeleteMessage);
        $('#message-list-controls .btn-mark').click(onMarkMessage);
    }

    function onSelectedItemChanged(adjustCount) {
        var selectedCount = typeof(adjustCount) === 'number' ? adjustCount + 1 : 1;
        $('#message-table div').each(function (idx, el) {
            if ($(el).hasClass('checked')) {
                selectedCount++;
            }
        });
        var hasUncheckedItems = selectedCount !== $('#message-table tr').size();
        $('#message-list-controls .select-all>i')
            .toggleClass('fa-square-o', hasUncheckedItems)
            .toggleClass('fa-check-square-o', !hasUncheckedItems);
        $('#message-list-controls .btn-mark').prop('disabled', selectedCount == 1);
        $('#message-list-controls .btn-delete').prop('disabled', selectedCount == 1);
    }

    /**
     * 获取选中的ID
     * @returns {Array}
     */
    function getCurrentMessageId() {
        var msgId = [];
        $('#message-table div.checked').each(function (idx, el) {
            msgId.push(Number(el.parentNode.parentNode.getAttribute('data-message-id')))
        })
        return msgId;
    }

    /**
     * 删除消息
     */
    function onDeleteMessage() {
        if (confirm(languageJSON.cf_delete_message)) {
            var data = JSON.stringify({
                action: "delAlarm",
                project: projectName,
                IDS: getCurrentMessageId()
            })
            var _url = requestUrl + '/backend_mgt/v2/sysinfo/'
            util.ajax('post', _url, data, function (msg) {
                if (msg.rescode == 200) refrash();
            });
        }
    }

    /**
     * 标记消息
     */
    function onMarkMessage() {
        var data = JSON.stringify({
            action: "updateAlarm",
            project: projectName,
            IDS: getCurrentMessageId()
        })
        var _url = requestUrl + '/backend_mgt/v2/sysinfo/'
        util.ajax('post', _url, data, function (msg) {
            if (msg.rescode == 200) refrash();
        });
    }
});
