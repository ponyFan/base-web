define(function(require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require("common/templates");
    var getClassAndTerm = require("pages/terminal/getTermClassAndTerm.js");
    var languageJSON = CONFIG.languageJson.unitManagement;

    exports.init = function() {
        var unitMtrList = null;
        var typeName = null;
        var _URL = null;
        selectLanguage();
        checkURL();
        renderTags();
    };

    function selectLanguage() {
        $("#unitMtr_title").text(languageJSON.unitMtr);
        $("#unitTerm_title").text(languageJSON.unitTerm);
    }

    function checkURL(){
        if(window.location.hash.indexOf('unitMaterial')>0){
            typeName = 'MTR';
        };
        if(window.location.hash.indexOf('unitTerm')>0){
            typeName = 'TERM';
        }
        _URL = typeName == 'MTR' ? "/backend_mgt/union_screen_material" : "/backend_mgt/unite_screen_term";
    }


    function renderTags() {
        $("#list_box").css("display", "block");
        $("#unitMtrList .addtag").text(languageJSON[typeName]);
        
        $('#unitMtrList h3 i').removeClass().addClass(typeName == 'MTR' ? 'fa fa-folder-open-o' : 'fa fa-television');
        renderAllTags();
        bindMutexEvent()
    }

    function bindMutexEvent() {
        // $(".addbox").off().on("click", function() {
        //     $(".addtag, .userTips").addClass("showBox");
            
        //     $(".namebox").focus()
        // });
        // $(".namebox").off("blur").on("blur", function() {
        //     $(".addtag, .savename, .userTips").removeClass("showBox")
        // });
        $('#unitMtrList').off().on('click',function(e){
            if($(e.target).hasClass('addbox') || $(e.target).parent().hasClass('addbox')){
                //  点击添加框-显示输入框
                $(".addtag, .userTips").addClass("showBox");
                $(".namebox").focus()
            }else{
                //  点击添加框以外地方-隐藏输入框
                $(".namebox").val('')
                $(".addtag, .savename, .userTips").removeClass("showBox")
            }
        })
        $(".savename").off().on("click", function(e) {
            e.stopPropagation();
            var tagName = $(".namebox").val().replace(/^\s+|\s+$/g,"");
            if(!tagName){
                return
            }
            addUnitTag(tagName);
            $(".namebox").val("");
            $('.addbox p').remove();
        });
        $(".namebox").off("keyup").on("keyup", function(event) {
            if ($(this).val().length > 0) {
                $(".savename").addClass("showBox");
                if (event.keyCode == 13) {
                    $(".savename").trigger("click")
                }
            } else {
                $(".savename").removeClass("showBox")
            }
        })
    }

    function addUnitTag(tagName) {
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "create",
            name: tagName || '新建资源组'
        });
        var url = CONFIG.serverRoot + _URL;
        var mtrID = -1;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                $(".addtag, .savename, .userTips").removeClass("showBox")
                alert(languageJSON[typeName]+'成功！')
                if(typeName == 'TERM'){
                    var _list = '<li mutexID="' + res.id + '" class="mutexBox">' + "<h3>" + tagName + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrSeq"></ul><ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                    $("#unitMtrList").append(_list);
                    $(".namebox").trigger("blur");
                    var li = $('li[mutexID="' + res.id + '"]');
                    bindMutexListEvent(li)
                    return;
                }
                var material = {
                    name:tagName,
                    name_eng: "",
                    url_name: res.id + '',
                    description: "",
                    is_live: "0",
                    Download_Auth_Type: "",
                    Download_Auth_Paras: "",
                    size: 0,
                    md5: '',
                    duration: 0,
                    create_time:getNowFormatDate(),
                    CreateUser: CONFIG.userName,
                    type: 7
                };
                var data = JSON.stringify({
                    action: 'Post',
                    project_name: CONFIG.projectName,
                    material: material
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v1/materials';
                UTIL.ajax('post', url, data, function (msg) {
                    if(msg.rescode!='200'){
                        return console.log('添加资源错误!');
                    }
                    mtrID = msg.material_id;
                    var _list = '<li mtrID="'+mtrID+'" mutexID="' + res.id + '" class="mutexBox">' + "<h3>" + tagName + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrSeq"></ul><ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                    $("#unitMtrList").append(_list);
                    $(".namebox").trigger("blur");
                    var li = $('li[mutexID="' + res.id + '"]');
                    bindMutexListEvent(li)
                })
                
            }
        })
    }

    function bindMutexListEvent($li) {
        var _listID = Number($li.attr("mutexID"));
        var _mtrid = null, _from = null, _to = null;
        $li.find("h3 i").off("click").on("click", function() {
            var titleInfo = ''
            if(typeName == 'MTR'){
                titleInfo='是否删除该资源组？'
            }else{
                titleInfo='是否删除该终端组？'
            }
            var r=confirm(titleInfo);
            if (r==true){
                deleteUnitTag($li)
            }
        });
        $li.children(".addmtr").off("click").on("click", function() {
            typeName == 'MTR'?addUnitMaterial($li) : addUnitTerm($li);
        });
        $li.find(".mtrlist i").off("click").on("click", function() {
            var ul_li = $(this).parent();
            var isFirst = $(ul_li).index() == 0 ? true : false;
            var titleInfo = ''
            if(typeName == 'MTR'){
                titleInfo='是否删除该资源？'
            }else{
                titleInfo='是否删除该终端？'
            }
            var r=confirm(titleInfo);
            if (r==true){
                deleteUnitMaterial(_listID, ul_li, isFirst)
            }
            
        })


        $li.find('.mtrlist').off('scroll').on('scroll', function(e){
            var _scrolledTop = e.currentTarget.scrollTop;
            $li.find('.mtrSeq')[0].scrollTop = _scrolledTop;
        })

        // $li.find('.mtrlist').off('sortstart').on('sortstart', function(e, ui){
        //     _from = ui.item.index() + 1;
        //     _mtrid = +ui.item.attr('mtrid');
        // })

        // $li.find('.mtrlist').off('sortstop').on('sortstop', function(e, ui){
        //     _to = ui.item.index() + 1;
        //     var isFromFirst = _from == 1 ? true : false;
        //     var isToFirst = _to == 1 ? true : false;
        //     var data = JSON.stringify({
        //         project_name: CONFIG.projectName,
        //         action: "move", 
        //         id: _listID,
        //         member: {
        //             id: _mtrid,
        //             from: _from,
        //             to:_to
        //         }
        //     });
        //     var url = CONFIG.serverRoot + _URL;
        //     UTIL.ajax("post", url, data, function(res) {
        //         if (res.rescode == 200) {
        //             if(isFromFirst || isToFirst){
        //                 if(isFromFirst){
        //                     var _first = $($li.find('.mtrlist').children()[_to-1])
        //                 }else{
        //                     var _first = $($li.find('.mtrlist').children()[_from-1])
        //                 }
                       
        //                 var _name = _first.find('span:first').text();
        //                 var _duration  =_first.find('span:last').text();
        //                 var mtrId = Number(_first.attr('mtrid'));
        //                 var data = JSON.stringify({
        //                     action: 'Put',
        //                     project_name: CONFIG.projectName,
        //                     Data: {
        //                         Name: _name,
        //                         duration: durationToSecond(_duration)
        //                     }
        //                 });
        //                 var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
        //                 UTIL.ajax('post', url, data, function(msg){
        //                     if(msg.rescode == '200'){
        //                         console.log('duration修改成功');
        //                     }
        //                 })
        //             }
        //             console.log('移动成功');
        //         }
        //     })


        // })

        $li.find('.mtrlist').sortable({
            start:function(e,ui){
                _from = ui.item.index() + 1;
                _mtrid = +ui.item.attr('mtrid');
            },
            stop: function(e,ui){
                _to = ui.item.index() + 1;
                var isFromFirst = _from == 1 ? true : false;
                var isToFirst = _to == 1 ? true : false;
                var data = JSON.stringify({
                    project_name: CONFIG.projectName,
                    action: "move", 
                    id: _listID,
                    member: {
                        id: _mtrid,
                        from: _from,
                        to:_to
                    }
                });
                var url = CONFIG.serverRoot + _URL;
                UTIL.ajax("post", url, data, function(res) {
                    if (res.rescode == 200) {
                        console.log(isFromFirst,isToFirst)
                        if(isFromFirst || isToFirst){
                            if(isFromFirst){
                                var _first = $($li.find('.mtrlist').children()[_to-1])
                            }else{
                                var _first = $($li.find('.mtrlist').children()[_from-1])
                            }
                           
                            var _name = _first.find('span:first').text();
                            var _duration  =_first.find('span:last').text();
                            //  只有一个span，联屏终端
                            if(_name == _duration) return
                            var mtrId = Number(_first.attr('mtrid'));
                            console.log(_name,_duration,mtrId)
                            var data = JSON.stringify({
                                action: 'Put',
                                project_name: CONFIG.projectName,
                                Data: {
                                    Name: _name,
                                    duration: durationToSecond(_duration)
                                }
                            });
                            var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + mtrId;
                            UTIL.ajax('post', url, data, function(msg){
                                if(msg.rescode == '200'){
                                    console.log('duration修改成功');
                                }
                            })
                        }
                        console.log('移动成功');
                    }
                })
            }
        })

        $li.find('a').on('click', function(e){
            if(!$(e.target).attr('url')){
                return
            } else if( $(e.target).attr('url').indexOf('http:')<0){
                alert('该资源无法预览！');
                return
            }
            e.stopPropagation();
            if(typeName == 'MTR'){
                var m_url = $(this).attr('url');
                var m_mtrType = $(this).attr('mtrtypeid');
                exports.url = m_url;
                exports.mtrType = m_mtrType;
                var page = "resources/pages/materials/materials_preview.html";
                UTIL.cover.load(page, 3);
            }else{
                var termName = $(this).text();
                window.location.hash = '#terminal/list';
                var _interval = setInterval(
                    function(){
                        if(localStorage.getItem('renderDone')){
                            $('#term_search').val(termName);
                            $('.form-control-feedback').click();
                            clearInterval(_interval);
                        }
                    }, 500);
            }
            
        })

    }

    function deleteUnitTag(li) {
        var _listID = Number(li.attr("mutexID"));
        var _mtrID = Number(li.attr('mtrid'));
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "delete",
            ids: [_listID]
        });
        
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                var data = JSON.stringify({
                    action: 'DeleteMulti',
                    project_name: CONFIG.projectName,
                    MaterialIDs: [_mtrID],
                    type_name: 'UnionScreen'
                });
                var _url = CONFIG.serverRoot + '/backend_mgt/v1/materials';
                UTIL.ajax('post', _url, data, function () {
                    alert('删除成功')
                })
                li.remove()
            }
        })
    }

    function addUnitMaterial(li) {
        var page = "resources/pages/channel/addMtr.html";
        UTIL.cover.load(page);
        unitMtrList = li
    }

    function addUnitTerm(li){
        var unitTermID = Number(li.attr("mutexID"));
        var _sequence = li.find('.mtrlist').children().length;
        var page = "resources/pages/terminal/getTermClassAndTerm.html";
        UTIL.cover.load(page);
        getClassAndTerm.title = '添加终端';
        getClassAndTerm.category = 'term_unit';
        getClassAndTerm.save = function(data) {
            var termInfo = data.termList.map(function(v) {
                if(typeof v === 'object')   return v;
            });
            var terms = data.termList.map(function(v) {
                return {
                    id:Number(v.termID),
                    sequence: ++_sequence
                }
            });
            var category_ids = data.categoryList.map(function(v) {
                return Number(v.categoryID)
            });
            var post_data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: "add",
                id: unitTermID,
                members: terms,
            });
            var url = CONFIG.serverRoot + _URL;
            UTIL.ajax("post", url, post_data, function(msg) {
                if (msg.rescode == 200) {
                    UTIL.cover.close();
                    var _length = li.find('.mtrlist').children().length;
                    termInfo.map(function(v) {
                        var _termSeq = '<li class="seqNumber">'+ (++_length) +'. </li>';
                        //var _termList = '<li mtrid="' + v.termID + '"><i class="fa fa-trash-o""></i>' + "<span>" + v.name + "</a></span></li>";
                        var _termList = '<li status="'+v.Status+'" mtrid="' + v.termID + '"><i class="fa fa-trash-o""></i>' + "<span><a>" + v.name + "</a></span></li>"
                        li.children(".mtrlist").append(_termList);
                        li.children(".mtrSeq").append(_termSeq);
                        var _li = $('li[mutexID="' + unitTermID + '"]');
                        bindMutexListEvent(_li)
                    })
                } else {
                    alert("发布失败!");
                    UTIL.cover.close()
                }
            })
        }
    }

    function deleteUnitMaterial(listid, li, isFirst) {
        var mtrid = Number(li.attr("mtrid"));
        var _sequence = Number(li.index()) + 1;
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "remove",
            id: listid,
            members: [{
                id:mtrid,
                sequence: _sequence
            }]
        });
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                if(typeName == 'TERM'){
                    
                }else{
                    var data = JSON.stringify({
                        Project: CONFIG.projectName,
                        Action: 'delete',
                        id:listid,
                    });
                    var _url = CONFIG.serverRoot + '/backend_mgt/v2/programs';
                    UTIL.ajax('post', _url, data, function(res){
                        if(res.rescode == '200'){
                            if(isFirst){
                                var _first = li.next();
                                var _duration  =_first.find('span:last').text();
                                if(li.parent('.mtrlist').children().length==1){
                                    _first = li;
                                    _duration = 0;
                                }
                                //var _name = _first.find('span:first').text();
                                //var mtrId = Number(_first.attr('mtrid'));
                                var unitTagMtrID = Number(_first.parents('.mutexBox').attr('mtrid'));
                                var unitTagName = _first.parents('.mutexBox').find('h3').text();
                                var data = JSON.stringify({
                                    action: 'Put',
                                    project_name: CONFIG.projectName,
                                    Data: {
                                        Name: unitTagName,
                                        duration: _duration == 0 ? 0:durationToSecond(_duration),
                                    }
                                });
                                var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + unitTagMtrID;
                                UTIL.ajax('post', url, data, function(msg){
                                    if(msg.rescode == '200'){
                                        li.remove();
                                        $('.mutexBox[mutexid="'+listid+'"]').find('.mtrSeq').children().eq(-1).remove();
                                        console.log('duration修改成功');
                                        
                                    }
                                })
                            }
                            console.log('删除成功')
                        }
                    })
                }
                if(!isFirst || typeName == 'TERM'){
                    li.remove();
                    $('.mutexBox[mutexid="'+listid+'"]').find('.mtrSeq').children().eq(-1).remove();
                }
            }
        })
    }

    function renderAllTags() {
        $("#unitMtrList li:not(:first-child)").remove();
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "query"
        });
        
        var url = CONFIG.serverRoot + _URL;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                res.groups.map(function(v) {
                    var _list = '<li mtrID="'+v.material_id+'" mutexID="' + v.id + '" class="mutexBox">' + "<h3 style='height:36px;'>" + v.name + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrSeq"></ul><ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                    $("#unitMtrList").append(_list);
                    v.members.map(function(x, i) {
                        var _mtrSeq = '<li class="seqNumber">'+ (i+1) +'. </li>';
                        if(typeName == 'MTR'){
                            var _mtrlist = '<li mtrid="' + x.ID + '"><i class="fa fa-trash-o""></i>' + "<span><a mtrtypeid=" + x.Type_ID + " url=" + x.URL + ">" + x.Name + "</a></span>" + "<span>" + x.Duration + "</span>" + "</li>";
                        }else{
                            var _mtrlist = '<li status="'+x.Status+'" mtrid="' + x.ID + '"><i class="fa fa-trash-o""></i>' + "<span><a>" + x.Name + "</a></span></li>";
                        }
                        
                        $('li[mutexID="' + v.id + '"]').children(".mtrlist").append(_mtrlist);
                        $('li[mutexID="' + v.id + '"]').children(".mtrSeq").append(_mtrSeq);
                    });
                    var li = $('li[mutexID="' + v.id + '"]');
                    bindMutexListEvent(li)
                })
                $('.mtrlist').sortable();
            }
        })
    }

    exports.addMaterials = function(mtrData) {
        var unitMtrListID = Number(unitMtrList.attr("mutexID"));
        var unitTagMtrID = Number(unitMtrList.attr("mtrid"));
        var fakeMtrName = unitMtrList.find('h3').text();
        var mtrIDs = [];
        var _sequence = unitMtrList.find('.mtrlist').children().length;
        var isFirst = unitMtrList.find('.mtrlist').children().length;
        mtrData.map(function(v) {
            mtrIDs.push({
                id: v.ID,
                sequence: ++_sequence
            })
        });
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "add",
            id: unitMtrListID,
            members: mtrIDs
        });
        var url = CONFIG.serverRoot + "/backend_mgt/union_screen_material";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                if(!isFirst){
                    var mtrId = Number(mtrIDs[0].id);
                    var _duration = mtrData[0].Duration;
                    var data = JSON.stringify({
                        action: 'Put',
                        project_name: CONFIG.projectName,
                        Data: {
                            Name: fakeMtrName,
                            duration: durationToSecond(_duration)
                        }
                    });
                    var url = CONFIG.serverRoot + '/backend_mgt/v1/materials/' + unitTagMtrID;
                    UTIL.ajax('post', url, data, function(msg){
                        console.log('修改资源组时长成功');
                    })
                }
                
                var _length = unitMtrList.find('.mtrlist').children().length;
                mtrData.map(function(v) {
                    var _mtrSeq = '<li class="seqNumber">'+ (++_length) +'. </li>';
                    var _mtrlist = '<li mtrid="' + v.ID + '"><i class="fa fa-trash-o""></i>' + "<span><a mtrtypeid=" + v.Type_ID + " url=" + v.URL + ">" + v.Name + "</a></span>" + "<span>" + v.Duration + "</span>" + "</li>";
                    unitMtrList.children(".mtrlist").append(_mtrlist);
                    unitMtrList.children(".mtrSeq").append(_mtrSeq);
                    
                })
                var li = $('li[mutexID="' + unitMtrListID + '"]');
                bindMutexListEvent(li);
            }
        })
    }

    function getNowFormatDate() {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        if (h < 10) h = '0' + h;
        if (m < 10) m = '0' + m;
        if (s < 10) s = '0' + s;
        var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + h + seperator2 + m + seperator2 + s;
        return currentdate;
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
});