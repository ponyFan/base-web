define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js");

    exports.classID;
    exports.className;
    exports.requireJS;

    var _workSeqments,
        _downloadSeqments,
        _restartTimer,
        _heartBeatPeriod,
        _mainServer,
        _programSync,
        languageJSON;

    function formatTime(trigger, duration, parent) {
        var hour = trigger[2];
        var minute = trigger[1];
        var second = trigger[0];
        if (hour !== '*' || minute !== '*' || second !== '*') {
            hour = (hour === '*') ? '00' : ((hour < 10) ? '0' + hour : hour);
            minute = (minute === '*') ? '00' : ((minute < 10) ? '0' + minute : minute);
            second = (second === '*') ? '00' : ((second < 10) ? '0' + second : second);
            $(parent).parent()[0].id == "CC-workArea" ?
                $(parent).find('#CC-workStart').val(hour + ':' + minute + ':' + second) :
                $(parent).find('#CC-downloadStart').val(hour + ':' + minute + ':' + second);

            //endtime
            var start = new Date('2016/04/24 ' + hour + ':' + minute + ':' + second);
            var end = new Date();
            end.setTime(start.getTime() + duration * 1000);
            var end_hour = end.getHours();
            var end_minute = end.getMinutes();
            var end_second = end.getSeconds();
            end_hour = (end_hour === '*') ? '00' : ((end_hour < 10) ? '0' + end_hour : end_hour);
            end_minute = (end_minute === '*') ? '00' : ((end_minute < 10) ? '0' + end_minute : end_minute);
            end_second = (end_second === '*') ? '00' : ((end_second < 10) ? '0' + end_second : end_second);
            $(parent).parent()[0].id == "CC-workArea" ?
                $(parent).find('#CC-workEnd').val(end_hour + ':' + end_minute + ':' + end_second) :
                $(parent).find('#CC-downloadEnd').val(end_hour + ':' + end_minute + ':' + end_second);
        }
    }

    exports.init = function () {
        selectLanguage();
        inputInit();
        loadInfo();

        // 关闭
        $('#CC-close').click(function () {
            UTIL.cover.close();
        })

        // 保存
        $('#CC-save').click(function () {
            var upgradeURL = $.trim($('#CC-upgradeURL').val()),
                logURL = $.trim($('#CC-logURL').val()),
                vol = $('#CC-vol-slider').val(),
                workSwitch = ($("#CC-workSwitch").bootstrapSwitch('state')) ? 1 : 0,
                downloadSwitch = ($("#CC-downloadSwitch").bootstrapSwitch('state')) ? 1 : 0,
                restartSwitch = ($("#CC-restartSwitch").bootstrapSwitch('state')) ? 1 : 0,
                workWeekRepeat = new Array(),
                cityIDs = ($('#CC-city').val() === null ? '' : $('#CC-city').val().join()),
                rotate = ($("#CC-rotate").bootstrapSwitch('state')) ? 1 : 0,
                rotateType = $("#CC-rotate-type").val(),
                rotateDegree = Number($("#CC-rotate-degree").val()),
                outputMode = ($("#CC-outputMode").bootstrapSwitch('state')) ? 1 : 0,
                outputMode_mode = $("#CC-outputMode-mode").val(),
                remoteADB = ($("#CC-remoteADB").bootstrapSwitch('state')) ? 1 : 0,
                debug = ($("#CC-debug").bootstrapSwitch('state')) ? 1 : 0,
                networkWatchdog = ($("#CC-network").bootstrapSwitch('state')) ? 1 : 0
            ;

            $('#CC-workWeekRepeat input[type="checkbox"]').each(function (i, e) {
                if ($(e)[0].checked) {
                    workWeekRepeat.push(i + 1);
                }
            })

            var workStart = $('#CC-workStart').val(),
                workEnd = $('#CC-workEnd').val(),
                workDuration,
                downloadStart = $('#CC-downloadStart').val(),
                downloadEnd = $('#CC-downloadEnd').val(),
                downloadDuration,
                restartTime = $('#CC-restartTime').val(),
                downloadSeqments = {},
                workSeqments = {},
                restartTimer = {};

            // 校验
            // 工作区间
            if (workSwitch === 1) {
                workSeqments.on = 1;
                if (workWeekRepeat.length === 0) {
                    alert(languageJSON.al_selectWorkCycle);
                    $('#CC-workWeekRepeat').focus();
                    return;
                }
                if (workStart === '') {
                    alert(languageJSON.al_selectWorkStart);
                    $('#CC-workStart').focus();
                    return;
                }

                // if (!$('#CC-workStart').inputmask("isComplete")) {
                //     alert(languageJSON.al_cfWorkStart);
                //     $('#CC-workStart').focus();
                //     return;
                // }

                if (workEnd === '') {
                    alert(languageJSON.al_selectWorkEnd);
                    $('#CC-workEnd').focus();
                    return;
                }

                // if (!$('#CC-workEnd').inputmask("isComplete")) {
                //     alert(languageJSON.al_cfWorkEnd);
                //     $('#CC-workEnd').focus();
                //     return;
                // }
                var works = $('#CC-workArea').children();
                var workDurations = works.length;
                workSeqments.extraWorks = [];
                for (var i = 0; i < workDurations; i++) {
                    var workStart = $($(works)[i]).find('#CC-workStart').val();
                    var workEnd = $($(works)[i]).find('#CC-workEnd').val();
               
                    workStart = workStart.split(':');
                    workStart = new Date('2016/04/25 ' + workStart[0] + ':' + workStart[1] + ':' + workStart[2]);

                    workEnd = workEnd.split(':');
                    workEnd = new Date('2016/04/25 ' + workEnd[0] + ':' + workEnd[1] + ':' + workEnd[2]);

                    workDuration = Math.ceil((workEnd - workStart) / 1000);

                    if ((workEnd - workStart) < 0) {
                        alert(languageJSON.al_workStartEnd);
                        $('#CC-workEnd').focus();
                        return;
                    }

                    workSeqments.duration = workDuration;
                    var s = workStart.getSeconds(),
                        m = workStart.getMinutes(),
                        h = workStart.getHours(),
                        d = '*',
                        M = '*',
                        y = '*',
                        w = workWeekRepeat.join(',');

                    if (i == 0) {
                        workSeqments.duration = workDuration;
                        workSeqments.trigger = s + " " + m + " " + h + " " + d + " " + M + " " + y + " " + w;
        
                    } else {
                        var extraWork = {
                            'duration': workDuration,
                            'trigger': s + " " + m + " " + h + " " + d + " " + M + " " + y + " " + w
                        };
                        workSeqments.extraWorks.push(extraWork);
                    }
                }
                workSeqments = JSON.stringify(workSeqments);
            }
            else {
                workSeqments = JSON.parse(_workSeqments);
                workSeqments.on = 0;
                workSeqments = JSON.stringify(workSeqments);
            }


            // 下载区间
            if (downloadSwitch === 1) {
                downloadSeqments.on = 1;

                if (downloadStart === '') {
                    alert(languageJSON.al_dlStart);
                    $('#CC-downloadStart').focus();
                    return;
                }

                // if (!$('#CC-downloadStart').inputmask("isComplete")) {
                //     alert(languageJSON.al_cfStart);
                //     $('#CC-downloadStart').focus();
                //     return;
                // }

                if (downloadEnd === '') {
                    alert(languageJSON.al_dlEnd);
                    $('#CC-downloadEnd').focus();
                    return;
                }

                // if (!$('#CC-downloadEnd').inputmask("isComplete")) {
                //     alert(languageJSON.al_cfEnd);
                //     $('#CC-downloadEnd').focus();
                //     return;
                // }

                var downloads = $('#CC-downloadArea').children();
                var downloadDurations = downloads.length;
                downloadSeqments.extraWorks = [];

                for (var i = 0; i < downloadDurations; i++) {
                    var downloadStart = $($(downloads)[i]).find('#CC-downloadStart').val();
                    var downloadEnd = $($(downloads)[i]).find('#CC-downloadEnd').val();
                    downloadStart = downloadStart.split(':');
                    downloadStart = new Date('2016/04/25 ' + downloadStart[0] + ':' + downloadStart[1] + ':' + downloadStart[2]);

                    downloadEnd = downloadEnd.split(':');
                    downloadEnd = new Date('2016/04/25 ' + downloadEnd[0] + ':' + downloadEnd[1] + ':' + downloadEnd[2]);

                    // downloadDuration = Math.ceil((downloadEnd - downloadStart) / 1000);
                    // if (downloadDuration < 0) {
                    //     downloadEnd.setTime(downloadEnd.getTime() + 24 * 60 * 60 * 1000);
                    // }
                    downloadDuration = Math.ceil((downloadEnd - downloadStart) / 1000);
                    downloadSeqments.duration = downloadDuration;
                    var s = downloadStart.getSeconds(),
                        m = downloadStart.getMinutes(),
                        h = downloadStart.getHours(),
                        d = '*',
                        M = '*',
                        y = '*',
                        w = '*';

                    if (downloadDuration < 0) {
                        downloadEnd.setTime(downloadEnd.getTime() + 24 * 60 * 60 * 1000);
                    }
                    if (i == 0) {
                        downloadSeqments.duration = workDuration;
                        downloadSeqments.trigger = s + " " + m + " " + h + " " + d + " " + M + " " + y + " " + w;

                    } else {
                        var extraWork = {
                            'duration': downloadDuration,
                            'trigger': s + " " + m + " " + h + " " + d + " " + M + " " + y + " " + w
                        };
                        downloadSeqments.extraWorks.push(extraWork);
                    }
                }
                downloadSeqments = JSON.stringify(downloadSeqments);
            }
            else {
                downloadSeqments = JSON.parse(_downloadSeqments);
                downloadSeqments.on = 0;
                downloadSeqments = JSON.stringify(downloadSeqments);
            }

            // 定时重启
            if (restartSwitch === 1) {
                restartTimer.on = 1;

                if (restartTime === '') {
                    alert(languageJSON.al_timing);
                    $('#CC-restartTime').focus();
                    return;
                }

                // if (!$('#CC-restartTime').inputmask("isComplete")) {
                //     alert(languageJSON.al_cfTiming);
                //     $('#CC-restartTime').focus();
                //     return;
                // }

                restartTime = restartTime.split(':');
                var s = restartTime[2],
                    m = restartTime[1],
                    h = restartTime[0],
                    d = '*',
                    M = '*',
                    y = '*',
                    w = '*';

                restartTimer.trigger = s + " " + m + " " + h + " " + d + " " + M + " " + y + " " + w;
                restartTimer = JSON.stringify(restartTimer);

            }
            else {
                restartTimer = JSON.parse(_restartTimer);
                restartTimer.on = 0;
                restartTimer = JSON.stringify(restartTimer);
            }


            saveTermClassConfig();

            function saveTermClassConfig() {

                var data = {
                    "project_name": CONFIG.projectName,
                    "action": "changeCategoryConfig",
                    "categoryID": exports.classID,
                    "config": {
                        "DownloadSeqments": downloadSeqments,
                        "WorkSeqments": workSeqments,
                        "UpgradeURL": upgradeURL,
                        "Volume": vol,
                        "HeartBeat_Period": _heartBeatPeriod,
                        "CityIDs": cityIDs,
                        "MainServer": _mainServer,
                        "RestartTimer": restartTimer,
                        // "ProgramSync": _programSync,
                        "LogURL": logURL,
                        "RemoteADB": remoteADB,
                        "Debug": debug,
                        "NetworkWatchdog": networkWatchdog,
                        "Rotate": JSON.stringify({
                            on: rotate,
                            type: rotateType,
                            degree: rotateDegree
                        }),
                        "OutputMode": JSON.stringify({
                            on: outputMode,
                            mode: outputMode_mode
                        })
                    }
                }

                $('#CC_waiting').show();

                UTIL.ajax('POST',
                    CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                    JSON.stringify(data),
                    function (data) {
                        if (data.rescode === '200') {
                            alert(languageJSON.al_saveSuc);
                            require(exports.requireJS).loadTermList();
                            UTIL.cover.close();
                        } else {
                            $('#CC_waiting').hide();
                            alert(languageJSON.al_saveTermConfCFFaild + data.errInfo);
                        }
                    }
                )
            }
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.termList;
        $(".term-prompt .warn-i").html('<i class="fa fa-warning"></i>&nbsp;' + languageJSON.cap_title);
        $(".term-config .lbl-basicInfo").html(languageJSON.termBoxTitle);
        $(".term-config .lbl-termName").html(languageJSON.conf_lbl_termName);
        $("#CC-term-name").attr("title", languageJSON.conf_lbl_termName);
        $(".term-config .lbl-currentCha").html(languageJSON.conf_lbl_currentCha);
        $(".term-config .lbl-preLssued").html(languageJSON.conf_lbl_preLssued);
        $(".term-config .lbl-termInfo").html(languageJSON.conf_lbl_termInfo);
        $(".term-config .lbl-RAM").html(languageJSON.RAM);
        $("#CC-log").html(languageJSON.gain);
        $("#CC-log-download").html(languageJSON.download);
        $(".term-config .lbl-CFInfo").html(languageJSON.conf_lbl_CFInfo);
        $(".term-config .lbl-updateServer").html(languageJSON.conf_lbl_updateServer);
        $("#CC-upgradeURL").attr("placeholder", languageJSON.conf_lbl_updateServerADD);
        $(".term-config .lbl-logServer").html(languageJSON.conf_lbl_logServer);
        $("#CC-logURL").attr("placeholder", languageJSON.conf_lbl_logServerADD);
        $(".term-config .lbl-volume").html(languageJSON.conf_lbl_volume);
        $(".term-config .lbl-city").html(languageJSON.conf_lbl_city);
        $("#CC-city").attr("data-placeholder", languageJSON.conf_city_placeholder);
        $(".term-config .lbl-work").html(languageJSON.conf_lbl_work);
        $(".term-config .lbl-download").html(languageJSON.conf_lbl_download);
        $(".term-config .lbl-timeRestart").html(languageJSON.conf_lbl_timeRestart);
        $(".term-config .lbl-rotate").html(languageJSON.conf_lbl_rotate);
        $("#CC-rotate-type").html('<option value="soft">' + languageJSON.conf_ddl_soft+ '</option>' +
            '<option value="hard">' + languageJSON.conf_ddl_hard+ '</option>')
        $("#CC-rotate-degree").html('<option value="90">' + languageJSON.conf_ddl_clockwise+ '90°</option>' +
            '<option value="-90">' + languageJSON.conf_ddl_counterclockwise+ '90°</option>')
        $(".term-config .lbl-outputMode").html(languageJSON.conf_lbl_outputMode);
        $(".term-config .lbl-remoteADB").html(languageJSON.conf_lbl_remoteADB);
        $(".term-config .lbl-debug").html(languageJSON.conf_lbl_debug);
        $(".term-config .lbl-network").html(languageJSON.conf_lbl_network);
        $(".term-config .lbl-sync").html(languageJSON.conf_lbl_sync);
        $(".term-config .lbl-syncID").html(languageJSON.conf_lbl_syncID);
        $(".term-config .lbl-syncIP").html(languageJSON.conf_lbl_syncIP);
        $(".term-config .lbl-syncPort").html(languageJSON.conf_lbl_syncPort);
        $(".term-config .lbl-syncTimeout").html(languageJSON.conf_lbl_syncTimeout);
        $(".term-config .CC-prompt-day").html("(" + languageJSON.everyday + ")");
        $("#CC-save").html(languageJSON.save);
        $("#CC-workWeekRepeat span:eq(0)").html(languageJSON.Monday);
        $("#CC-workWeekRepeat span:eq(1)").html(languageJSON.Tuesday);
        $("#CC-workWeekRepeat span:eq(2)").html(languageJSON.Wednesday);
        $("#CC-workWeekRepeat span:eq(3)").html(languageJSON.Thursday);
        $("#CC-workWeekRepeat span:eq(4)").html(languageJSON.Friday);
        $("#CC-workWeekRepeat span:eq(5)").html(languageJSON.Saturday);
        $("#CC-workWeekRepeat span:eq(6)").html(languageJSON.Sunday);
        $("#CC_waiting").html(languageJSON.cap_foot);
    }

    function inputInit() {

        $.fn.bootstrapSwitch.defaults.onText = languageJSON.ON;
        $.fn.bootstrapSwitch.defaults.offText = languageJSON.OFF;

        $("#CC-workSwitch").bootstrapSwitch();
        $("#CC-downloadSwitch").bootstrapSwitch();
        $("#CC-restartSwitch").bootstrapSwitch();
        $("#CC-rotate").bootstrapSwitch();
        $("#CC-outputMode").bootstrapSwitch();
        $("#CC-remoteADB").bootstrapSwitch();
        $("#CC-debug").bootstrapSwitch();
        $("#CC-network").bootstrapSwitch();
        $("#CC-restartSwitch, #CC-rotate, #CC-outputMode").parent().parent().css("float", "left");

        $('#CC-workSwitch').on('switchChange.bootstrapSwitch', function (event, state) {
            if (state) {
                $('#CC-workWeekRepeatArea').css('display', 'block');
                $('#CC-workArea').css('display', 'block');
                $('#workDuration_add').css('display', 'inline-block');
            } else {
                $('#CC-workWeekRepeatArea').css('display', 'none');
                $('#CC-workArea, #workDuration_add').css('display', 'none');
            }
        });

        $("#CC-downloadSwitch").on('switchChange.bootstrapSwitch', function (event, state) {
            if (state) {
                $('#CC-downloadArea').css('display', 'block');
                $('#download_add').css('display', 'inline-block');
            } else {
                $('#CC-downloadArea, #download_add').css('display', 'none');
            }
        });

        $("#CC-restartSwitch").on('switchChange.bootstrapSwitch', function (event, state) {
            if (state) {
                $('#CC-restartArea').css('display', 'block');
            } else {
                $('#CC-restartArea').css('display', 'none');
            }
        });

        $("#CC-rotate").on('switchChange.bootstrapSwitch', function (event, state) {
            if (state) {
                $('#CC-rotateArea').css('display', 'block');
            } else {
                $('#CC-rotateArea').css('display', 'none');
            }
        });

        $("#CC-outputMode").on('switchChange.bootstrapSwitch', function (event, state) {
            if (state) {
                $('#CC-outputModeArea').css('display', 'block');
            } else {
                $('#CC-outputModeArea').css('display', 'none');
            }
        });

        $('#CC-workWeekRepeat input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_minimal-blue'
        })
        // $('#CC-workStart').inputmask("hh:mm:ss", {"placeholder": "hh:mm:ss"});
        // $('#CC-workEnd').inputmask("hh:mm:ss", {"placeholder": "hh:mm:ss"});
        // $('#CC-downloadStart').inputmask("hh:mm:ss", {"placeholder": "hh:mm:ss"});
        // $('#CC-downloadEnd').inputmask("hh:mm:ss", {"placeholder": "hh:mm:ss"});
        // $('#CC-restartTime').inputmask("hh:mm:ss", {"placeholder": "hh:mm:ss"});
        // 时间控件绑定
        layui.use('laydate', function(){
            var laydate = layui.laydate;
            var elements=$('#CC-workStart,#CC-workEnd,#CC-downloadStart,#CC-downloadEnd,#CC-restartTime')
            elements.each(function(index,ele){
                laydate.render({
                    elem: ele,
                    type:'time', //指定元素
                    done:function(value){
                        $(ele).val(value)
                        $(ele).trigger('change')
                    }
                })
            })
        })
    }

    function loadInfo() {

        $('#CC-title').html(exports.className);
        $("#cover_area").focus();

        //增加工作区间
        $('#workDuration_add').on('click', function (e) {
            var newWorkDuration = $($('#CC-workArea').children()[0]).clone();
            $(newWorkDuration).append('<a class="btn workDuration_delete" title="删除"><i class="glyphicon glyphicon-trash" style="font-size:14px"></i></a>');
            $('#CC-workArea').append(newWorkDuration);
            // $(newWorkDuration).find('#CC-workEnd, #CC-workStart').inputmask("hh:mm:ss", { "placeholder": "hh:mm:ss" });

            layui.use('laydate', function(){
                var laydate = layui.laydate;

                (newWorkDuration)
                .find('#CC-workEnd, #CC-workStart')
                .removeAttr("lay-key")
                .each(function(index,ele){
                    laydate.render({
                        elem: ele,
                        type:'time', //指定元素
                        done:function(value){
                            $(ele).val(value)
                            $(ele).trigger('change')
                        }
                    })
                })
            })
            //删除工作区间
            $('.workDuration_delete').off('click').on('click', function (e) {
                $(e.currentTarget).parent().remove();
            })
        });

        //增加下载区间
        $('#download_add').on('click', function (e) {
            var newDownloadDuration = $($('#CC-downloadArea').children()[0]).clone();
            $(newDownloadDuration).append('<a class="btn download_delete" title="删除"><i class="glyphicon glyphicon-trash" style="font-size:14px"></i></a>');
            $('#CC-downloadArea').append(newDownloadDuration);

            // (newDownloadDuration).find('#CC-downloadEnd, #CC-downloadStart').inputmask("hh:mm:ss", { "placeholder": "hh:mm:ss" });

            layui.use('laydate', function(){
                var laydate = layui.laydate;

                (newDownloadDuration)
                .find('#CC-downloadEnd, #CC-downloadStart')
                .removeAttr("lay-key")
                .each(function(index,ele){
                    laydate.render({
                        elem: ele,
                        type:'time', //指定元素
                        done:function(value){
                            $(ele).val(value)
                            $(ele).trigger('change')
                        }
                    })
                })
            })
            //删除下载区间
            $('.download_delete').off('click').on('click', function (e) {
                $(e.currentTarget).parent().remove();
            })
        })
        loadCityInfo();

        function loadCityInfo() {
            var data = {
                "project_name": CONFIG.projectName,
                "action": "getCityList",
                "Pager": {
                    "total": -1,
                    "per_page": 100000000,
                    "page": 1,
                    "orderby": "",
                    "sortby": "",
                    "keyword": ""
                }
            }

            UTIL.ajax('POST',
                CONFIG.serverRoot + '/backend_mgt/v2/city',
                JSON.stringify(data),
                function (data) {
                    if (data.rescode === '200') {
                        var citys = data.cityList;
                        $('#CC-city').empty();
                        for (var i = 0; i < citys.length; i++) {
                            $('#CC-city').append('<option value = "' + citys[i].AreaID + '">' + citys[i].City + '（' + citys[i].CityEng + '）</option>');
                        }
                        loadConfigInfo();
                    } else {
                        alert(languageJSON.al_gainCityInfoFaild);
                    }
                }
            );
        }

        function loadConfigInfo() {
            var data = {
                "project_name": CONFIG.projectName,
                "action": "getCategoryConfig",
                "categoryID": exports.classID
            }

            UTIL.ajax(
                'POST',
                CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                JSON.stringify(data),
                function (data) {
                    if (data.rescode !== '200') {
                        alert(languageJSON.al_gainTermInfoCFFaild);
                    } else {
                        $('#CC-Channel').html(data.config.Channel_Name);
                        $('#CC-PreChannel').html(data.config.PreDownload_Channel_Name);
                        $('#CC-upgradeURL').val(data.config.UpgradeURL);
                        $('#CC-logURL').val(data.config.LogURL);

                        $("#CC-vol-slider").bootstrapSlider({
                            max: 100,
                            value: data.config.Volume
                        });

                        var config = data.config;

                        // 心跳
                        _heartBeatPeriod = config.HeartBeat_Period;

                        // MainServer
                        _mainServer = config.MainServer;

                        // _programSync
                        _programSync = config.ProgramSync;

                        // _workSeqments
                        _workSeqments = config.WorkSeqments;

                        // _downloadSeqments
                        _downloadSeqments = config.DownloadSeqments;

                        // _restartTimer
                        _restartTimer = config.RestartTimer;

                        // 加载城市信息
                        for (var i = 0; i < config.Cities.length; i++) {
                            $('#CC-city > option:nth(0)').attr('value')
                            $("#CC-city").find("[value$='" + config.Cities[i].ID + "']").attr('selected', true);
                        }
                        $("#CC-city").select2();

                        //工作区间
                        var workSeqments = JSON.parse(config.WorkSeqments);

                        if (workSeqments.on === 0) {
                            $("#CC-workSwitch").bootstrapSwitch('state', false);
                        }

                        var trigger = workSeqments.trigger.split(" ");
                        var duration = workSeqments.duration;
                        var works = workSeqments.extraWorks; 
                        //week
                        var week = trigger[6];
                        if (week !== '*') {
                            week = week.split(',');
                            for (var i = 0; i < week.length; i++) {
                                $('#CC-workWeekRepeat input[type$=checkbox]:nth(' + (Number(week[i]) - 1) + ')').iCheck('check');
                            }
                        }

                        formatTime(trigger, duration, $('#CC-workArea').children()[0]);

                        if (works) {
                            var len = works.length;
                            works.map(function (v, i) {
                                $('#workDuration_add').trigger('click');
                                var trigger = v.trigger.split(" ");
                                var duration = v.duration;
                                formatTime(trigger, duration, $('#CC-workArea').children()[1 + i]);
                            })
                        } 

                        // 下载区间
                        var DownloadSeqments = JSON.parse(config.DownloadSeqments);

                        if (DownloadSeqments.on === 0) {
                            $("#CC-downloadSwitch").bootstrapSwitch('state', false);
                        }

                        var trigger = DownloadSeqments.trigger.split(" ");
                        var duration = DownloadSeqments.duration;
                        var works = DownloadSeqments.extraWorks;

                        formatTime(trigger, duration, $('#CC-downloadArea').children()[0]);

                        if (works) {
                            var len = works.length;
                            works.map(function (v, i) {
                                $('#download_add').trigger('click');
                                var trigger = v.trigger.split(" ");
                                var duration = v.duration;
                                formatTime(trigger, duration, $('#CC-downloadArea').children()[1 + i]);
                            })
                        } 


                        // 定时重启
                        var RestartTimer = JSON.parse(config.RestartTimer);

                        if (RestartTimer.on === 0) {
                            $("#CC-restartSwitch").bootstrapSwitch('state', false);
                        }

                        var trigger = RestartTimer.trigger.split(" ");

                        //starttime
                        var hour = trigger[2];
                        var minute = trigger[1];
                        var second = trigger[0];
                        if (hour !== '*' || minute !== '*' || second !== '*') {
                            hour = (hour === '*') ? '00' : hour;
                            minute = (minute === '*') ? '00' : minute;
                            second = (second === '*') ? '00' : second;
                            $('#CC-restartTime').val(hour + ':' + minute + ':' + second);
                        }

                        // 屏幕旋转
                        var rotate = JSON.parse(config.Rotate);
                        if (rotate.on === 0) {
                            $("#CC-rotate").bootstrapSwitch('state', false);
                        }
                        $("#CC-rotate-type").val(rotate.type);
                        $("#CC-rotate-degree").val(rotate.degree);

                        // 屏幕输出模式
                        var outputMode = JSON.parse(config.OutputMode);
                        if (outputMode.on === 0) {
                            $("#CC-outputMode").bootstrapSwitch('state', false);
                        }
                        $("#CC-outputMode-mode").val(outputMode.mode);

                        // 远程调试ADB
                        var remoteADB = JSON.parse(config.RemoteADB);
                        if (remoteADB === 0) {
                            $("#CC-remoteADB").bootstrapSwitch('state', false);
                        }

                        // 打印本地日志
                        var debug = JSON.parse(config.Debug);
                        if (debug === 0) {
                            $("#CC-debug").bootstrapSwitch('state', false);
                        }

                        // 网络检测
                        var network = config.NetworkWatchdog ? JSON.parse(config.NetworkWatchdog) : 0;
                        if (network === 0) {
                            $("#CC-network").bootstrapSwitch('state', false);
                        }
                    }
                }
            );
        }
    }


});
