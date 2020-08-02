define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var adEdit = require("pages/channel/adEdit.js");
    //var languageJSON = CONFIG.languageJson.user;
    var plsType = '';
    var plsAttr = {};

    exports.init = function () {
        //selectLanguage();
        renderPlsAttr();
        bindEvent();
    }
    exports.priority;
    exports.type;
    exports.location;
    exports.startTime;
    exports.endTime;
    exports.plsType;
    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $('#playlist_name').val($('.edit-pls-name').val());
    }

    function bindEvent() {
        $('.prioritySe').on('change', function (e) {
            $(e.target).val() != '0' ? $('.isShowPeriod').show() : $('.isShowPeriod').hide();
        })

        $(".CA_close").click(function () {
            UTIL.cover.close();
        });

        // $('.pls_normal, .pls_mix, .pls_bottom').on('keyup', function(){
        //     if($(this).val().length > 0){
        //         $('.plsAttrSave').prop('disabled', false);
        //     }else{
        //         $('.plsAttrSave').prop('disabled', true);
        //     }
        // })

        $('.plsAttrSave').on('click', function () {
            var plsName = '';
            var showText = '';
            if (plsType == 'normal') {
                if(!$('.pls_normal').val()){
                    alert('请输入播单名称！');
                    return;
                }
                plsAttr.name = $('.pls_normal').val();
                adEdit.type = '常规';
                if ($('.prioritySe').val() == '0') {
                    showText = '-常规';
                    adEdit.priority = 0;
                    adEdit.startTime ='';
                    adEdit.endTime = '';

                    plsAttr.priority = 0;
                    plsAttr.startTime = '';
                    plsAttr.endTime = '';
                } else {
                    var sTime = $('#startTime').val();
                    var eTime = $('#endTime').val();
                    var _priority = '-优先' + $('.prioritySe').val();
                    if(!sTime || !eTime || sTime > eTime){
                        alert('请输入正确的有效时间区间！')
                        return;
                    }
                    adEdit.priority = parseInt($('.prioritySe').val());
                    adEdit.startTime = $('#startTime').val();
                    adEdit.endTime = $('#endTime').val();

                    plsAttr.priority = parseInt($('.prioritySe').val()) || 0;
                    plsAttr.startTime = $('#startTime').val() || '';
                    plsAttr.endTime = $('#endTime').val() || '';
                    showText = _priority + ' (' + sTime + ' ~ ' + eTime + ')';
                }
            } else if (plsType == 'mix') {
                if(!$('.pls_mix').val()){
                    alert('请输入播单名称！');
                    return;
                }
                plsAttr.name = $('.pls_mix').val();
                adEdit.type = '均插';
                var _location = $('.positionSe').val();
                adEdit.location = $('.positionSe').val();
                plsAttr.location = $('.positionSe').val() || 0;
                showText = '-均插' + _location;
            } else {
                if(!$('.pls_bottom').val()){
                    alert('请输入播单名称！');
                    return;
                }
                plsAttr.name = $('.pls_bottom').val();
                adEdit.type = '垫播';
                showText = '-垫播';
            }
            exports.priority = plsAttr.priority;
            exports.location = plsAttr.location;
            exports.startTime = plsAttr.startTime;
            exports.endTime = plsAttr.endTime;
            if (localStorage.getItem('ad_plan')) {
                addPlaylist();
            } else {
                var LEFT = $('.edit-pls-name').val().length * 20;
                LEFT > 300 ? LEFT = 300 : '';
                $('.box-header .priority').text(showText).css('left', LEFT + 'px');
                $('.edit-pls-name').val(plsAttr.name);
            }
            UTIL.cover.close();
        })
    }

    function addPlaylist() {
        var plsName = $('.edit-pls-name').val();
        var type = getPlaylistType();
        var sTime = plsAttr.startTime ? '9999-01-01 ' + plsAttr.startTime + ':00' : '';
        var eTime = plsAttr.endTime ? '9999-01-01 ' + plsAttr.endTime + ':00' : '';
        var mtrType = localStorage.getItem('mtrType');
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'create',
            material_type_id: mtrType == 'Video' ? 1 : 2,
            name: plsAttr.name,
            type: type,
            priority: plsAttr.priority || 0,
            location: plsAttr.location || 0,
            start_time: sTime,
            end_time: eTime,
        })

        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';

        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                alert('创建成功');
                location.hash = '#channel/adEdit?id=' + res.id;
                $('.addAdsResources').prop('disabled', false);
                plsAttr = [];
                //plsAttr.name = '';
                //plsAttr.priority = '';
                //plsAttr.type = '';
                //plsAttr.location = '';
                //plsAttr.startTime = '';
                //plsAttr.endTime = '';
            }
        });
    }

    function renderPlsAttr() {
        // $('.plsAttrSave').prop('disabled', false);
        var queryString = '';
        if (exports.plsType) {
            queryString = exports.plsType;
        } else {
            queryString = window.location.hash.match(/\?(.*)/);
            queryString = queryString[1];
            exports.type == '常规' ? queryString = 'normal' : '';
            exports.type == '均插' ? queryString = 'mix' : '';
            exports.type == '垫播' ? queryString = 'bottom' : '';
        }
        var plsName = $('.edit-pls-name').val();
        plsType = queryString;
        switch (queryString){
            case 'normal':
                $('.playlist_normal').show();
                $('.pls_normal').val(plsName);
                var isSetPriority = !!plsAttr.priority && !!plsAttr.priority;
                if (isSetPriority || !!exports.priority) {
                    $('.prioritySe').val(plsAttr.priority || exports.priority);
                    $('#startTime').val(plsAttr.startTime || exports.startTime);
                    $('#endTime').val(plsAttr.endTime || exports.endTime)
                    $('.isShowPeriod').show();
                } else {
                    $('.prioritySe').val('0');
                }
                $('.playlist_mix, .playlist_bottom').hide();
                break;
            case 'mix':
                $('.playlist_mix').show();
                $('.pls_mix').val(plsName);
                $('.positionSe').val(plsAttr.location || exports.location || 0);
                $('.playlist_normal, .playlist_bottom').hide();
                break;
            case 'bottom':
                $('.playlist_bottom').show();
                $('.pls_bottom').val(plsName);
                $('.playlist_normal, .playlist_mix').hide();
                break;
            default:
                break;
        }
    }

    function getPlaylistType() {
        switch (exports.plsType) {
            case 'normal':
                return '常规';
                break;
            case 'mix':
                return '均插';
                break;
            case 'bottom':
                return '垫播';
                break;
            default:
                return null;
                break;
        }
    }

})
