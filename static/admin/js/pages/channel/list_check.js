'use strict';

define(function(require, exports, module) {

    // depend on these components
    var templates = require('common/templates'),
        config    = require('common/config'),
        util      = require('common/util');

    // global variables
    var requestUrl    = config.serverRoot,
        projectName   = config.projectName,
        nDisplayItems = 25,
        keyword       = '';
    var languageJSON;

    // 初始化页面
	exports.init = function() {
        selectLanguage();
        loadPage(1);
        registerEventListeners();
    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = config.languageJson.channel;

    }

    function registerEventListeners() {
        $('#channel-table').delegate('input[type="checkbox"]', 'ifClicked', function (ev) {
            onSelectedItemChanged($(this.parentNode).hasClass('checked') ? -1 : 1);
        });
        $('#channel-table').delegate('tr', 'click', function (ev) {
            var self = this;
            $('#channel-table tr').each(function (idx, el) {
                $(el).iCheck('uncheck');
            });
            $(self).iCheck('check');
            onSelectedItemChanged();
        });
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
        $('#channel-list-controls .btn-publish-later').click(publishChannelLater);
        $('#channel-list-controls .btn-copy').click(copyChannel);
        $('#channel-list-controls .btn-delete').click(deleteChannel);
        $('#channel-list-nav').keyup(function (ev) {
            if (ev.which === 13) {
                onSearch($('#channel-list-nav input').val());
                ev.stopPropagation();
            }
        });
        $('#channel-list-nav button').click(function (ev) {
            onSearch($('#channel-list-nav input').val());
        });
        
    }
    
    function onSearch(_keyword) {
        keyword = typeof(_keyword) === 'string' ? _keyword : '';
        loadPage(1);
    }
    
    function publishChannel() {
        alert('终端树还没有实现');
    }
    
    function publishChannelLater() {
        alert('终端树还没有实现');
    }
    
    function copyChannel() {
        var data = JSON.stringify({
            Action: 'Copy',
            Project: projectName,
            ChannelID: getCurrentChannelId()
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/channels/', data, function (res) {
            console.log(res);
            alert(Number(res.rescode) === 200 ? '复制成功' : '复制失败');
        });
    }
    
    function deleteChannel() {
        var data = JSON.stringify({
            Action: 'Delete',
            Project: projectName
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/channels/' + getCurrentChannelId(), data, function (res) {
            console.log(res);
            alert(Number(res.rescode) === 200 ? '删除成功' : '删除失败');
        });
    }

    function onSelectedItemChanged(adjustCount) {
        var selectedCount = typeof(adjustCount) === 'number' ? adjustCount: 0;
        $('#channel-table div').each(function (idx, el) {
            if ($(el).hasClass('checked')) {
                selectedCount++;
            }
        });
        var hasUncheckedItems = selectedCount !== $('#channel-table tr').size();
        $('#channel-list-controls .select-all>i')
            .toggleClass('fa-square-o', hasUncheckedItems)
            .toggleClass('fa-check-square-o', !hasUncheckedItems);
        $('#channel-list-controls .btn-publish').prop('disabled', selectedCount !== 1);
        $('#channel-list-controls .btn-publish-later').prop('disabled', selectedCount !== 1);
        $('#channel-list-controls .btn-copy').prop('disabled', selectedCount !== 1);
        $('#channel-list-controls .btn-delete').prop('disabled', selectedCount !== 1);
    }

    function getChannelId(el) {
        var idAttr;
        while (el && !(idAttr = el.getAttribute('data-channel-id'))) {
            el = el.parentNode;
        }
        return Number(idAttr);
    }
    
    function getCurrentChannelId() {
        return Number($('#channel-table div.checked')[0].parentNode.getAttribute('data-channel-id'));
    }

    // 加载页面数据
    function loadPage(pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        var pager = {
            page: String(pageNum),
            total: '0',
            per_page: String(nDisplayItems),
            orderby: 'ID',
            sortby: '',
            keyword: keyword
        };
        var data = JSON.stringify({
            Action: 'GetPage',
            Project: projectName,
            Pager: pager
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/channels/', data, render);
    }

    // 渲染界面
    function render(json) {

        var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
        $('#channel-table-pager').jqPaginator({
            // totalPages: totalPages,
            totalCounts: json.Pager.total,
            pageSize: nDisplayItems,
            visiblePages: 10,
            currentPage: Number(json.Pager.page),
            onPageChange: function (num, type) {
                if (type === 'change') {
                    loadPage(num);
                }
            }
        });

        $('#channel-table>tbody').html('');
        json.Channels.forEach(function (el, idx, arr) {
            var schedule_type = el.Overall_Schedule_Type === 'Regular' ? '常规' : '定时';
            var schedule_params = {
                'Sequence': '顺序',
                'Percent': '比例',
                'Random': '随机'
            }[el.Overall_Schedule_Paras.Type];
            schedule_params = schedule_params ? schedule_params : '其它';
            var data = {
                id: el.ID,
                name: el.Name,
                schedule_type: schedule_type,
                schedule_params: schedule_params,
                version: el.Version
            };
            $('#channel-table>tbody').append(templates.channel_table_row(data));
        });
        onSelectedItemChanged();

        $('#channel-table input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        });

    }
	
});
