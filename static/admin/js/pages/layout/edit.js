'use strict';

define(function(require, exports, module) {
    var LAYOUTEDIT = require("pages/layout/edit"),
        INDEX = require("../index.js"),
        currentMenu = INDEX.getCurrentMenu('节目模版');
    /**
     * 依赖的所有模块
     */
	var templates = require('common/templates'),
		config    = require('common/config'),
		util      = require('common/util'),
        layoutEditor    = require('common/layout_editor'),
        toast     = require('common/toast');

    /**
     * 模块全局变量
     * @type {*}
     */
    var requestUrl  = config.serverRoot,
        projectName = config.projectName,
        layoutId    = -1,
        editor      = null,
        savedWidgetIds = [],
        languageJSON = config.languageJson.channel,
        isAdVersion = false;

    /**
     * 页面初始化
     */
	exports.init = function() {
        // checkIsAd();
        savedWidgetIds = [];
        window.onpopstate = onHashChange;
        layoutId = Number(util.getHashParameters().id);
        if (!isNaN(layoutId)) {
            var data = JSON.stringify({
                project_name: projectName,
                action: 'getCBLList',
                data: {
                    layout_id: layoutId
                }
            });
            util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, onLayoutDataAvailable);
        } else {
            var defaultLayout = {
                ID: -1,
                Name: languageJSON.newLayout,
                Name_eng: 'new layout',
                Width: '1920',
                Height: '1080',
                BackgroundPic: '',
                BackgroundColor: '#000000',
                TopMargin: '0',
                RightMargin: '0',
                BottomMargin: '0',
                LeftMargin: '0',
                Layout_ControlBoxs: []
            };
            onLayoutDataAvailable(defaultLayout);
        }
	};

    function onHashChange() {
        if (location.hash.indexOf('#layout/edit') !== 0) {
            $('#edit-page-container').empty().addClass('none');
            $('.sidebar-mini').css('overflow-y','auto')
        }
        try {
            editor.destroy();
        } catch(e) {}
        window.onpopstate = undefined;
    }

    /**
     * 过滤网络数据
     */
    function onLayoutDataAvailable(res) {
        var widgets = [];
        res.Layout_ControlBoxs.sort(function (a, b) {
            return a.Zorder - b.Zorder;
        });
        res.Layout_ControlBoxs.forEach(function (el, idx, arr) {
            widgets.push({
                top: el.Top,
                left: el.Left,
                width: el.Width,
                height: el.Height,
                id: el.ID,
                type: el.Type,
                typeName: boxTypeName(el.Type)
            });
            if (el.ID !== -1) {
                savedWidgetIds.push(el.ID);
            }
        });
        var data = {
            id:             res.ID,
            name:           res.Name,
            nameEng:       res.Name_eng,
            width:          res.Width,
            height:         res.Height,
            topMargin:      res.TopMargin,
            leftMargin:     res.LeftMargin,
            rightMargin:    res.RightMargin,
            bottomMargin:   res.BottomMargin,
            backgroundColor:res.BackgroundColor,
            backgroundImage: res.BackgroundPic.Type === 'Image' ? {
                id: res.BackgroundPic.ID,
                url: res.BackgroundPic.URL,
                type: res.BackgroundPic.Type,
                download_auth_type: res.BackgroundPic.Download_Auth_Type
            } : {
                type: 'Unknown',
                ID: 0
            },
            widgets:        widgets,
            Editable:       res.Editable == false ? false :true
        };
        renderMain(data);
        registerEventListeners();
        onWidgetsListUpdate();
    }

    /**
     * 渲染主页面
     * @param data
     */
    function renderMain(data) {
        console.log(data)
        /************** main ****************/

        var language = {
            lang: {
                editLayout: languageJSON.editLayout,
                exitEdit: languageJSON.exitEdit,
                saveExit: languageJSON.saveExit,
                save: languageJSON.save,
                toolbar: languageJSON.toolbar,
                video: languageJSON.video,
                image: languageJSON.image,
                text: languageJSON.text,
                clock: languageJSON.clock,
                weather: languageJSON.weather,
                adVideo: languageJSON.adVideo,
                adImage: languageJSON.adImage,
                music: languageJSON.music,
                delete: languageJSON.delete,
                canvasArea: languageJSON.canvasArea,
                ctrlProperties: languageJSON.ctrlProperties,
                promptSteps1: languageJSON.promptSteps1,
                promptSteps2: languageJSON.promptSteps2,
                promptSteps3: languageJSON.promptSteps3,
                promptSteps4: languageJSON.promptSteps4,
            }
        }
        $('#edit-page-container')
            .html(templates.layout_edit_main(language))
            .removeClass('none');
            $('.sidebar-mini').css('overflow-y','hidden')
        if(!data.Editable){
            $('.btn-layout-editor-exit').remove()
            $('.btn-layout-editor-saveExit').remove()
            $('.btn-layout-editor-save').remove()
        }
        //判断广告控件隐藏显示
        getJurisdiction()
        // if(!isAdVersion){
        //     $('#adVideo, #adImage').remove();
        // }
        /************** layout properties **************/
        var properties = {
            name: data.name,
            width: data.width,
            height: data.height,
            background_color: data.backgroundColor,
            lang: {
                edit: languageJSON.edit,
                height: languageJSON.height,
                width: languageJSON.width,
                bgColor: languageJSON.bgColor,
                addBgcolor: languageJSON.addBgcolor,
                cancelBgcolor: languageJSON.cancelBgcolor,
            }
        };
        $('#layout-editor-wrapper .layout-editor-properties').html(templates.layout_edit_property(properties));
        
        jscolor.register()
        /*************** editor *******************/
        var canvas = $('#layout-editor-wrapper .layout-editor-canvas'),
            canvasHeight = canvas.height(),
            canvasWidth = canvas.width();
        editor = new layoutEditor.LayoutEditor(data, canvasWidth, canvasHeight, true);
        editor.attachToDOM(canvas[0]);

        /**************** widget properties *********************/
        var widget = editor.getLayout().getFocusedWidget();
        var widgetProperty = widget ? {
            type: widget.mTypeName,
            top: widget.mTop,
            left: widget.mLeft,
            width: widget.mWidth,
            height: widget.mHeight
        } : {
            type: '', top: 0, left: 0, width: 0, height: 0
        };
        var lang = {
            currentCtrl: languageJSON.currentCtrl,
            width: languageJSON.width,
            height: languageJSON.height,
            layer: languageJSON.layer,
            upLayer: languageJSON.upLayer,
            downLayer: languageJSON.downLayer,
        };
        widgetProperty.lang = lang;
        $('#layout-editor-wrapper .layout-editor-widget-properties').html(templates.layout_edit_widget_property(widgetProperty));

    }

    /**
     * 注册事件
     */
    function registerEventListeners() {
        $('#layout-editor-wrapper input').change(onInputChanged);
        $('#layout-editor-wrapper .btn-add-widget').click(onAddWidget);
        $('#layout-editor-wrapper .btn-layout-editor-background').click(function () {           //添加背景图
            //alert('资源列表还未实现');
            var page = "resources/pages/channel/addMtr.html";
            util.cover.load(page);
            onAddMaterial();
        });
        $('#layout-editor-wrapper .btn-layout-editor-cancelbackground').click(function () {
            var mtrId = null,
                url = "",
                datype = "";
            LAYOUTEDIT.updateBackground(mtrId, url, datype);
        });
        $('#layout-editor-wrapper .btn-layout-editor-delete-widget').click(function () {
            editor.getLayout().deleteWidget(editor.getLayout().getFocusedWidget());
        });
        $('#layout-editor-wrapper .btn-layout-editor-zindex-decrease').click(function () {
            editor.getLayout().getFocusedWidget().move(-1);
        });
        $('#layout-editor-wrapper .btn-layout-editor-zindex-increase').click(function () {
            editor.getLayout().getFocusedWidget().move(1);
        });
        editor.onFocusChanged(onFocusedWidgetChanged);
        editor.onWidgetsChanged(onWidgetsListUpdate);
        $('#layout-editor-wrapper .btn-layout-editor-back').click(function () {
            $('#edit-page-container').empty().addClass('none');
            $('.sidebar-mini').css('overflow-y','auto')
            location.hash = '#layout/list';
        });
        $('#layout-editor-wrapper .btn-layout-editor-save').click(onSaveLayout);
        $('#layout-editor-wrapper .btn-layout-editor-saveExit').click(function() {
            $(this).attr("exit", "true");
            onSaveLayout();
        });
        $('#layout-editor-wrapper .layout-editor-widgets').delegate('li', 'click', function (ev) {
            var index = Number(this.getAttribute('data-widget-index'));
            editor.mLayout.mWidgets[index].requestFocus();
        });

        $('#layout-editor-wrapper .btn-layout-editor-exit').click(function () {
            $('#edit-page-container').empty().addClass('none');
            $('.sidebar-mini').css('overflow-y','auto')
            location.hash = '#layout/list';
            window.onpopstate = undefined;
        });

    }

    /**
     * 保存模版数据
     */
    function onSaveLayout() {
        $('#layout-editor-wrapper .btn-layout-editor-save').attr("disabled","disabled");
        setTimeout(removeDisabled,config.letTimeout);
        var json = editor.getLayout().toJSON(),
            isNewLayout = json.id === -1;

        httpCheckLayoutExists(json, function (err) {
            if (err) { console.error(err); return; }
            console.log('模版添加成功!');
            httpUpdateLayout(json, function (err) {
                if (err) { console.error(err); return; }
                console.log('模版更新成功');
                httpDeleteWidgets(json, function (err) {
                    if (err) { console.error(err); return; }
                    console.log('模版删除成功!');
                    httpAddWidgets(json, function (err) {
                        if (err) { console.error(err); return; }
                        console.log('控件添加成功!');
                        httpUpdateWidgets(json, function (err) {
                            if (err) { console.error(err); return; }
                            console.log('控件更新成功!');
                            $('#layout-editor-wrapper .btn-layout-editor-save').removeAttr("disabled");
                            alert(languageJSON.al_saveSuc);
                            if ($('#layout-editor-wrapper .btn-layout-editor-saveExit').attr("exit") == "true"){
                                location.hash = '#layout/list';
                                $('#edit-page-container').empty().addClass('none')
                                $('.sidebar-mini').css('overflow-y','auto')
                            }else {
                                if (isNewLayout) {
                                    location.hash = '#layout/edit?id=' + json.id;
                                }
                            }
                            //location.reload();
                        });
                    });
                });
            });
        });

    }

    function removeDisabled(){
        $('#layout-editor-wrapper .btn-layout-editor-save').removeAttr("disabled");
    }
    /**
     * 检查layout是否存在，不存在则添加
     * @param json
     * @param cb
     */
    function httpCheckLayoutExists(json, cb) {
        if (json.id !== -1) {
            cb();
            return;
        }
        var data = JSON.stringify({
            project_name: projectName,
            action: 'add',
            data: {
                layout_id: String(json.id),
                Name: json.name,
                Name_eng: json.nameEng,
                Width: String(json.width),
                Height: String(json.height),
                BackgroundPic: String(json.backgroundImage.id === -1 ? 0: json.backgroundImage.id),
                BackgroundColor: json.backgroundColor,
                TopMargin: String(json.topMargin),
                RightMargin: String(json.rightMargin),
                LeftMargin: String(json.leftMargin),
                BottomMargin: String(json.bottomMargin)
            }
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
            if (Number(res.rescode) !== 200) {
                cb(res);
                return;
            }
            json.id = json.layout.mId = res.ID;
            cb();
        });
    }

    /**
     * 更新layout信息
     * @param json
     * @param cb
     */
    function httpUpdateLayout(json, cb) {
        var data = JSON.stringify({
            project_name: projectName,
            action: 'update',
            data: {
                layout_id: String(json.id),
                Name: json.name,
                Name_eng: json.nameEng,
                Width: String(json.width),
                Height: String(json.height),
                BackgroundPic: String(json.backgroundImage.id === -1 ? 0: json.backgroundImage.id),
                BackgroundColor: json.backgroundColor,
                TopMargin: String(json.topMargin),
                RightMargin: String(json.rightMargin),
                LeftMargin: String(json.leftMargin),
                BottomMargin: String(json.bottomMargin)
            }
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
            if (Number(res.rescode) !== 200) {
                cb(res);
                return;
            }
            //生成缩略图
            html2canvas( $(".layout-editor-canvas").children().children().eq(2).children() ,{
                onrendered: function(canvas){
                    var data = JSON.stringify({
                        project_name: projectName,
                        action: 'updateThumbnail',
                        data: {
                            layout_id: String(json.id),
                            Thumbnail: canvas.toDataURL(),
                        }
                    });
                    util.ajax2('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
                        if (Number(res.rescode) == 200) {
                            console.log('控件缩略图添加成功!');
                        }
                    })
                    cb();
                }
            });
        });
    }

    /**
     * 删除widget
     * @param json
     * @param cb
     */
    function httpDeleteWidgets(json, cb) {
        var widgetsNeedDelete = [];
        savedWidgetIds.forEach(function (id) {
            var contain = false;
            json.widgets.forEach(function (el) {
                if (el.id === id) {
                    contain = true;
                }
            });
            if (!contain) {
                widgetsNeedDelete.push(id);
            }
        });
        savedWidgetIds = [];
        json.widgets.forEach(function (el) {
            savedWidgetIds.push(el.id);
        });
        if (widgetsNeedDelete.length === 0) {
            cb();
        }
        var successCount = 0, failed = false;
        widgetsNeedDelete.forEach(function (el) {
            var data = JSON.stringify({
                project_name: projectName,
                action: 'deleteLCB',
                data: {
                    layout_controlbox_id: String(el)
                }
            });
            util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
                if (!failed && Number(res.rescode) !== 200) {
                    cb(res);
                    failed = true;
                    return;
                }
                successCount++;
                if (successCount === widgetsNeedDelete.length) {
                    cb();
                }
            });
        });
    }

    /**
     * 添加widget
     * @param json
     * @param cb
     */
    function httpAddWidgets(json, cb) {
        var widgetsNeedAdd = [], zIndexes = [];
        var zIndex = 0;
        json.widgets.forEach(function (el) {
            if (el.id === -1) {
                widgetsNeedAdd.push(el);
                zIndexes.push(zIndex);
            }
            zIndex++;
        });
        if (widgetsNeedAdd.length === 0) {
            cb();
            return;
        }
        var successCount = 0, failed = false;
        widgetsNeedAdd.forEach(function (el, idx) {
            var data = JSON.stringify({
                project_name: projectName,
                action: 'addLCB',
                data: {
                    Left: String(el.left),
                    Width: String(el.width),
                    Top: String(el.top),
                    Height: String(el.height),
                    layout_id: String(json.id),
                    layout_controlbox_id: String(el.id),
                    Type: String(el.type),
                    Zorder: String(zIndexes[idx])
                }
            });
            util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
                if (!failed && Number(res.rescode) !== 200) {
                    cb(res);
                    failed = true;
                    return;
                }
                successCount++;
                el.id = el.widget.mId = res.ID;
                if (successCount === widgetsNeedAdd.length) {
                    cb();
                }
            });
        });
    }

    /**
     * 批量更新
     * @param json
     * @param cb
     */
    function httpUpdateWidgets(json, cb) {
        var widgetsNeedUpdate = [];
        var zIndex = 0;
        json.widgets.forEach(function (el) {
            if (el.id !== -1) {
                widgetsNeedUpdate.push({
                    Left: el.left,
                    Width: el.width,
                    Top: el.top,
                    Height: el.height,
                    layout_id: String(json.id),
                    layout_controlbox_id: String(el.id),
                    Type: String(el.type),
                    Zorder: String(zIndex)
                });
            }
            zIndex++;
        });
        var data = JSON.stringify({
            project_name: config.projectName,
            action: 'updateCBLList',
            data: {
                layout_id: String(json.id),
                Name: json.name,
                Name_eng: json.nameEng,
                Width: String(json.width),
                Height: String(json.height),
                BackgroundPic: String(json.backgroundImage.id),
                BackgroundColor: json.backgroundColor,
                TopMargin: json.topMargin,
                LeftMargin: json.leftMargin,
                RightMargin: json.rightMargin,
                BottomMargin: json.bottomMargin,
                Layout_ControlBoxs: widgetsNeedUpdate
            }
        });
        util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
            if (Number(res.rescode) !== 200) {
                cb(res);
                return;
            }
            cb();
        });
    }

    /**
     * 更新widget列表
     */
    function onWidgetsListUpdate() {
        var videoOrAudioWidgetExists = false,
            widgets = [];
        editor.getLayout().mWidgets.forEach(function (el, idx, arr) {
            if (el.mType === 'VideoBox' || el.mType === 'AudioBox') {
                videoOrAudioWidgetExists = true;
            }
            widgets.push({
                name: el.mTypeName,
                background_color: el.mBackgroundColor,
                focused: el === editor.mLayout.mFocusedWidget
            });
        });
        // 注释掉 视频和音频控件只能选一个
        // $('#layout-editor-wrapper .btn-add-widget[data-widget-id="video"]').prop('disabled', videoOrAudioWidgetExists);
        // $('#layout-editor-wrapper .btn-add-widget[data-widget-id="audio"]').prop('disabled', videoOrAudioWidgetExists);
        $('#layout-editor-wrapper .layout-editor-widgets')
            .html(templates.layout_edit_widgets({widgets: widgets}));
    }

    /**
     * 更新widget 属性列表
     */
    function onFocusedWidgetChanged() {
        var widgetProperties = $('#layout-editor-wrapper .layout-editor-widget-properties input'),
            focusedWidget = editor.getLayout().getFocusedWidget();
        //$('#layout-editor-wrapper .layout-editor-widget-properties').toggleClass('none', !focusedWidget);
        widgetProperties[0].value = focusedWidget ? focusedWidget.mTypeName : '';
        widgetProperties[1].value = focusedWidget ? focusedWidget.mLeft: 0;
        widgetProperties[2].value = focusedWidget ? focusedWidget.mTop : 0;
        widgetProperties[3].value = focusedWidget ? focusedWidget.mWidth : 0;
        widgetProperties[4].value = focusedWidget ? focusedWidget.mHeight : 0;
        $('#layout-editor-wrapper li').each(function (idx, el) {
            var $this = $(this),
                index = $this.attr('data-widget-index');
             $this.toggleClass('focused', editor.mLayout.mWidgets[index] === focusedWidget);
        });
    }

    function onAddWidget(ev) {
        var widgetId = this.getAttribute('data-widget-id');
        var json = {
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            id: -1
        };
        switch (widgetId) {
            case 'image':
                json.type = 'ImageBox';
                json.typeName = languageJSON.ImageBox;
                break;
            case 'video':
                json.type = 'VideoBox';
                json.typeName = languageJSON.VideoBox;
                break;
            case 'audio':
                json.type = 'AudioBox';
                json.typeName = languageJSON.AudioBox;
                break;
            case 'html':
                json.type = 'WebBox';
                json.typeName = languageJSON.WebBox;
                break;
            case 'clock':
                json.type = 'ClockBox';
                json.typeName = languageJSON.ClockBox;
                break;
            case 'weather':
                json.type = 'WeatherBox';
                json.typeName = languageJSON.WeatherBox;
                break;
            case 'office':
                json.type = 'OfficeBox';
                json.typeName = languageJSON.OfficeBox;
                break;
            case 'adVideo':
                json.type = "AdVideoBox";
                json.typeName = languageJSON.AdVideoBox;
                break;
            case 'adImage':
                json.type = 'AdImageBox';
                json.typeName = languageJSON.AdImageBox;
                break;
        }
        var widget = layoutEditor.Widget.create(json, editor.getLayout());
        editor.getLayout().addWidget(widget);
        widget.requestFocus();
    }

    /**
     * 处理输入框改变事件
     * @param ev
     */
    function onInputChanged(ev) {
        var propertyId = this.getAttribute('data-property-id'),
            focusedWidget = editor.getLayout().getFocusedWidget();
        switch (propertyId) {
            case 'layout-width':
                if (!editor.getLayout().setWidth(Number(this.value))) {
                    this.value = editor.getLayout().getWidth();
                    toast.show(languageJSON.toastW);
                }
                break;
            case 'layout-height':
                if (!editor.getLayout().setHeight(Number(this.value))) {
                    this.value = editor.getLayout().getHeight();
                    toast.show(languageJSON.toastH);
                }
                break;
            case 'layout-bg-color':
                editor.getLayout().setBackgroundColor(this.value);
                break;
            case 'layout-name':
                editor.getLayout().setName(this.value);
                break;
            case 'widget-top':
                if (focusedWidget && !focusedWidget.setTop(Number(this.value))) {
                    this.value = focusedWidget.getTop();
                    toast.show(languageJSON.toastO);
                }
                break;
            case 'widget-left':
                if (focusedWidget && !focusedWidget.setLeft(Number(this.value))) {
                    this.value = focusedWidget.getLeft();
                    toast.show(languageJSON.toastO);
                }
                break;
            case 'widget-width':
                if (focusedWidget && !focusedWidget.setWidth(Number(this.value))) {
                    this.value = focusedWidget.getWidth();
                    toast.show(languageJSON.toastO);
                }
                break;
            case 'widget-height':
                if (focusedWidget && !focusedWidget.setHeight(Number(this.value))) {
                    this.value = focusedWidget.getHeight();
                    toast.show(languageJSON.toastO);
                }
                break;
        }
    }

    function updateBackground(id, url, download_auth_type) {
        if (typeof url !== 'string') {
            return;
        }
        editor.getLayout().setBackgroundImage({id: parseInt(id), url: url, type: 'Image', download_auth_type: download_auth_type});
    }

    function onAddMaterial() {
        var el = $('#mtr_addMtr');
        if (el.size() === 0) {
            el = $('<input id="mtr_addMtr" type="hidden">')
                .appendTo($(document.body));
        }
        el.attr('typeid', 2);
        el.attr('is_choisebg', 1);
        util.cover.load('resources/pages/channel/addMtr.html');
    }

    /**
     * 判断控件名
     * @param type
     * @returns {*}
     */
    function boxTypeName(type) {
        var typeName;
        switch (type) {
            case 'ImageBox':
                typeName = languageJSON.ImageBox;
                break;
            case 'VideoBox':
                typeName = languageJSON.VideoBox;
                break;
            case 'AudioBox':
                typeName = languageJSON.AudioBox;
                break;
            case 'WebBox':
                typeName = languageJSON.WebBox;
                break;
            case 'ClockBox':
                typeName = languageJSON.ClockBox;
                break;
            case 'WeatherBox':
                typeName = languageJSON.WeatherBox;
                break;
            case 'OfficeBox':
                typeName = languageJSON.OfficeBox;
                break;
            case 'AdVideoBox':
                typeName = languageJSON.AdVideoBox;
                break;
            case 'AdImageBox':
                typeName = languageJSON.AdImageBox;
                break;
        }
        return typeName;
    }

    function checkIsAd(){
        var data = JSON.stringify({
            Project: projectName,
            project_name: projectName,
            Action: 'get_function'
        })
        var url = requestUrl + '/backend_mgt/v1/projects';
        //同步请求
        util.ajax2('post', url, data, function (json) {
            if(json.rescode == '200'){
                isAdVersion = json.function.advertisement;
            }
        })
    }

    exports.updateBackground = updateBackground;

    function getJurisdiction(){
        if(currentMenu.menu.indexOf("视频广告") == '-1'){
            $('#adVideo').remove()
        }
        if(currentMenu.menu.indexOf("图片广告") == '-1'){
            $('#adImage').remove()
        }
    }
});
