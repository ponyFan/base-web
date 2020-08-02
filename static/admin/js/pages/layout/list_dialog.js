
define(function (require, exports, module) {
   'use strict';

    var templates   = require('common/templates'),
        config      = require('common/config'),
        util        = require('common/util');

    var requestUrl  = config.serverRoot,
        projectName = config.projectName,
        nDisplayItems = config.pager.pageSize,
        nVisiblePages = config.pager.visiblePages,
        pagerFist = config.pager.first,
        pagerLast = config.pager.last,
        pagerNext = config.pager.next,
        pagerPrev = config.pager.prev,
        pagerPage = config.pager.page,
        instance,
        languageJSON = config.languageJson.channel;

    function openDialog() {
        instance = null;
        if (instance) {
            console.error('模版列表对话框已经存在!');
            return;
        }
        instance = {
            currentPage: 1,
            keyword: ''
        };
        var lang = {
            selectLayout: languageJSON.selectLayout,
            searchLayout: languageJSON.searchLayout,
        };
        $('#cover_area').html(templates.layout_list_dialog(lang))
            .css({display: 'flex'});
        loadPage(instance.currentPage, instance.keyword);
        registerEventListeners();
    }

    function loadPage(pageNum,  keyword) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $('.layout-list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        var pager = {
            page: String(pageNum),
            total: '0',
            per_page: nDisplayItems,
            orderby: 'CreateTime',
            sortby: 'DESC',
            keyword: keyword
        };
        var data = JSON.stringify({
            action: 'listPage',
            project_name: projectName,
            Pager: pager
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, render);
    }
    
    function updatePager(totalPages, totalCounts, currentPage) {
        var jqObj = $('#layout-table-pager');
        jqObj.jqPaginator({
            // totalPages: totalPages,
            totalCounts: totalCounts,
            pageSize: nDisplayItems,
            // visiblePages: nVisiblePages,
            visiblePages: 3,
            // first: pagerFist,
            // last: pagerLast,
            next: pagerNext,
            prev: pagerPrev,
            page: pagerPage,
            currentPage: currentPage,
            onPageChange: function (num, type) {
                if (type === 'change') {
                    instance.currentPage = num;
                    loadPage(num, instance.keyword);
                }
            }
        });
    }

    function render(json) {

        var totalPages = Math.max(1, Math.ceil(json.Pager.total / nDisplayItems)),
            currentPage = Number(json.Pager.page);
        updatePager(totalPages, json.Pager.total, currentPage);

        $('#layout-list-dialog .layout-list').html('');
        json.LayoutList.forEach(function (el, idx, arr) {
            //var style = el.BackgroundPic.Type === 'Unknown' ?
            //    'background-color: ' + el.BackgroundColor : 'background-image: url(' + getThumbnail(el) + ')';
            var style = 'background-image: url(' + getThumbnail(el) + ')';
            var data = {
                id: el.ID,
                name: el.Name,
                style: style
            };
            $('#layout-list-dialog .layout-list').append(templates.layout_list_dialog_item(data));
        });

    }

    function registerEventListeners() {
        $('#layout-list-dialog .layout-list').delegate('li', 'click', function (ev) {
            var layoutId = parseInt(this.getAttribute('data-layout-id'));
            notifySelectItem(layoutId);
        });
        $('#layout-list-dialog .layout-list-search').change(function (ev) {
            var keyword = this.value;
            if (keyword !== instance.keyword) {
                instance.keyword = keyword;
                instance.currentPage = instance.currentPage;
                loadPage(1, keyword);
            }
        });
        $('#layout-list-dialog .btn-close').click(closeDialog);
    }

    function unregisterEventListeners() {}

    function closeDialog() {
        unregisterEventListeners();
        $('#cover_area')
            .html('')
            .css({display: 'none'});
        notifyCloseDialog();
        instance = null;
    }

    function notifySelectItem(layoutId) {
        instance.onSelectListener && instance.onSelectListener(layoutId);
    }

    function onSelectItem(listener) {
        instance.onSelectListener = listener;
    }

    function notifyCloseDialog() {
        instance.onCloseDialogListener && instance.onCloseDialogListener();
    }

    function onCloseDialog(listener) {
        instance.onCloseDialogListener = listener;
    }

    /**
     *获取缩略图
     */
    function getThumbnail(el) {
        var background_image;
        if (el.BackgroundPic.Type == "Unknown" ||!el.BackgroundPic.Type) {
            var data = JSON.stringify({
                project_name: projectName,
                action: 'getThumbnail',
                data: {
                    layout_id: String(el.ID),
                }
            });
            util.ajax2('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
                if (Number(res.ID) != undefined) {
                    console.log('获取缩略图添加成功!');
                    background_image = res.Thumbnail;
                }
            })
        } else {
            background_image = util.getRealURL(el.BackgroundPic.Download_Auth_Type, el.BackgroundPic.URL);
        }
        return background_image;
    }

    exports.open = openDialog;
    exports.close = closeDialog;
    exports.onSelect = onSelectItem;
    exports.onClose = onCloseDialog;

});

