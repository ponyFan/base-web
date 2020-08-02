define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var STORES = require("pages/store/store_list.js");
    var languageJSON = CONFIG.languageJson.store;

    exports.init = function () {
        selectLanguage();
        //加载用户信息
        var type=STORES.type;
        var uID = Number(STORES.storeID);
        var uName1 = STORES.storeName;
        var uAddress1 = STORES.storeAddress;
        var uLicenseNo1 = STORES.storeLicenseNo;
        var uConnection1 = STORES.storeConnection;
        var _pageNO = Number(STORES.pageNum);
        if (type === "edit") {
            $(".modal-title").html("<i class='fa fa-pencil-square-o'></i>" + languageJSON.editStore);
            $("#store_name").val(uName1);
            $("#store_address").val(uAddress1);
            $("#store_licenseNo").val(uLicenseNo1);
            $("#store_connection").val(uConnection1);
            $("#store_name")[0].focus();
            //确定
            $("#store_create").click(function () {
                var uName = $("#store_name").val();
                var uAddress = $("#store_address").val();
                var uLicenseNo = $("#store_licenseNo").val();
                var uConnection = $("#store_connection").val();
                var regT = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/; //验证手机号的正则表达式
                var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/; //验证邮箱的正则表达式
                if (uName === "") {
                    alert(languageJSON.al_storeName + "！");
                    $("#store_name")[0].focus();
                    return false;
                } else if (uAddress === "") {
                    alert(languageJSON.al_storeAddress + "！");
                    $("#store_address")[0].focus();
                    return false;
                } else if (uLicenseNo === "") {
                    alert(languageJSON.al_storeLicenseNo + "！");
                    $("#store_licenseNo")[0].focus();
                    return false;
                } else if (!(regT.test(uConnection) || reg.test(uConnection)) || uConnection === "") {
                    alert(languageJSON.al_storeConnection + "！");
                    $("#store_connection")[0].focus();
                    return false;
                }
                var name = {
                    storeId: uID,
                    StoreName: uName,
                    StoreAddress: uAddress,
                    StoreLicenseNo: uLicenseNo,
                    StoreConnection: uConnection
                };
                var data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: 'updateStore',
                    data: name
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v1/storeManagement';
                UTIL.ajax('post', url, data, function (msg) {
                    if (msg.rescode == 200) {
                        UTIL.cover.close();
                        alert(languageJSON.al_updateStoreSuc);
                        STORES.loadStoresPage(_pageNO);
                    } else {
                        alert(languageJSON.al_updateStoreFaild);
                    }
                });
            });
        } else if (type === "add") {
            $("#store_name").val("");
            $("#store_address").val("");
            $("#store_licenseNo").val("");
            $("#store_connection").val("");
            $(".modal-title").html("<i class='fa fa-pencil-square-o'></i>" + languageJSON.addStore);
            var regT = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/; //验证手机号的正则表达式
            var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/; //验证邮箱的正则表达式
            //确定
            $("#store_create").click(function () {
                var sName = $("#store_name").val();
                var sAddress = $("#store_address").val();
                var sLicenseNo = $("#store_licenseNo").val();
                var sConnection = $("#store_connection").val();
                if (sName === "") {
                    alert(languageJSON.al_storeName + "！");
                    $("#store_name")[0].focus();
                    return false;
                } else if (sAddress === "") {
                    alert(languageJSON.al_storeAddress + "！");
                    $("#store_address")[0].focus();
                    return false;
                } else if (sLicenseNo === "") {
                    alert(languageJSON.al_storeLicenseNo + "！");
                    $("#store_licenseNo")[0].focus();
                    return false;
                } else if (!(regT.test(sConnection) || reg.test(sConnection)) || sConnection === "") {
                    alert(languageJSON.al_storeConnection + "！");
                    $("#store_connection")[0].focus();
                    return false;
                }
                var name = {
                    StoreName: sName,
                    StoreAddress: sAddress,
                    StoreLicenseNo: sLicenseNo,
                    StoreConnection: sConnection
                };
                var data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: 'addStore',
                    data: name
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v1/storeManagement';
                UTIL.ajax('post', url, data, function (msg) {
                    if (msg.rescode == 200) {
                        UTIL.cover.close();
                        type = "";
                        alert(languageJSON.al_addStoreSuc);
                        STORES.loadStoresPage(1);
                    } else {
                        type = "";
                        alert(languageJSON.al_addStoreFaild);
                    }
                });
            });
        }
        //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
            type = "";
        });
    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#md_storeName").html(languageJSON.store);
        $("#md_storeAddress").html(languageJSON.storeAddress);
        $("#md_storeLicenseNo").html(languageJSON.storeLicenseNo);
        $("#md_storeConnection").html(languageJSON.storeConnection);
        $("#store_create").html(languageJSON.submit);
        // $("#user_name1").attr("placeholder", languageJSON.pl_enUsername);
    }
});
