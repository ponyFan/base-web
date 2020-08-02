'use strict';

define(function(require, exports, module) {

	// depend on these components
	var templates = require('common/templates'),
		config    = require('common/config'),
		util      = require('common/util');

	// global variables
	var requestUrl    = config.serverRoot,
		projectName   = config.projectName,
		nDisplayItems = 10,
		_pageNO = 1,
        last,
		languageJSON = config.languageJson.channel;


	// 初始化页面
	exports.init = function() {
		selectLanguage();
		loadPage(_pageNO);
		registerEventListeners();
	};

	/**
	 * 语言切换绑定
	 */
	function selectLanguage() {
		$("#layoutTitle").html(languageJSON.titleLayout);
		$("#layoutPrompt").html('<i class="fa fa-info-circle"></i>&nbsp;' + languageJSON.prompt3);
		$("#mtrLisTitle").html(languageJSON.layoutList)
		$("#channel-list-search").attr("placeholder", languageJSON.searchLayout);
		$("#layout-list-controls .btn-delete").html(languageJSON.delete);
		$("#layout-list-controls .btn-add-layout").html(languageJSON.addLayout);
		$("#layout-list-controls .btn-share").html(languageJSON.share);
        $("#layout-list-controls .btn-cancelShare").html(languageJSON.cancelShare);
	}

	function registerEventListeners() {
		$('#layout-table').delegate('input[type="checkbox"]', 'ifClicked', function (ev) {
			onSelectedItemChanged($(this.parentNode).hasClass('checked') ? -1 : 1);
		});
		$('#layout-table').delegate('tr', 'click', function (ev) {
			var self = this;
			// $('#layout-table tr').each(function (idx, el) {
			// 	$(el).iCheck('uncheck');
			// });
			// $(self).iCheck('check');
			if($(self).find("input").prop("checked") == true){
				$(self).iCheck('uncheck');
			}else{
				$(self).iCheck('check');
			}
			onSelectedItemChanged();
		});
		$('#layout-table').delegate('.btn-layout-detail', 'click', function (ev) {
			var layoutId = getLayoutId(ev.target);
			ev.stopPropagation();
		});
        $('#layout-list-controls .select-all').click(function (ev) {
            var hasUncheckedItems = false;
            $('#layout-table div').each(function (idx, el) {
                if (!(hasUncheckedItems || $(el).hasClass('checked'))) {
                    hasUncheckedItems = true;
                }
            });
            $('#layout-table tr').each(function (idx, el) {
                $(el).iCheck(hasUncheckedItems ? 'check' : 'uncheck');
            });
            onSelectedItemChanged();
        });
		$('#layout-list-controls .btn-delete').click(onDeleteLayout);
		$('#layout-list-controls .btn-share').click(function (ev) {
			onShareLayout(1)
		});
		$('#layout-list-controls .btn-cancelShare').click(function (ev) {
			onShareLayout(-1)
		});

		//$('#channel-list-search').keyup(function (ev) {
		//	if (ev.which === 13) {
		//		onSearch(this.value);
		//       ev.stopPropagation();
		//   }
		//}

		//搜索事件

        $("#channel-list-search").keyup(function(event){
            if (event.keyCode == 13) {
                if (!util.isValidated('keyword', $('#channel-list-search').val())) return;
                onSearch(event);
            }
        });
        $("#channel-list-search").next().click(onSearch);
        function onSearch(event) {
            last = event.timeStamp;         //利用event的timeStamp来标记时间，这样每次的keyup事件都会修改last的值，注意last必需为全局变量
            setTimeout(function(){          //设时延迟0.5s执行
                if(last-event.timeStamp==0) //如果时间差为0（也就是你停止输入0.5s之内都没有其它的keyup事件发生）则做你想要做的事
                {
                    if (!util.isValidated('keyword', $('#channel-list-search').val())) return;
                    loadPage(1);
                }
            },500);
        }
    }

    function onSelectedItemChanged(adjustCount) {
		var selectedCount = typeof(adjustCount) === 'number' ? adjustCount+1: 1;
		$('#layout-table div').each(function (idx, el) {
			if ($(el).hasClass('checked')) {
				selectedCount++;
			}
		});
		var hasUncheckedItems = selectedCount !== $('#layout-table tr').size();
		$('#layout-list-controls .select-all>i')
			.toggleClass('fa-square-o', hasUncheckedItems)
			.toggleClass('fa-check-square-o', !hasUncheckedItems);
		$('#layout-list-controls .btn-publish').prop('disabled', selectedCount !== 2);
		$('#layout-list-controls .btn-publish-later').prop('disabled', selectedCount !== 2);
		$('#layout-list-controls .btn-copy').prop('disabled', selectedCount !== 2);
		$('#layout-list-controls .btn-delete').prop('disabled', selectedCount !== 2);
	}

	function onDeleteLayout(ev) {
        if (confirm(languageJSON.cf_delLayout)) {
            var data = JSON.stringify({
                project_name: projectName,
                action: 'delete',
                data: {
                    layout_id: getCurrentLayoutId()
                }
            });
            util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
                if (Number(res.rescode) === 200) {
                    alert(languageJSON.deleteSuc);
                } else {
                    alert(languageJSON.al_delLayoutFaild);
                }
                loadPage(1);
            });
        }
	}
	function onShareLayout (type){
		// getAllLayoutId()
		//分享
		if(type == 1){
			var data = JSON.stringify({
				project_name: projectName,
				action: 'share_layout',
				layout_ids: getAllLayoutId()
				
			});
		}else if(type == -1){
			var data = JSON.stringify({
				project_name: projectName,
				action: 'cancel_share_layout',
				layout_ids: getAllLayoutId()
			});
		}else{
			return
		}
		util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, function (res) {
			// if (Number(res.rescode) === 200) {
			// 	alert(languageJSON.deleteSuc);
			// } else {
			// 	alert(languageJSON.al_delLayoutFaild);
			// }
			loadPage(1);
		});
	}

	function getLayoutId(el) {
		var idAttr;
		while (el && !(idAttr = el.getAttribute('data-layout-id'))) {
			el = el.parentNode;
		}
		return Number(idAttr);
	}

	function getCurrentLayoutId() {
		return Number($('#layout-table div.checked')[0].parentNode.parentNode.getAttribute('data-layout-id'));
	}

	function getAllLayoutId() {
		let list = []
		$('#layout-table div.checked').each(function(k){
			let id = this.parentNode.parentNode.getAttribute('data-layout-id')
			list.push(parseInt(id))
		})
		return list
	}

	// 加载页面数据
    $('#layout-table>tbody').html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');
    function loadPage(pageNum) {
		nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
        var searchKeyword = $('#channel-list-search').val();
       
		var pager = {
			page: String(pageNum),
			total: '0',
			per_page: nDisplayItems,
			orderby: 'CreateTime',
			sortby: 'DESC',
            keyword: searchKeyword
		};
		var data = JSON.stringify({
			action: 'listPage',
			project_name: projectName,
			Pager: pager
		});
		util.ajax('post', requestUrl + '/backend_mgt/v1/layout', data, render);
	}

	/**
	 * 渲染界面
	 * @param json
	 */
	function render(json) {

		var totalPages = Math.ceil(json.Pager.total / nDisplayItems);
        totalPages = Math.max(totalPages, 1);
		$('#layout-table-pager').jqPaginator({
			// totalPages: totalPages,
            totalCounts: json.Pager.total,
            pageSize: nDisplayItems,
            visiblePages: config.pager.visiblePages,
			first: config.pager.first,
            prev: config.pager.prev,
            next: config.pager.next,
            last: config.pager.last,
            page: config.pager.page,
			currentPage: Number(json.Pager.page),
			onPageChange: function (num, type) {
				_pageNO = num;
				if (type === 'change') {
					loadPage(_pageNO);
				}
			}
		});

		$('#layout-table>tbody').html('');
        $("#layout-table>tbody").append('<tr>' +
        '<th class="mod_checkbox" style="width:32px;"></th>' +
        '<th class="mod_name">' + languageJSON.layoutName + '</th>' +
        '<th class="mod_size_center">' + languageJSON.size + '</th>' +
        '<th class="mod_user_center">' + languageJSON.chn_create + '</th>' +
		'<th class="mod_create_time_center create-time">' + languageJSON.chn_createTime + '</th>'+
		'<th class="mod_status mod_user_center">' + languageJSON.share + '</th>'+
        '</tr>');
        if(json.LayoutList!=0) {
            json.LayoutList.forEach(function (el, idx, arr) {
                var data = {
                    id: el.ID,
                    name: el.Name,
                    width: el.Width,
                    height: el.Height,
                    background_color: el.BackgroundColor,
                    operator: el.UserName,
					create_time: el.CreateTime,
					share : ((el.Share === 1) ? ('<span style="color:#07ea07;">'+languageJSON.shared+'</span>') : ('<span">'+languageJSON.notShare+'</span>'))
                };
                $('#layout-table>tbody').append(templates.layout_table_row(data));
            });
        }else{
            $("#layout-table>tbody").empty();
            $('#layout-table-pager').empty();
            $("#layout-table>tbody").append( '<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
        }
		onSelectedItemChanged();

		$('#layout-table input[type="checkbox"]').iCheck({
			checkboxClass: 'icheckbox_flat-blue',
			radioClass: 'iradio_flat-blue'
		});

	}

});
