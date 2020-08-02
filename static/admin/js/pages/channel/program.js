define(function (require, exports, module) {
    'use strict';

    var templates = require('common/templates'),
        config = require('common/config'),
        util = require('common/util'),
       crud = require('common/crud'), 
        durationInput = require('common/duration_input'),
        layoutEditor = require('common/layout_editor'),
        timer = require('pages/channel/timer'),
		toast = require('common/toast');

    var db = null,
        programId = null,
        layoutId = null,
        editor = null,
        editMode = false,
        widgetId = null,
        container = null;
    var languageJSON = config.languageJson.channel;

    //载入
    function load(program, _container) {
        container = _container;
        editor = null;
        editMode = false;
        if (!program) {
            $('#channel-editor-wrapper .channel-program-editor').html(languageJSON.nolayout + '!');
            return;
        }
        db = crud.Database.getInstance();
        programId = program.id;
        layoutId = program.layout_id;
        initProgramView();
    }

    function initProgramView() {
        CWdefault(programId);
        var program = db.collection('program').select({id: programId})[0],
            layout = db.collection('layout').select({id: layoutId})[0],
            widgets = db.collection('widget').select({program_id: programId});
        renderProgramView(program, layout, widgets);
        registerEventListeners();
        
    }

    function renderProgramView(program, layout, widgets) {
        var p = program.schedule_params === '' ? {} : JSON.parse(program.schedule_params),
            duration = typeof p.duration === 'number' ? p.duration : 0,
            data = {
                name: program.name,
                type: program.schedule_type,
                lifetime_start: program.lifetime_start.replace(' ', 'T'),
                lifetime_end: program.lifetime_end.replace(' ', 'T'),
                count: p.count,
                layout: {
                    name: layout.name,
                    width: layout.width,
                    height: layout.height
                },
                language: {
                    previewProgram: languageJSON.previewProgram,
                    prompt1: languageJSON.prompt1,
                    strarTime: languageJSON.strarTime,
                    endTime: languageJSON.endTime,
                    timingTrigger: languageJSON.timingTrigger,
                    playDuration: languageJSON.playDuration,
                    playTime: languageJSON.playTime,
                    Layout: languageJSON.layout,
                    width: languageJSON.width,
                    height: languageJSON.height,
                    loading: languageJSON.loading,
                }
            };
            // console.log('节目属性')
            // console.log(data)
            // console.log('节目参数属性')
            // console.log(p)
        $('#channel-editor-wrapper .channel-program-editor')
            .html(templates.channel_edit_program(data));

        // 设置日期时间组件
        layui.use('laydate', function () {
            var laydate = layui.laydate;

            laydate.render({
                elem: '#startTime_input',
                type: 'datetime',
                value: new Date(data.lifetime_start),
                done: function (value, date, endDate) {
                    $("#startTime_input").val(value)
                    $("#startTime_input").trigger("change")
                }
            });
            
            laydate.render({
                elem: '#endTime_input',
                type: 'datetime',
                value:new Date(data.lifetime_end),
                done: function (value, date, endDate) {
                    $("#endTime_input").val(value)
                    $("#endTime_input").trigger("change")
                }
            });

            laydate.render({
                elem: '#startTime_input0',
                type: 'datetime',
                value: new Date(data.lifetime_start),
                done: function (value, date, endDate) {
                    $("#startTime_input0").val(value)
                    $("#startTime_input0").trigger("change")
                }
            });
            
            laydate.render({
                elem: '#endTime_input0',
                type: 'datetime',
                value:new Date(data.lifetime_end),
                done: function (value, date, endDate) {
                    $("#endTime_input0").val(value)
                    $("#endTime_input0").trigger("change")
                }
            });
        })

        new durationInput.DurationInput({
            onChange: onDurationChange,
            duration: duration,
            element: $('#channel-editor-wrapper .program-duration-container')[0]
        });
        $('#channel-editor-wrapper .program-duration-container')
            .find('.duration-input-hidden')
            .addClass('program-duration-hidden');
        var trigger = JSON.parse(program.schedule_params);
        if (!trigger.trigger) {
            trigger.trigger = '0 0 0 * * * *';
        }
        updateTimer(trigger.trigger);
        //  触控节目-触发方式
        if(p.type){
            $("#touchType").val(p.type)
        }
        // var timerType = 'timed';
        // if (program.schedule_type !== 'Timed') {
        //     var params = JSON.parse(db.collection('channel').select({})[0].overall_schedule_params);
        //     if (params.Type === 'Percent') {
        //         timerType = 'percent';
        //     } else {
        //         timerType = '';
        //     }
        // }
        checkPage();
        // updateProgramSchedule(timerType);
        updateProgramSchedule(program.schedule_type);
        renderEditor(layout, widgets);
        var w = editor.mLayout.getFocusedWidget();
        if (w) {
            w = db.collection('widget').select({id: w.mId})[0];
            widgetId = w.id;
        } else {
            w = null;
        }
        loadWidget(w);
    }
    
    function onDurationChange(duration) {
        console.log(duration)
        var schedule_params = JSON.parse(db.collection('program').select({id: programId})[0].schedule_params),
            params = {};
        if (typeof schedule_params.trigger !== 'string') {
            params.trigger = '0 0 0 * * * *';
        } else {
            params.trigger = schedule_params.trigger;
        }
        if (typeof schedule_params.count !== 'number') {
            params.count = 1;
        } else {
            params.count = schedule_params.count;
        }
        if (typeof schedule_params.type !== 'string') {
            params.type = 'click';
        } else {
            params.type = schedule_params.type;
        }
        params.duration = duration;
        db.collection('program').update({schedule_params: JSON.stringify(params)}, {id: programId});
    }


    function loadWidget(widget) {
        //console.log(widget);
        //资源控件页面加载
		var page = "resources/pages/channel/mtrCtrl.html";
		$(".channel-program-widget").load(page);
        localStorage.setItem('currentWidget', JSON.stringify(widget));
    }

    function renderEditor (layout, widgets) {

        widgets.sort(function (a, b) {
            return a.z_index - b.z_index;
        });
        var json = {
                id: layout.id,
                name: layout.name,
                nameEng: layout.name_eng,
                width: layout.width,
                height: layout.height,
                topMargin: layout.top_margin,
                leftMargin: layout.left_margin,
                rightMargin: layout.right_margin,
                bottomMargin: layout.bottom_margin,
                backgroundColor: layout.background_color,
                backgroundImage: layout.background_image_url ? {
                    type: 'Image',
                    url: layout.background_image_url,
                    download_auth_type: layout.download_auth_type
                } : {type: 'Unknown'},
                widgets: widgets.map(function (el) {
                    return {
                        top: el.top,
                        left: el.left,
                        width: el.width,
                        height: el.height,
                        id: el.id,
                        type: el.type,
                        typeName: el.type_name
                    };
                })
            };

        var canvas = $('#channel-editor-wrapper .channel-program-layout-body'),
            canvasHeight = canvas.height(),
            canvasWidth = canvas.width();
        editor = new layoutEditor.LayoutEditor(json, canvasWidth, canvasHeight, false);

        editor.attachToDOM(canvas[0]);
        for (var i = editor.mLayout.mWidgets.length - 1; i >= 0; i--) {
            var widget = editor.mLayout.mWidgets[i],
                _data = {
                    id: widget.mId,
                    name: widget.mTypeName,
                    background_color: widget.mBackgroundColor
                };
            $('#channel-editor-wrapper .channel-program-layout-footer>ul').append(templates.channel_edit_widget_item(_data));
        }
        $('#channel-editor-wrapper .channel-program-layout-footer>ul>li:eq(0)').css("border", "1px solid rgb(60, 141, 188)");

    }

    function showPreview(editor) {
        var data = {}, style;
        db.collection('widget').select({program_id: programId}).forEach(function (w) {
            var materials = db.collection('material').select({widget_id: w.id}),
                material;
            if (materials.length === 0) {
                material = {
                    download_auth_type:'',
                    url: ''
                };
            } else {
                var min = 0
                for (var a = 0; a < materials.length; a++) {
                    if (materials[min].sequence > materials[a].sequence) {
                        min = a;
                    }
                }
                material = materials[min];
            }
            switch (w.type) {
                case 'AudioBox':
                    data[w.id] = {download_auth_type: material.download_auth_type, material: material.url};
                    break;
                case 'VideoBox':
                    data[w.id] = {download_auth_type: material.download_auth_type, material: material.url};
                    break;
                case 'WebBox':
                    style = w.style === '' ? {} : JSON.parse(w.style);
                    var mtrData;
                    var Data = JSON.stringify({
                        "Project": config.projectName,
                        "Action": "GetCheckText"
                    })
                    util.ajax2(
                        'POST',
                        config.serverRoot + '/backend_mgt/v1/webmaterials/'+material.resource_id,
                        Data,
                        function(data){
                            mtrData = data;
                        },'text'
                    )
                    if (style.Type === 'Marquee') {
                        style = {
                            type: style.Type,
                            color: style.TextColor,
                            direction: style.ScrollDirection,
                            speed: Number(style.ScrollSpeed),
                            backgroundColor: style.BackgroundColor
                        };
                        var domFont = $(mtrData).find('span')[0] ? $(mtrData).find('span')[0].style.fontSize : null;
                        style.fontSize=domFont?domFont:'20px'
                        mtrData = mtrData.replace(/<\/?.+?>/g,"")
                    } else if(style.Type === 'Normal'){
                        style = {
                            type: style.Type,
                            RefrashType: $("#mtrC-selsect-normalType").val(),
                            speed: $("#mtrC-selsect-normalScrollSpeed").val(),
                            pageDownPeriod: Number($("#mtrC_pageDownPeriod").val()),
                            backgroundColor: $("#text_bgcolor").val(),
                        };
                    } else {
                        style = {
                            type: style.Type,
                            pageDownPeriod: Number($("#mtrC_pageDownPeriod").val()),
                            backgroundColor: $("#text_bgcolor").val()
                        };
                    }
                    data[w.id] = {material: mtrData, style: style};
                    break;
                case 'ClockBox':
                    style = w.style === '' ? {} : JSON.parse(w.style);
                    data[w.id] = {material: w.material, style: style};
                    break;
                case 'WeatherBox':
                    style = w.style === '' ? {} : JSON.parse(w.style);
                    data[w.id] = {material: w.material, style: style};
                    break;
                case 'ImageBox':
                    data[w.id] = {download_auth_type: material.download_auth_type, material: material.url};
                    break;
                case 'OfficeBox':
                    //var _url = previewOfficeBox(material.resource_id);
                    var url_office = '';
                    var _data = JSON.stringify({
                        project_name: config.projectName,
                        action: "getone",
                        officeid: material.resource_id
                    })
                    var _url = config.serverRoot + '/backend_mgt/v2/officeaction/';
                    util.ajax2('post', _url, _data, function (msg) {
                        url_office = msg[0];
                    }, 'JSON')
                    //data[w.id] = {download_auth_type: material.download_auth_type, material: material.url};
                    data[w.id] = { download_auth_type: 'None', material: url_office };
                    break;
                case 'AdVideoBox':
                    data[w.id] = { download_auth_type: material.download_auth_type, material: material.url };
                    break;
                case 'AdImageBox':
                    data[w.id] = { download_auth_type: material.download_auth_type, material: material.url };
                    break;
            }
        });
        editor.showPreview(data);
    }

    function registerEventListeners () {
        messageDispatcher.reset();
        container.subscribeEvent(messageDispatcher);
        messageDispatcher.on('channel_overall_schedule_params.change', function (data) {
            $('#channel-editor-wrapper .channel-program')
                .toggleClass('percent-channel', data === 'Percent');
        });
        messageDispatcher.on('program.reset', function () {
            editor && editor.destroy();
        });

        editor.onFocusChanged(function () {
            var focusedWidget = editor.getLayout().getFocusedWidget();
            if (focusedWidget) {
                var _widgetId = focusedWidget.mId;
                if (_widgetId !== widgetId) {
                    widgetId = _widgetId;
                    onSelectWidget(db.collection('widget').select({id: _widgetId})[0]);
                }
            } else {
                onSelectWidget(null);
            }
        });
        $('#channel-editor-wrapper .channel-program-layout-footer li').click(function () {
            $('#channel-editor-wrapper .channel-program-layout-footer li').css("border", "solid 1px #ddd");
            $(this).css("border", "solid 1px #3c8dbc");
            var widgetId = Number(this.getAttribute('data-id')), widgets = editor.mLayout.mWidgets;
            for (var i = 0; i < widgets.length; i++) {
                if (widgets[i].mId === widgetId) {
                    widgets[i].requestFocus();
                }
            }
        });
        $('#channel-editor-wrapper .btn-channel-preview').click(function () {
            if (!editMode) {
				//toast.show('温馨提示：当前预览是您最后一次保存的内容');
                showPreview(editor);
                editMode = true;
                $(this).children('i')
                    .addClass('fa-stop')
                    .removeClass('fa-play-circle-o');
                $(this).get(0).lastChild.nodeValue = ' ' + languageJSON.cancelPreview ;
                $(this).attr("is_preview","true");
            } else {
                editor.hidePreview();
                editMode = false;
                $(this).children('i')
                    .removeClass('fa-stop')
                    .addClass('fa-play-circle-o');
                $(this).get(0).lastChild.nodeValue = ' ' + languageJSON.previewProgram;
                $(this).attr("is_preview","false");
            }
        });
        $('#channel-editor-wrapper .btn-channel-setup-timer').click(function () {
            var scheduleStr = JSON.parse(db.collection('program').select({id: programId})[0].schedule_params);
            scheduleStr = scheduleStr.trigger ? scheduleStr.trigger : '0 0 0 * * * *';
            var instance = new timer.Timer(timer.Timer.decode(scheduleStr));
            instance.open(0,function (data) {
                console.log(data)
                var p = JSON.parse(db.collection('program').select({id: programId})[0].schedule_params);
                p.trigger = data;
                db.collection('program').update({schedule_params: JSON.stringify(p)}, {id: programId});
                updateTimer(data);
            });
        });
        $('#channel-editor-wrapper .channel-program-header input').change(onProgramEdit);
        $('#channel-editor-wrapper .channel-program-timer input,#channel-editor-wrapper .channel-program-timer select').change(onProgramEdit);
    }

    function onProgramEdit() {          //频道保存到缓存
        var programName = $('#channel-editor-wrapper .channel-program-header input').val(); //改节目名时修改节目列表的名字
        $(".program-list-item.selected").find("span").text(programName);

        var field = this.getAttribute('data-field'),
            updates = null, value;
        switch (field) {
            case 'name':
                updates = {name: this.value};
                break;
            case 'lifetime_start':
                if (this.type === 'date') {
                    value = this.value + 'T00:00:00';
                } else {
                    value = this.value;
                }
                updates = {lifetime_start: value.replace('T', ' ')};
                break;
            case 'lifetime_end':
                if (this.type === 'date') {
                    value = this.value + 'T00:00:00';
                } else {
                    value = this.value;
                }
                updates = {lifetime_end: value.replace('T', ' ')};
                break;
            case 'count':
                var schedule_params = JSON.parse(db.collection('program').select({id: programId})[0].schedule_params);
                var params = {};
                params.count = parseInt(this.value);
                if (typeof schedule_params.trigger !== 'string') {
                    params.trigger = '0 0 0 * * * *';
                } else {
                    params.trigger = schedule_params.trigger;
                }
                if (typeof schedule_params.duration !== 'number') {
                    params.duration = 60;
                } else {
                    params.duration = schedule_params.duration;
                }
                updates = {schedule_params: JSON.stringify(params)};
                break;
            case 'touchType':
                var schedule_params = JSON.parse(db.collection('program').select({id: programId})[0].schedule_params);
                var params = {};
                params.type = (this.value);
                console.log('触发方式：'+this.value)
                if (typeof schedule_params.trigger !== 'string') {
                    params.trigger = '0 0 0 * * * *';
                } else {
                    params.trigger = schedule_params.trigger;
                }
                if (typeof schedule_params.duration !== 'number') {
                    params.duration = 60;
                } else {
                    params.duration = schedule_params.duration;
                }
                if (typeof schedule_params.type !== 'string') {
                    params.type = 'click';
                } else {
                    params.duration = schedule_params.duration;
                }
                updates = {schedule_params: JSON.stringify(params)};
                break; 
        }
        if (updates) {
            db.collection('program').update(updates, {id: programId});
            if (field === 'name') {
                messageDispatcher.send('program_name.change', {id: programId, name: this.value});
            }
        }
    }
    
    function checkPage(){
        // alert(localStorage.getItem('mtr_pro'))
        if(localStorage.getItem('mtr_pro') == '1'){
            // $($('.channel-program-timer').children()[6]).clone(true);
            $('.channel-program-timer').children().hide();
            $($('.channel-program-timer').children()[6]).show().css({
                'position': 'absolute',
                'right': '130px',
                'top': '5px'
            })

        }
    }

    function updateProgramSchedule(type) {
        //  判断节目类型，为属性容器增加class，控制不同节目属性的隐藏显示
        var timed = type === 'Timed',
            regular = type === 'Regular',
            touch = type=== 'Touch';
        $('#channel-editor-wrapper .channel-program-timer')
            .toggleClass('timed-program', timed)
            .toggleClass('channel-program', regular)
            .toggleClass('touch-program', touch);
        if($('.channel-program-schedule-type').val() == 'Percent'){
            $('#channel-editor-wrapper .channel-program').addClass('percent-channel')
        }
    }
    
    function updateTimer(str) {
        var fields = $('#channel-editor-wrapper .channel-editor-program-trigger span'),
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
        $('#channel-editor-wrapper .channel-editor-program-trigger')
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

    function onSelectWidget (widget) {
        $('.channel-program-layout-footer li').css("border", "solid 1px #ddd");     //初始化下方边框
        $('.channel-program-layout-footer li').each(function(){
            if ($(this).attr("data-id") == widget.id){
                $(this).css("border", "solid 1px #3c8dbc");
            }
        });
        loadWidget(widget);
    }

    var messageDispatcher = (function () {

        var callbacks = {};

        return {
            on: function (name, cb) {
                if (callbacks.hasOwnProperty(name)) {
                    throw new Error('event ' + name + ' has been subscribed!');
                }
                callbacks[name] = cb;
            },
            send: function (name, data) {
                typeof callbacks[name] === 'function' && callbacks[name](data);
            },
            reset: function () {
                callbacks = {};
            }
        }

    }());

    function CWdefault(programId) {
        var widgets = db.collection('widget').select({program_id: programId});
        widgets.forEach(function(el, idx, arr) {
            //时钟插件默认值
            if (el.type == "ClockBox" && el.style == "") {
                var cstyle = {
                    TextColor: "#000000",
                    Type: "Time",
                }
                db.collection("widget").update({style: JSON.stringify(cstyle)}, {id: el.id});
            }
            //天气插件默认值
            if (el.type == "WeatherBox" && el.style == "") {
                var wstyle = {
                    Type: "Normal",
                    SwitchPeriod: 10,
                    TextColor: "#000000"
                }
                db.collection("widget").update({style: JSON.stringify(wstyle)}, {id: el.id});
            }
        })
    }

    function previewOfficeBox(id) {
        var data = JSON.stringify({
            project_name: config.projectName,
            action: "getone",
            officeid: id
        })
        var _url = config.serverRoot + '/backend_mgt/v2/officeaction/';
        util.ajax('post', _url, data, function (msg) {
            var zdata = msg;
            return zdata[0];
        })
    }

    exports.load = load;

});
