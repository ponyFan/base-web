define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require('common/templates');
    var getClassAndTerm = require('pages/store/getTermClassAndTerm_store.js');
    var nDisplayItems = 10;
    var _pageNO = 1;
    var languageJSON = CONFIG.languageJson.store;
    exports.init = function () {
        selectLanguage();


        // search
        $("#term_search").keyup(function (event) {
            if (event.keyCode == 13) {
                var searchKeyword = $.trim($('#term_search').val());
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                exports.loadStoresPage(_pageNO, true);
            }
        }).change(function () {
            var searchKeyword = $.trim($('#term_search').val());
            if (!UTIL.isValidated('keyword', searchKeyword)) return;
            exports.loadStoresPage(_pageNO, true);
        });
        $("#term_search").next().click(function () {
            var searchKeyword = $.trim($('#term_search').val());
            if (!UTIL.isValidated('keyword', searchKeyword)) return;
            exports.loadStoresPage(_pageNO, true);
        });

        exports.loadStoresPage(_pageNO, true); //加载默认页面
    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#storeTitle").html(languageJSON.storeBinding);
        $("#term_search").attr("placeholder", languageJSON.pl_searchStore);
        $("#store_add").html('<i class="fa fa-pencil-square-o"></i>' + languageJSON.createNewStore);
    }

    // 加载页面数据
    exports.loadStoresPage = function (pageNum, isSearch) {
        _pageNO = pageNum;
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        // loading
        $("#storesTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        var searchKeyword = $.trim($('#term_search').val());
        exports.pNum = pageNum;
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'store_list',
            Pager: {
                "total": -1,
                "per_page": nDisplayItems,
                "page": isSearch ? 1 : _pageNO,
                "orderby": "",
                "sortby": "desc",
                "keyword": searchKeyword
            }
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v1/storeManagement';
        UTIL.ajax('post', url, data, function (json) {
            $("#storesTable tbody").html("");
            //翻页
            var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
            totalPages = Math.max(totalPages, 1);
            $('#stores-table-pager').jqPaginator({
                // totalPages: totalPages,
                totalCounts: json.Pager.total ,
                pageSize: nDisplayItems,
                visiblePages: CONFIG.pager.visiblePages,
                first: CONFIG.pager.first,
                prev: CONFIG.pager.prev,
                next: CONFIG.pager.next,
                last: CONFIG.pager.last,
                page: CONFIG.pager.page,
                currentPage: isSearch ? 1 : _pageNO,
                onPageChange: function (num, type) {
                    if (type === 'change') {
                        _pageNO = num;
                        exports.loadStoresPage(_pageNO, false);
                    }
                }
            });
            //拼接
            if (json.stores != undefined) {
                var strData = json.stores;
                $("#storesTable tbody").append('<tr>' +
                    '<th class="store_name">' + languageJSON.store + '</th>' +
                    '<th class="store_address">' + languageJSON.storeAddress + '</th>' +
                    '<th class="store_licenseNo">' + languageJSON.storeLicenseNo + '</th>' +
                    '<th class="store_connection">' + languageJSON.storeConnection + '</th>' +
                    '<th class="store_operation">' + languageJSON.operation + '</th>' +
                    '</tr>');
                for (var x = 0; x < strData.length; x++) {
                    //var stringArry;
                    var rID = strData[x].ID;
                    var rName = strData[x].StoreName;
                    var rAddress = strData[x].StoreAddress;
                    var rLicenseNo = strData[x].StoreLicenseNo;
                    var rConnection = strData[x].StoreConnection;
                    var operation = '' +
                        '<a class="binding"><button type="button" class="btn btn-default btn-xs">' + languageJSON.binding + '</button></a> ' +
                        '<a class="unbind"><button type="button" class="btn btn-default btn-xs">' + languageJSON.unbind + '</button></a> ' +
                        '<a class="bindingList"><button type="button" class="btn btn-default btn-xs">' + languageJSON.bindingList + '</button></a> ' +
                        '<a class="stores_delete"><button type="button" class="btn btn-default btn-xs"><i class="glyphicon glyphicon-trash user-delete"></i></button></a>';
                    var roltr = '<tr class="user-row" storeID="' + rID + '" storeName="' + rName + '" storeAddress="' + rAddress + '" storeLicenseNo="' + rLicenseNo + '" storeConnection="' + rConnection + '">' +
                        '<td class="store_name"><a class="sName">' + rName + '</a></td>' +
                        '<td class="store_address">' + rAddress + '</td>' +
                        '<td class="store_licenseNo">' + rLicenseNo + '</td>' +
                        '<td class="store_connection">' + rConnection + '</td>' +
                        '<td class="store_operation">' + operation + '</td>' +
                        '</tr>';
                    $("#storesTable tbody").append(roltr);
                }
                exports.pageNum = _pageNO;
                //添加
                $("#store_add").click(function () {
                    exports.type = "add";
                    UTIL.cover.load('resources/pages/store/store_edit.html');
                });
                //绑定列表
                $(".binding").click(function () {
                    var currentID = $(this).parent().parent().attr("storeID");
                    bindDevice("binding", currentID)
                });
                $(".unbind").click(function () {
                    var currentID = $(this).parent().parent().attr("storeID");
                    bindDevice("unbind", currentID)
                });
                $(".bindingList").click(function () {
                    var currentID = $(this).parent().parent().attr("storeID");
                    bindDevice("bindingList", currentID)
                });
                function bindDevice(tps, currentId) {
                    UTIL.cover.load('resources/pages/store/getTermClassAndTerm_store.html');
                    getClassAndTerm.title = languageJSON[tps];
                    getClassAndTerm.tps = tps;
                    getClassAndTerm.Term = currentId;
                    getClassAndTerm.save = function (data) {
                        var post_data = JSON.stringify({
                            project_name: CONFIG.projectName,
                            action: data.action,
                            termID: data.termID,
                            storeId: currentId
                        });
                        var url = CONFIG.serverRoot + '/backend_mgt/v1/storeManagement';
                        UTIL.ajax('post', url, post_data, function (msg) {
                            if (msg.rescode == 200) {
                                alert(languageJSON.al_Success);
                                UTIL.cover.close();
                            }
                            else {
                                alert(languageJSON.al_Failed);
                                UTIL.cover.close();
                            }
                        });
                    }
                }
                //删除
                $(".stores_delete").click(function () {
                    var self = $(this);
                    var currentID = self.parent().parent().attr("storeID");
                    if (confirm(languageJSON.cf_delStore + "？")) {
                        var data = JSON.stringify({
                            project_name: CONFIG.projectName,
                            action: 'deleteStore',
                            data: { "storeId": currentID }
                        });
                        var url = CONFIG.serverRoot + '/backend_mgt/v1/storeManagement';
                        UTIL.ajax('post', url, data, function (msg) {
                            if (msg.rescode == 200) {
                                alert(languageJSON.al_delSuc)
                            } else {
                                alert(languageJSON.al_delFaild)
                            };
                            exports.loadStoresPage(_pageNO); //刷新页面
                        });
                    }
                });
                //编辑
                $(".sName").click(function () {
                    var self = $(this);
                    var sName = self.html();
                    var currentID = self.parent().parent().attr("storeID");
                    var sAddress = self.parent().parent().attr("storeAddress");
                    var sLicenseNo = self.parent().parent().attr("storeLicenseNo");
                    var sConnection = self.parent().parent().attr("storeConnection");
                    exports.type = "edit";
                    exports.storeName = sName;
                    exports.storeID = currentID;
                    exports.storeAddress = sAddress;
                    exports.storeLicenseNo = sLicenseNo;
                    exports.storeConnection = sConnection;
                    UTIL.cover.load('resources/pages/store/store_edit.html');
                });
            }
        });
    };

    //function render(json) {

    //}
})
