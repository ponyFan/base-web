define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        TREE = require("common/treetree.js"),
        _tree,
        _pageSize = 10,
        _pageNO = 1,
        _checkList = [],
        languageJSON,
        languageJSON_ad;
    var selectedTerms = [];
    //var checkTermsList = [];
    exports.save;
    exports.title;
    exports.category;
    exports.channelID;
    exports.playlistID;

    exports.init = function () {
        selectLanguage();
        $('#term_sel_title').html(exports.title);
        initTree();
        initEvent();

        // 关闭
        $('#term_sel_cancel').click(function () {
            UTIL.cover.close();
            selectedTerms=[];
            _checkList.length = 0;
        })

        // 保存
        $('#term_sel_save').click(function () {
            var categoryList = _tree.getSelectedNodeID();
            categoryList = JSON.parse(JSON.stringify(categoryList).replace(/nodeId/g, 'categoryID'));
            var termList = _checkList;
            console.log(categoryList,termList)

            if (categoryList.length === 0 && termList.length === 0) {
                alert(languageJSON.al_selectTtT);
            } else {
                var data = [];
                //是否递归
                if ($("#tree-include").is(':checked')) {
                    data.action = "";
                } else {
                    data.action = "NoRecursive";
                }
                data.categoryList = categoryList;
                data.termList = termList;
                exports.save(data);
                _checkList.length = 0
            }
        })

        var searchKeyword = $.trim($('#term_sel_search').val())
        $('#changeCate').on('change', function(){
            if(exports.category == 'audit_check'){
                if($(this).val() == 2){
                    var data = JSON.stringify({
                        project_name: CONFIG.projectName,
                        action: "query_publish_groups",
                        id: exports.playlistID
                    });
    
                    var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
                    UTIL.ajax("post", url, data, function(msg) {
                        if (msg.rescode == 200) {
                            exports.title = '审核中联屏组播单';
                            $('.col-md-4').hide();
                            $('.col-md-8').css('width','100%');
                            getAuditUnionTerms(msg)
                        } else {
                            alert("联屏终端获取失败!");
                            UTIL.cover.close()
                        }
                    })
                }else{
                    exports.title = '审核中播单';
                    $('.col-md-4').show();
                    $('.col-md-8').css('width','66.6%');
                    loadTermList(_pageNO)
                }
            }else{
                if($(this).val() == 2){
                    getPublishedScreen()
                    
                }else{
                    exports.title = '撤销终端';
                    $('.col-md-4').show();
                    $('.col-md-8').css('width','66.6%');
                    loadTermList(_pageNO)
                }
            }

        })
    }
    function getPublishedScreen(){
        console.log('已发布联屏终端')
        var searchKeyword = $.trim($('#term_sel_search').val())
        var pager = {
            page: _pageNO,
            per_page: _pageSize,
            keyword: searchKeyword,
        }
        var data = JSON.stringify({
            project_name: CONFIG.projectName,
            action: "query_groups",
            id:exports.playlistID,
            pager:pager
        });

        var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
        UTIL.ajax("post", url, data, function(msg) {
            if (msg.rescode == 200) {
                exports.title = '联屏撤销';
                $('.col-md-4').hide();
                $('.col-md-8').css('width','100%');
                renderTermlist(msg)
            } else {
                UTIL.cover.close()
            }
        })
    }
    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.termList;
        languageJSON_ad = CONFIG.languageJson.adPlan;
        $("#term_sel_cancel").html(languageJSON.cancel);
        $("#select-termlist-title").html(languageJSON.all);

        switch(exports.category){
            case 'term_ads':
                $(".lbl-include").html(languageJSON.IncludingAd);
                $("#term_sel_save").html(languageJSON.publish);
                $('.tree-footer-include').hide();
                $('.col-md-4').show();
                break;
            case 'emergency_ch':
                $(".lbl-include").html(languageJSON.includingTerm);
                $("#term_sel_save").html(languageJSON.save);
                $('.tree-footer-include').hide();
                $('.col-md-4').show();
                break;
            case 'unit_publish':
                $('.tree-footer-include').hide();
                $('.col-md-4').hide();
                $('.col-md-8').css('width','100%');
                break;
            case 'audit_check':
                $('.tree-footer-include').hide();
                break;
            case 'published':
                $("#term_sel_save").hide();
                $('.tree-footer-include').hide();
                break;
            default:
                $('.col-md-4').show();
                $('.tree-footer-include').show();
                $(".lbl-include").html(languageJSON.Including_sub_category + ":");
                $("#term_sel_save").html(languageJSON.publish);
            
        }

        $("#term_sel_search").attr("placeholder", languageJSON.pl_searchTermByIP);
        $(".tree-footer-include-tips").html('<i class="fa fa-info-circle"></i>&nbsp;' + languageJSON.Including_sub_category_tips_off)
    }

    function initTree() {
        $("#tree-include").bootstrapToggle();
        //是否递归
        $("#tree-include").change(function () {
            if ($("#tree-include").is(':checked')) {
                $(".tree-footer-include-tips").html('<i class="fa fa-info-circle"></i>&nbsp;' + languageJSON.Including_sub_category_tips_on)
            } else {
                $(".tree-footer-include-tips").html('<i class="fa fa-info-circle"></i>&nbsp;' + languageJSON.Including_sub_category_tips_off)
                
            }
        })

        var dataParameter = {
            "project_name": CONFIG.projectName,
            "action": "getTree"
        };
        exports.channelID ? dataParameter.channelID = Number(exports.channelID) : '';

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
            JSON.stringify(dataParameter),
            function (data) {
                if (data.rescode === '200') {
                    data = data.TermTree.children;
                    if(data.length < 1){                     // 处理当前用户没有分配终端
                        alert('当前用户没有任何所属终端可以发布频道！');
                        $('#term_sel_cancel').click();
                        return
                    }
                    _tree = {domId: 'select-termclass-tree', checkMode: 'multiple'};
                    _tree = TREE.new(_tree);
                    _tree.createTree($('#' + _tree.domId), data);
                    // 选中、打开第一个结点
                    var li = $('#' + _tree.domId).find('li:nth(0)');
                    _tree.openNode(li);
                    _tree.setFocus(li);
                    loadTermList();

                    // 终端分类列表各项点击
                    $('#select-termclass-tree li > a').each(function (i, e) {
                        $(this).click(function (e) {
                            loadTermList();
                        })
                    })
                    if (exports.category == 'term_ads') {
                        $('#select-termclass-tree li  input').on('click', function () {
                            var isSelected = $(this).prop('checked');
                            var termClassId = $('#select-termclass-tree').find('.focus').attr('node-id');
                            var _termClassId = $('#select-termlist-title').attr('cateid');
                            var ischecked = $('#select-termclass-tree').find('.focus input').prop('checked')
                            if (termClassId == _termClassId && ischecked && isSelected) {
                                $('#term_sel_list input').iCheck('check');
                            } else {
                                $('#term_sel_list input').iCheck('uncheck');
                            }
                        })
                    };
                    if (exports.category == 'term_unit'){
                        $('#select-termclass-tree input').prop('disabled', true);
                    }
                } else {
                    alert(languageJSON.al_gainTtFaild);
                }
            }
        );
    }

    function initEvent() {

        // serach
        $('.has-feedback .form-control-feedback').click(function () {
            var searchKeyword = $.trim($('#term_sel_search').val());
            if (!UTIL.isValidated('keyword', searchKeyword)) return;
            loadTermList(_pageNO);
        });
        $('#term_sel_search').change(function () {
                var searchKeyword = $.trim($('#term_sel_search').val());
                if (!UTIL.isValidated('keyword', searchKeyword)) return;
                loadTermList(_pageNO);
            })

        // 全选，不全选
        $('#term－sel-list-select-all').click(function () {
            var check = $('#term－sel-list-select-all>i').hasClass('fa-square-o');
            $('#term－sel-list-select-all>i').toggleClass('fa-square-o', !check);
            $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', check);
            $('#term_sel_list tr input[type="checkbox"]').iCheck((check ? 'check' : 'uncheck'));
        })

        //选择每页显示数
        $('#selectNums').on('change', function(){
            loadTermList(1);
        })

    }

    function onCheckBoxChange() {
        // 设置是否全选
        var isChecked = $('#term_sel_list tr input[type="checkbox"]:checked').length;
        var allCheckBox = $('#term_sel_list tr input[type="checkbox"]').length;
        var ifSelAll = (isChecked === allCheckBox);
        $('#term－sel-list-select-all>i').toggleClass('fa-square-o', !ifSelAll);
        $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', ifSelAll);
    }

    _checkList.add = function (id, status, name, terms) {
        _checkList.push({'termID': '' + id, 'status': status, 'name': name, 'terms': terms});
    }

    _checkList.delete = function (id) {
        for (var i = 0; i < _checkList.length; i++) {
            if (_checkList[i].termID === id) {
                _checkList.splice(i, 1);
                return;
            }
        }
    }

    function loadTermList(pageNum) {
        _pageSize = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        // _pageSize = $('#selectNums').val();
        // if(_pageSize=='全部' || exports.category == 'audit_check'){
        //     _pageSize = 5000
        //     $('#selectNums').val('全部')
        // } 
        // _pageSize = parseInt(_pageSize);

        // loading
        $('#term_sel_list').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

        var dom = $('#select-termclass-tree').find('.focus');
        $('#select-termlist-title').html(_tree.getFocusName(dom));
        $('#select-termlist-title').attr('cateId', _tree.getFocusCateId(dom));   

        if (pageNum !== undefined) {
            _pageNO = pageNum;
        } else {
            _pageNO = 1;
        }

        var searchKeyword = $.trim($('#term_sel_search').val());
        var termClassId = $('#select-termclass-tree').find('.focus').attr('node-id');
        // alert(_pageSize)
        console.log(exports.title)
        if (exports.title == '已发布终端' || exports.title == '撤销终端' || exports.title == '激活终端' || exports.title == '取消终端' || exports.title == '撤回终端') {
            console.log('普通终端')
            var pager = {
                page: _pageNO,
                per_page: _pageSize,
                keyword: searchKeyword,
            };
            (exports.title == '撤销终端' || exports.title == '已发布终端') ? _url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist' : _url = CONFIG.serverRoot + '/backend_mgt/emergency'
            if (exports.title == '撤销终端' || exports.title == '已发布终端') {
                var data = JSON.stringify({
                    action: 'query_terms',
                    project_name: CONFIG.projectName,
                    id: exports.playlistID,
                    pager: pager,
                    category_id: Number($('#select-termlist-title').attr('cateid')) || 1
                })
                showSelectable();
            } else {
                var data = JSON.stringify({
                    action: 'query_terms',
                    project_name: CONFIG.projectName,
                    id: exports.playlistID,
                    pager: pager,
                    category_id: Number($('#select-termlist-title').attr('cateid')) || 1,
                    active: exports.title == '激活终端' ? 0 : exports.title == '取消终端' ? 1 : -1
                })
            }

            UTIL.ajax('post', _url, data, function (json) {
                if (json.rescode == 200) {
                    console.log('已发布-普通终端列表')
                    var totalPages = Math.ceil(1 / 10);
                    totalPages = Math.max(totalPages, 1);
                    $('#select-term-table-pager').jqPaginator({
                        // totalPages: totalPages,
                        totalCounts: json.total,
                        pageSize: _pageSize,
                        visiblePages: CONFIG.pager.visiblePages,
                        // first: CONFIG.pager.first,
                        prev: CONFIG.pager.prev,
                        next: CONFIG.pager.next,
                        // last: CONFIG.pager.last,
                        page: CONFIG.pager.page,
                        currentPage: _pageNO,
                        onPageChange: function (num, type) {
                            if (type == 'change') {
                                _pageNum = num;
                                loadTermList(num);
                            }
                        }
                    });
                }

                var mtrData = json.terms;
                $('#term_sel_list').empty();

                //_checkList.length = 0;

                mtrData.map(function (v) {
                    var statusName = v.online == 0 ? '离线' : v.status == 'Running' ? '运行' : '休眠';
                    var status = v.online == 0 ? 'offline' : v.status == 'Running' ? 'running' : 'shutdown';
                    var seletedItems = _checkList.map(function(v,i){
                        return +(v.termID)
                    }) 
                    
                    var checked = seletedItems.includes(v.termID) ? 'checked' : '';
                    $('#term_sel_list').append('' +
                        '<tr tid="' + v.id + '" status="' + status + '">' +
                        '<td>' +
                        '<input type="checkbox" ' + checked + '>' +
                        '</td>' +
                        '<td>' + v.name + '</td>' +
                        '<td>' + statusName + '</td>' +
                        '<td>当前频道：' + ((v.current_play_info === '') ? '' : JSON.parse(v.current_play_info).ChannelName) + '</td>' +
                        '</tr>'
                    );
                })

                var hasCheck = $('#term－sel-list-select-all>i').hasClass('fa-check-square-o');
                if (hasCheck) {
                    $('#term－sel-list-select-all>i').toggleClass('fa-square-o', true);
                    $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', false);
                }

                $('#term_sel_list tr input[type="checkbox"]').iCheck({
                    checkboxClass: 'icheckbox_flat-blue',
                    radioClass: 'iradio_flat-blue'
                })
                    .on('ifChecked', function (event) {
                        _checkList.delete($(this).parent().parent().parent().attr('tid'));
                        _checkList.add($(this).parent().parent().parent().attr('tid'), $(this).parent().parent().parent().attr('status'), $(this).parents('td').next().text());
                        onCheckBoxChange();
                    })
                    .on('ifUnchecked', function (event) {
                        _checkList.delete($(this).parent().parent().parent().attr('tid'));
                        onCheckBoxChange();
                    });
                    $('#term_sel_list tr input[checked]').iCheck('check');
                $('#term_sel_list tr').each(function (i, e) {

                    // 点击整行
                    $(e).click(function () {
                        // $('#term_sel_list tr input[type="checkbox"]').iCheck('uncheck');
                        var status = $(e).find('input[type="checkbox"]').prop('checked');
                        if(!status){
                            $(e).find('input[type="checkbox"]').iCheck('check');
                            // _checkList.delete($(e).attr('tid'));
                            // _checkList.add($(e).attr('tid'), $(e).attr('status'), $(e).find('td:eq(1)').text());
                            // onCheckBoxChange();
                        }else{
                            $(e).find('input[type="checkbox"]').iCheck('uncheck');
                            // _checkList.delete($(e).attr('tid'));
                            // onCheckBoxChange();
                        }
                    })

                })
                if (_checkList.length > 0) {
                    onCheckBoxChange();
                }
            });
            return;
        }

        if(exports.title == '联屏发布' || exports.title == '联屏撤销'){
            console.log('联屏终端')
            var pager = {
                page: _pageNO,
                per_page: _pageSize,
                keyword: searchKeyword,
            }
            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: "query",
                // id:'',
                pager:pager
            });

            var url = CONFIG.serverRoot + '/backend_mgt/unite_screen_term';
            UTIL.ajax("post", url, data, function(msg) {
                if (msg.rescode == 200) {
                    //UTIL.cover.close();
                    renderTermlist(msg)
                } else {
                    alert("发布失败!");
                    UTIL.cover.close()
                }
            })
            
            return;
        }

        if(exports.title == '审核中播单') {
            showSelectable();
            var data = JSON.stringify({
                project_name: CONFIG.projectName,
                action: "query_publish_terms",
                id: exports.playlistID,
            });

            var url = CONFIG.serverRoot + '/backend_mgt/advertisement_playlist';
            UTIL.ajax("post", url, data, function(msg) {
                if (msg.rescode == 200) {
                    getSelectedItems(msg);
                    $('#select-termclass-tree input').prop('disabled', true);
                    $('#term_sel_save').remove();
                } else {
                    UTIL.cover.close()
                }
            }) 
        }
        _pageSize = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        // _pageSize = $('#selectNums').val();
        // if(_pageSize=='全部' || exports.category == 'audit_check'){
        //     _pageSize = 5000;
        //     $('#selectNums').val('全部');
        // } 
        // _pageSize = parseInt(_pageSize);
        var data = {
            "project_name": CONFIG.projectName,
            "action": "getTermList",
            "categoryID": termClassId,
            "Pager": {
                "total": -1,
                "per_page": +(_pageSize),
                "page": _pageNO,
                "orderby": "",
                "sortby": "",
                "keyword": searchKeyword,
                "status": ""
            }
        }
        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
            JSON.stringify(data),
            function (data) {
                renderTermlist(data);
            }
            
        )
    }

    function renderTermlist(data){
        $('#term_sel_list').empty();
        var searchKeyword = $.trim($('#term_sel_search').val());
        var termClassId = $('#select-termclass-tree').find('.focus').attr('node-id');
        var ALLCHECK = false;
        if (data.rescode != 200) {
            alert(languageJSON.al_getListFaild + '：' + rescode.errInfo);
            return;
        }

        // set pagebar
        if(exports.title == '联屏发布' || exports.title == '联屏撤销'){
            var totalCounts = data.total;
            var tl = data.groups; 

        }else{
            var totalCounts = Math.max(data.totalStatistic.totalTermNum, 1);
            var tl = data.termList.terms; 
            if(selectedTerms.length > 0){
                tl = tl.filter(function(v,i){
                    return selectedTerms.includes(v.ID)
                })
            }
        }
        
        //var totalCounts = Math.max(data.totalStatistic.totalTermNum, 1);
        // _pageSize = $('#selectNums').val();
        // if(_pageSize=='全部' || exports.category == 'audit_check'){
        //     _pageSize = 5000;
        //     $('#selectNums').val('全部');
        // } 
        _pageSize = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        //发布播单-分页  |  已发布终端-联屏终端
        $('#select-term-table-pager').jqPaginator({
            totalCounts: totalCounts,
            pageSize: +(_pageSize),
            visiblePages: 3,
            // first: CONFIG.pager.first,
            prev: CONFIG.pager.prev,
            next: CONFIG.pager.next,
            // last: CONFIG.pager.last,
            page: CONFIG.pager.page,
            currentPage: _pageNO,
            onPageChange: function (num, type) {
                _pageNO = num;
                if (type === 'change') {
                    if(exports.title == '联屏撤销'){
                        getPublishedScreen()
                    }else{
                        loadTermList(_pageNO);
                    }
                }
            }
        });

        // term_sel_list
        
        $('#term_sel_list').empty();

        // 清空已选list
       // _checkList.length = 0;

        //判断与之关联的终端组是否勾选
        var _termClassId = $('#select-termlist-title').attr('cateid');
        var ischecked = $('#select-termclass-tree').find('.focus input').prop('checked')
        if (termClassId == _termClassId && ischecked) {
            ALLCHECK = true;
        }
        for (var i = 0; i < tl.length; i++) {
            if(exports.title == '联屏发布' || exports.title == '联屏撤销'){
                var termsArray = tl[i].members;
                var termsName = termsArray.length + '个终端';
                var termList = termsArray.map(function(v,i){
                    return v.ID;
                })
                termList = termList.join('.');
                $('#term_sel_list').append('' +
                '<tr tid="' + tl[i].id + '" termIds="' + termList + '">' +
                '<td>' +
                '<input type="checkbox" ' + checked + '>' +
                '</td>' +
                '<td>' + tl[i].name + '</td>' +
                '<td>' + termsName + '</td>' +
                
                '</tr>'
            );
            }else{
                var statusName = (tl[i].Online === 0) ? languageJSON.offline : ((tl[i].Status === 'Running') ? languageJSON.running : languageJSON.dormancy);
                var status = (tl[i].Online === 0) ? 'offline' : ((tl[i].Status === 'Running') ? 'running' : 'shutdown');

                var seletedItems = _checkList.map(function(v,i){
                    return +(v.termID)
                }) 
                var checked = seletedItems.includes(tl[i].ID) ? 'checked' : '';
                $('#term_sel_list').append('' +
                '<tr tid="' + tl[i].ID + '" status="' + status + '">' +
                '<td>' +
                '<input type="checkbox" ' + checked + '>' +
                '</td>' +
                '<td>' + tl[i].Name + '</td>' +
                '<td>' + statusName + '</td>' +
                '<td>' + languageJSON.list_currentChannel + '：' + ((tl[i].CurrentPlayInfo === '') ? '' : JSON.parse(tl[i].CurrentPlayInfo).ChannelName) + '</td>' +
                '</tr>'
            );
            }
            
        }
        if (exports.category == 'term_ads') {
            $('#term_sel_list input').prop('checked', ALLCHECK);
        }

        // 复选
        // 复选全选按钮初始化
        var hasCheck = $('#term－sel-list-select-all>i').hasClass('fa-check-square-o');
        if (hasCheck) {
            $('#term－sel-list-select-all>i').toggleClass('fa-square-o', true);
            $('#term－sel-list-select-all>i').toggleClass('fa-check-square-o', false);
        }


        // 列表选择按钮添加icheck
        $('#term_sel_list tr input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue'
        })
            .on('ifChecked', function (event) {
                _checkList.delete($(this).parent().parent().parent().attr('tid'));
                _checkList.add($(this).parent().parent().parent().attr('tid'), $(this).parent().parent().parent().attr('status'), $(this).parents('td').next().text(), $(this).parent().parent().parent().attr('termids'));
                onCheckBoxChange();
            })
            .on('ifUnchecked', function (event) {
                _checkList.delete($(this).parent().parent().parent().attr('tid'));
                onCheckBoxChange();
            });
        
            $('#term_sel_list tr input[checked]').iCheck('check');
        // 点击
        $('#term_sel_list tr').each(function (i, e) {

            // 点击整行
            $(e).click(function () {
                var status = $(e).find('input[type="checkbox"]').prop('checked');
                if(!status){
                    $(e).find('input[type="checkbox"]').iCheck('check');
                }else{
                    $(e).find('input[type="checkbox"]').iCheck('uncheck');
                }
            })

        })
        if (_checkList.length > 0) {
            onCheckBoxChange();
        }


    }

    function showSelectable(){
        $('#changeCate').show();
    }

    function getSelectedItems(data){
        var categoryIds = data.category_ids;
        categoryIds.map(function(v,i){
            $('#select-termclass-tree').find('li[node-id='+v+'] input').prop('checked', true);
        })
        selectedTerms = data.term_ids;
    }

    function getAuditUnionTerms(data) {
        var tl = data.union_screen_terms;
        if(!tl.length) $('#term_sel_list').html('<h5 style="text-align:center;color:grey;">(空)</h5>');
        for (var i = 0; i < tl.length; i++) {
            var termsArray = tl[i].term_ids;
            var termsName = termsArray.length + '个终端';
            termsArray = termList.join('.');
            $('#term_sel_list').append('' +
            '<tr tid="' + tl[i].id + '" termIds="' + termsArray + '">' +
            '<td>' +
            '<input type="checkbox" ' + checked + '>' +
            '</td>' +
            '<td>' + tl[i].name + '</td>' +
            '<td>' + termsName + '</td>' +
            '</tr>')
        }
    }

});
