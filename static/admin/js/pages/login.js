var languageJson = {
    zh_CN: {
        pageTitle: "HK IPS 1.0",
        pageTitle_mms: "HK MMS 1.0",
        title2: "IPS 1.0",
        title2_mms: "MMS 1.0",
        loginName: "登  录",
        error_prompt1: "请您输入用户名！",
        error_prompt2: "用户名格式不正确！例：xxx@develop",
        error_prompt3: "请您输入密码！"
    },
    en_US: {
        pageTitle: "HK IPS 1.0",
        pageTitle_mms: "HK MMS 1.0",
        title2: "1.0",
        title2_mms: "1.0",
        loginName: "Sign In",
        error_prompt1: "Please enter user name!",
        error_prompt2: "User name format is not correct! Such as：xxx@develop",
        error_prompt3: "Please enter your password!"
    },
    zh_default: {
        title1: "智慧发布系统",
        //title1: "语音播报系统",
        //title1: "信息互动系统",
        title1_mms: "会议预定系统",
        loginTitle: "登录 HK IPS 账户",
    },
    en_default: {
        title1: "IPS",
        title1_mms: "MMS",
        loginTitle: "Login HK IPS Account",
    },
    zh_MCLZ: {
        title1: "明厨亮灶",
        loginTitle: "登录 明厨亮灶 账户",
    },
    en_MCLZ: {
        title1: "Open Kitchen",
        loginTitle: "Login Open Kitchen Account",
    },
    zh_KFCS: {
        title1: "开发测试文本",
        loginTitle: "登陆 开发测试 账户",
    },
    zh_Clivia: {
        title1: "CLIVIA",
        loginTitle: "登陆 CLIVIA 账户"
    },
    en_Clivia: {
        title1: "CLIVIA",
        loginTitle: "Login CLIVIA Account" 
    }
}

$(document).ready(function () {
    var language, obj;

    var languageConfig = checkURL();

    $("#l_language .language_zh").click(function () {
        setCookie("language", "zh-CN")
        languageStatus(languageConfig)
    })
    $("#l_language .language_en").click(function () {
        setCookie("language", "en-US")
        languageStatus(languageConfig)
    })

    $("#l_version span").text(CONFIG.version);

    $('#submit').click(function () {
        debugger
        /*$("#error_m").html("");
        if ($("#username").val() == "") {
            $("#error_m").html(obj.error_prompt1);
            return false;
        } else if ($("#username").val().substring(0, $("#username").val().indexOf('@')) == "") {
            $("#error_m").html(obj.error_prompt2);
            return false;
        } else if ($("#password").val() == "") {
            $("#error_m").html(obj.error_prompt3);
            return false;
        }*/
        var account = $("#username").val().split('@')[0];
        var account_mms = $("#username").val();
        var projectName = 'Default'/*$("#username").val().split('@')[1]*/;
        var projectName_mms = '';
        var pwd = hex_md5($('#password').val());
        var isMMS = false/*$('.ims').hasClass('isSelected') ? false : true*/;
        // alert(projectName);
        $.post(
            CONFIG.requestURL + '/backend_mgt/v2/logon/',
            base64_encode(JSON.stringify({
                "xxx1": "GetToken",
                "xxx2": isMMS ? projectName_mms : projectName,
                "xxx3": isMMS ? account_mms : account,
                "xxx4": pwd
            })),
            function (data) {
                debugger
                var result = JSON.parse(data);
                var status = result.rescode;
                var err = result['errInfo'];
                localStorage.setItem("project_name", isMMS ? result.project : projectName);
                localStorage.setItem("account", isMMS ? account_mms: account);
                localStorage.setItem("token", result.token);
                if ($('.ims').hasClass('isSelected')) {
                    window.location.href = "index.html";
                } else {
                    window.location.href = window.location.origin + "/meeting/index.html";
                }
                /*if (status == 200) {
                    localStorage.setItem("project_name", isMMS ? result.project : projectName);
                    localStorage.setItem("account", isMMS ? account_mms: account);
                    localStorage.setItem("token", result.token);
                    if ($('.ims').hasClass('isSelected')) {
                        window.location.href = "index.html";
                    } else {
                        window.location.href = window.location.origin + "/meeting/index.html";
                    }
                } else {
                    $("#error_m").html(err);
                }*/
            });

    })

    $('.ims').on('click', function (e) {
        var target = $(e.currentTarget);
        $('.tabs span').removeClass('isSelected');
        target.addClass('isSelected');
        $('.imsTitle').show();
        $('.mmsTitle').hide();
        languageStatus(languageConfig);
    })

    //清空Localstorage
    localStorage.clear();

    $('.ims').trigger('click');
    languageStatus(languageConfig)
    /**
     * 判断语言
     */
    function languageStatus(caseName) {
        if (getCookie("language") == undefined) {
            language = CONFIG.default_language;
        } else {
            language = getCookie("language");
        }
        if (language == "zh-CN") {
            obj = languageJson.zh_CN;
            caseText = languageJson['zh_' + caseName]
            $("#l_language .language_zh").addClass("active").attr("disabled", true);
            $("#l_language .language_en").removeAttr("disabled").removeClass("active");
            setCookie("language", "zh-CN")
        } else if (language == "en-US") {
            obj = languageJson.en_US;
            caseText = languageJson['en_' + caseName]
            $("#l_language .language_en").addClass("active").attr("disabled", true);
            $("#l_language .language_zh").removeAttr("disabled").removeClass("active");
            setCookie("language", "en-US")
        }
        if ($('.ims').hasClass('isSelected')) {
            $("title").html(obj.pageTitle);
            $(".login-logo").html(" ");

        } else {
            $("title").html(obj.pageTitle_mms);
            $(".login-logo").html('<b>' + caseText.title1_mms + '</b>&nbsp;' + obj.title2_mms);
        }
        $(".login-box-body .ims").html(caseText.loginTitle);
        $(".login-box-body .mms").html(caseText.loginTitle);
        $(".login-box-body #submit").val(obj.loginName);

    }
}).keydown(function (e) {
    if (e.keyCode == 13) {
        $("#submit").trigger("click");
    }
});

