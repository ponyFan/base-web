define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var USERS = require("pages/user/users_list.js");
    var AUDITLIST = require("pages/user/audit_list.js");
    var languageJSON = CONFIG.languageJson.user;
    var _URL = '/backend_mgt/audit_group';
    var groupID = '';

    exports.init = function () {
        selectLanguage();
        getInfo()
        //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
        });

        $('#audit_create1').click(function() {
            if(!groupID || groupID == '' || groupID == 'undefined'){
                createAudit();
            }else{
                updateAudit();
            }
            
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {}

    function getInfo(){
        groupID = AUDITLIST.groupID
        if(!AUDITLIST.groupID || AUDITLIST.groupID == '' || AUDITLIST.groupID == 'undefined'){
            $('.modal-title').text('创建审核组')
            $("#audit_name1").val('')
        }else{
            AUDITLIST.groupID = ''
            $('.modal-title').text('编辑审核组')
            $("#audit_name1").val(AUDITLIST.groupName)
        }
    }
    function createAudit(){
        var auditName = $('#audit_name1').val();
        if(!auditName){
            alert('审核组名称不能为空！')
            return
        }
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "create",
            name: auditName
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                AUDITLIST.loadAuditPage();
                UTIL.cover.close();
            }
        })
    }
    function updateAudit(){
        var auditName = $('#audit_name1').val();
        if(!auditName){
            alert('审核组名称不能为空！')
            return
        }
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "change",
            id: groupID,
            name: auditName
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                AUDITLIST.loadAuditPage();
                UTIL.cover.close();
            }
        })
    }

})
