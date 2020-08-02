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
        durationInput = require('common/duration_input'),
        getClassAndTerm = require('pages/terminal/getTermClassAndTerm.js');

    /**
     * 全局配置
     */
    var projectName = config.projectName,
        requestUrl = config.serverRoot,
        db = null,
        editMode = false,
        programId = null,
        channelId = null,
        programHandle = null,
        widgetId = null,
        languageJSON = config.languageJson.channel;

    exports.adChannelName;

     /**
     * 初始化数据库
     */
    function configDatabase() {
        try {
            db.rollback();
        } catch (err) {
        }
        try {
            db.drop('program');
            db.drop('layout');
            db.drop('widget');
            db.drop('material');
        } catch (err) {
        }
        db.create('program', [
            {name: 'id', type: 'number', autoIncrement: true},
            {name: 'template_id', type: 'number'},
            {name: 'is_time_segment_limit', type: 'number'},
            {name: 'layout_id', type: 'number'},
            {name: 'lifetime_start', type: 'string'},
            {name: 'lifetime_end', type: 'string'},
            {name: 'name', type: 'string'},
            {name: 'name_eng', type: 'string'},
            {name: 'schedule_params', type: 'string'},
            {name: 'schedule_type', type: 'string'},
            {name: 'sequence', type: 'number'},
            {name: 'time_segment_duration', type: 'number'},
            {name: 'time_segment_start', type: 'string'}
        ]);
        db.create('layout', [
            {name: 'id', type: 'number'},
            {name: 'background_color', type: 'string'},
            {name: 'background_image_mid', type: 'number'},
            {name: 'background_image_url', type: 'string'},
            {name: 'bottom_margin', type: 'number'},
            {name: 'download_auth_type', type: 'string'},
            {name: 'top_margin', type: 'number'},
            {name: 'left_margin', type: 'number'},
            {name: 'right_margin', type: 'number'},
            {name: 'width', type: 'number'},
            {name: 'height', type: 'number'},
            {name: 'name', type: 'string'},
            {name: 'name_eng', type: 'string'}
        ]);
        db.create('widget', [
            {name: 'id', type: 'number', autoIncrement: true},
            {name: 'program_id', type: 'number'},
            {name: 'program_template_id', type: 'number'},
            {name: 'layout_widget_id', type: 'number'},
            {name: 'layout_id', type: 'number'},
            {name: 'type_id', type: 'number'},
            {name: 'type', type: 'string'},
            {name: 'type_name', type: 'string'},
            {name: 'material', type: 'string'},
            {name: 'width', type: 'number'},
            {name: 'height', type: 'number'},
            {name: 'left', type: 'string'},
            {name: 'style', type: 'string'},
            {name: 'top', type: 'number'},
            {name: 'overall_schedule_params', type: 'string'},
            {name: 'overall_schedule_type', type: 'string'},
            {name: 'z_index', type: 'number'}
        ]);
        db.create('material', [
            {name: 'id', type: 'number', autoIncrement: true},
            {name: 'widget_id', type: 'number'},
            {name: 'is_time_segment_limit', type: 'number'},
            {name: 'lifetime_start', type: 'string'},
            {name: 'lifetime_end', type: 'string'},
            {name: 'resource_id', type: 'number'},
            {name: 'name', type: 'string'},
            {name: 'name_eng', type: 'string'},
            {name: 'schedule_params', type: 'string'},
            {name: 'schedule_type', type: 'string'},
            {name: 'sequence', type: 'number'},
            {name: 'time_segment_duration', type: 'number'},
            {name: 'time_segment_start', type: 'string'},
            {name: 'type_id', type: 'number'},
            {name: 'type_name', type: 'string'},
            {name: 'download_auth_type', type: 'string'},
            {name: 'url', type: 'string'}
        ]);
        db.beginTransaction();
    }
    /**
     * 页面入口
     */
    exports.init = function () {
        editMode = false;
        programHandle = null;
        channelId = null;
        window.onpopstate = function () {
            onCloseEditor();
            window.onpopstate = undefined;
        };
        db = crud.Database.getInstance();
        configDatabase();
        var _programid = Number(util.getHashParameters().id);
        programId = _programid,
        loadWidgetData(isNaN(_programid) ? null : _programid);
    };



    function bindEvent() {
        $('.btn-channel-editor-close').on('click', function () {
            onBackList();
        });
        $('#channel-editor-wrapper .btn-channel-editor-save').click(onSaveChannel);
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

    }
    

    function onSaveChannel() {
        toast.show(languageJSON.prompt2);
        $('#channel-editor-wrapper .btn-channel-editor-save').attr("disabled", "disabled");
        setTimeout(removeDisabled, config.letTimeout);
        remoteUpdatePrograms()
            .then(remoteUpdateWidgets)
            .then(remoteAddMaterials)
            .then(remoteUpdateMaterials)
            .then(remoteDeleteMaterials)
            .done(onSaveChannelSuccess)
            .fail(onSaveChannelFail);
    }

    function removeDisabled() {
        $('#channel-editor-wrapper .btn-channel-editor-save').removeAttr("disabled");
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

    function remoteUpdatePrograms() {
        var deferred = $.Deferred();
        var _name = $('.direct-name-003').val();
        var data = JSON.stringify({
            Project: projectName,
            Action: 'change',
            id: Number(window.location.hash.split('id=')[1]),
            Data: {
                Name: _name,
            }
        });
        util.ajax('post', requestUrl + '/backend_mgt/v2/programs/', data, function (res) {
            if (res.rescode == '200') {
                var data = JSON.stringify({
                    action: 'Put',
                    project_name: projectName,
                    Data: {
                        Name: _name,
                        duration: convertTime()
                    }
                });
                var mtrId = +localStorage.getItem('pro_mtrid');
                var url = requestUrl + '/backend_mgt/v1/materials/' + mtrId;
                util.ajax('post', url, data, function(msg){
                    if(msg.rescode == 200){
                        console.log('节目包修改成功');
                        localStorage.setItem('pro_duration',convertTime());
                        localStorage.setItem('pro_name',_name);
                        deferred.resolve();
                    }
                });
            }
        });
        return deferred.promise();
    }

    function remoteUpdateWidgets() {
        var deferred = $.Deferred(),
            changedWidgets = db.collection('widget').getLocalUpdatedRows();
        if (changedWidgets.length === 0) {
            deferred.resolve();
        } else {
            var successCount = 0, failed = false;
            changedWidgets.forEach(function (widget) {
                var data = JSON.stringify({
                    Project: projectName,
                    Action: 'Update',
                    ControlBoxID: widget.id,
                    Data: {
                        Style: widget.style,
                        Overall_Schedule_Paras: widget.overall_schedule_params,
                        Overall_Schedule_Type: widget.overall_schedule_type,
                        Z: widget.z_index,
                        ID: widget.id,
                        ControlBox_Material: widget.material,
                        Top: widget.top,
                        Left: widget.left,
                        ControlBox_Type_ID: widget.type_id,
                        ControlBox_Type_Name: widget.type_name,
                        ControlBox_Type: widget.type,
                        Program_ID: widget.program_template_id,
                        Height: widget.height,
                        Width: widget.width
                    }
                });
                util.ajax('post', requestUrl + '/backend_mgt/v1/controlboxes/' + widget.id, data, function (res) {
                    if (!failed && Number(res.rescode) !== 200) {
                        failed = true;
                        deferred.reject(res);
                        return;
                    }
                    successCount++;
                    if (successCount === changedWidgets.length) {
                        deferred.resolve();
                    }
                });
            });
        }
        return deferred.promise();
    }

    function remoteAddMaterials() {
        var deferred = $.Deferred(),
            newMaterials = db.collection('material').getLocalInsertedRows();
        if (newMaterials.length === 0) {
            deferred.resolve();
        } else {
            var successCount = 0, failed = false;
            newMaterials.forEach(function (material) {
                var data = JSON.stringify({
                        Project: projectName,
                        Action: 'AddMaterialWithID',
                        ControlBoxID: material.widget_id,
                        Data: {
                            ControlBox_ID: material.widget_id,
                            Material_ID: material.resource_id,
                            LifeStartTime: material.lifetime_start,
                            LifeEndTime: material.lifetime_end,
                            Is_TimeSegment_Limit: material.is_time_segment_limit,
                            TimeSegment_Start: material.time_segment_start,
                            TimeSegment_Duration: material.time_segment_duration,
                            Schedule_Paras: material.schedule_params,
                            Schedule_Type: material.schedule_type,
                            Sequence: material.sequence
                        }
                    }),
                    oldMaterialId = material.id;
                util.ajax('post', requestUrl + '/backend_mgt/v1/controlboxes', data, function (res) {
                    if (!failed && Number(res.rescode) !== 200) {
                        failed = true;
                        deferred.reject(res);
                        return;
                    }
                    successCount++;
                    var materialId = Number(res.ControlBox_Material_ID);
                    db.collection('material').update({id: materialId}, {id: oldMaterialId});
                    if (successCount === newMaterials.length) {
                        deferred.resolve();
                    }
                });
            });
        }
        return deferred.promise();
    }

    function remoteUpdateMaterials() {
        var deferred = $.Deferred(),
            changedMaterials = db.collection('material').getLocalUpdatedRows();
        if (changedMaterials.length === 0) {
            deferred.resolve();
        } else {
            var successCount = 0, failed = false;
            changedMaterials.forEach(function (material) {
                var data = JSON.stringify({
                    Project: projectName,
                    Action: 'UpdateMaterial',
                    Data: {
                        ID: material.id,
                        LifeStartTime: material.lifetime_start,
                        LifeEndTime: material.lifetime_end,
                        ControlBox_ID: material.widget_id,
                        Name: material.name,
                        Name_eng: material.name_eng,
                        Type_ID: material.type_id,
                        URL: material.url,
                        Type_Name: material.type_name,
                        Material_ID: material.resource_id,
                        Schedule_Type: material.schedule_type,
                        Schedule_Paras: material.schedule_params,
                        Is_TimeSegment_Limit: material.is_time_segment_limit,
                        Sequence: material.sequence,
                        TimeSegment_Start: material.time_segment_start,
                        TimeSegment_Duration: material.time_segment_duration
                    }
                });
                util.ajax('post', requestUrl + '/backend_mgt/v1/controlboxes', data, function (res) {
                    if (!failed && Number(res.rescode) !== 200) {
                        failed = true;
                        deferred.reject(res);
                        return;
                    }
                    successCount++;
                    if (successCount === changedMaterials.length) {
                        deferred.resolve();
                    }
                });
            });
        }
        return deferred.promise();
    }

    function remoteDeleteMaterials() {
        var deferred = $.Deferred(),
            deletedMaterials = db.collection('material').getLocalDeletedRows();
        if (deletedMaterials.length === 0) {
            deferred.resolve();
        } else {
            var successCount = 0, failed = false;
            deletedMaterials.forEach(function (material) {
                var data = JSON.stringify({
                    Project: projectName,
                    Action: 'DeleteMaterial',
                    ControlBox_Material_ID: material.id
                });
                util.ajax('post', requestUrl + '/backend_mgt/v1/controlboxes', data, function (res) {
                    if (!failed && Number(res.rescode) !== 200) {
                        failed = true;
                        deferred.reject(res);
                        return;
                    }
                    successCount++;
                    if (successCount === deletedMaterials.length) {
                        deferred.resolve();
                    }
                });
            });
        }
        return deferred.promise();
    }

    function onSaveChannelSuccess() {
        db.commit();
        db.beginTransaction();
        $('#channel-editor-wrapper .btn-channel-editor-save').removeAttr("disabled");

        if ($('#channel-editor-wrapper .btn-channel-editor-saveRelease').attr("release") == "true") {
            onPublishChannel();
            return;
        } else if ($('#channel-editor-wrapper .btn-channel-editor-saveSubmit').attr("audit") == "true") {
            onSubmitAudit();
        } else {
            alert(languageJSON.al_saveSuc);
        }
        if (location.hash.indexOf('?id=') === -1) {
            location.hash = '#channel/edit?id=' + channelId;
        } else {
            exports.init();
        }
        //location.reload();
        localStorage.removeItem('ch_type');
    }

    function onSaveChannelFail() {
        //db.rollback();
        $('#channel-editor-wrapper .btn-channel-editor-save').removeAttr("disabled");
        alert(languageJSON.al_saveFaild);
    }

    /***************** get channel data ****************/

    function loadWidgetData(programid) {
        var deferred = $.Deferred(), promises = [];
        var data = JSON.stringify({
                Action: 'query',
                Project: projectName,
                id: programid
            });
        util.ajax('post', requestUrl + '/backend_mgt/v2/programs', data, function (res) {
            if (Number(res.rescode) !== 200) {
                onBackList()
                deferred.reject(res);
                return;
            }
            var layout = parseLayoutData(res.Layout);
            var widgets = res.ControlBoxs.map(parseWidgetData);
            widgets.forEach(function (widget) {
                var a = 0;
                widget.layout_id = ++a;
                widget.program_id = programid;
                db.collection('widget').load(widget);
                promises.push(loadMaterialData(widget));
            });
            $.when.apply($, promises).always(function () {
                deferred.resolve();
                renderProgramView(layout, widgets);
                renderEditor(layout, widgets);
            });


        });
        return deferred.promise();
    }

    function loadMaterialData(widget) {
        var deferred = $.Deferred(),
            data = JSON.stringify({
                Action: 'GetMaterials',
                Project: projectName,
                ControlBoxID: widget.id
            });
        util.ajax('post', requestUrl + '/backend_mgt/v1/controlboxes', data, function (res) {
            if (Number(res.rescode) !== 200) {
                deferred.reject(res);
                return;
            }
            var materials = res.Materials.map(parseMaterialData);
            materials.forEach(function (material) {
                db.collection('material').load(material);
            });
            deferred.resolve();
        });
        return deferred.promise();
    }

    function renderProgramView(layout, widgets) {
        var data = {
            name: localStorage.getItem('pro_name'),
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
                },
                lang: {
                    btn_save: languageJSON.save,
                    btn_saveSubmit: languageJSON.saveSubmit,
                    btn_savePublish: languageJSON.savePublish,
                    clickAddLayout: languageJSON.clickAddLayout,
                    timingProgram: languageJSON.timingProgram,
                    regularProgram: languageJSON.regularProgram,
                    delete: languageJSON.delete,
                    add: languageJSON.add,
                    sequence: languageJSON.sequence,
                    random: languageJSON.Random,
                    ratio: languageJSON.ratio,
                    loading: languageJSON.loading
                }
        };

        $('#edit-page-container')
            .html(templates.materials_edit_program(data))
            .removeClass('none');
        $('.sidebar-mini').css('overflow-y','hidden')
        $('#channel-editor-wrapper .channel-program-editor')
            .html(templates.channel_edit_program(data));
        var pro_duration = localStorage.getItem('pro_duration');
        var _duration = pro_duration.indexOf(":") < 0 ? +pro_duration : durationToSecond(pro_duration);
        new durationInput.DurationInput({
            onChange: '',
            duration: _duration,
            element: $('#channel-editor-wrapper .program-duration-container')[0]
        });

        modifyPage();

        bindEvent();
    }
    
    function durationToSecond(value){
        var [_hour, _minute, _second] = value.split(':');
        var [_hour1, _hour2] = _hour.split('');
        var [_minute1, _minute2] = _minute.split('');
        var [_second1, _second2] = _second.split('');
        return +_hour1 * 10 * 60 * 60 + (+_hour2) * 60 *60 + (+_minute1) * 10 * 60 + (+_minute2) * 60 + (+_second1) * 10 + (+_second2);
    }

    function convertTime(){
        var hour = +$('.duration-input-hour').text(),
         minute = +$('.duration-input-minute').text(),
         second = +$('.duration-input-second').text();
        return hour * 3600 + minute * 60 + second;
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

        var w = editor.mLayout.getFocusedWidget();
        if (w) {
            w = db.collection('widget').select({id: w.mId})[0];
            widgetId = w.id;
        } else {
            w = null;
        }
        loadWidget(w);
        editor.onFocusChanged(function () {
            var focusedWidget = this.getLayout().getFocusedWidget();
            var wType = focusedWidget.mType;
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

    function parseMaterialData(data) {
        var typeName = data.Type_Name;
        if (data.Is_Live != undefined) {
            if (data.Is_Live == 1) {
                typeName = "直播";
            }
        }
        return {
            id: data.ID,
            widget_id: data.ControlBox_ID,
            is_time_segment_limit: data.Is_TimeSegment_Limit,
            lifetime_start: data.LifeStartTime,
            lifetime_end: data.LifeEndTime,
            resource_id: data.Material_ID,
            name: data.Name,
            name_eng: data.Name_eng,
            schedule_params: data.Schedule_Paras,
            schedule_type: data.Schedule_Type,
            sequence: data.Sequence,
            time_segment_duration: data.TimeSegment_Duration,
            time_segment_start: data.TimeSegment_Start,
            type_id: data.Type_ID,
            type_name: typeName,
            download_auth_type: data.Download_Auth_Type,
            url: data.URL
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
        $('.channel-program-layout-footer li').each(function(){
            if ($(this).attr("data-id") == widget.id){
                $(this).css("border", "solid 1px #3c8dbc");
            }
        });
        loadWidget(widget);
    }

    function loadWidget(widget) {
		var page = "resources/pages/channel/mtrCtrl.html";
		$(".channel-program-widget").load(page);
        localStorage.setItem('currentWidget', JSON.stringify(widget));
    }

    function modifyPage() {
        $('.channel-program-list, .direct-name-002, .direct-name-002-hint').remove();
        $('.channel-program-editor').css('width', '100%');
        $('.channel-program-timer').children().hide();
            $($('.channel-program-timer').children()[6]).show().css({
                'position': 'absolute',
                'right': '130px',
                'top': '5px'
            })

        if(localStorage.getItem('programPreview') == 'true' || localStorage.getItem('isPublish') == 'true'){
            $('.channel-program-timer').remove();
            $('.direct-name-003-hint').remove();
            $('.btn-channel-editor-save').remove();
        }
    }
    
    /**
     * 关闭页面的回调函数
     */
    function onCloseEditor() {
        $('#edit-page-container')
            .empty()
            .addClass('none');
        $('.sidebar-mini').css('overflow-y','auto')
        window.onpopstate = undefined;
    }

    function onBackList() {
        // if(localStorage.getItem('programPreview') == 'true'){
        //     location.hash = '#channel/adEdit?id=' + localStorage.getItem('playlistId')
        // }else{
        //     location.hash = '#materials/materials_list';
        // }
        window.history.go(-1);
        localStorage.removeItem('programPreview');
        localStorage.removeItem('playlistId');
        localStorage.removeItem('pro_duration');
        localStorage.removeItem('pro_name');
        localStorage.removeItem('pro_mtrid');
        localStorage.removeItem('isPublish');
    }
});