function cookies(projectname, value) {
    if (getCookie(projectname) == undefined) {
        setCookie(projectname, value);
    } else if (getCookie(projectname) != "") {
        setCookie(projectname, value);
    }
}

// //设置cookie
function setCookie(name, value, days) {
    //var exp=new Date();
    //exp.setTime(exp.getTime() + days*24*60*60*1000);
    //var arr=document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
    document.cookie = name + "=" + escape(value);
}
function getCookie(name) {
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if (arr != null) {
        return unescape(arr[2]);
        return null;
    }
}

$(function () {
    if (getCookie("project_name") != undefined) {
        auto($("#username"));
    }
});

//用户名自动补全
function auto(selector) {
    var elt = selector;
    var autoComplete, autoLi;
    var strHtml = [];
    strHtml.push('<div class="AutoComplete" id="AutoComplete">');
    strHtml.push('    <ul class="AutoComplete_ul">');
    strHtml.push('        <li hz="@' + getCookie("project_name") + '"></li>');
    strHtml.push('    </ul>');
    strHtml.push('</div>');

    $('body').append(strHtml.join(''));

    autoComplete = $('#AutoComplete');
    autoComplete.data('elt', elt);
    autoLi = autoComplete.find('li:not(.AutoComplete_title)');
    autoLi.mouseover(function () {
        $(this).siblings().filter('.hover').removeClass('hover');
        $(this).addClass('hover');
    }).mouseout(function () {
        $(this).removeClass('hover');
    }).mousedown(function () {
        autoComplete.data('elt').val($(this).text()).change();
        autoComplete.hide();
    });
    //用户名补全+翻动
    elt.keyup(function (e) {
        if (/13|38|40|116/.test(e.keyCode) || this.value == '') {
            return false;
        }
        var username = this.value;
        if (username.indexOf('@') == -1) {
            autoComplete.hide();
            return false;
        }
        autoLi.each(function () {
            this.innerHTML = username.replace(/\@+.*/, '') + $(this).attr('hz');
            if (this.innerHTML.indexOf(username) >= 0) {
                $(this).show();
            } else {
                $(this).hide();
            }
        }).filter('.hover').removeClass('hover');
        autoComplete.show().css({
            left: $(this).offset().left,
            top: $(this).offset().top + $(this).outerHeight(true) - 1,
            position: 'absolute',
            zIndex: '99999'
        });
        if (autoLi.filter(':visible').length == 0) {
            autoComplete.hide();
        } else {
            autoLi.filter(':visible').eq(0).addClass('hover');
        }
    }).keydown(function (e) {
        if (e.keyCode == 38) { //上
            autoLi.filter('.hover').prev().not('.AutoComplete_title').addClass('hover').next().removeClass('hover');
        } else if (e.keyCode == 40) { //下
            autoLi.filter('.hover').next().addClass('hover').prev().removeClass('hover');
        } else if (e.keyCode == 13) { //Enter
            autoLi.filter('.hover').mousedown();
            e.preventDefault();    //如有表单，阻止表单提交
        }
    }).focus(function () {
        autoComplete.data('elt', $(this));
    }).blur(function () {
        autoComplete.hide();
    });
}

function base64_encode(str){
    var c1, c2, c3;
    var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var i = 0, len= str.length, string = '';

    while (i < len){
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len){
            string += base64EncodeChars.charAt(c1 >> 2);
            string += base64EncodeChars.charAt((c1 & 0x3) << 4);
            string += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len){
            string += base64EncodeChars.charAt(c1 >> 2);
            string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            string += base64EncodeChars.charAt((c2 & 0xF) << 2);
            string += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        string += base64EncodeChars.charAt(c1 >> 2);
        string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        string += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        string += base64EncodeChars.charAt(c3 & 0x3F)
    }
    return string
}

function checkURL() {
    var url = window.location.hostname;
    var languageConfig = {};
    switch (url) {
        case "www.fangxineat.com":
        case "fangxineat.com":
            languageConfig.case = "MCLZ";
            break;
        case "192.168.30.110":
            languageConfig.case = "default";
            break;
        case "yun.jsclivia.com":
        case "180.101.41.178":
            languageConfig.case = "Clivia";
            break;
        default:
            languageConfig.case = "default";
            break;
    }
    return languageConfig.case;
}
