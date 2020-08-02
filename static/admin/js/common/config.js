define(function (require, exports, module) {
    var UTIL = require("common/util.js");
    var ZH_CN = require("common/language/zh-CN.js");
    var EN_US = require("common/language/en-US.js");

    exports.userName = UTIL.getLocalParameter("account");
    exports.serverRoot = CONFIG.requestURL;
    exports.meetingRoot = CONFIG.meetingURL;
    exports.Resource_UploadURL = CONFIG.uploadURL;
    exports.version = CONFIG.version;
    exports.adVersion = CONFIG.adVersion;
    exports.projectName = UTIL.getLocalParameter('project_name');
    exports.token = UTIL.getLocalParameter('token');
    // exports.termListLoadInterval = 60 * 1000;
    exports.termSnapInterval = 1 * 1000;
    exports.termSnapWait = 30 * 1000;
    exports.termGetLogWait = 2 * 60 * 1000;
    exports.letTimeout = 60000;

    /**
     * 语言选择
     * @param language
     */
    exports.selectLanguage = function (language) {
        exports.language = language;
        if (exports.language == undefined) {
            exports.languageJson = ZH_CN.JSON;
        }else if (exports.language == "zh-CN") {
            exports.languageJson = ZH_CN.JSON;
        } else if (exports.language == "en-US") {
            exports.languageJson = EN_US.JSON;
        }
    }

    if (exports.token == undefined) {
        var currentLang = navigator.language;
        UTIL.setCookie("language", "zh-CN");
        var language = "zh-CN";
        if(!currentLang)
            currentLang = navigator.browserLanguage;
        switch (currentLang.toLowerCase()) {
            case "zh-cn":
                UTIL.setCookie("language", "zh-CN");
                break;
            case "en-us":
                UTIL.setCookie("language", "en-US");
                break;
            default:
                break;
        }
        exports.selectLanguage(UTIL.getCookie("language"));
        alert(exports.languageJson.index.errorRelogin);
        window.location.href = "login.html";
        return false;
    }

    exports.selectLanguage(UTIL.getCookie("language"));

    exports.pager = {
        pageSize: 15,
        visiblePages: 5,
        first: '<li><a href="javascript:;">' + exports.languageJson.first + '</a></li>',
        prev: '<li><a href="javascript:;">' + exports.languageJson.prev + '</a></li>',
        next: '<li><a href="javascript:;">' + exports.languageJson.next + '</a></li>',
        last: '<li><a href="javascript:;">' + exports.languageJson.last + '</a></li>',
        page: '<li><a href="javascript:;">{{page}}</a></li>'
    }
});
