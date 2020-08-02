define(function (require, exports, module) {

    /**
     * 声明依赖的所有模块
     */
    var templates = require('common/templates'),
        config = require('common/config'),
        util = require('common/util'),
        crud = require('common/crud'),
        toast = require('common/toast'),
        layoutDialog = require('pages/layout/list_dialog'),
        programCtrl = require('pages/channel/program'),
        layoutEditor = require('common/layout_editor'),
        getClassAndTerm = require('pages/terminal/getTermClassAndTerm.js');

    /**
     * 全局配置
     */
    var projectName = config.projectName,
        requestUrl = config.serverRoot,
        db = null,
        channelId = null,
        programHandle = null,
        widgetId = null,
        languageJSON = config.languageJson.channel,
        channel = null;

    exports.adChannelName;
    /**
     * 页面入口
     */
    exports.init = function () {
        programHandle = null;
        channelId = null;
        window.onpopstate = function () {
            onCloseEditor();
            window.onpopstate = undefined;
        };
        var _programid = Number(util.getHashParameters().id);
        loadWidgetData(isNaN(_programid) ? null : _programid);
    };

    //获取离线包状态
    function loadAdChannel() {
        //  已存在离线包信息，直接渲染
        let adChannel = localStorage.getItem('adChannel')
        if(adChannel) {
            channel = JSON.parse(adChannel)
            console.log("已存在离线包信息",channel)
            renderOffline(channel)
            return
        }
        console.log("不存在离线包信息，重新获取")
        //  不存在离线包信息，重新获取
        var pager = {
            page: 1,
            per_page: 1,
            keyword: '',
        };
        var data = JSON.stringify({
            action: 'query',
            project_name: projectName,
            id: localStorage.getItem('chnid'),
            pager: pager
        });
        util.ajax('post', requestUrl + '/backend_mgt/advertisement_channel', data, function(json){
            if(json.adv_cs.length > 0){
                console.log(json.adv_cs[0])
                channel = json.adv_cs[0]
                renderOffline(channel)
            } else {
                console.log('未找到匹配的广告频道',localStorage.getItem('adChannelName'))
            }
        });
    }

    //  展示离线包信息
    function renderOffline(channel){
            let statusHtml = ''
            switch (channel.status)
            {
                case 1:
                    statusHtml = languageJSON.offline+' <span class="label label-warning">' + languageJSON.pendingProd + '</span>';
                    break;
                case 2:
                    statusHtml = languageJSON.offline+' <span class="label label-primary">' + languageJSON.producing + '</span>';
                    break;
                case 3:
                    statusHtml = languageJSON.offline+' <span class="label label-success">' + languageJSON.prodSuc + '</span>';
                    $(document).find('.download-offline').removeAttr("disabled").show()
                    break;
                case 4:
                    statusHtml = languageJSON.offline+' <span class="label label-danger">' + languageJSON.prodFaild + '</span>';
                    break;
                default:
                    statusHtml = languageJSON.offline+' <span class="label label-warning">' + languageJSON.prodBefore + '</span>';
            }
            $(document).find('.offline-status').html(statusHtml).show()
            $(document).find('.btn-export-offline').show()
    }



    function bindEvent() {
        $('.btn-channel-editor-close').on('click', function () {
            onBackList();
        });
        $('.mDatepicker').datepicker({
            autoclose: true,
            endDate: "+0d",
        })
        $('.mDatepicker').on('change', function () {
            if ($('.expand-page').hasClass('expanded')) {
                renderList();
            } else {
                $('#open_expand').trigger('click');
            }
        })
        $('#open_expand').on('click', function () {
            $('.expand-page').toggleClass('expanded');
            $('#open_expand').toggleClass('expanded_i');
            if (!$('.expand-page').hasClass('expanded')) {
                $('.resChart').children().empty();
            } else {
                setTimeout(function () {
                    //renderChart();
                    renderList();
                }, 1000)
            }
        })
        $('.btn-export-offline').on('click', function () {
            if (confirm(languageJSON.cf_exportOffline)) {
                var data = JSON.stringify({
                    action: 'offline',
                    project: projectName,
                    id: [channel.id]
                });
                util.ajax('post', requestUrl + '/backend_mgt/v2/channels/', data, function (res) {
                    if (Number(res.rescode) == 200) {
                        alert(languageJSON.al_exporting)
                        loadAdChannel()
                    } else {
                        alert(languageJSON.al_exportFaild);
                    }
                });
            }
        })
        $('.download-offline').on('click', function () {
            var url = channel.url;
	        window.open(url);
        })

    }


    /***************** get channel data ****************/

    function loadWidgetData(programid) {
       var data = JSON.stringify({
                Action: 'GetControlBoxs',
                Project: projectName,
                ProgramID: programid
            });
        util.ajax('post', requestUrl + '/backend_mgt/v2/programs', data, function (res) {
            if (Number(res.rescode) !== 200) {
                return;
            }
            var layout = parseLayoutData(res.Layout);
            var widgets = res.ControlBoxs.map(parseWidgetData);
           
            renderProgramView(layout, widgets);
            renderEditor(layout, widgets);

            var _widgets = widgets.filter(function (v) {
                return v.type_id > 7;
            })
            loadMaterialData(_widgets[0]);
            loadWidgetHeader(_widgets[0]);
            loadDateSlots(_widgets[0]);

        });
    }

    function loadMaterialData(widget) {
        var deferred = $.Deferred(),
            data = JSON.stringify({
                action: 'query_adv_pl',
                project_name: projectName,
                control_box_id: widget.id || widget.mId
            });
        util.ajax('post', requestUrl + '/backend_mgt/advertisement_channel', data, function (res) {
            if (Number(res.rescode) !== 200) {
                deferred.reject(res);
                return;
            }
            var materials = res.adv_pls;
            renderPlsList(materials);
            deferred.resolve();
        });
        return deferred.promise();
    }

    function loadDateSlots(widget) {
        var data = JSON.stringify({
            action: 'query_date',
            project_name: projectName,
            control_box_id: widget.id || widget.mId,
            publish_id: Number(localStorage.getItem('publishid')) || '',
            priority: Number($('#plsPriority').val()) || 0,
        });
        util.ajax('post', requestUrl + '/backend_mgt/advertisement_channel', data, function (res) {
            if (res.rescode == 200) {
                var dataSlots = res.date_slots;
                $('#plsDateSlots').empty().hide();
                if (dataSlots.length > 0) {
                    dataSlots.map(function (v) {
                        var sOptions = '<option>';
                        var _option = v.start_date + ' - ' + v.end_date;
                        var aOption = sOptions + _option + '</option>';
                        $('#plsDateSlots').append(aOption);
                    })
                    $('#plsDateSlots').show();
                    bindSelectEvents();
                   $('#plsDateSlots').trigger('change');
                //    var _widget = {};
                //    var dateArray = $('#plsDateSlots').val()&&$('#plsDateSlots').val().split(' - ');
                //    _widget.start_date = dateArray[0] + ' 00:00:00';
                //    _widget.end_date = dateArray[1] + ' 00:00:00';
                //    _widget.publishid = Number(localStorage.getItem('publishid'));
                //    _widget.control_box_id =  widget.id || widget.mId;
                //    _widget.priority = Number($('#plsPriority').val());
                //    renderRealPls(_widget);
                }else{
                    bindSelectEvents();
                    $('#plsDateSlots').show()
                    $('#plsList').empty().append('<h5 style="text-align:center;color:grey;">暂无播单数据</h5>');
                }

            }
        })


    }

    function bindSelectEvents() {
        $('#plsDateSlots').off('change').on('change', function () {
            var dateArray = $(this).val()&&$(this).val().split(' - ');
            var obj = {};
            obj.start_date = dateArray[0] + ' 00:00:00';
            obj.end_date = dateArray[1] + ' 00:00:00';
            obj.publishid = Number(localStorage.getItem('publishid'));
            obj.control_box_id = Number($('#mtrCtrl_Title').attr('widget_id'));
            obj.priority = Number($('#plsPriority').val());
            renderRealPls(obj);
        })

        $('#plsPriority').off('change').on('change', function () {
            var obj = {}, widget={};
            var dateArray = $('#plsDateSlots').val()&&$('#plsDateSlots').val().split(' - ');
            widget.id = Number($('#mtrCtrl_Title').attr('widget_id'));
            if(!dateArray){
                loadDateSlots(widget);
                return;
            } 
            obj.start_date = dateArray[0] + ' 00:00:00';
            obj.end_date = dateArray[1] + ' 00:00:00';
            obj.publishid = Number(localStorage.getItem('publishid'));
            obj.control_box_id = Number($('#mtrCtrl_Title').attr('widget_id'));
            obj.priority = Number($(this).val());
            widget.id = Number($('#mtrCtrl_Title').attr('widget_id'));
            loadDateSlots(widget);
            //renderRealPls(obj);
        })
    }

    function renderRealPls(obj) {
        $('#plsList').empty();
        var data = JSON.stringify({
            "project_name": projectName,
            "action": "query_real_pl",
            "control_box_id": obj.control_box_id,
            "publish_id": obj.publishid,
            "priority": obj.priority,
            "start_date": obj.start_date,
            "end_date":obj.end_date,
        })
        util.ajax('post', requestUrl + '/backend_mgt/advertisement_channel', data, function (res) {
            if (res.rescode == 200) {
                var realPls = res.real_pls;
                realPls.map(function (v, i) {
                    var sTime = v.TimeSegment_Start;
                    var eTime = v.TimeSegment_End;
                    var occu = (Number(v.Occupancy) * 100).toFixed(2) + '%';
                    $('#plsList').append('<ul class=seq_'+ i +'>' +
                        '<li class="plsHeader"><span>开始时间: ' + sTime + '</span><span>结束时间: ' + eTime + '</span><span>满刊率: ' + occu+'</span></li>'+
                        '</ul>');
                    var sources = v.Source.SubSources;
                    sources.map(function (val,index) {
                        var _duration = '';
                        var _index = index + 1;
                        if(typeof(val.Duration) == 'string'){
                            _duration = val.Duration;
                        }else{
                            var duration = Number(val.Duration);
                            _duration = convertTime(duration);
                        }
                        $('.seq_' + i).append('<li><span>' + _index+'</span><span title='+val.Name+'>' + val.Name + '</span><span>' + _duration+'</span></li>');
                    })
                })
                
            }
        });
    }

    function renderPlsList(data) {
        $('.channel-program-list ol').empty();
        data.map(function (v) {
            $('.channel-program-list ol').append('<li typeid=' + v.material_type_id +'>' +
                '<a href="#channel/adEdit?id='+v.id+'">' + v.name + '</a>' +
                '</li>');
        })

        $('.channel-program-list ol a').on('click', function () {
            var mtrType = $(this).parent('li').attr('typeid') == 1 ? 'Video' : 'Image';
            localStorage.setItem('mtrType', mtrType);
        })

    }

    function renderProgramView(layout, widgets) {
        var data = {
            name: localStorage.getItem('adChannelName'),
                lifetime_start: '1970-01-01 00:00:00'.replace(' ', 'T'),
                lifetime_end: '2030-01-01 00:00:00'.replace(' ', 'T'),
                count: '',
                layout: {
                    name: layout.name,
                    width: layout.width,
                    height: layout.height
                },
                language: {
                    previewProgram: languageJSON.previewProgram,
                    exportOffline: languageJSON.exportOffline,
                    download: languageJSON.download,
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

        $('#edit-page-container')
            .html(templates.channel_edit_adprogram(data))
            .removeClass('none');
        $('.sidebar-mini').css('overflow-y','hidden')
        $('#channel-editor-wrapper .channel-program-editor')
            .html(''+templates.channel_edit_program(data));

        modifyPage();

        bindEvent();
        //  获取离线包状态
        loadAdChannel();
    }

    function renderEditor(layout, widgets) {
        var widgetArray = [];
        widgets.map(function (v, i) {
            i == 0 ? widgetId = v.id : '';
        });
        var json = {
            id: '',
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
            } : { type: 'Unknown' },
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
        widgetArray.push(editor.mLayout.mWidgets);
        for (var i = editor.mLayout.mWidgets.length - 1; i >= 0; i--) {
            var widget = editor.mLayout.mWidgets[i],
                _data = {
                    id: widget.mId,
                    name: widget.mTypeName,
                    background_color: widget.mBackgroundColor
                };
            $('#channel-editor-wrapper .channel-program-layout-footer>ul').append(templates.channel_edit_widget_item(_data));
        }
        //$('#channel-editor-wrapper .channel-program-layout-footer>ul>li:eq(0)').css("border", "1px solid rgb(60, 141, 188)");

        editor.onFocusChanged(function () {
            var focusedWidget = this.getLayout().getFocusedWidget();
            var wType = focusedWidget.mType;
            if (wType != 'AdImageBox' && wType != 'AdVideoBox') {
                this.getLayout().mFocusMask.style.border = 'none';
                return;
            }
            
            if (focusedWidget) {
                var _widgetId = focusedWidget.mId;
                if (_widgetId !== widgetId) {
                    widgetId = _widgetId;
                    var thisWidget = null;
                    widgetArray.filter(function (v) {
                        v.filter(function (_v) {
                            _v.mId == _widgetId ? thisWidget = _v : '';
                        })
                    })
                    onSelectWidget(thisWidget)
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

        // 渲染列表
    }

    function parseWidgetData(data) {
        return {
            id: data.ID,
            program_template_id: data.Program_ID,
            type_id: data.ControlBox_Type_ID,
            layout_widget_id: 0,
            type: data.ControlBox_Type,
            type_name: data.ControlBox_Type_Name,
            material: data.ControlBox_Material,
            width: data.Width,
            height: data.Height,
            left: data.Left,
            top: data.Top,
            overall_schedule_params: data.Overall_Schedule_Paras,
            overall_schedule_type: data.Overall_Schedule_Type,
            style: data.Style,
            z_index: data.Z
        };
    }

    function parseLayoutData(data) {
        return {
            name: data.Name,
            name_eng: data.Name_eng,
            width: data.Width,
            height: data.Height,
            top_margin: data.TopMargin,
            left_margin: data.LeftMargin,
            right_margin: data.RightMargin,
            bottom_margin: data.BottomMargin,
            background_color: data.BackgroundColor,
            background_image_mid: data.BackgroundPic_MID,
            background_image_url: data.BackgroundPic_URL,
            download_auth_type: data.Download_Auth_Type
        };
    }

    function onSelectWidget(widget) {
        $('.channel-program-layout-footer li').css("border", "solid 1px #ddd");     //初始化下方边框
        $('.channel-program-layout-footer li').each(function () {
            if ($(this).attr("data-id") == widget.mId) {
                $(this).css("border", "solid 1px #3c8dbc");
            }
        });
        $('#plsList').empty();
        loadMaterialData(widget);
        loadWidgetHeader(widget);
        loadDateSlots(widget);

    }

    function loadWidgetHeader(widget) {
        $("#widget_attribute").empty();
        var wleft = widget.left == undefined ? widget.mLeft : widget.left;
        var wtop = widget.top == undefined ? widget.mTop : widget.top;
        var wwidth = widget.width == undefined ? widget.mWidth : widget.width;
        var wheight = widget.height == undefined ? widget.mHeight : widget.width;
        var widgetColor = '';

        var wtype = widget.type || widget.mType;
        switch (wtype) {
            case 'VideoBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle1);
                break;
            case 'ImageBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle2);
                break;
            case 'AudioBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle3);
                break;
            case 'WebBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle4);
                break;
            case 'ClockBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle5);
                break;
            case 'WeatherBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle6);
                break;
            case 'OfficeBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle7);
                break;
            case 'AdVideoBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle8);
                break;
            case 'AdImageBox':
                $("#mtrCtrl_Title").html(languageJSON.ctrTitle9);
                break;
        }
        $(".channel-program-layout-footer ul li").each(function () {
            if ($(this).attr("data-id") == (widget.mId || widget.id)) {
                widgetColor = $(this).find("i").css("background-color");
            }
        })
        $("#mtrCtrl_Title").prev().css("background-color", widgetColor);
        $("#mtrCtrl_Title").attr("widget_id", widget.id || widget.mId);
        $("#widget_attribute").append('<label>' + languageJSON.left + '：' + wleft + '</label><label>' + languageJSON.top + '：' + wtop + '</label><label>' + languageJSON.size + '：' + wwidth + '×' + wheight + '</label>');
    }


    function modifyPage() {
        $('.direct-name-003-hint, .channel-program-timer, .btn-channel-preview, .btn-channel-editor-save').hide();
        var page = "resources/pages/channel/widgetPls.html";
        //$('.channel-program-widget').load(page);
        var _widgetPls = $('.widgetPls').clone();
        $('.widgetPls').remove();
        $('.channel-program-widget').empty().append(_widgetPls);
        $('.widgetPls').show();
    }

    function convertTime(time) {
        var _t1 = Math.floor(time / 60);
        var _t2 = time % 60;
        var cTime = '';
        if (_t1 < 1) {
            cTime = _t2 < 10 ? '00:0' + _t2 : '00:' + _t2;
        } else if (_t1 >= 1 && _t1 < 10) {
            cTime = _t2 < 10 ? '0' + _t1 + ':' + '0' + _t2 : '0' + _t1 + ':' + _t2;
        }else {
            cTime = _t2 < 10 ? _t1 + ':0' + _t2 : _t1 + ':' + _t2;
        }
        return cTime;
    }
    
    /**
     * 关闭页面的回调函数
     */
    function onCloseEditor() {
        $('#edit-page-container')
            .empty()
            .addClass('none');
        $('.sidebar-mini').css('overflow-y','auto')
        if (programHandle) {
            programHandle.send('program.reset', null);
        }
        window.onpopstate = undefined;
    }

    function onBackList() {
        localStorage.setItem('fromProgram','ads');
        //location.hash = '#channel/list';
       // localStorage.removeItem('publishid');
       $('#edit-page-container').empty().addClass('none');
       $('.sidebar-mini').css('overflow-y','auto')
        localStorage.removeItem('adChannelName');
        localStorage.removeItem('adChannel');
        localStorage.removeItem('chnid');
        window.history.go(-1);
    }


    //资源播放次数统计

    function renderList() {
        $('.resChart').children().empty();
        var dateArray = $('.mDatepicker').val().split('/');
        if (dateArray.length < 3) return;
        var _date = dateArray[2] + '-' + dateArray[0] + '-' + dateArray[1] + ' 00:00:00';
        var data = JSON.stringify({
            action: 'get_play_count_day',
            project_name: projectName,
            date: _date,
            term_id: localStorage.getItem('term_id') || ''
        });
        util.ajax('post', requestUrl + '/backend_mgt/term_statis', data, function (res) {
            if (res.rescode == 200) {
                var len = res.statis.length, _li = '';
                if(!len){
                    var _h3 = '<h3>该日期无播放记录！</h3>';
                    $('.resChart').append(_h3);
                    return;
                }
                for (var i = 0; i < len; i++) {
                    _li += '<li><label>' + res.statis[i].name + '</label><span>' + res.statis[i].count +'次</span></li>';
                }
                $('.resChart ul').append(_li);
            }else{
                var _h3 = '<h3>该日期无播放记录！</h3>';
                $('.resChart').append(_h3);
            }
        })
    }
});