define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js"),
        templates = require('common/templates'),
        toast = require('common/toast'),
        util = require('common/util');

    var username = CONFIG.userName;
    var project = CONFIG.projectName;
    var languageJSON = CONFIG.languageJson.index;
    var caseTextJSON = CONFIG.languageJson.caseText;
    var isAdVersion = false;
    var menuList = [];
    var serverDateinterval = '';
    var dateTimer = ''
    var isInteractive = false
    var isPrison = false
    exports.init = function () {

        //检测项目
        var caseName = checkURL();
        var caseText = caseTextJSON[caseName];
        checkIsAd();
        getSysInfo();
        selectLanguage();
        $("#i_version span").text(CONFIG.version);
        if (username.indexOf('@') > 0) {
            $("#username, #bar").html(username);
        } else {
            $("#username, #bar").html(username + '@' + project);
        }
        //$("#bar").html(username + '@' + project);
        $("#USER-NAME").html(username);
        $(".main-header .logo .logo-lg").text(caseText.title);
        $("#subTitle").text(caseText.subTitle);
        // 存储权限
        initUserConfigs();

        // checkJurisdiction();
        checkJurisdiction_new();

        var msgNum = 0;
        // channelVersionCheck();
        //setInterval(channelVersionCheck, 10000);

        setNavBarHeight();
        window.onresize = function(){
            throttle(setNavBarHeight);
        }
        
        //登出
        $("#logout").click(function () {
            var data = JSON.stringify({
                action: 'logout',
                project_name: project,
            });
            var url = CONFIG.serverRoot + '/backend_mgt/v2/logout';
            util.ajax('post', url, data, function (json) {
                window.location.href = "login.html";
            })
        });
        //修改密码
        $("#repassword").click(function () {
            exports.type = "resetpsw";
            var uName = $("#USER-NAME").html();
            exports.userName = uName;
            UTIL.cover.load('resources/pages/user/user_psw.html');
        });

        /**
         * 频道版本校验
         */
        function channelVersionCheck() {
            $('#messageNum').html(msgNum > 0 ? msgNum : '');

            var data = JSON.stringify({
                action: "checkTerm",
                project: project,
            });
            var _url = CONFIG.serverRoot + '/backend_mgt/v2/sysinfo/';
            UTIL.ajax('post', _url, data, function (json) {
                console.log('1212123')
                if (json.res && json.res.length > 0) {
                    json.res.forEach(function (el) {
                        var data = {
                            title: languageJSON.warning,
                            datetime: el.ErrTime,
                            message: el.Error,
                        };
                        $('#msg-list').append(templates.message_menu_list_row(data));
                        msgNum++;

                        toast.show(languageJSON.new_message + "：" + el.Error);
                    })
                }
                $('#msg-box-title').html(languageJSON.you_have + ' ' + msgNum + ' ' + languageJSON.messages);
            })

        }
    };
    /**
     * 上传弹层页面
     */
    exports.upl = function () {
        $("#page_upload").load("resources/pages/materials/materials_upload.html");
        $("#page_upload").css("display", "flex");
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".index-lang-select .index-lang-option").click(function (el) {
            var lang = $(this).attr("lang");
            UTIL.setCookie("language", lang)
            window.location.reload();
            console.log($(this))
        })
        $("title").html(languageJSON.title);
        $("#languageName").html(CONFIG.languageJson.langName);
        $("#langImage").attr("src", CONFIG.languageJson.iconUrl)
        $("#repassword").html('<i class="fa fa-unlock-alt"></i>' + languageJSON.resetPassword);
        $("#logout").html('<i class="glyphicon glyphicon-log-out"></i>' + languageJSON.logout);
        $("#dpUpl").attr("title", languageJSON.dpUpl);
        $("#seeAllMsg").html(languageJSON.see_all_messages);
        localStorage.removeItem('ch_type');
    }

    function loadPage() {
        var page = window.location.hash.match(/^#([^?]*)/);
        //page = page === null ? 'terminal/list' : page[1];
        if (page == null) {
            if ($(".box-index-menu li:eq(0) ul").length == 0) {
                page = $(".box-index-menu li:eq(0)").find("a").attr("href").substring(1);
            } else {
                page = $(".box-index-menu li:eq(0) ul li:eq(0)").find("a").attr("href").substring(1);
            }
        } else {
            page = page[1];
        }
        page == 'channel/ad_plan' ? localStorage.setItem('ad_plan','1') : localStorage.removeItem('ad_plan');
        //刷新菜单的焦点
        $(".box-index-menu li").attr("class", "menutree");
        $(".box-index-menu li ul li").removeAttr("class");
        $(".box-index-menu").find("a").each(function () {
            if (page != null) {
                var activeHref = "#" + page;
                if ($(this).attr("href") == activeHref) {
                    if ($(this).parent().attr("class") == null) {					//二级菜单
                        $(this).parent().attr("class", "active");
                        $(this).parent().parent().parent().attr("class", "menutree active");
                    } else if ($(this).parent().attr("class") == "menutree") {	//一级菜单
                        $(this).parent().attr("class", "menutree active");
                    }
                    
                }
            }
        })

        //清除周期事件
        var MTRLIST = require("pages/materials/materials_list.js"),
            CHALISH = require("pages/channel/list.js"),
            STATISTICS = require("pages/terminal/statistics.js");
        window.clearInterval(MTRLIST.mtrListRefrash);
        window.clearInterval(CHALISH.channelListRefrash);
        window.clearInterval(STATISTICS.staInt);
        window.clearInterval(STATISTICS.staInt2);

        //检查关闭弹窗
        UTIL.cover.close();
        UTIL.cover.close(2);

        // load页面
        $('#page_box').load('resources/pages/' + page + '.html');
        //window.location.hash = page;
    }

    //检索权限
    function checkJurisdiction() {
        var data = JSON.stringify({
            action: 'GetFunctionModules',
            project_name: project,
            UserName: username,
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails';
        UTIL.ajax('post', url, data, function (json) {
            var menuJson = languageJSON.menu;
            var jdtData = json.FunctionModules;
            for (var a = 0; a < jdtData.length; a++) {
                var moduleId = jdtData[a].ModuleID;

                switch (moduleId) {
                    case 1:		//终端管理/控制台
                        if (jdtData[a].ReadWriteAuth == 1) {
                            $(".box-index-menu").append('<li id="treeview_term" class="menutree">' +
                                '<a><span>' + menuJson.console + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                '<li class="active"><a id="menu_termlist" href="#terminal/list"><i class="fa fa-television"></i> ' + menuJson.termList + '</a></li>' +
                                '</ul>' +
                                '</li>');
                        }
                        break;
                    case 2:		//频道管理/发布管理
                        if (jdtData[a].ReadWriteAuth == 1) {
                            $(".box-index-menu").append('<li id="treeview_channel" class="menutree">' +
                                '<a><span>111' + menuJson.releases + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                (isAdVersion ? '<li><a href="#channel/ad_plan"><i class="fa fa-list-alt"></i> 222' + menuJson.adPlan + '</a></li>' : '') +
                                '<li><a href="#channel/list"><i class="fa fa-newspaper-o"></i> 333' + menuJson.channelList + '</a></li>' +
                                '</ul>' +
                                '</li>');
                        }
                        break;
                    case 3:		//资源管理
                        if (jdtData[a].ReadWriteAuth == 1) {
                            $(".box-index-menu").append('<li id="treeview_mtr" class="menutree">' +
                                '<a><span>' + menuJson.resource + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                '<li><a href="#materials/materials_list"><i class="fa fa-folder"></i> ' + menuJson.resourceList + '</a></li>' +
                                '</ul>' +
                                '</li>');
                        }
                        break;
                    case 4:		//资源添加
                        break;
                    case 5:		//模版管理
                        if (jdtData[a].ReadWriteAuth == 1) {
                            if ($("#treeview_channel ul").length == 0) {
                                $(".box-index-menu").append('<li id="treeview_channel" class="menutree">' +
                                    '<a><span>&nbsp;777' + menuJson.layout + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                    '<ul class="menutree-menu">' +
                                    '<li><a href="#layout/list"><i class="fa fa-object-group"></i> 888' + menuJson.layoutList + '</a></li>' +
                                    '</ul>' +
                                    '</li>');
                            } else {
                                $("#treeview_channel ul").append('<li><a href="#layout/list"><i class="fa fa-object-group"></i> 999' + menuJson.layoutList + '</a></li>');
                            }
                        }
                        break;
                    case 6:		//用户管理/管理员工具
                        if (jdtData[a].ReadWriteAuth == 1) {
                            $(".box-index-menu").append('<li id="treeview_user" class="menutree">' +
                                '<a><span>&nbsp;' + menuJson.administratorTools + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                '<li><a href="#user/users_list"><i class="glyphicon glyphicon-user"></i> ' + menuJson.userList + '</a></li>' +
                                '<li><a href="#user/roles_list"><i class="fa fa-black-tie"></i> ' + menuJson.roleList + '</a></li>' +
                                '<li><a id="menu_userlog" href="#userlog/list"><i class="fa fa-eye"></i> ' + menuJson.oplog + '</a></li>' +
                                (isAdVersion ? '<li><a href="#user/audit_list"><i class="fa fa-legal"></i> ' + menuJson.reviewList1 + '</a></li>' : '') +
                                '</ul>' +
                                '</li>');
                            break;
                        }
                    case 7:		//审核权限
                        if (jdtData[a].ReadWriteAuth == 1) {
                            if(jdtData[1].ReadWriteAuth == 0){
                                $(".box-index-menu").append('<li id="treeview_channel" class="menutree">' +
                                '<a><span> 444' + menuJson.releases + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                '<li><a href="#channel/reviewList"><i class="fa fa-check-square"></i> 555' + menuJson.reviewList + '</a></li>' +
                                '</ul>' + 
                                '</li>');
                            }else if(isAdVersion){
                                $('#treeview_channel .menutree-menu').append('<li><a href="#channel/reviewList"><i class="fa fa-check-square"></i> 666' + menuJson.reviewList + '</a></li>');
                            }
                        }
                        break;
                    case 8:		//门店管理
                        if (jdtData[a].ReadWriteAuth == 1) {
                            $(".box-index-menu").append('<li id="treeview_store" class="menutree">' +
                                '<a><span>' + menuJson.store + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                '<li><a href="#store/live_list"><i class="fa fa-crosshairs"></i> ' + menuJson.liveList + '</a></li>' +
                                '<li><a href="#store/store_list"><i class="glyphicon glyphicon-link"></i> ' + menuJson.storeList + '</a></li>' +
                                '</ul>' +
                                '</li>');
                            break;
                        }
                    case 9:    //会议预定
                        if (jdtData[a].ReadWriteAuth == 1) {
                            $(".box-index-menu").append('<li id="treeview_store" class="menutree">' +
                                '<a><span>' + menuJson.meeting + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                                '<ul class="menutree-menu">' +
                                '<li><a href="#store/meeting_list"><i class="glyphicon glyphicon-calendar"></i> ' + menuJson.meetingList + '</a></li>' +
                                '</ul>' +
                                '</li>');
                        }
                            break;
                    case 10:   //联屏管理
                    if (jdtData[a].ReadWriteAuth == 1 && isAdVersion) {
                        $(".box-index-menu #treeview_mtr").before('<li id="treeview_store" class="menutree">' +
                            '<a><span>' + menuJson.unitManagement + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                            '<ul class="menutree-menu">' +
                            '<li><a href="#unit/unitMaterial"><i class="fa fa-folder-open-o"></i> ' + menuJson.unitMaterial + '</a></li>' +
                            '<li><a href="#unit/unitTerm"><i class="fa fa-television"></i> ' + menuJson.unitTerm + '</a></li>' +
                            '</ul>' +
                            '</li>');
                    }
                        break;
                    case 13:    //在线统计
                        if(jdtData[a].ReadWriteAuth == 1){
                            $('#treeview_term .menutree-menu').append('<li><a id="menu_statistics" href="#terminal/statistics"><i class="fa fa-area-chart"></i>' + menuJson.statistics + '</a></li>')
                        }
                        break;

                    case 14:    //终端日志
                        if(jdtData[a].ReadWriteAuth == 1){
                            $('#treeview_term .menutree-menu').append('<li><a id="menu_termlog" href="#termlog/list"><i class="fa fa-calendar"></i> ' + menuJson.termLog + '</a></li>')
                        }
                        break;
                    
                    case 15:    //  播放统计
                        if(jdtData[a].ReadWriteAuth == 1){
                            $('#treeview_term .menutree-menu').append('<li><a id="menu_playStatistics" href="#terminal/playStatistics"><i class="fa fa-play-circle"></i> ' + menuJson.playStatistics + '</a></li>')
                        }
                        break;
                }
            }
            $(".box-index-menu li:eq(0)").attr("class", "menutree active");
            window.onhashchange = loadPage;
            //选择资源
             //$("#treeview_mtr").click(function () {
             //    $(".box-index-menu li").attr("class", "menutree");
             //    // $(".box-index-menu li ul").css("display", "none");
             //    $("#treeview_mtr").attr("class", "menutree active");
             //    loadPage();
             //})

            if ($(".box-index-menu li").length == 0) {
                alert(languageJSON.errorNoPermissions);
            } else {
                loadPage();
            }
        });
    }

    function isHaving(list,item) {
        let flag =  false
        for(let i=0;i<list.length;i++){
            if(list[i].module == item)  flag = true
        }
        return flag
    }
    //设置服务器时间
    function setServerDate(serverDate){
        var data = {
            "project_name": project,
            "action": "update_server_date",
            "date": serverDate
        }
        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/date',
            JSON.stringify(data),
            function (data) {
                if (data.rescode === '200') {
                    alert('服务器时间设置成功！')
                    window.location.reload()
                }
            }
        )
    }
    //检索权限-菜单现实隐藏
    function checkJurisdiction_new() {
        var data = JSON.stringify({
            action: 'GetMenu',
            project_name: project,
            UserName: username,
            token: CONFIG.token,
            user: CONFIG.userName
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/userdetails';
        $.ajax({
            type: 'post',
            url: url,
            data: data,
            complete: function( xhr,data ){ 
                var serverDate = (xhr.getResponseHeader('Date'))
                console.log(UTIL.formatDate('yyyy-MM-dd hh:mm:ss',new Date(serverDate)) )
                serverDateinterval = new Date() - new Date(serverDate)
                if(dateTimer) clearInterval(dateTimer)

                dateTimer = setInterval(function(){
                    // console.log(UTIL.timestampToTime(new Date() - serverDateinterval))
                    $('#serverDate').text(UTIL.timestampToTime(new Date() - serverDateinterval))
                },1000)
                layui.use('laydate', function(){
                    var laydate = layui.laydate;
                    
                    //执行一个laydate实例
                    laydate.render({
                      elem: '#serverDate', //指定元素
                      type: 'datetime',
                      btns: ['now', 'confirm'],
                    value: new Date(UTIL.timestampToTime(new Date() - serverDateinterval)),
                    done: function (value, date, endDate) {
                        if(confirm("设置服务器时间为 "+ value)){
                            if(dateTimer) clearInterval(dateTimer)
                            setServerDate(value)
                        }else{

                        }
                    }
                    });
                  });
            }
        }).then(function (json) {
            json = JSON.parse(json)
            var menuJson = languageJSON.menu;
            var dataList = json
            menuList = dataList
            // return
            //控制台 
            if(isHaving(dataList,'终端管理') || isHaving(dataList,'在线统计')  || isHaving(dataList,'终端日志')  || isHaving(dataList,'播放统计')){
                $(".box-index-menu").append('<li id="treeview_term" class="menutree">'
                    +'<a><span>' + menuJson.console + '</span><i class="fa fa-angle-down pull-right"></i></a>'
                    +'<ul class="menutree-menu">'
                    +'</ul>' 
                    +'</li>')
                //终端管理
                if (isHaving(dataList,'终端管理')) {
                    $('#treeview_term .menutree-menu').append('<li class="active"><a id="menu_termlist" href="#terminal/list"><i class="fa fa-television"></i> ' + menuJson.termList + '</a></li>')
                }
                //在线统计
                if(isHaving(dataList,'在线统计')){
                    $('#treeview_term .menutree-menu').append('<li><a id="menu_statistics" href="#terminal/statistics"><i class="fa fa-area-chart"></i> ' + menuJson.statistics + '</a></li>')
                }
                //终端日志
                if(isHaving(dataList,'终端日志')){
                    $('#treeview_term .menutree-menu').append('<li><a id="menu_termlog" href="#termlog/list"><i class="fa fa-calendar"></i> ' + menuJson.termLog + '</a></li>')
                }
                //  播放统计
                if(isHaving(dataList,'播放统计')){
                    $('#treeview_term .menutree-menu').append('<li><a id="menu_playStatistics" href="#terminal/playStatistics"><i class="fa fa-play-circle"></i> ' + menuJson.playStatistics + '</a></li>')
                }
            }
            //频道管理/发布管理
            if(isHaving(dataList,'广告计划')  || isHaving(dataList,'频道管理') || isHaving(dataList,'节目模版') || isHaving(dataList,'广告审核') ){
                $(".box-index-menu").append('<li id="treeview_channel" class="menutree">'
                    +'<a><span>' + menuJson.releases + '</span><i class="fa fa-angle-down pull-right"></i></a>'
                    +'<ul class="menutree-menu">'
                    +'</ul>' 
                    +'</li>')
                //广告计划
                if (isHaving(dataList,'广告计划') ) {
                    $('#treeview_channel .menutree-menu').append('<li><a href="#channel/ad_plan"><i class="fa fa-list-alt"></i> ' + menuJson.adPlan + '</a></li>')
                }
                //频道管理
                if(isHaving(dataList,'频道管理') ){
                    $('#treeview_channel .menutree-menu').append('<li><a href="#channel/list"><i class="fa fa-newspaper-o"></i> ' + menuJson.channelList + '</a></li>')
                    $(document).on('click','a[href="#channel/list"]',function(){
                        console.log('点击频道管理，清除点击频道类型')
                        localStorage.removeItem('btnClick_type')
                    })
                }
                // 节目模版
                if(isHaving(dataList,'节目模版') ){
                    $('#treeview_channel .menutree-menu').append('<li><a href="#layout/list"><i class="fa fa-object-group"></i> ' + menuJson.layoutList + '</a></li>')
                }
                //广告审核
                if(isHaving(dataList,'广告审核') ){
                    $('#treeview_channel .menutree-menu').append('<li><a href="#channel/reviewList"><i class="fa fa-check-square"></i> ' + menuJson.reviewList + '</a></li>')
                }
            }
            //联屏管理
            if(isHaving(dataList,'联屏资源')  || isHaving(dataList,'联屏终端')  ){
                $(".box-index-menu").append('<li id="treeview_screen" class="menutree">'
                    +'<a><span>' + menuJson.unitManagement + '</span><i class="fa fa-angle-down pull-right"></i></a>'
                    +'<ul class="menutree-menu">'
                    +'</ul>' 
                    +'</li>')
                //联屏资源
                if (isHaving(dataList,'联屏资源') ) {
                    $('#treeview_screen .menutree-menu').append('<li><a href="#unit/unitMaterial"><i class="fa fa-folder-open-o"></i> ' + menuJson.unitMaterial + '</a></li>')
                }
                //联屏终端
                if(isHaving(dataList,'联屏终端') ){
                    $('#treeview_screen .menutree-menu').append('<li><a href="#unit/unitTerm"><i class="fa fa-television"></i> ' + menuJson.unitTerm + '</a></li>')
                }
            }
            //资源管理
            if (isHaving(dataList,'资源管理') ) {
                $(".box-index-menu").append('<li id="treeview_mtr" class="menutree">' +
                    '<a><span>' + menuJson.resource + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                    '<ul class="menutree-menu">' +
                    '<li><a href="#materials/materials_list"><i class="fa fa-folder"></i> ' + menuJson.resourceList + '</a></li>' +
                    '</ul>' +
                    '</li>');
            }
            //用户管理/管理员工具
            if(isHaving(dataList,'用户管理')  || isHaving(dataList,'角色权限')  || isHaving(dataList,'操作日志') || isHaving(dataList,'审核管理') ){
                $(".box-index-menu").append('<li id="treeview_user" class="menutree">'
                    +'<a><span>' + menuJson.administratorTools + '</span><i class="fa fa-angle-down pull-right"></i></a>'
                    +'<ul class="menutree-menu">'
                    +'</ul>' 
                    +'</li>')
                //用户管理
                if (isHaving(dataList,'用户管理') ) {
                    $('#treeview_user .menutree-menu').append('<li><a href="#user/users_list"><i class="glyphicon glyphicon-user"></i> ' + menuJson.userList + '</a></li>')
                }
                //角色权限
                if(isHaving(dataList,'角色权限') ){
                    $('#treeview_user .menutree-menu').append('<li><a href="#user/roles_list"><i class="fa fa-black-tie"></i> ' + menuJson.roleList + '</a></li>')
                }
                //操作日志
                if (isHaving(dataList,'操作日志') ) {
                    $('#treeview_user .menutree-menu').append('<li><a id="menu_userlog" href="#userlog/list"><i class="fa fa-eye"></i> ' + menuJson.oplog + '</a></li>')
                }
                //审核管理
                if(isHaving(dataList,'审核管理') ){
                    $('#treeview_user .menutree-menu').append('<li><a href="#user/audit_list"><i class="fa fa-legal"></i> ' + menuJson.reviewList1 + '</a></li>')
                }
            }
            //门店管理
            if(isHaving(dataList,'监控绑定') || isHaving(dataList,'门店绑定') ){
                $(".box-index-menu").append('<li id="treeview_store" class="menutree">'
                    +'<a><span>' + menuJson.store + '</span><i class="fa fa-angle-down pull-right"></i></a>'
                    +'<ul class="menutree-menu">'
                    +'</ul>' 
                    +'</li>')
                //监控绑定
                if (isHaving(dataList,'监控绑定') ) {
                    $('#treeview_store .menutree-menu').append('<li><a href="#store/live_list"><i class="fa fa-crosshairs"></i> ' + menuJson.liveList + '</a></li>')
                }
                //联屏终端
                if(disHaving(dataList,'联屏终端') ){
                    $('#treeview_store .menutree-menu').append('<li><a href="#store/store_list"><i class="glyphicon glyphicon-link"></i> ' + menuJson.storeList + '</a></li>')
                }
            }
           //会议预定
            if (isHaving(dataList,'会议绑定') ) {
                $(".box-index-menu").append('<li id="treeview_store" class="menutree">' +
                    '<a><span>' + menuJson.meeting + '</span><i class="fa fa-angle-down pull-right"></i></a>' +
                    '<ul class="menutree-menu">' +
                    '<li><a href="#store/meeting_list"><i class="glyphicon glyphicon-calendar"></i> ' + menuJson.meetingList + '</a></li>' +
                    '</ul>' +
                    '</li>');
            }

            $(".box-index-menu li:eq(0)").attr("class", "menutree active");
            window.onhashchange = loadPage;
            
            if ($(".box-index-menu li").length == 0) {
                alert(languageJSON.errorNoPermissions);
            } else {
                loadPage();
            }
        });
    }

    function initUserConfigs() {

        var data = {
            "project_name": project,
            "action": "GetKey",
            "key": "CheckLevel"
        }

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/userconfigs',
            JSON.stringify(data),
            function (data) {
                if (data.rescode === '200') {
                    UTIL.setLocalParameter('config_checkSwitch', data.UserConfigs[0].ConfigValue);
                    if (UTIL.getLocalParameter('config_checkSwitch') == '1') {
                        setUserConfig_check();
                    }
                }
            }
        )
    }

    function setUserConfig_check() {
        var data = {
            "project_name": project,
            "action": "HasCheckModule"
        }

        UTIL.ajax2(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/userdetails',
            JSON.stringify(data),
            function (data) {
                if (data.rescode === '200') {
                    UTIL.setLocalParameter('config_canCheck', data.hasCheckModule);
                } else {
                    console.log('获取是否有审核权限失败');
                }
            }
        )
    }

    function checkURL() {
        var url = window.location.hostname;
        var languageConfig = {};
        switch (url) {
            case "www.fangxineat.com":
            case "fangxineat.com":
                languageConfig.case = "MCLZ";
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

    function checkIsAd(){
        var data = JSON.stringify({
            Project: project,
            project_name: project,
            Action: 'get_function'
        })
        var url = CONFIG.serverRoot + '/backend_mgt/v1/projects';
        UTIL.ajax('post', url, data, function (json) {
            if(json.rescode == '200'){
                isAdVersion = json.function.advertisement;
            }
        })
    }

    function setNavBarHeight(){
        var CLIENT_HEIGHT = $(window).height();
        $('.box-index-menu').height(CLIENT_HEIGHT-60);
    }

    function throttle(method, context){
        clearTimeout(method.tId);
        method.tId = setTimeout(function(){
            method.call(context);
        }, 200);
    }

    exports.getCurrentMenu = function (menuName){
        let currentMenu = {}
        for(var i=0;i<menuList.length;i++){
            if(menuList[i].module == menuName)  currentMenu = menuList[i]
        }
        return currentMenu
    }

    //获取系统版本
    function getSysInfo(){
        var data = JSON.stringify({
            action: 'get_ims_version',
            project_name: project,
        });
        var url = CONFIG.serverRoot + '/backend_mgt/v2/sysinfo';
        util.ajax('post', url, data, function (json) {
            //  base_XXX        普通版
            //  adv_XXX         广告版
            var version = json.split('_');
            version.forEach(function(value,index,array){
                if(value.indexOf('prison') > -1) isPrison = true;
                if(value.indexOf('interactive') > -1) isInteractive = true;
        　　})
            // exports.isPrison = isPrison;
            // exports.isInteractive = isInteractive;
            localStorage.setItem('isPrison',isPrison)
            localStorage.setItem('isInteractive',isInteractive)
            // console.log('触摸',isInteractive,'语音',isPrison,)
        })
    }
});
