define(function (require, exports, module) {
    var templates = require('common/templates'),
        CONFIG = require('common/config'),
        UTIL = require('common/util'),
        getClass = require('pages/terminal/getMultipleTermClass.js'),
        getLabel = require('pages/terminal/labelManage.js'),
        languageJSON = CONFIG.languageJson.termList,
        nDisplayItems ,
        _onlinePageNO = 1,
        OPTION = {},
        _lastPageNO = 1;
    exports.init = function () {
        selectLanguage();
        termOnlineTime(_onlinePageNO);
        termLiatOnline(_lastPageNO);

        loadServerPage();
        loadTerminalPage();
        //初始化
        loadTermRunningPage();


        //搜索事件
        $("#statistics-term-search").keyup(function (event) {
            if (event.keyCode == 13) {
                var searchKeyword = $('#statistics-term-last-search').val();
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                onSearchTermOnline(event);
            }
        });
        $("#statistics-term-search").next().click(onSearchTermOnline);
        function onSearchTermOnline(event) {
            last = event.timeStamp;
            setTimeout(function () {
                if (last - event.timeStamp == 0) {
                    var searchKeyword = $('#statistics-term-last-search').val();
                    if (!UTIL.isValidated('keyword', searchKeyword)) return;
                    getOnlineDurByDate(localStorage.getItem('startTime'), localStorage.getItem('endTime'), 1, true);
                    //termOnlineTime(1);
                }
            }, 500);
        }

        $("#statistics-term-last-search").keyup(function (event) {
            if (event.keyCode == 13) {
                onSearchLastOnline(event);
            }
        });
        $("#statistics-term-last-search").next().click(onSearchLastOnline);
        function onSearchLastOnline(event) {
            last = event.timeStamp;
            setTimeout(function () {
                if (last - event.timeStamp == 0) {
                    termLiatOnline(1);
                }
            }, 500);
        }

        //导出上线时长
        $("#btn-export-timeDuration").click(function () {
            //exportOnlineDur();
            exportOnlineDur_1();
        })
        //导出最后上线时间
        $("#btn-export-lastTime").click(function () {
            exportLastOnline();
        })

        //绑定终端运行状态里的事件
        bindTermRunningEvent();
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#content-title").html(languageJSON.statistics);
        $(".term-online-duration").html(languageJSON.termOnlineDur)
        $(".term-lastOnline").html(languageJSON.termLastOnlineTime)
        $("#statistics-term-search").attr('placeholder', languageJSON.pl_searchTerm);
        $("#statistics-term-last-search").attr('placeholder', languageJSON.pl_searchTerm);
        $(".btn-export-html").html(languageJSON.export);
    }

    function loadServerPage() {
        var cpuPercent = 0,
            ramPercent = 0,
            diskPercent = 0;
        var cpuI = '1' + languageJSON.core + '1' + languageJSON.threads;
        var language = {
            serverInfo: languageJSON.serverInfo,
            cpuI: cpuI,
            serverData: languageJSON.serverData,
            ram: languageJSON.RAM,
            disk: languageJSON.disk,
            usage: languageJSON.usage,
            utilization: languageJSON.utilization
        }
        $('#statistics-server').html(templates.statistics_server_info(language));

        liveData();

        var data = JSON.stringify({
            action: "getSysInfo",
            project_name: CONFIG.projectName,
            user : CONFIG.userName,
            token : CONFIG.token
        })
        var _url = CONFIG.serverRoot + "/backend_mgt/v2/sysinfo/";
        var staInt = setInterval(function () {
            $.ajax({
                type: 'post',
                url: _url,
                data: data
            }).then(function(res){
                res = JSON.parse(res)
                if(res.rescode != '200'){
                    clearInterval(staInt)
                    alert(res.errInfo)
                }else{
                    let msg = res
                    cpuI = (msg.cpu_num ? msg.cpu_num : 1) + languageJSON.core + (msg.logical_cpu_num ? msg.logical_cpu_num : 1) + languageJSON.threads;
                    $("#cpuInfo").html(cpuI)
                    $("#ramUsage").html(msg.mem_used + '/' + msg.mem_total);
                    // var ramUsed = usage(msg.mem_used, msg.mem_total);
                    var ramUsed = msg.mem_percent;
                    $("#progress-ramUsed").css("width", ramUsed);
                    if (parseFloat(ramUsed) > 90) {
                        $("#progress-ramUsed").attr("class", "progress-bar progress-bar-red");
                    } else if (parseFloat(ramUsed) > 80) {
                        $("#progress-ramUsed").attr("class", "progress-bar progress-bar-yellow");
                    } else {
                        $("#progress-ramUsed").attr("class", "progress-bar progress-bar-aqua");
                    }

                    $("#diskUsage").html(msg.disk_used + '/' + msg.disk_total);
                    //var diskUsed = usage(msg.disk_used, msg.disk_total);
                    var diskUsed = msg.disk_percent;
                    $("#progress-diskUsed").css("width", diskUsed);
                    if (parseFloat(diskUsed) > 90) {
                        $("#progress-diskUsed").attr("class", "progress-bar progress-bar-red");
                    } else if (parseFloat(diskUsed) > 80) {
                        $("#progress-diskUsed").attr("class", "progress-bar progress-bar-yellow");
                    } else {
                        $("#progress-diskUsed").attr("class", "progress-bar progress-bar-aqua");
                    }

                    cpuPercent = msg.cpu_percent;
                    ramPercent = msg.mem_percent;
                    diskPercent = msg.disk_percent;
                    $(".knob-cpu").val(cpuPercent)
                    $(".knob-ram").val(ramPercent)
                    $(".knob-disk").val(diskPercent)
                    $(".knob").trigger("change")
                }
            })
            // UTIL.ajax("post", _url, data, function (msg) {
            //     cpuI = (msg.cpu_num ? msg.cpu_num : 1) + languageJSON.core + (msg.logical_cpu_num ? msg.logical_cpu_num : 1) + languageJSON.threads;
            //     $("#cpuInfo").html(cpuI)
            //     $("#ramUsage").html(msg.mem_used + '/' + msg.mem_total);
            //     // var ramUsed = usage(msg.mem_used, msg.mem_total);
            //     var ramUsed = msg.mem_percent;
            //     $("#progress-ramUsed").css("width", ramUsed);
            //     if (parseFloat(ramUsed) > 90) {
            //         $("#progress-ramUsed").attr("class", "progress-bar progress-bar-red");
            //     } else if (parseFloat(ramUsed) > 80) {
            //         $("#progress-ramUsed").attr("class", "progress-bar progress-bar-yellow");
            //     } else {
            //         $("#progress-ramUsed").attr("class", "progress-bar progress-bar-aqua");
            //     }

            //     $("#diskUsage").html(msg.disk_used + '/' + msg.disk_total);
            //     //var diskUsed = usage(msg.disk_used, msg.disk_total);
            //     var diskUsed = msg.disk_percent;
            //     $("#progress-diskUsed").css("width", diskUsed);
            //     if (parseFloat(diskUsed) > 90) {
            //         $("#progress-diskUsed").attr("class", "progress-bar progress-bar-red");
            //     } else if (parseFloat(diskUsed) > 80) {
            //         $("#progress-diskUsed").attr("class", "progress-bar progress-bar-yellow");
            //     } else {
            //         $("#progress-diskUsed").attr("class", "progress-bar progress-bar-aqua");
            //     }

            //     cpuPercent = msg.cpu_percent;
            //     ramPercent = msg.mem_percent;
            //     diskPercent = msg.disk_percent;
            //     $(".knob-cpu").val(cpuPercent)
            //     $(".knob-ram").val(ramPercent)
            //     $(".knob-disk").val(diskPercent)
            //     $(".knob").trigger("change")
            // })
        }, 1000);
        exports.staInt = staInt 
        /**
         * 实时数据绑定  
         */
        function liveData() {
            try {
                //CPU
                $(".knob-cpu").knob({
                    min: 0,
                    'change': function (e) {
                        $(".knob-cpu").val(cpuPercent)
                    }
                });
                //RAM
                $(".knob-ram").knob({
                    min: 0,
                    'change': function (e) {
                        $(".knob-ram").attr("value", t);
                    }
                });
                //DISK
                $(".knob-disk").knob({
                    min: 0,
                    'change': function (e) {
                        $(".knob-ram").attr("value", t);
                    }
                });

                Highcharts.setOptions({
                    global: {
                        useUTC: false
                    },
                    lang: {
                        months: languageJSON.months,
                        weekdays: languageJSON.weekdays
                    }
                });
                // Create the chart
                $('#container').highcharts('StockChart', {
                    chart: {
                        events: {
                            load: function () {
                                // set up the updating of the chart each second
                                var series = this.series[0];
                                var series2 = this.series[1];
                                exports.staInt2 = window.setInterval(function () {
                                    var x = (new Date()).getTime(), // current time
                                        y = parseFloat(cpuPercent),
                                        y2 = parseFloat(ramPercent);
                                    series.addPoint([x, y], true, true);
                                    series2.addPoint([x, y2], false, true);
                                }, 1000);
                            }
                        }
                    },
                    rangeSelector: {
                        buttons: [{
                            count: 1,
                            type: 'minute',
                            text: '1M'
                        }, {
                            count: 5,
                            type: 'minute',
                            text: '5M'
                        }, {
                            type: 'all',
                            text: languageJSON.all
                        }],
                        inputEnabled: false,
                        selected: 0
                    },
                    title: {
                        text: languageJSON.livaData
                    },
                    exporting: {
                        enabled: false
                    },
                    series: [{
                        name: 'CPU ' + languageJSON.utilization + '(%)',
                        type: 'spline',
                        data: (function () {
                            // generate an array of random data
                            var data = [], time = (new Date()).getTime(), i;
                            for (i = -999; i <= 0; i += 1) {
                                data.push([
                                    time + i * 1000,
                                    0
                                ]);
                            }
                            // data = cpupList;
                            return data;
                        }())
                    }, {
                        name: 'RAM ' + languageJSON.utilization + '(%)',
                        type: 'spline',
                        data: (function () {
                            // generate an array of random data
                            var data = [], time = (new Date()).getTime(), i;
                            for (i = -999; i <= 0; i += 1) {
                                data.push([
                                    time + i * 1000,
                                    0
                                ]);
                            }
                            // data = rampList;
                            return data;
                        }())
                    }],
                    credits: {
                        enabled: false
                    }
                });
            } catch (e) {
            }
        }
    }

    function formatDate(now) {
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var date = now.getDate();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second; 
    }

    function loadTerminalPage() {
        var onlinePercent = 0,
            sleepPercent = 0,
            averOnlineDur = 0;
        var timeStamp = new Date().getTime();
        var statisticTime = formatDate(new Date(timeStamp));
        /*var statisticLabel = '统计时间 : ';*/
        var language = {
            termInfo: languageJSON.termInfo,
            termData: languageJSON.termData,
            termOnlineInfo: languageJSON.termOnlineInfo,
            statisticTime: statisticTime,
            statisticLabel: languageJSON.statisticLabel,
        }
        $('#statistics-terminal').html(templates.statistics_terminal_info(language));

        var data = JSON.stringify({
            action: "get_daily_online_count",
            project_name: CONFIG.projectName,
        })
        var _url = CONFIG.serverRoot + "/backend_mgt/term_statis";
        UTIL.ajax("post", _url, data, function (msg) {
            Highcharts.setOptions({
                global: {
                    useUTC: false
                },
                lang: {
                    months: languageJSON.months,
                    weekdays: languageJSON.weekdays
                }
        });
            var parseData_on = [], parseData_off = [];
            
            var date = msg['date_list'].map(function (v, i) {
                return v * 1000;
            });
            var onlineCount = msg['online_count'];
            var offlineCount = msg['offline_count'];
            for (var i = 0; i < date.length; i++) {
                var x = date[i],
                    aPoint_on = [],
                    aPoint_off = [],
                    y_on = onlineCount[i],
                    y_off = offlineCount[i];
                aPoint_on.push(x);
                aPoint_on.push(y_on);
                aPoint_off.push(x);
                aPoint_off.push(y_off)
                parseData_on.push(aPoint_on);
                parseData_off.push(aPoint_off);
            }
            // Create the chart
            $('#container_term').highcharts('StockChart', {
                rangeSelector: {
                    buttons: [{
                        count: 1,
                        type: 'month',
                        text: '1M'
                    }],
                    inputEnabled: false,
                },
                exporting: {
                    enabled: false
                },
                title: {
                    text: languageJSON.termData
                },
                series: [{
                    name: languageJSON.onlineTermCount,
                    marker: {
                        enabled: true,
                        radius: 3
                    },
                    data: parseData_on
                },
                {
                    name: languageJSON.offlineTermCount,
                    marker: {
                        enabled: true,
                        radius: 3
                    },
                    data: parseData_off
                    }
                ],
                credits: {
                    enabled: false
                }
            });

            loadLiveInfo();
        })


    }

    function loadTermRunningPage() {
        var language = {
            termRunningData: languageJSON.termRunningData,
            statisTime: languageJSON.statisTime,
            to: languageJSON.to,
            statisRange: languageJSON.statisRange,
            sTerminal: languageJSON.sTerminal,
            sLabel: languageJSON.sLabel,
            statisCompare: languageJSON.statisCompare,
            defaultTime: languageJSON.defaultTime,
            customize: languageJSON.customize,
            statisExport: languageJSON.statisExport,
            exportAll: languageJSON.exportAll,
            exportNormal: languageJSON.exportNormal,
            exportAbnormal: languageJSON.exportAbnormal,
            exportZombie: languageJSON.exportZombie,
            exportData: languageJSON.exportData,
            exportAbnormalData: languageJSON.exportAbnormalData,
            exportOnOffline: languageJSON.exportOnOffline,
            exportReboot: languageJSON.exportReboot,
            exportOnline: languageJSON.exportOnline,
            exportSlow: languageJSON.exportSlow,
            normalUtilization : '正常终端平均运行率',
            abnormalUtilization: '异常终端平均运行率',
            allStatusTitle: '终端状态总览',
            abnormalStatusTitle: '终端异常情况发生频次(终端/天)',
            saveFilter: '确定',
            searchTerminal: '搜索终端名称',
        }
        $('#statistics-running').html(templates.statistics_termRunning_info(language));
        var myDate = new Date(), _startDate = new Date();
        myDate.setDate(myDate.getDate() - 1);
        _startDate.setDate(_startDate.getDate() - 7);
        var todayDate = new Date();
        $("#datepicker1, #datepicker2").datepicker({
            autoclose: true,
            language: languageJSON.all == '全部' ? "zh-CN" : 'en',
            startDate: "-1m",
            endDate: "+1d",
        });

        $($('#datepicker1').children('input')[0]).datepicker('setDate', _startDate);
        $($('#datepicker1').children('input')[1]).datepicker('setDate', myDate);
        $($('#datepicker2').children('input')).datepicker('setDate', myDate);
        $('#statistics-running input').iCheck({
            checkboxClass: "icheckbox_flat-blue",
            radioClass: "iradio_flat-blue"
        });
        
        //默认同期对比
        var s1 = formatDatePicker('start', $($('#datepicker1').children('input')[0]).val());
        var e1 = formatDatePicker('end', $($('#datepicker1').children('input')[1]).val());

       
        var offset = moment(e1).diff(s1) + 1000*60*60*24;
        var _s2 = new Date(moment(s1).valueOf() - offset)
        var _e2 = new Date(moment(e1).valueOf() - offset)
       
        var s2 = moment(_s2).format('YYYY-MM-DD HH:mm:ss')
        var e2 = moment(_e2).format('YYYY-MM-DD HH:mm:ss')
        OPTION = {
            startTime:s1,
            endTime: e1,
            startSTime: s2,
            startETime: e2,
            categoryId: [],
            labelId: '',
        }

        getSumChart(OPTION);
        getAbnormalChart(OPTION);
        getAverageChart(OPTION);
        // getNormalLineChart(OPTION);

    }

    function getSumChart(option) {
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "overview_status",
            'category_id': option.categoryId,
            'date_from': option.startTime,
            'date_to': option.endTime,
            'same_date_from': option.startSTime,
            'same_date_to': option.startETime,
            'keyword': option.keyword
        })

       var _url = CONFIG.serverRoot + "/backend_mgt/term_statis";
       UTIL.ajax("post", _url, data, function (msg) {
            var normalTerm = msg.normal,
                exceptTerm = msg.except,
                zombieTerm = msg.zombie;

            var msg = [
                ['正常终端', normalTerm.count],
                ['异常终端', exceptTerm.count],
                ['僵尸终端', zombieTerm.count]
            ];
            var _nchange = normalTerm.change >= 0 ? '+'+normalTerm.change : ''+normalTerm.change;
            var _echange = exceptTerm.change >= 0 ? '+'+exceptTerm.change : ''+exceptTerm.change;
            var _zchange = zombieTerm.change >= 0 ? '+'+zombieTerm.change : ''+zombieTerm.change;
            // var t1 = ''+normalTerm.count + _nchange;
            // var t2 = ''+exceptTerm.count + _echange;
            // var t3 = ''+zombieTerm.count + _zchange;

            var _text = '<b>正常终端：</b><b style="color:green; font-size:16px;">'+normalTerm.count+'</b><b style="color:green">'+_nchange+'</b><br><b>异常终端：</b><b style="color:orangered; font-size:16px;">'+exceptTerm.count+'</b><b style="color:orangered">'+_echange+'</b><br><b>僵尸终端：</b><b style="color:gray; font-size:16px;">'+zombieTerm.count+'</b><b style="color:gray">'+_zchange+'</b>';
            var chart = null;
            $('#container1').highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                },
                exporting: {
                    enabled: false
                },
                title: {
                    floating: true,
                    text: _text,
                    style: {
                        fontSize: '12px'
                    },
                    y:120
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                    }
                },
                series: [{
                    type: 'pie',
                    innerSize: '80%',
                    name: languageJSON.termCount,
                    data: msg
                }]
            });
       })
    }
    
    function getAbnormalChart(option) {
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "overview_except_status",
            'category_id': option.categoryId,
            'date_from': option.startTime,
            'date_to': option.endTime,
            'same_date_from': option.startSTime,
            'same_date_to': option.startETime,
            'keyword': option.keyword
        })

        var _url = CONFIG.serverRoot + "/backend_mgt/term_statis/";
       UTIL.ajax("post", _url, data, function (msg) {
            var onoffline = msg.onoffline
                reboot = msg.reboot
                short_online = msg.short_online
                download_timeout = msg.download_timeout;

            var msg = [
                ['频繁上下线', onoffline.count],
                ['频繁重启', reboot.count],
                ['在线时间短', short_online.count],
                ['下载极慢', download_timeout]
            ];
            var _ochange = onoffline.change >= 0 ? '+'+onoffline.change : ''+onoffline.change;
            var _rchange = reboot.change >= 0 ? '+'+reboot.change : ''+reboot.change;
            var _schange = short_online.change >= 0 ? '+'+short_online.change : ''+short_online.change;
            // var t1 = ''+onoffline.count + _ochange;
            // var t2 = ''+reboot.count + _rchange;
            // var t3 = ''+short_online.count + _schange;
            var t4 = download_timeout;
            var _text = '<b>频繁上下线:</b><b style="color:green; font-size:16px">'+onoffline.count+'</b><b style="color:green">'+_ochange+'</b><br><b>频繁重启:</b><b style="color:orangered; font-size:16px">'+reboot.count+'</b><b style="color:orangered">'+_rchange+'</b><br><b>在线时间短:</b><b style="color:gray; font-size:16px">'+short_online.count+'</b><b style="color:gray">'+_schange+'</b><br><b>下载极慢:</b><b style="color:gray; font-size:16px">'+t4+'</b>';
            var chart = null;
            $('#container2').highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                },
                exporting: {
                    enabled: false
                },
                title: {
                    floating: true,
                    text: _text,
                    style: {
                        fontSize: '12px'
                    },
                    y:120
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                    }
                },
                series: [{
                    type: 'pie',
                    innerSize: '80%',
                    name: languageJSON.termCount,
                    data: msg
                }]
            });
        })
    }

    function getAverageChart(option) {
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "overview_run_time",
            'category_id': option.categoryId,
            'date_from': option.startTime,
            'date_to': option.endTime,
            'keyword': option.keyword
        })

       var _url = CONFIG.serverRoot + "/backend_mgt/term_statis";
       UTIL.ajax("post", _url, data, function (msg) {
            var normalRate = msg.normal_rate * 100 + "%";
            var exceptRate = msg.except_rate * 100 + "%";
            $('.knob-normal, .knob-abnormal').knob({
                min:0
            })
            $(".knob-normal").val(normalRate);
            $(".knob-abnormal").val(exceptRate);
       })
    }

    function getNormalLineChart(option) {
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "overview_daily_normal_status",
            'category_id': option.categoryId,
            'date_from': option.startTime,
            'date_to': option.endTime,
            'keyword': option.keyword
        })

       var _url = CONFIG.serverRoot + "/backend_mgt/term_statis";
       UTIL.ajax("post", _url, data, function (msg) {
           var _data = msg.data;
           var dateArray = [];
           var countArray = [];
           _data.map(function(v){
               dateArray.push(v.date);
               countArray.push(v.count);
           })

           $('#container5').highcharts({
            chart: {
                type: 'line'
            },
            title:{
                floating:true,
                text:''
            },
            exporting: {
                enabled: false
            },
            xAxis: {
                categories: dateArray,
                crosshair: true,
            },
            yAxis: {
                min: 0,
            },
            series: [{
                name: '终端数',
                //data: [1,2,3,4,5,6,7,8,9,4,3,2,5,7,3]
                data: countArray
            }],
            credits: {
                enabled: false
            }
        });
       })
    }

    function getAbnormalLineChart(option) {
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "overview_daily_except_status",
            'category_id': option.categoryId,
            'date_from': option.startTime,
            'date_to': option.endTime,
            'keyword': option.keyword
        })

       var _url = CONFIG.serverRoot + "/backend_mgt/term_statis";
       UTIL.ajax("post", _url, data, function (msg) {
        var _data = msg.data;
        var dateArray = [];
        var countArray = [];
        _data.map(function(v){
            dateArray.push(v.date);
            countArray.push(v.count);
        })
        $('#container5').highcharts({
         chart: {
             type: 'line'
         },
         title:{
             floating:true,
             text:''
         },
         exporting: {
             enabled: false
         },
         xAxis: {
             categories: dateArray,
             crosshair: true,
         },
         yAxis: {
             min: 0,
         },
         series: [{
             name: '终端数',
             //data: [1,2,3,4,5,6,7,8,9,4,3,2,5,7,3]
             data: countArray
         }],
         credits: {
             enabled: false
         }
     });
    })
    }


    function bindTermRunningEvent(){
        $('#container_filter .selectAddress').on('click', function(){
            getClass.title = '请选择终端组';
            getClass.save = function (data) {
                cIDArr = [];
                cNameArr = [];
                for (var i = 0; i < data.length; i++) {
                    cIDArr.push(data[i].categoryID);
                    cNameArr.push(data[i].name);
                    delete data[i].name;
                }
                OPTION.categoryId = cIDArr;
                getClass.categoryData = data;
                var cNameStr = cNameArr.join() || '选择终端组';
                $(".selectAddress").text(cNameStr);
                $(".selectAddress").attr('title',cNameStr);
                UTIL.cover.close(2);
            }
            getClass.close = function () {
                UTIL.cover.close(2);
            }
            UTIL.cover.load('resources/pages/terminal/getMultipleTermClass.html', 2);
        });

        // $('#container_filter .selectlabel').on('click', function(){
        //     getLabel.title = '请选择标签';
        //     getLabel.save = function (data) {
        //         cIDArr = [];
        //         cNameArr = [];
        //         for (var i = 0; i < data.length; i++) {
        //             cIDArr.push(data[i].labelId);
        //             cNameArr.push(data[i].labelName);
        //             delete data[i].labelName;
        //         }
        //         getLabel.labelData = data;
        //         var cNameStr = cNameArr.join(' / ') || '选择标签';
        //         $(".selectlabel").text(cNameStr);
        //         $(".selectlabel").attr('title',cNameStr);
        //         UTIL.cover.close(2);
        //     }
        //     getLabel.close = function () {
        //         UTIL.cover.close(2);
        //     }
        //     UTIL.cover.load('resources/pages/terminal/labelManage.html', 2);
        // })

        $('#container_filter .saveFilter').on('click', function(){
            var _keyword = '';
            var s1 = formatDatePicker('start', $($('#datepicker1').children('input')[0]).val());
            var e1 = formatDatePicker('end', $($('#datepicker1').children('input')[1]).val());
            var s2 = '', e2 = '';

            if($(".range1 div.icheckbox_flat-blue.checked").length > 0){
                if($('.selectAddress').text() == '选择终端组') OPTION.categoryId = [];
            }else{
                OPTION.categoryId= [];
            }
            if($(".range2 div.icheckbox_flat-blue.checked").length > 0){
                labelId = '';
                _keyword = $('.selectlabel').val();
            }
            if($(".leftSide div.iradio_flat-blue.checked").length > 0){
                // var offset = new Date(e1) - new Date(s1) + 1000*60*60*24;
                // var _s2 = new Date(new Date(s1) - offset).toLocaleDateString();
                // var _e2 = new Date(new Date(e1) - offset).toLocaleDateString();
                // s2 = formatDatePicker('start', _s2);;
                // e2 = formatDatePicker('end', _e2);;
                var offset = moment(e1).diff(s1) + 1000*60*60*24;
                var _s2 = new Date(moment(s1).valueOf() - offset)
                var _e2 = new Date(moment(e1).valueOf() - offset)
                s2 = moment(_s2).format('YYYY-MM-DD HH:mm:ss')
                e2 = moment(_e2).format('YYYY-MM-DD HH:mm:ss')
            }else{
                s2 = formatDatePicker('start', $($('#datepicker2').children('input')[0]).val());
                e2 = formatDatePicker('end', $($('#datepicker2').children('input')[1]).val());
            }
            
            OPTION.startTime=s1;
            OPTION.endTime= e1;
            OPTION.startSTime= s2;
            OPTION.startETime= e2;
            OPTION.labelId = '';
            OPTION.keyword = _keyword;

            getSumChart(OPTION);
            getAbnormalChart(OPTION);
            getAverageChart(OPTION);
            getNormalLineChart(OPTION);
            $('#normalTerm').trigger('click');

        })

        $('#exportList1 a').on('click', function(){
            var categoryName = $('.selectAddress').text() == '选择终端组' ? '所有终端' : $('.selectAddress').text();
            var info = '确定以下列条件导出吗：\n统计时间：\n 开始时间: ' + OPTION.startTime + '\n 结束时间: ' + OPTION.endTime + '\n统计范围：\n 终端组: ' + categoryName + '\n 关键字:' + (OPTION.keyword || '无') + '\n数据对比：\n' + ' 开始时间:' + OPTION.startSTime + '\n 结束时间:' + OPTION.startETime;
            var runFilter = confirm(info);
            if (!runFilter) return

            var index = $(this).parent().index();
            var type='', _name='';
            switch (index) {
                case 0:
                    type = 'all';
                    _name = '全部终端';
                    break;
                case 1:
                    type = 'normal';
                    _name = '正常终端';
                    break;
                case 2:
                    type = 'except';
                    _name = '异常终端';
                    break;
                case 3:
                    type = 'zombie';
                    _name = '僵尸终端';
                    break;
            }
            var data = JSON.stringify({
                'action': 'export_term_xls',
                'category_id': OPTION.categoryId,
                'date_from': OPTION.startTime,
                'date_to': OPTION.endTime,
                'project_name': CONFIG.projectName,
                'keyword': OPTION.keyword,
                'type': type
            });
            var url = CONFIG.serverRoot + "/backend_mgt/term_statis";
            UTIL.ajax("post", url, data, function (msg) {
                var time = new Date();
                var filename = time.toLocaleDateString();
                var downloadLink = msg.file_url;
                var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
                save_link.href = downloadLink
                save_link.download = _name + filename;
                fake_click(save_link);
            })
        })

        $('#exportList2 a').on('click', function(){
            var categoryName = $('.selectAddress').text() == '选择终端组' ? '所有终端' : $('.selectAddress').text();
            var info = '确定以下列条件导出吗：\n统计时间：\n 开始时间: ' + OPTION.startTime + '\n 结束时间: ' + OPTION.endTime + '\n统计范围：\n 终端组: ' + categoryName + '\n 关键字:' + (OPTION.keyword || '无') + '\n数据对比：\n' + ' 开始时间:' + OPTION.startSTime + '\n 结束时间:' + OPTION.startETime;
            var runFilter = confirm(info);
            if (!runFilter) return

            var index = $(this).parent().index();
            var type='', _name='';
            switch (index) {
                case 0:
                    type = 'onoffline';
                    _name = '频繁上下线';
                    break;
                case 1:
                    type = 'reboot';
                    _name = '频繁重启';
                    break;
                case 2:
                    type = 'short_online';
                    _name = '在线时间短';
                    break;
                case 3:
                    type = 'download_timeout';
                    _name = '下载极慢';
                    break;
            }
            var data = JSON.stringify({
                'action': 'export_term_xls',
                'category_id': OPTION.categoryId,
                'date_from': OPTION.startTime,
                'date_to': OPTION.endTime,
                'project_name': CONFIG.projectName,
                'keyword': OPTION.keyword,
                'type': type
            });
            var url = CONFIG.serverRoot + "/backend_mgt/term_statis";
            UTIL.ajax("post", url, data, function (msg) {
                var time = new Date();
                var filename = time.toLocaleDateString();
                var downloadLink = msg.file_url;
                var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
                save_link.href = downloadLink
                save_link.download = _name + filename;
                fake_click(save_link);
            })
        })

        $('#normalTerm').on('click', function(){
            $('#container5').empty();
            $('#container_line span').removeClass('select');
            $(this).addClass('select');
            getNormalLineChart(OPTION);
        })

        $('#abnormalTerm').on('click', function(){
            $('#container5').empty();
            $('#container_line span').removeClass('select');
            $(this).addClass('select');
            getAbnormalLineChart(OPTION);
        })

        $('#normalTerm').trigger('click');
    }


    function loadLiveInfo() {
        var data = JSON.stringify({
            "project_name": CONFIG.projectName,
            "action": "get_current_statis"
        })

        //var _url = CONFIG.serverRoot + "/backend_mgt/v2/termcategory/";
        var _url = CONFIG.serverRoot + "/backend_mgt/term_statis/";
        UTIL.ajax("post", _url, data, function (msg) {
            var onlineTerm = msg.Running
                shutdownTerm = msg.Dormant
                totalTerm = msg.Total
                offlineTerm = msg.Offline;

            var msg = [
                [languageJSON.running, onlineTerm],
                [languageJSON.dormancy, shutdownTerm],
                [languageJSON.offline, offlineTerm]
            ];

            var chart = null;
            Highcharts.setOptions({
                colors: ['#00c0ef', '#1F1F1F', '#919191'],
                lang: {
                    months: ['一月', '二月', '三月', '四月', '五月', '六月',  '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
                }
            });
            $('#container_live').highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                },
                exporting: {
                    enabled: false
                },
                title: {
                    floating: true,
                    text: languageJSON.termCount
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        point: {
                            events: {
                                mouseOver: function (e) { 
                                    chart.setTitle({
                                        text: e.target.name + ' : ' + e.target.y + '/' + totalTerm
                                    });
                                }
                            }
                        },
                    }
                },
                series: [{
                    type: 'pie',
                    innerSize: '80%',
                    name: languageJSON.termCount,
                    data: msg
                }]
            }, function (c) {
                var centerY = c.series[0].center[1],
                    titleHeight = parseInt(c.title.styles.fontSize);
                c.setTitle({
                   // x: 18,
                    x: 10,
                    y: centerY + titleHeight / 2 ,
                    style: {
                        fontSize: '12px'
                    }
                });
                chart = c;
            });
        });
    }
       // }

    /**
     * 终端时长列表
     * @param pageNum
     */
    function termOnlineTime(pageNum) {
        // loading
        //$('#box-table-termOnlineTime>tbody').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $('#box-table-termOnlineTime>tbody').empty();
        $('#noResults').remove();
        $('#box-table-termOnlineTime>tbody').append('<tr>' +
            '<th class="sta_name"><b>' + languageJSON.termName + '</b></th>' +
            '<th class="sta_mac text-center">' + languageJSON.termMac + '</th>' +
            '<th class="sta_onlineStatus text-center">' + languageJSON.status + '</th>' +
            '<th class="sta_yesOnTime">' + 
            '<div id="datepicker" class="input-daterange input-group"><span style="border:none; font-weight:bold" class="input-group-addon">' + languageJSON.onlineDur +
            '</span > <input type="text" class="input-sm form-control" name="start"><span class="input-group-addon">' + languageJSON.until_to +'</span>' + 
            '<input type="text" class="input-sm form-control" name="end"></div>' + 
            '<button id="btn-search" type="button" class="btn btn-default btn-sm">' + languageJSON.searchByDate + '</button>' +
            '</th>' +
            '<th class="sta_toOnTime text-center"></th>' +
            '</tr>')

        //设置时间选择器默认值 默认为昨天
        var myDate = new Date();
        myDate.setDate(myDate.getDate() - 1);
        var todayDate = new Date();
        $("#datepicker").datepicker({
            autoclose: true,
            language: languageJSON.all == '全部' ? "zh-CN" : 'en',
            startDate: "-1m",
            endDate: "+1d",
            //datesDisabled: [todayDate]
        });

        $($('#datepicker').children('input')).datepicker('setDate', myDate);

        $("#btn-search").on('click', function () {
            var fromDate = formatDatePicker('start', $($('#box-table-termOnlineTime input')[0]).val());
            var toDate = formatDatePicker('end', $($('#box-table-termOnlineTime input')[1]).val());
            getOnlineDurByDate(fromDate, toDate, pageNum, true);
            localStorage.setItem('startTime', fromDate);
            localStorage.setItem('endTime', toDate);
        })
        $("#btn-search").trigger('click');
        //$('#box-table-termOnlineTime input').trigger('change');
    }

    function formatDatePicker(isStart, date) {
        var fromDate = '',
            toDate = '';
        if (date.indexOf("/") < 0) {
            parsedDate = date.replace(/年/, '-').replace(/月/, '-').replace(/日/, '') + " 00:00:00";
            isStart == "start" ? fromDate = parsedDate : toDate = parsedDate;
        } else {
            var timeArray = date.split("/");
            if(timeArray[0].length >3){
                var year = timeArray[0];
                var month = format(timeArray[1]);
                var day = format(timeArray[2]);
            }else{
                var year = timeArray[2];
                var month = timeArray[0];
                var day = timeArray[1];
            }
            parsedDate = year + '-' + month + '-' + day + ' 00:00:00';
            isStart == "start" ? fromDate = parsedDate : toDate = parsedDate;
        }
        return fromDate || toDate;
    }

      /**
     *打开单个终端详情页面
     * @param termID
     */

    function openOneTermDetail(termID) {
        var language = {
            termInfo: languageJSON.conf_lbl_basicInfo,
            termData: languageJSON.termData,
            termName: languageJSON.conf_lbl_termName,
            termVersion: languageJSON.termVersion,
            currentChannel: languageJSON.list_currentChannel,
            preLssued: languageJSON.conf_lbl_preLssued,
            RAM: languageJSON.RAM
        }
        //$('#cover_area').html(templates.statistics_single_terminal(language))
        //    .css({ display: 'flex' });
        $('#singleTerminal').html(templates.statistics_single_terminal(language)).show();
        $('#closeCover').on('click', function (e) {
            $('#singleTerminal').hide();
        })
        var date_detailInfo = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "getInfo",
            ID: termID
        });
        var date_onlineCount = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "get_term_online_statis",
            term_id: termID
        })
        var url_detailInfo = CONFIG.serverRoot + "/backend_mgt/v2/term/";
        var url_onlineCount = CONFIG.serverRoot + "/backend_mgt/term_statis";
        UTIL.ajax('post', url_detailInfo, date_detailInfo, function (res) {
            $('#term-name').text(res.Name)
            $('#term-channel').text(res.Channel_Name)
            $('#term-preChannel').text(res.PreDownload_Channel_Name || languageJSON.nothing)
            $('#term-ip').text(res.IP)
            $('#term-mac').text(res.MAC)
            $('#term-cpu').text(res.Cpu + '%')
            $('#term-memory').text(res.Mem)
            $('#term-version').text(res.TermVersion);
       
        })

        UTIL.ajax('post', url_onlineCount, date_onlineCount, function (res) {
            var dateArray = res['date_list'].map(function (v, i) {
                return Highcharts.dateFormat('%Y-%m-%d', v*1000);
            })
            var durationArray = res['online_duration'].map(function (v, i) {
                return Number((v / 3600).toFixed(1));
            })
            
            $('#container_termInfo').highcharts({
                chart: {
                    type: 'column'
                },
                exporting: {
                    enabled: false
                },
                title: {
                    text: languageJSON.termOnlineDur
                },
                xAxis: {
                    categories: dateArray,
                    crosshair: true,
                },
                yAxis: {
                    title: {
                        text: languageJSON.durHours
                    },
                    min: 0,
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                series: [{
                    name: languageJSON.termOnlineDur,
                    data: durationArray
                }],
                credits: {
                    enabled: false
                }
            });
        })
    }


      /**
     * 根据时间区间查询终端时长列表
     * @param fromDate
     * @param toDate
     */
    function getOnlineDurByDate(fromDate, toDate, pageNum, isSelectDatePicker) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        $('#box-table-termOnlineTime>tbody tr:not(:first)').remove();
        $('#noResults').remove();
        var data = JSON.stringify({
            action: "get_online_duration",
            project_name: CONFIG.projectName,
            date_from: fromDate,
            date_to: toDate,
            Pager: {
                page: pageNum,
                per_page: nDisplayItems,
                keyword: $('#statistics-term-search').val() ? $('#statistics-term-search').val() : ''
            }
        })

        UTIL.ajax('post', CONFIG.serverRoot + '/backend_mgt/term_statis', data, function (json) {
            var totalPages = Math.ceil(json.total / nDisplayItems);
            totalPages = Math.max(totalPages, 1);
            $('#statistics-table-pager').jqPaginator({
                // totalPages: totalPages,
                totalCounts: json.total,
                pageSize: nDisplayItems,
                visiblePages: CONFIG.pager.visiblePages,
                first: CONFIG.pager.first,
                prev: CONFIG.pager.prev,
                next: CONFIG.pager.next,
                last: CONFIG.pager.last,
                page: CONFIG.pager.page,
                currentPage: isSelectDatePicker ? pageNum : _onlinePageNO,
                onPageChange: function (num, type) {
                    _onlinePageNO = num;
                    if (type === 'change') {
                        //termOnlineTime(_onlinePageNO);
                        getOnlineDurByDate(fromDate, toDate, _onlinePageNO, false);
                    }
                }
            });
            if (json.total != 0) {
                json.terms.map(function (v, i) {
                    var data = {
                        name: json.names[i] || '',
                        mac: json.macs[i] || '',
                        onlineStatus: json.online[i] == 1 ? languageJSON.online : languageJSON.offline,
                        totalOnlineTime: formatSecondToHour(json.online_duration[i]),
                        idName: 'progress_duration' + v,
                        termId: v
                    }
               
                    var totalDuration = json.interval * 24 * 60 * 60;
                    var duration = usage_duration(json.online_duration[i], totalDuration);
                    $('#box-table-termOnlineTime>tbody').append(templates.statistics_table_row(data));
                    $('#progress_duration' + v).css("width", duration);
                    $('#box-table-termOnlineTime #' + v).on('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        openOneTermDetail($(this)[0].id);
                    })
                })
            } else {
                $('#box-table-termOnlineTime>tbody tr:not(":first")').empty();
                //$("#box-table-termOnlineTime>tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
                $("#box-table-termOnlineTime").parent().append('<h5 id="noResults" style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
        })

    }

    /**
     * 终端最后上线时间列表
     * @param pageNum
     */
    function termLiatOnline(pageNum) {
        nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        // loading
        $('#box-table-lastOnlineTime>tbody').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
        $('#box-table-lastOnlineTime>tbody').empty();
        $('#box-table-lastOnlineTime>tbody').append('<tr>' +
            '<th class="lot_name"><b>' + languageJSON.termName + '</b></th>' +
            '<th class="lot_mac text-center">' + languageJSON.termMac + '</th>' +
            '<th class="lot_lastTime text-center">' + languageJSON.lastOnlineTime + '</th>' +
            '</tr>')

        var searchKeyword = $('#statistics-term-last-search').val();
        var pager = {
            Online: 0,
            page: pageNum,
            total: 0,
            per_page: nDisplayItems,
            orderby: 'LastOnlineTime',
            sortby: '',
            keyword: searchKeyword ? searchKeyword : ''
        };
        var data = JSON.stringify({
            action: "get_offline_terms_last_online_time",
            project_name: CONFIG.projectName,
            Pager: pager
        })
        UTIL.ajax('post', CONFIG.serverRoot + '/backend_mgt/term_statis/', data, function (json) {
            var totalPages = Math.ceil(json.total / nDisplayItems);
            totalPages = Math.max(totalPages, 1);
            $('#statistics-lastOnlineTime-pager').jqPaginator({
                totalCounts: json.total,
                pageSize: nDisplayItems,
                visiblePages: CONFIG.pager.visiblePages,
                first: CONFIG.pager.first,
                prev: CONFIG.pager.prev,
                next: CONFIG.pager.next,
                last: CONFIG.pager.last,
                page: CONFIG.pager.page,
                currentPage: _lastPageNO,
                onPageChange: function (num, type) {
                    _lastPageNO = num;
                    if (type === 'change') {
                        termLiatOnline(_lastPageNO);
                    }
                }
            });
            if (json.total != 0) {
                json.data.forEach(function (el, idx, arr) {
                    var data = {
                        name: el.Name,
                        mac: el.MAC,
                        LastOnlineTime: el.LastOnlineTime
                    };
                    $('#box-table-lastOnlineTime>tbody').append(templates.statistics_table_last_row(data));
                })
            } else {
                $('#box-table-lastOnlineTime>tbody').empty();
                $("#box-table-lastOnlineTime>tbody").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
        })
    }

    /**
     * 导出终端在线时长
     */
    function exportOnlineDur() {
        var pager = {
            Online: 1,
            page: 1,
            total: 0,
            per_page: 9999,
            orderby: 'YesterdayTotalOnlineTime',
            sortby: 'DESC',
            keyword: ''
        };
        var data = JSON.stringify({
            action: "get_offline_terms_last_online_time",
            project_name: CONFIG.projectName,
            Pager: pager
        })
        UTIL.ajax('post', CONFIG.serverRoot + '/backend_mgt/term_statis/', data, function (json) {
            $('#export-table>tbody').empty();
            $('#export-table>tbody').append('<tr>' +
                '<th class="sta_name"><b>' + languageJSON.termName + '</b></th>' +
                '<th class="sta_mac text-center">' + languageJSON.termMac + '</th>' +
                '<th class="sta_onlineStatus text-center">' + languageJSON.status + '</th>' +
                '<th class="sta_yesOnTime text-center">' + languageJSON.yestOnlineTime + '</th>' +
                '<th class="sta_toOnTime text-center">' + languageJSON.todayOnlineTime + '</th>' +
                '</tr>')
            if (json.total != 0) {
                json.data.forEach(function (el, idx, arr) {
                    var data = {
                        name: el.Name,
                        mac: el.MAC,
                        onlineStatus: el.Online == 1 ? languageJSON.online : languageJSON.offline,
                        TodayTotalOnlineTime: formatTime(el.TodayTotalOnlineTime),
                        YesterdayTotalOnlineTime: formatTime(el.YesterdayTotalOnlineTime)
                    };
                    $('#export-table>tbody').append(templates.statistics_table_row(data));
                })
            } else {
                $('#export-table>tbody').empty();
                $('#export-table>tbody').append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
            export_raw(languageJSON.termOnlineDur, $("#box-export-table").html())
        })
    }

    function exportOnlineDur_1() {
        var fromDate = $('#datepicker input[name="start"]').val();
        var endDate = $('#datepicker input[name="end"]').val();
        var date_from = formatDatePicker('start', fromDate);
        var date_to = formatDatePicker('end', endDate);
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "gen_statis_xls",
            date_from: date_from,
            date_to: date_to
        })
        UTIL.ajax('post', CONFIG.serverRoot + '/backend_mgt/term_statis/', data, function (json) {
            var time = new Date();
            var name = languageJSON.termOnlineDur;
            var filename = time.toLocaleDateString();
            var downloadLink = json.file_url;
            var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
            save_link.href = downloadLink
            save_link.download = name + filename;
            fake_click(save_link);
        })

    }


    /**
     * 导出离线终端最后上线时间
     */
    function exportLastOnline() {
        var pager = {
            Online: 0,
            page: 1,
            total: 0,
            per_page: 9999,
            orderby: 'LastOnlineTime',
            sortby: '',
            keyword: ''
        };
        var data = JSON.stringify({
            action: "get_offline_terms_last_online_time",
            project_name: CONFIG.projectName,
            Pager: pager
        })
        UTIL.ajax('post', CONFIG.serverRoot + '/backend_mgt/term_statis', data, function (json) {
            $('#export-table>tbody').empty();
            $('#export-table>tbody').append('<tr>' +
                '<th class="lot_name"><b>' + languageJSON.termName + '</b></th>' +
                '<th class="lot_mac text-center">' + languageJSON.termMac + '</th>' +
                '<th class="lot_lastTime text-center">' + languageJSON.lastOnlineTime + '</th>' +
                '</tr>')
            if (json.total != 0) {
                json.data.forEach(function (el, idx, arr) {
                    var data = {
                        name: el.Name,
                        mac: el.MAC,
                        LastOnlineTime: el.LastOnlineTime
                    };
                    $('#export-table>tbody').append(templates.statistics_table_last_row(data));
                })
            } else {
                $('#export-table>tbody').empty();
                $('#export-table>tbody').append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
            }
            export_raw(languageJSON.termLastOnlineTime, $("#box-export-table").html())
        })
    }

    /**
     * 保存列表
     */
    function export_raw(name, data) {
        var time = new Date();
        var filename = time.toLocaleDateString();
        var data = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title></title></head><body>' + data + '</body></html>';
        var urlObject = window.URL || window.webkitURL || window;
        var export_blob = new Blob([data]);
        var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
        save_link.download = name + filename + '.html';
        //  IE不支持createObjectURL，使用自带方法window.navigator.msSaveOrOpenBlob
        if('msSaveOrOpenBlob' in navigator){
            // Microsoft Edge and Microsoft Internet Explorer 10-11
            window.navigator.msSaveOrOpenBlob(export_blob, save_link.download);
        }else{
            // standard code for Google Chrome, Mozilla Firefox etc
            save_link.href = urlObject.createObjectURL(export_blob);
            
            fake_click(save_link);
        }
    }
    function fake_click(obj) {
        var ev = document.createEvent("MouseEvents");
        ev.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0
            , false, false, false, false, 0, null
        );
        obj.dispatchEvent(ev);
    }

    /**
     * @function 将时间戳转化为小时+分+秒
     * @param {Date} 时间戳
     * @return {String} 时间字符串
     */
    function formatTime(longTime) {
        //转化为 小时+分+秒
        var time = parseFloat(longTime);
        var h,
            m,
            s
        if (time != null && time != "" || time == 0) {
            if (time < 60) {
                h = "00";
                m = "00";
                s = format(time);
            } else if (time >= 60 && time < 3600) {
                h = "00";
                m = format(parseInt(time / 60));
                s = format(parseInt(time % 60));
            } else if (time >= 3600 && time < 86400) {
                h = format(parseInt(time / 3600));
                m = format(parseInt(time % 3600 / 60));
                s = format(parseInt(time % 3600 % 60 % 60));
            } else if (time >= 86400) {
                h = "24";
                m = "00";
                s = "00";
            }
            time = h + ":" + m + ":" + s;
        }
        return time;
    }

    function formatSecondToHour(longTime) {
        if (longTime > 86400) {
            var days = parseInt(longTime / 86400);
            var hours = days * 24;
            var time_reduceH = longTime % 86400;
            var time_1 = formatTime(time_reduceH);
            return parseInt(time_1.split(':')[0]) + hours + time_1.slice(2);
        }
        else {
            return formatTime(longTime);
        }
    }

    function format(time) {
        if (time < 10) {
            return "0" + time;
        } else {
            return time;
        }
    }
   

    /**
     * 计算使用量百分比
     * @param used
     * @param totle
     * @returns {string}
     */
    function usage(used, totle) {
        var spl1 = used.split(/[a-z|A-Z]+/gi);
        var spl2 = totle.split(/[a-z|A-Z]+/gi);
        return Math.round(Number(spl1[0]) / Number(spl2[0]) * 10000) / 100.00 + "%";
    }
      /**
     * 计算在线时长百分比
     * @param dur
     * @param total
     * @returns {string}
     */
    function usage_duration(dur, total) {
        return dur / total * 10000 / 100.00 + "%";
    }

})