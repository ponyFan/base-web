define(function (require, exports, module) {
    var UTIL = require("common/util.js"),
        CONFIG = require('common/config');
    var MTRCTRL = require("pages/channel/mtrCtrl");
    var timer = require('pages/channel/timer');
    var languageJSON;

    exports.init = function () {
        selectLanguage();
        loadPage();

        //关闭窗口
        $(".CA_close").click(function () {
            localStorage.removeItem('currentResource')
            UTIL.cover.close();
        });

        //保存
        $("#btn-batchSubmit").click(function () {
            onSubmit();
        });

        $('#timingBtn').change(function(){
            if($('#timingBtn').val() == 0){
                $('#timingSetting').hide()
            }else{
                $('#timingSetting').show()
            }
        })

        $("#resRecorded").bootstrapSwitch();

        $('#timingSetting').click(function () {
            var currentResource = JSON.parse(localStorage.getItem('currentResource'))
            var scheduleStr = JSON.parse(currentResource.schedule_params);
            scheduleStr = scheduleStr.trigger ? scheduleStr.trigger : '0 0 0 * * * *';
            console.log('修改前触发设置：'+scheduleStr)
            var instance = new timer.Timer(timer.Timer.decode(scheduleStr));
            instance.open('2',function (data) {
                //  保存回调函数
                console.log('修改前触发设置：'+data)
                var currentResource = JSON.parse(localStorage.getItem('currentResource'))
                var scheduleStr = JSON.parse(currentResource.schedule_params);
                scheduleStr.trigger = data
                currentResource.schedule_params = JSON.stringify(scheduleStr)
                localStorage.setItem('currentResource',JSON.stringify(currentResource))
                // currentResource.schedule_params = JSON.stringify(scheduleStr)
                //  显示
                updateTimer(data);
            });
        });
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.channel;
        $("#cover_area .box-title").html(languageJSON.title8);
        $('.resStartTime').text(languageJSON.resStratTime)
        $('.resEndTime').text(languageJSON.resEndTime)
        $('.resTrriger').text(languageJSON.resTrriger)
        $(".batchOperation-prompt").html('<i class="fa fa-info-circle" >&nbsp' + languageJSON.prompt2 + '</i>');
        $("#btn-batchSubmit").html(languageJSON.submit);
    }

    /**
     *载入页面
     */
    function loadPage() {
        var currentResource = JSON.parse(localStorage.getItem('currentResource'))
        if(!currentResource.id){
            console.log('获取当前资源失败！')
        }else{
            //  渲染日期
            layui.use('laydate', function () {
                var laydate = layui.laydate;
        
                laydate.render({
                    elem: '#startTime_input',
                    type: 'datetime',
                    value: new Date(currentResource.lifetime_start),
                    done: function (value, date, endDate) {
                        $("#startTime_input").val(value)
                        $("#startTime_input").trigger("change")
                    }
                });
                
                laydate.render({
                    elem: '#endTime_input',
                    type: 'datetime',
                    value:new Date(currentResource.lifetime_end),
                    done: function (value, date, endDate) {
                        $("#endTime_input").val(value)
                        $("#endTime_input").trigger("change")
                    }
                });
            })
            //  根据资源类型，设置定时出发是否开启
            if(currentResource.schedule_type == 'Regular'){
                $('#timingBtn').val(0)
            }else{
                $('#timingBtn').val(1)
                $('#timingSetting').show()
            }
            //  设置定时触发显示样式
            var schedule_params = JSON.parse(currentResource.schedule_params);
            var scheduleStr = schedule_params.trigger ? schedule_params.trigger : '0 0 0 * * * *';
            updateTimer(scheduleStr)
            //  断点续传
            if (schedule_params.isRecorded && schedule_params.isRecorded == 1) {
                $("#resRecorded").bootstrapSwitch('state', true);
            }else{
                $("#resRecorded").bootstrapSwitch('state', false);
            }
        }
    }

    /**
     *保存事件
     */
    function onSubmit() {
        var currentResource = JSON.parse(localStorage.getItem('currentResource'))
        var scheduleStr = JSON.parse(currentResource.schedule_params);
        if(!scheduleStr.trigger){
            scheduleStr.trigger = '0 0 0 * * * *'
        }
        var stratTime = $('#startTime_input').val()
        var endTime = $('#endTime_input').val()
        var isTrriger = $('#timingBtn').val()
        var isRecorded = ($("#resRecorded").bootstrapSwitch('state')) ? 1 : 0
        //  设置时间
        currentResource.lifetime_start = stratTime
        currentResource.lifetime_end = endTime
        //  是否断点续播
        scheduleStr.isRecorded = isRecorded
        //  定时触发
        if(isTrriger == 0){
            //关闭定时触发
            scheduleStr.trigger = '0 0 0 * * * *'
            currentResource.schedule_type = 'Regular'
        }else{
            currentResource.schedule_type = 'Timed'
        }
        //  schedule_params修改保存
        currentResource.schedule_params = JSON.stringify(scheduleStr)
        MTRCTRL.saveResourceAttr(currentResource)
        // localStorage.removeItem('currentResource')
        UTIL.cover.close();
    }

    //  更新定时触发显示格式
    function updateTimer(str) {
        var fields = $('#timingSetting span'),
            segments = str.split(' '),
            dayTimer = false;
        if (segments[6] !== '*' || (segments[5] === '*' &&
            segments[4] === '*' && segments[3] === '*')) {
            dayTimer = true;
            var weekday = segments[6].split(',');
            var week;
            if (weekday[0] != undefined) {
                week = toWeekday(weekday[0]);
                if (weekday[1] != undefined) {
                    week += ',' + toWeekday(weekday[1]);
                    if (weekday[2] != undefined) {
                        week += ',' + toWeekday(weekday[2]);
                        if (weekday[3] != undefined) {
                            week += ',' + toWeekday(weekday[3]);
                            if (weekday[4] != undefined) {
                                week += ',' + toWeekday(weekday[4]);
                                if (weekday[5] != undefined) {
                                    week += ',' + toWeekday(weekday[5]);
                                    if (weekday[6] != undefined) {
                                        week += ',' + toWeekday(weekday[6]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        $('#timingSetting')
            .toggleClass('day-timer', dayTimer)
            .toggleClass('date-timer', !dayTimer);
        fields[0].textContent = segments[4] === '*' ? languageJSON.monthly : segments[4] + languageJSON.month;
        fields[1].textContent = segments[3] === '*' ? languageJSON.everyDay : segments[3] + languageJSON.day;
        fields[2].textContent = segments[6] === '*' ? languageJSON.everyDay : languageJSON.every + week;
        fields[3].textContent = segments[2] === '*' ? languageJSON.everyHour : segments[2] + languageJSON.hour;
        fields[4].textContent = segments[1] === '*' ? languageJSON.everyMin : segments[1] + languageJSON.min;
        fields[5].textContent = segments[0] === '*' ? languageJSON.everySecond : segments[0] + languageJSON.second;
    }
    function toWeekday(num) {
        switch(num){
            case '1' : return languageJSON.Monday; break;
            case '2' : return languageJSON.Tuesday; break;
            case '3' : return languageJSON.Wednesday; break;
            case '4' : return languageJSON.Thursday; break;
            case '5' : return languageJSON.Friday; break;
            case '6' : return languageJSON.Saturday; break;
            case '7' : return languageJSON.Sunday; break;
            default: return '' ;
        }
    }
    
})