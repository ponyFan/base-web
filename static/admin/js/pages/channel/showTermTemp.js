define(function (require, exports, module) {
    var UTIL = require('common/util'),
        templates = require('common/templates'),
        CONFIG = require('common/config');
    var layoutEditor = require('common/layout_editor');

    var requestUrl = CONFIG.serverRoot,
        projectName = CONFIG.projectName,
        languageJSON = CONFIG.languageJson.adPlan,
        mtrType = 'Ad' + localStorage.getItem('mtrType') + 'Box';
    var EDITOR = [];
    var WIDGET_LIST = [];
    var PROGRAM_IDS = [];

    exports.data;

    exports.init = function () {
        selectLanguage();
        bindEvent();
        renderEditor(exports.data.program_layouts);
    }

    function selectLanguage() {
        $('#term_sel_title').text('发布到终端');
        $('#term_sel_save').prop('disabled', true);
    }

    function bindEvent() {
        $('#term_sel_cancel').on('click', function () {
            initGV();
            UTIL.cover.close();
        })

        $('#term_sel_save').on('click', function () {
            //LOADING

            $('.temps .temp_body .loadingMask').css({ 'opacity': 0.84, 'z-index': 9 });
            $('#term_sel_save').prop('disabled', true);
            setTimeout(function () { publishPls() }, 1000); //测试用延时1秒;
            //publishPls()
        })

    }

    function renderEditor(data) {
        var widgetId = null;
        var widgetArray = [];
        var mtrType = 'Ad' + localStorage.getItem('mtrType') + 'Box';
        data.map(function (v, i) {
            var widgets = v.controlboxes;
            var totalTemp = data.length;
            PROGRAM_IDS.push(v.program_ids);
            var layout = v.layout;
            i == 0 ? widgetId = v.id : '';
            widgets.sort(function (a, b) {
                return a.z - b.z;
            });
            var json = {
                id: v.layout_id,
                name: layout.name || '',
                nameEng: layout.name_eng || '',
                width: layout.width,
                height: layout.height,
                topMargin: layout.top_margin,
                leftMargin: layout.left_margin,
                rightMargin: layout.right_margin,
                bottomMargin: layout.bottom_margin,
                backgroundColor: layout.background_color || '',
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
                        type: el.controlbox_type,
                        typeName: el.controlbox_type_name
                    };
                })
            };
            var tempBox = '<div class="temps chid' + v.program_ids+'" id="temp_' + i + '"><div class="temp_header"><h4></h4><span></span></div><div class="temp_body"></div><div class="temp_footer"><ul></ul></div></div>';
            $('#term-list').append(tempBox);
            $('#temp_' + i + ' .temp_header h4').text('模版名称: ' + layout.name);
            $('#temp_' + i + ' .temp_header span').text('( ' + (i+1) + '/' + totalTemp + ' )');
            var canvas = $('#temp_' + i + ' .temp_body'),
                canvasHeight = canvas.height(),
                canvasWidth = canvas.width();
            editor = new layoutEditor.LayoutEditor(json, canvasWidth, canvasHeight, false);
            EDITOR.push(editor);
            editor.attachToDOM(canvas[0]);

           // addLoadingMask(canvasWidth,canvasHeight);
            $('#temp_' + i + ' .temp_body').append(addLoadingMask(canvasWidth, canvasHeight));
            widgetArray.push(editor.mLayout.mWidgets);
            for (var j = editor.mLayout.mWidgets.length - 1; j >= 0; j--) {
                var widget = editor.mLayout.mWidgets[j];
                var wType = widget.mType;
                
                if (mtrType == 'AdImageBox') {
                    if (wType != 'AdImageBox' && wType != 'AdVideoBox') {
                        continue;
                    }
                }
                if (wType != mtrType) continue;
                var _data = {
                    id: widget.mId,
                    name: widget.mTypeName,
                    background_color: widget.mBackgroundColor,
                };
                $('#temp_' + i + ' .temp_footer>ul').append(templates.channel_edit_widget_item(_data));
            }

            widgets.map(function (v) {
                var li = $('.temps').find('[data-id="' + v.id + '"]').attr('data-cbid', v.layout_controlbox_id);
            })

            EDITOR[i].onFocusChanged(function () {
                var focusedWidget = this.getLayout().getFocusedWidget();
                var wType = focusedWidget.mType;
                if (mtrType == 'AdImageBox') {
                    if (wType != 'AdImageBox' && wType != 'AdVideoBox') {
                        this.getLayout().mFocusMask.style.border = 'none';
                        return;
                    }
                }
                if (wType != mtrType) {
                    this.getLayout().mFocusMask.style.border = 'none';
                    return;
                };
                
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
            //var defaultLi = $('#temp_' + i + ' .temp_footer>ul>li:eq(0)');
            //defaultLi.css("border", "1px solid rgb(60, 141, 188)");
            //var _seq = defaultLi.parents('.temps').attr('id').split('_')[1];
            //WIDGET_LIST[seq] = Number(defaultLi.attr('data-cbid'));
            $('#temp_' + i + ' .temp_footer li').on('click', function () {
                $(this).parent().children('li').css("border", "solid 1px #ddd");
                $(this).css("border", "solid 1px #3c8dbc");
                var seq = $(this).parents('.temps').attr('id').split('_')[1];
                WIDGET_LIST[seq] = Number($(this).attr('data-cbid'));
                isAllSelected();
                var widgetId = Number(this.getAttribute('data-id')), /*widgets = editor.mLayout.mWidgets;*/
                    widgets = widgetArray[seq];
                for (var i = 0; i < widgets.length; i++) {
                    if (widgets[i].mId === widgetId) {
                        widgets[i].requestFocus();
                    }
                }
            });
            $('#temp_' + i + ' .temp_footer li:eq(0)').trigger('click');
        })

    }

    function onSelectWidget(widget) {
        var li = $('.temps').find('[data-id="' + widget.mId + '"]');
        var lis = li.parent().children();
        lis.css("border", "solid 1px #ddd");
        li.css("border", "solid 1px #3c8dbc");
        var _seq = li.parents('.temps').attr('id').split('_')[1];
        WIDGET_LIST[_seq] = Number(li.attr('data-cbid'));
        isAllSelected();
    }

    function publishPls() {
        var plsIds = [];
        var cb = [];

        PROGRAM_IDS.map(function (v,i) {
            var obj = {
                program_ids: v,
                layout_controlbox_id: WIDGET_LIST[i]
            }
            //  没有选中控件，不放入post数据
            if(WIDGET_LIST[i]){
                cb.push(obj);
            }
        })

        $('#adTable input:checked').parents('tr').each(function (i,v) {
            plsIds.push(Number($(v).attr('mtrid')));
        })
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            // action: 'publish_2',
            action: 'publish_audit_submit',
            ids: plsIds,
            controlboxes: cb,
            term_ids: exports.data.term_ids,
            category_ids:  exports.data.category_ids
        })

        var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        UTIL.ajax('post', url, data, function (res) {
            if (res.rescode == 200) {
                showMsg(res);
                $('.temps .temp_body .loadingMask').css({ 'opacity': 0, 'z-index': -1 });
                $('#term_sel_save').prop('disabled', false);
                initGV();
                UTIL.cover.close();
            }
        })

    }

    function initGV() {
        EDITOR = [];
        WIDGET_LIST = [];
        PROGRAM_IDS = [];
    }

    function showMsg(data) {
        // var fails = data.fail_count;
        // var sucs = data.success_count;
        // var text_success = '成功' + sucs + '个:' + '\n';
        // var text_fail = '失败' + fails + '个:' + '\n';
        // if (fails > 0) {
        //     data.fail.map(function (v) {
        //         text_fail += v.info;
        //         text_fail += '\n';
        //     })
        // } else {
        //     initGV();
        // }

        // data.success.map(function (v) {
        //     $('#term_list .chid' + v.channel_id + '').find('.loadingMask p').text('发布成功！');
        // })
        // data.fail.map(function (v) {
        //     $('#term_list .chid' + v.channel_id + '').find('.loadingMask p').text('发布失败！');
        // })
        // var show_text = text_fail + '\n' + text_success;
        var show_text = '已提交审核，请等待';
        alert(show_text);
    }

    function isAllSelected() {
        PROGRAM_IDS.length == WIDGET_LIST.length ? $('#term_sel_save').prop('disabled', false) : $('#term_sel_save').prop('disabled', true);
    }

    function addLoadingMask(w,h) {
        var loadingMask = '<div class="loadingMask" style="width:' + w + 'px' + ';height:' + h + 'px' +'"><div class="loader2"></div><p>发布中...</p></div>';
        return loadingMask;
    }

})