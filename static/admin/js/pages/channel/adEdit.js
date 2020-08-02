'use strict';

define(function (require, exports, module) {
    var UTIL = require('common/util'),
        templates = require('common/templates'),
        CONFIG = require('common/config');
    var playlistAttr = require('pages/channel/playlistAttr.js');
        
    var requestUrl = CONFIG.serverRoot,
        playlistId = -1,
        playlistType = '',
        projectName = CONFIG.projectName,
        languageJSON = CONFIG.languageJson.adPlan,
        mtrType = localStorage.getItem('mtrType'),
        materialData = [];

        exports.priority;
        exports.location;
        exports.startTime;
        exports.endTime;
        exports.type;


    exports.init = function () {
        playlistId = Number(UTIL.getHashParameters().id);
        playlistId ? openPlaylist(playlistId) : showNewPage();
    }


    function bindListEvent() {
        var behavior = localStorage.getItem('behavior');
        if(behavior=='edit'){
            $('.advDel').off('click').on('click', function (e) {
                if (confirm("是否删除改广告资源？")==true){
                    e.stopPropagation();
                    var id = $(e.target).attr('advid');
                    deleteAdsResource(id);
                } else {
                    return false
                }
            })
    
            $('.advCopy').off('click').on('click', function (e) {
                e.stopPropagation();
                var id = $(e.target).attr('advid');
                copyAdsResource(id);
            })
    
            $('#adList li').off('click').on('click', function () {
                $('#adList li').removeClass('editingCard');
                $(this).addClass('editingCard');
                $('.adDetail').addClass('showAdAttr');
                $('.playlist').addClass('moveLeft');
                $('.adName label').text($(this).find('.resName').text()).attr('resId',$(this).attr('id'));
                $('#admName').val($(this).find('.resName').text());
                $('#admName, .srcDuration').show();
                $('#mtr_addMtr').hide();
                $('.lbl-duration').parent().show();
                $('#admDuration').val($(this).attr('data-dur'));
                $('.srcDuration').text('(源时长: ' + $(this).data('odu') + ')');
                $('#admCounts').val($(this).attr('data-cts'));
                $('#admOnline, #admOffline').val('');
    

                var startDate = new Date($(this).attr('data-std'));
                var endDate = new Date($(this).attr('data-end'));
                $('#admOnline').datepicker('setDate', startDate);
                $('#admOffline').datepicker('setDate', endDate);
                $('#admOntime').val(calculateDate() || 1);
            })
        }


        $('#adList li input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        })

        $('#adList li a').on('click', function (e) {
            e.stopPropagation();
            var mtrName = $(this).text().split('.');
            var materialType = $(this).parents('li').attr('data-type');
            var _mtyType = mtrName[mtrName.length - 1];
            if(_mtyType == 'mp4' || _mtyType == 'ogg' || _mtyType == 'MPEG4' || _mtyType == 'WebM' || _mtyType == 'mov'|| _mtyType == 'avi'){
                mtrType = 'Video'
            }else if(_mtyType == 'wmv' || _mtyType == 'mkv'){
                alert('该视频格式不支持预览!')
                return
            }else{
                mtrType = 'Image';
            }
            if(materialType == 'Program'){
                localStorage.setItem('pro_duration', $(this).parents('li').attr('data-odu'));
                localStorage.setItem('pro_name', $(this).parents('li').find('.resName').text());
                localStorage.setItem('pro_mtrid', $(this).parents('li').attr('data-mtrid'));
                localStorage.setItem('playlistId', playlistId);
                localStorage.setItem('programPreview', true);
                return;
            }
            //var mtrType = localStorage.getItem('mtrType');
            var m_url = $(this).attr('url');
            if(m_url.indexOf('http')<0){
                var _parent = $(this).parents('span'); 
                if(_parent.children().length > 3){
                    _parent.find('.childMtr2').toggleClass('showChildMtr');
                   return;
                }
                var data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: 'query',
                    id:+m_url
                })
                var url = CONFIG.serverRoot + '/backend_mgt/union_screen_material';
                UTIL.ajax('post', url, data, function(res){
                    if(res.groups.length == 0) return;
                    var mtrs = res.groups[0].members;
                    var _trs = '';
                    mtrs.map(function(v,i){
                        _trs += '<tr><td style="width:20px;">'+(i+1)+'. </td><td><a target="_blank" datype="None" url="'+v.URL+'">'+v.Name+'</a></td></tr>'
                    });
                    _parent.prepend('<table class="childMtr2"><tbody>'+_trs+'</tbody></table>');
                    _parent.find('.childMtr2 a').on('click', function(e){
                       e.stopPropagation();
                       var z_index = parseInt($(this).parents("tr").index());
                       exports.viewData = mtrs[z_index];
                       var page = "resources/pages/materials/materials_preview.html";
                       UTIL.cover.load(page, 3);
                    })
                });
                return;
            }
            exports.url = m_url;
            exports.mtrType = mtrType;
            var page = "resources/pages/materials/materials_preview.html";
            UTIL.cover.load(page, 3);
        })
    }

    function bindEvent() {
        var behavior = localStorage.getItem('behavior');
        if(behavior == 'audit'){
            $('.btn-layout-editor-back').click(function () {
                playlistAttr.priority = '';
                playlistAttr.type = '';
                playlistAttr.location = '';
                playlistAttr.startTime = '';
                playlistAttr.endTime = '';
                $('#edit-page-container').empty().addClass('none');
                $('.sidebar-mini').css('overflow-y','auto')
                localStorage.removeItem('mtrType');
                // location.hash = '#channel/reviewList';
                window.history.go(-1);
            });
            return;
        }
        $('.btn-layout-editor-back').click(function () {
            playlistAttr.priority = '';
            playlistAttr.type = '';
            playlistAttr.location = '';
            playlistAttr.startTime = '';
            playlistAttr.endTime = '';
            $('#edit-page-container').empty().addClass('none');
            $('.sidebar-mini').css('overflow-y','auto')
            localStorage.removeItem('mtrType');
            //location.hash = '#channel/ad_plan';
            window.history.go(-1);
        });

        $('.edit-pls-name').on('click', function () {
            $('.priority').hide();
        }).on('blur', function () {
            $('.priority').show();
            var content = $('.edit-pls-name').val(), sum = 0, re = /[\u4E00-\u9FA5]/g;
            var ch_length = content.match(re) ? content.match(re).length : 0;
            var all_length = content.length;
            //var LEFT = $('.edit-pls-name').val().length * 20;


            var LEFT = ch_length * 20 + (all_length - ch_length) * 14 + 30;
            LEFT > 300 ? LEFT = 300 : '';
            $('.box-header .priority').css('left', LEFT + 'px');
        });

        $('#plsSave').on('click', function () {
            $(this).prop('disabled', true);
            updatePlaylist();
        })

        $('.playlistAttr').click(function () {
            var page = "resources/pages/channel/playlistAttr.html";
            UTIL.cover.load(page);
        })

        $('.addAdsResources').click(function () {
            addAdsResources();
        })

        $('.addMaterial').click(function () {
            addMaterial();
        })

        $('#adList').on('click', function(){
            if($('.childMtr2')){
                $('.childMtr2').removeClass('showChildMtr').addClass('showChildMtr');
            }
        })

        $('.adSave').click(function () {
            if(!$('#admName').val() || !$('#admCounts').val() || !$('#admOnline').val() || !$('#admOffline').val()){
                alert('请输入所有资源编辑项！');
                return
            }
            var g = /^[1-9]*[1-9][0-9]*$/;
            if(!g.test($('#admCounts').val())){
                alert('请输入正确的播放次数!')
                return
            }
            $('.adDetail').removeClass('showAdAttr');
            $('.playlist').removeClass('moveLeft');
            $('#adList li').removeClass('editingCard');
            $('.adName label').text() != '添加资源' ? updateAdsResource() : saveAdsResources();
            $('.adName label').text('');
            $('#admName').show();
            $('.addMaterial').hide();
            $('.lbl-duration').parent().show();
        })

        $('.adCancel').click(function () {
            $('.adDetail').removeClass('showAdAttr');
            $('.playlist').removeClass('moveLeft');
            $('#adList li').removeClass('editingCard');
            $('#admCounts, #admOnline, #admOffline, #admOntime').val('');
            
        })

        $('#admOnline').on('change', function () {
            if ($('#admOffline').val()){
                var duration = calculateDate()
                if (duration >= 0) {
                    $('#admOntime').val(duration +1)
                } else {
                    alert('上刊时间需要小于下刊时间！');
                    $('#admOnline, #admOntime').val('');
                }
            }
        })

        $('#admOffline').on('change', function () {
            if ($('#admOnline').val()) {
                var duration = calculateDate()
                if (duration >= 0) {
                    $('#admOntime').val(duration + 1);
                } else {
                    alert('下刊时间需要大于上刊时间！');
                    $('#admOffline, #admOntime').val('');
                }
            }
        })

        //校验播放次数和持续时长
        $('#admCounts, #admDuration').on('change', function () {
            if (!UTIL.isValidated('number', $(this).val())) {
                $(this).val('');
            };
        })

    }

    function onHashChange() {
        if (location.hash.indexOf('#channel/adEdit') !== 0) {
            $('#edit-page-container').empty().addClass('none');
            $('.sidebar-mini').css('overflow-y','auto')
        }
        window.onpopstate = undefined;
    }

    function selectLanguage() {        
        var _mtrType = localStorage.getItem('mtrType');
        var behavior = localStorage.getItem('behavior');
        var pageTitle = behavior == 'audit' ? '审核播单' : '编辑播单';
        $('.header-title').text(pageTitle);
        $('#mtr_addMtr').attr('typeid', _mtrType == 'Video' ? 1 : 2);
        $(".mDatepicker input").datepicker({
            autoclose: true,
        });
        if(behavior == 'audit'){
            $('#plsSave').hide();
            $('.addAdsResources, .playlistAttr').prop('disabled', true);
        }

    }

    function showPriorityText(data) {
        var showText = '';
        if (data.type == '常规') {
            if (data.priority == '0') {
                showText = '-常规';
            } else {
                var sTime = data.start_time != 'None' ? data.start_time.split(' ')[1].slice(0, 5) : '';
                var eTime = data.end_time != 'None' ? data.end_time.split(' ')[1].slice(0, 5) : ''; 
                var _priority = '-优先' + data.priority;
                showText = _priority + ' (' + sTime + ' ~ ' + eTime + ')';
            }
        } else if (data.type == '均插') {
            var _location = data.location || '';
            showText = '-均插' + _location;
        } else {
            showText = '-垫播';
        };
        //判断汉字个数
        var content = $('.edit-pls-name').val(), sum = 0, re = /[\u4E00-\u9FA5]/g;
        var ch_length = content.match(re) ? content.match(re).length : 0;
        var all_length = content.length;
        
        //var LEFT = $('.edit-pls-name').val().length * 20;
        var LEFT = ch_length * 20 + (all_length - ch_length) * 14 + 30
        LEFT > 300 ? LEFT = 300 : '';
        $('.box-header .priority').text(showText).css('left', LEFT + 'px');
    }

    function showNewPage() {
        $('#edit-page-container')
            .html(templates.channel_adEdit())
            .removeClass('none');
            $('.sidebar-mini').css('overflow-y','hidden')
        selectLanguage();
        $('.addAdsResources').prop('disabled', true);
        bindEvent();
    }

    function openPlaylist(id) {
        var behavior = localStorage.getItem('behavior');
        var _mtrType = localStorage.getItem('mtrType');
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'query',
            id: id,
            material_type_id: _mtrType == 'Video' ? 1 : 2,
            behavior:behavior,
            pager: {
                keyword: '',
                page: 1,
                per_page: 10
            }
        })
        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                if(res.adv_pls.length > 0){
                    var pls_info = res.adv_pls[0];
                }else{
                    alert('无权限查看本播单信息！')
                    window.history.go(-1)
                    return
                }
                
                $('#edit-page-container')
                    .html(templates.channel_adEdit(pls_info))
                    .removeClass('none');
                    $('.sidebar-mini').css('overflow-y','hidden')
                if (pls_info) {
                    playlistAttr.priority = pls_info.priority;
                    playlistAttr.type = pls_info.type;
                    playlistAttr.location = pls_info.location;
                    playlistAttr.startTime = pls_info.start_time != 'None' ? pls_info.start_time.split(' ')[1].slice(0, 5) : '';
                    playlistAttr.endTime = pls_info.end_time != 'None' ? pls_info.end_time.split(' ')[1].slice(0, 5) : '';
                }
                selectLanguage();
                showPriorityText(pls_info);
                bindEvent();
                renderPlaylist(id);
            }
        });
    }

    function renderPlaylist(id) {
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'query',
            pl_id: id
        });

        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement';
        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                var advs = res.advs;
                advs.map(function (v) {
                    var ss = blkgetDate(v.start_date, v.end_date);
                    var day_1 = Number((parseFloat(ss.per) * parseInt(ss.days) / 100).toFixed(1));
                    var day_2 = Number((parseInt(ss.days) - (parseFloat(ss.per) * parseInt(ss.days) / 100)).toFixed(1));
                    var _width = day_1 / (day_1 + day_2) * 100 + "%";
                    var _href = 'href="#materials/materials_editPage?id='+v.material_url+'"';
                    _href = v.type == 'Program' ? _href : '';
                    // var _href = '#materials/materials_editPage?id='+ v.material_url;
                    // _href = v.type == 'Program' ? _href : '';
                    $("#adList").append('<li id=adRes_' + v.id + ' data-mtrid='+v.material_id+' data-type=' + v.type + ' data-dur=' + v.duration + ' data-odu=' + v.material_duration +' data-cts=' + v.times + ' data-std=' + v.start_date.split(' ')[0] + ' data-end=' + v.end_date.split(' ')[0] + '>' +
                        '<aside>' +
                        '<span>' +
                        //'<label class="resName"><input type="checkBox" class="advChoice" advId="' + v.id + '"><a url="'+v.material_url+'" target="_blank">' + v.name + '</a></label>' +
                        '<label class="resName" title=' + v.name + '><a '+ _href + ' url="' + v.material_url + '">' + v.name + '</a></label>' +
                        '<em>持续时长：' + v.duration + 's</em>' +
                        '<em>播放次数：' + v.times + '次</em>' +
                        '</span>' +
                        '</aside>' +
                        '<aside>' +
                        '<header>' +
                         '<label>已上刊' + day_1 + '天/剩余' + day_2 +'天</label>' +
                        '<b>' +
                        '<i style="width:' + _width + ';"></i>' +
                        '</b>' +
                        '</header>' +
                        '<footer>' +
                        '<em>上刊日期：' + v.start_date.split(' ')[0] + '</em>' +
                        '<em>下刊日期：' + v.end_date.split(' ')[0] + '</em>' +
                        '</footer>' +
                        '</aside>' +
                        '<aside>' +
                        '<i class="advCopy" advId="' + v.id + '">复制</i>' +
                        '<i class="advDel" advId="' + v.id + '">删除</i>' +
                        '</aside>' +
                        '</li>');
                })
                bindListEvent();
            } else {
                // alert('error!')
            }
        });

        $('#adList input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        });
        resizeHeight();
    }

    function resizeHeight() {
        var height = window.innerHeight;
        $('#adList').css('height', height - 180 + 'px');
    }

    function getPlaylistType() {
        var queryString = window.location.hash.match(/\?(.*)/);
        queryString = queryString[1];
        switch (queryString) {
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
                return Number(queryString.split('=')[1]);
                break;
        }
    }

    function addAdsResources() {
        $('.adDetail').addClass('showAdAttr');
        $('.playlist').addClass('moveLeft');
        $('.adName label').text('添加资源');
        $('#admName').hide();
        $('#mtr_addMtr').show();
        $('.srcDuration').hide();
        $('#admCounts, #admOnline, #admOffline, #admOntime, #admDuration').val('');
    }

    function addMaterial() {
        var page = "resources/pages/channel/addMtr.html";
        UTIL.cover.load(page);
    }

    exports.addAds = function (mtrData) {
        materialData = mtrData;
        var len = mtrData.length;
        var tpText = '';
        var $input = $('#admName');
        var _name = mtrData[0].Name || mtrData[0].name;
        $input.val(_name + '等' + len + '个资源...').show();
        $input.attr('data-toggle', 'tooltip');
        $input.tooltip();
        mtrData.map(function (v) {
            tpText += (v.Name || v.name) + '\n';
        })
        $input.attr('title', tpText);
    }

    function saveAdsResources() {
        if (!materialData.length) return;
        materialData.map(function (v) {
            var onlineArr = $('#admOnline').val().split('/');
            var startDate = onlineArr[2] + '-' + onlineArr[0] + '-' + onlineArr[1] + ' 00:00:00';
            var offlineArr = $('#admOffline').val().split('/');
            var endDate = offlineArr[2] + '-' + offlineArr[0] + '-' + offlineArr[1] + ' 00:00:00';
            var ss = blkgetDate(startDate, endDate);
            var day_1 = Number((parseFloat(ss.per) * parseInt(ss.days) / 100).toFixed(1));
            var day_2 = Number((parseInt(ss.days) - (parseFloat(ss.per) * parseInt(ss.days) / 100)).toFixed(1));
            var _width = day_1 / (day_1 + day_2) * 100 + "%";
            var _duration = +$('#admDuration').val() || durationToSecond(v.Duration || v.members[0].Duration);

            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: 'create',
                name: v.Name || v.name,
                // duration: durationToSecond(v.Duration || v.members[0].Duration),
                duration: _duration,
                times: $('#admCounts').val(),
                start_date: startDate,
                end_date: endDate,
                material_id: v.ID || v.id,
                adv_pl_id: playlistId,
            })
            var _url = CONFIG.serverRoot + '/backend_mgt/advertisement';
            var _href = 'href="#materials/materials_editPage?id='+v.ID+'"';
            _href = v.Type_Name == 'Program' ? _href : '';
            UTIL.ajax('post', _url, data, function (res) {
                if (res.rescode == '200') {
                    $("#adList").append('<li id=adRes_'+res.id+' data-mtrid='+v.ID+' data-type=' + v.Type_Name + ' data-odu=' + (v.Duration || v.members[0].Duration) +' data-dur=' + _duration + ' data-cts=' + $('#admCounts').val() + ' data-std=' + startDate.split(' ')[0] + ' data-end=' + endDate.split(' ')[0]+'>' +
                        '<aside>' +
                        '<span>' +
                        //'<label class="resName"><input type="checkBox" class="advChoice" advId="' + res.id + '"><a url="' + v.URL +'" target="_blank">' + v.Name + '</a></label>' +
                        '<label class="resName" title='+(v.Name || v.name)+'><a '+_href+' url="' + (v.URL || v.id) + '">' + (v.Name || v.name) + '</a></label>' +
                        '<em>持续时长：' + _duration + 's</em>' + 
                        '<em>播放次数：' + $('#admCounts').val() + '次</em>' +
                        '</span>' +
                        '</aside>' +
                        '<aside>' +
                        '<header>' +
                        '<label>已上刊' + day_1 + '天/剩余' + day_2 + '天</label>' +
                        '<b>' +
                        '<i style="width:' + _width + ';"></i>' +
                        '</b>' +
                        '</header>' +
                        '<footer>' +
                        '<em>上刊日期：' + startDate.split(' ')[0] + '</em>' +
                        '<em>下刊日期：' + endDate.split(' ')[0] + '</em>' +
                        '</footer>' +
                        '</aside>' +
                        '<aside>' +
                        '<i class="advCopy" advId="' + res.id + '">复制</i>' +
                        '<i class="advDel" advId="' + res.id + '">删除</i>' +
                        '</aside>' +
                        '</li>');

                    bindListEvent();
                }
            });
           
        })
    }

    function blkgetDate(startD, endD) {
        startD = startD.replace(/\-/g, "/");
        endD = endD.replace(/\-/g, "/");

        var tD = new Date();
        var percent;
        if (tD < new Date(startD)) {
            percent = '0';
        } else if (tD > new Date(endD)) {
            percent = '100%';
        } else {
            percent = ((tD.getTime() - new Date(startD).getTime()) / (new Date(endD).getTime() - new Date(startD).getTime()) * 100).toFixed(3) + "%";
        }

        var daysNO = (new Date(endD.substring(0, 10)).getTime() - new Date(startD.substring(0, 10)).getTime()) / (24 * 3600 * 1000) + 1;
        var returnMsg = {};
        returnMsg.per = percent;
        returnMsg.days = daysNO;

        return returnMsg;
    }

    function calculateDate() {
        var t1 = $('#admOnline').val();
        var t2 = $('#admOffline').val();
        var d1 = t1.replace(/\-/g, "/");
        var d2 = t2.replace(/\-/g, "/");
        var onlineTime = new Date(d2) - new Date(d1);
        return onlineTime / 1000 / 3600 / 24;
    }

    function durationToSecond(value){
        // var [_hour, _minute, _second] = value.split(':');
        var time = value.split(':');
        var  _hour = time[0], _minute = time[1], _second = time[2];
        // var [_hour1, _hour2] = _hour.split('');
        var time_hour = _hour.split('');
        var _hour1 = time_hour[0], _hour2 = time_hour[1];
        // var [_minute1, _minute2] = _minute.split('');
        var time_minute = _minute.split('');
        var _minute1 = time_minute[0], _minute2 = time_minute[1];
        // var [_second1, _second2] = _second.split('');
        var time_second = _second.split('');
        var _second1 = time_second[0], _second2 = time_second[1];
        return +_hour1 * 10 * 60 * 60 + (+_hour2) * 60 *60 + (+_minute1) * 10 * 60 + (+_minute2) * 60 + (+_second1) * 10 + (+_second2);
    }


    function deleteAdsResource(id) {
            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: 'delete',
                ids: [id]
            })
            var _url = CONFIG.serverRoot + '/backend_mgt/advertisement';
            UTIL.ajax('post', _url, data, function (res) {
                if (res.rescode == '200') {
                    $('.advDel[advid=' + id + ']').parents('li').remove();
                }
            })

    }

    function copyAdsResource(id) {
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'copy',
            ids: [id]
        })

        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement';

        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                alert('复制成功');
                $('#adList').empty();
                renderPlaylist(playlistId);
            }
        });
    }

    function updateAdsResource() {
        var id = $('.adName label').attr('resId').split('_')[1];
        var _thisLi = $('#adRes_'+id);
        var onlineArr = $('#admOnline').val().split('/');
        var startDate = onlineArr[2] + '-' + onlineArr[0] + '-' + onlineArr[1] + ' 00:00:00';
        var offlineArr = $('#admOffline').val().split('/');
        var endDate = offlineArr[2] + '-' + offlineArr[0] + '-' + offlineArr[1] + ' 00:00:00';
        var ss = blkgetDate(startDate, endDate);
        var day_1 = Number((parseFloat(ss.per) * parseInt(ss.days) / 100).toFixed(1));
        var day_2 = Number((parseInt(ss.days) - (parseFloat(ss.per) * parseInt(ss.days) / 100)).toFixed(1));
        var _width = day_1 / (day_1 + day_2) * 100 + "%";
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'change',
            name: $('#admName').val(),
            duration: $('#admDuration').val(),
            times: $('#admCounts').val(),
            start_date: startDate,
            end_date: endDate,
            id: id
        })
        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement';

        var materialType = _thisLi.attr('data-type');
        var _href = 'href=' + _thisLi.find('a').attr('href');
        _href = materialType == 'Program' ? _href : '';
        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                var _url = $('#adRes_' + id).find('a').attr('url');
                $('#adRes_' + id).empty().append('<aside>' +
                    '<span>' +
                    //'<label class="resName"><input type="checkBox" class="advChoice" advId="' + id + '"><a url="' + _url +'" target="_blank">' + $('#admName').val() + '</a></label>' +
                    '<label class="resName"><a '+_href+' url="' + _url + '">' + $('#admName').val() + '</a></label>' +
                    '<em>持续时长：' + $('#admDuration').val()+ 's</em>' +
                    '<em>播放次数：' + $('#admCounts').val() + '次</em>' +
                    '</span>' +
                    '</aside>' +
                    '<aside>' +
                    '<header>' +
                    '<label>已上刊' + day_1 + '天/剩余' + day_2 + '天</label>' +
                    '<b>' +
                    '<i style="width:' + _width + ';"></i>' +
                    '</b>' +
                    '</header>' +
                    '<footer>' +
                    '<em>上刊日期：' + startDate.split(' ')[0] + '</em>' +
                    '<em>下刊日期：' + endDate.split(' ')[0] + '</em>' +
                    '</footer>' +
                    '</aside>' +
                    '<aside>' +
                    '<i class="advCopy" advId="' + id + '">复制</i>' +
                    '<i class="advDel" advId="' + id + '">删除</i>' +
                    '</aside>')
                var dataObj = {
                    'data-dur': $('#admDuration').val(),
                    'data-cts': $('#admCounts').val(),
                    'data-std': startDate.split(' ')[0],
                    'data-end':endDate.split(' ')[0],
                }
                $('#adRes_' + id).attr(dataObj);
                bindListEvent();
            }
        })

    }

    function addPlaylist() {
        var plsName = $('.edit-pls-name').val();
        var type = getPlaylistType();
        var sTime = exports.startTime ? '9999-01-01 ' + exports.startTime + ':00' : '';
        var eTime = exports.endTime ? '9999-01-01 ' + exports.endTime + ':00' : '';
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'create',
            material_type_id: mtrType == 'Video' ? 1 : 2,
            name: plsName,
            type: type,
            priority: exports.priority || 0,
            location: exports.location || 0,
            start_time: sTime,
            end_time: eTime,
        })

        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';

        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                alert('创建成功');
                location.hash = '#channel/adEdit?id=' + res.id;
                $('.addAdsResources').prop('disabled', false);
                playlistAttr.priority = '';
                playlistAttr.type = '';
                playlistAttr.location = '';
                playlistAttr.startTime = '';
                playlistAttr.endTime = '';
            }
        });
    }

    function updatePlaylist() {
        var plsName = $('.edit-pls-name').val();
        var id = getPlaylistType();
        var sTime = playlistAttr.startTime ? '9999-01-01 ' + playlistAttr.startTime + ':00' : '';
        var eTime = playlistAttr.endTime ? '9999-01-01 ' + playlistAttr.endTime + ':00' : '';
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: 'change',
            id: id,
            name: plsName,
            type: playlistAttr.type,
            priority: playlistAttr.priority || 0,
            location: playlistAttr.location || 0,
            start_time: sTime,
            end_time: eTime,
        })

        var _url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';

        UTIL.ajax('post', _url, data, function (res) {
            if (res.rescode == '200') {
                alert('修改成功');
            }
            $('#plsSave').prop('disabled', false);
        });
    }

})