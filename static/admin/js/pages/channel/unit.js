define(function(require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var templates = require("common/templates");
    var unitMtrList = null;
    var languageJSON = CONFIG.languageJson.unitManagement;
    var typeName = null;
    exports.init = function() {
        selectLanguage();
        bind();
        $("#mtrUnit").click();
    };

    function selectLanguage() {
        $("#unit_title").text(languageJSON.unitTitle);
        $("#mtrUnit").html('<i class="fa fa-video-camera"></i> ' + languageJSON.unitMtr);
        $("#mtrTerm").html('<i class="fa fa-image"></i> ' + languageJSON.unitTerm);
    }

    function bind() {
        $("#mtrUnit").click(function() {
            typeName = "MTR";
            renderMutex();
        });
        $("#mtrTerm").click(function() {
            typeName = "TERM";
            renderMutex();
        });
        $("#mtrSearch").keyup(function(event) {
            if (event.keyCode == 13) {
                var searchKeyword = $("#mtrSearch").val();
                if (!UTIL.isValidated("keyword", searchKeyword)) return;
                onSearch(event)
            }
        });
        $("#mtrSearch").next().click(onSearch);

        function onSearch(event) {
            last = event.timeStamp;
            setTimeout(function() {
                if (last - event.timeStamp == 0) {
                    var searchKeyword = $("#mtrSearch").val();
                    if (!UTIL.isValidated("keyword", searchKeyword)) return;
                    exports.loadPage(1, mtrType)
                }
            }, 500)
        }
    }

    function renderMutex() {
        $("#list_box").css("display", "block");
        $("#unitMtrList .addtag").text(languageJSON[typeName]);
        $("#mtrChoise li").removeClass("active");
        $("#mtrChoise li").each(function() {
            if ($(this).attr("typename") == typeName) {
                $(this).addClass("active")
            }
        });
        $("#unitMtrList").show();
        $('#unitMtrList h3 i').removeClass().addClass(typeName == 'MTR' ? 'fa fa-folder-open-o' : 'fa fa-television');
        renderMutexTags();
        bindMutexEvent()
    }

    function bindMutexEvent() {
        $(".addbox").off().on("click", function() {
            $(".addtag, .userTips").addClass("showBox");
            
            $(".namebox").focus()
        });
        $(".namebox").off("blur").on("blur", function() {
            $(".addtag, .savename, .userTips").removeClass("showBox")
        });
        $(".savename").off().on("click", function(e) {
            e.stopPropagation();
            var tagName = $(".namebox").val();
            addMutexTag(tagName);
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

    function addMutexTag(tagName) {
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "create",
            name: tagName
        });
        var _url = typeName == 'MTR' ? "/backend_mgt/union_screen_material" : "/backend_mgt/unite_screen_term";
        var url = CONFIG.serverRoot + _url;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                var _list = '<li mutexID="' + res.id + '" class="mutexBox">' + "<h3>" + tagName + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                $("#unitMtrList").append(_list);
                $(".namebox").trigger("blur");
                var li = $('li[mutexID="' + res.id + '"]');
                bindMutexListEvent(li)
            }
        })
    }

    function bindMutexListEvent($li) {
        var _listID = Number($li.attr("mutexID"));
        var _mtrid = null, _from = null, _to = null;
        $li.find("h3 i").on("click", function() {
            deleteUnitTag($li)
        });
        $li.children(".addmtr").on("click", function() {
            addUnitMaterial($li)
        });
        $li.find(".mtrlist i").on("click", function() {
            var ul_li = $(this).parent();
            var isFirst = $(ul_li).index == 0 ? true : false;
            deleteUnitMaterial(_listID, ul_li, isFirst)
        })


        $li.find('.mtrlist').off('scroll').on('scroll', function(e){
            var _scrolledTop = e.currentTarget.scrollTop;
            $li.find('.mtrSeq')[0].scrollTop = _scrolledTop;
        })

        $li.find('.mtrlist').off('sortstart').on('sortstart', function(e, ui){
            _from = ui.item.index() + 1;
            _mtrid = +ui.item.attr('mtrid');
        })

        $li.find('.mtrlist').off('sortstop').on('sortstop', function(e, ui){
            _to = ui.item.index() + 1;
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
            var _url = CONFIG.serverRoot + "/backend_mgt/union_screen_material";
            UTIL.ajax("post", _url, data, function(res) {
                if (res.rescode == 200) {
                    console.log('移动成功');
                }
            })


        })

        $li.find('a').on('click', function(e){
            e.stopPropagation();
            var m_url = $(this).attr('url');
            var m_mtrType = $(this).attr('mtrtypeid');
            exports.url = m_url;
            exports.mtrType = m_mtrType;
            var page = "resources/pages/materials/materials_preview.html";
            UTIL.cover.load(page, 3);
        })

    }

    function deleteUnitTag(li) {
        var _listID = Number(li.attr("mutexID"));
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "delete",
            ids: [_listID]
        });
        var _url = typeName == 'MTR' ? "/backend_mgt/union_screen_material" : "/backend_mgt/unite_screen_term";
        var url = CONFIG.serverRoot + _url;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                li.remove()
            }
        })
    }

    function addUnitMaterial(li) {
        var page = "resources/pages/channel/addMtr.html";
        UTIL.cover.load(page);
        unitMtrList = li
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
        var url = CONFIG.serverRoot + "/backend_mgt/union_screen_material";
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
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
                            var _name = _first.find('span:first').text();
                            var _duration  =_first.find('span:last').text();
                            var mtrId = Number(_first.attr('mtrid'));
                            var data = JSON.stringify({
                                action: 'Put',
                                project_name: CONFIG.projectName,
                                Data: {
                                    Name: _name,
                                    duration: durationToSecond(_duration)
                                }
                            });
                            var url = requestUrl + '/backend_mgt/v1/materials/' + mtrId;
                            util.ajax('post', url, data, function(msg){
                                if(msg.rescode == '200'){
                                    console.log('duration修改成功');
                                }
                            })
                        }
                        console.log('删除成功')
                    }
                })

                li.remove();
                $('.mutexBox[mutexid="'+listid+'"]').find('.mtrSeq').children().eq(-1).remove();
            }
        })
    }

    function renderMutexTags() {
        $("#unitMtrList li:not(:first-child)").remove();
        var post_data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "query"
        });
        var _url = typeName == 'MTR' ? "/backend_mgt/union_screen_material" : "/backend_mgt/unite_screen_term";
        var url = CONFIG.serverRoot + _url;
        UTIL.ajax("post", url, post_data, function(res) {
            if (res.rescode == 200) {
                res.groups.map(function(v) {
                    var _list = '<li mutexID="' + v.id + '" class="mutexBox">' + "<h3>" + v.name + '<i class="fa fa-close"></i></h3>' + '<ul class="mtrSeq"></ul><ul class="mtrlist"></ul>' + '<div id="mtr_addMtr" class="addmtr" typeid="1">添加</div>' + "</li>";
                    $("#unitMtrList").append(_list);
                    v.members.map(function(x, i) {
                        var _mtrSeq = '<li class="seqNumber">'+ (i+1) +'. </li>';
                        var _mtrlist = '<li mtrid="' + x.ID + '"><i class="fa fa-trash-o""></i>' + "<span><a mtrtypeid=" + x.Type_ID + " url=" + x.URL + ">" + x.Name + "</a></span>" + "<span>" + x.Duration + "</span>" + "</li>";
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
        var fakeMtrName = unitMtrList.find('h3').text();
        var mtrIDs = [];
        var _sequence = unitMtrList.find('.mtrlist').children().length;
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

                var material = {
                    name:fakeMtrName,
                    name_eng: "",
                    url_name: unitMtrListID + '',
                    description: "",
                    is_live: "0",
                    Download_Auth_Type: "",
                    Download_Auth_Paras: "",
                    size: mtrData[0].Size,
                    md5: '',
                    duration: durationToSecond(mtrData[0].Duration),
                    create_time:getNowFormatDate(),
                    CreateUser: CONFIG.userName
                };
                var data = JSON.stringify({
                    action: 'Post',
                    project_name: CONFIG.projectName,
                    material: material
                });
                var url = CONFIG.serverRoot + '/backend_mgt/v1/materials';
                UTIL.ajax('post', url, data, function (res) {
                    if(res.rescode!='200'){
                        return console.log('添加资源错误!');
                    }
                })
                var _length = unitMtrList.find('.mtrlist').children().length;
                mtrData.map(function(v) {
                    var _mtrSeq = '<li class="seqNumber">'+ (++_length) +'. </li>';
                    var _mtrlist = '<li mtrid="' + v.ID + '"><i class="fa fa-trash-o""></i>' + "<span><a mtrtypeid=" + v.Type_ID + " url=" + v.URL + ">" + v.Name + "</a></span>" + "<span>" + v.Duration + "</span>" + "</li>";
                    unitMtrList.children(".mtrlist").append(_mtrlist);
                    unitMtrList.children(".mtrSeq").append(_mtrSeq);
                    var li = $('li[mutexID="' + unitMtrListID + '"]');
                    bindMutexListEvent(li)
                })
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
        var [_hour, _minute, _second] = value.split(':');
        var [_hour1, _hour2] = _hour.split('');
        var [_minute1, _minute2] = _minute.split('');
        var [_second1, _second2] = _second.split('');
        return +_hour1 * 10 * 60 * 60 + (+_hour2) * 60 *60 + (+_minute1) * 10 * 60 + (+_minute2) * 60 + (+_second1) * 10 + (+_second2);
    }
});