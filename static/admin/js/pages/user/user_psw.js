define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var USERS = require("pages/user/users_list.js");
    var INDEX = require("pages/index.js")
    var languageJSON = CONFIG.languageJson.user;

    exports.init = function () {
        selectLanguage();
        var type = INDEX.type;
        var _pageNO = Number(USERS.pageNum);
        if (type) {
            INDEX.type = ''
            console.log('修改当前用户密码')
            uName = INDEX.userName;
            $(".modal-title").html("<i class='fa fa-user'></i>" + languageJSON.updatePsw)
            $("#user_name").val(uName);
            $("#password").val("");
            $("#password1").val("");
            //提交
            $("#user_reset_psw").click(function () {
                var uName = $("#user_name").val();
                var uPassword = $("#password").val();
                var uPassword1 = $("#password1").val();
                var psdreg_1 = /^.*(?=.{8,})(?=.*\d)(?=.*[a-zA-Z]).*$/;//数字+字母
                var psdreg_2 = /^.*(?=.{8,})(?=.*\d)(?=.*[!@#$%^&*? ]).*$/;//数字+特殊符号
                var psdreg_3 = /^.*(?=.{8,})(?=.*[!@#$%^&*? ])(?=.*[a-zA-Z]).*$/;//特殊符号+字母
                var psdreg_4 = /^.*(?=.{8,})(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*? ]).*$/;//特殊符号+字母+数字
                if (uPassword === "") {
                    alert(languageJSON.al_noPsw + "！");
                    $("#password")[0].focus();
                    return false
                } else if (!psdreg_1.test(uPassword) && !psdreg_2.test(uPassword) && !psdreg_3.test(uPassword) && !psdreg_4.test(uPassword)) {
                    alert(languageJSON.al_noPass + "！");
                    $("#password1")[0].focus();
                    return false
                } else if (uPassword1 === "") {
                    alert(languageJSON.al_noPsw + "！");
                    $("#password1")[0].focus();
                    return false
                } else if (uPassword != uPassword1) {
                    alert(languageJSON.al_pswNotConsistent + "！");
                    $("#password")[0].focus();
                    return false
                } else {
                    var psw = {
                        PASSWORD: hex_md5(uPassword),
                        USERNAME: uName
                    }
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: 'UpdateUserPassByUserName',
                        Data: psw
                    });
                    var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails/' + uName;
                    UTIL.ajax(
                        'post', url, data,
                        function (msg) {
                            if (msg.rescode == 200) {
                                alert(languageJSON.al_pswUpdateSuc);
                                UTIL.cover.close();
                            } else {
                                alert(languageJSON.al_pswUpdateFaild)
                            }
                        }
                    );
                }
            });
        } else {
            //重置密码-重新获取用户列表
            console.log('重置密码')
            var uName = USERS.userName1;
            $("#user_name").val(uName);
            var uID = USERS.userID1;
            $("#password").val("");
            $("#password1").val("");
            var psdreg_1 = /^.*(?=.{8,})(?=.*\d)(?=.*[a-zA-Z]).*$/;//数字+字母
            var psdreg_2 = /^.*(?=.{8,})(?=.*\d)(?=.*[!@#$%^&*? ]).*$/;//数字+特殊符号
            var psdreg_3 = /^.*(?=.{8,})(?=.*[!@#$%^&*? ])(?=.*[a-zA-Z]).*$/;//特殊符号+字母
            var psdreg_4 = /^.*(?=.{8,})(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*? ]).*$/;//特殊符号+字母+数字
            //提交
            $("#user_reset_psw").click(function () {
                var uPassword = $("#password").val();
                var uPassword1 = $("#password1").val();
                if (uPassword === "") {
                    alert(languageJSON.al_noPsw + "！");
                    $("#password")[0].focus();
                    return false
                } else if (!psdreg_1.test(uPassword) && !psdreg_2.test(uPassword) && !psdreg_3.test(uPassword) && !psdreg_4.test(uPassword)) {
                    alert(languageJSON.al_noPass + "！");
                    $("#password1")[0].focus();
                    return false
                } else if (uPassword1 === "") {
                    alert(languageJSON.al_noPsw + "！");
                    $("#password1")[0].focus();
                    return false
                } else if (uPassword != uPassword1) {
                    alert(languageJSON.al_pswNotConsistent + "！");
                    $("#password")[0].focus();
                    return false
                } else {
                    var psw = {
                        PASSWORD: hex_md5(uPassword),
                        USERNAME: uName
                    }
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: 'UpdateUserPass',
                        Data: psw
                    });
                    var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails/' + uID;
                    UTIL.ajax('post', url, data, function (msg) {
                        if (msg.rescode == 200) {
                            UTIL.cover.close();
                            alert(languageJSON.al_resetPswSuc);
                        } else {
                            alert(languageJSON.al_resetPswFaild)
                        }
                        USERS.loadUsersPage(_pageNO);
                    });
                }
            });
        }

        //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
        });
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".modal-title").html("<i class='fa fa-user'></i> " + languageJSON.resetPsw)
        $("#lbl_username").html(languageJSON.username);
        $("#lbl_newPsw").html(languageJSON.newPsw+'<span style="font-size:12px;">('+languageJSON.al_noPass+')</span>');
        $("#lbl_rePsw").html(languageJSON.cfPsw);
        $("#user_reset_psw").html(languageJSON.submit);
    }
})
