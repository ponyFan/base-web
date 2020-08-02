define(function (require, exports, module) {
	var CONFIG = require("common/config.js");
	var UTIL = require("common/util.js");
	var templates = require('common/templates');
	var getClassAndTerm = require('pages/store/getTerm_meeting.js');
	var nDisplayItems = 10;
	var _pageNO = 1;
	var languageJSON = CONFIG.languageJson.store;
	exports.init = function () {
		selectLanguage();

		exports.isShowUnbinded = 0;
		// search
		$("#liveSearch").keyup(function (event) {
			if (event.keyCode == 13) {
				exports.loadLivePage(_pageNO, true);
			}
		}).change(function () {
			exports.loadLivePage(_pageNO, true);
		});
		$("#liveSearch").next().click(function () {
			exports.loadLivePage(_pageNO, true);
		});

		exports.loadLivePage(_pageNO, true); //����Ĭ��ҳ��

		//��ʾδ���ն�
		$("#showUnbindedTerm").click(function (e) {
			e.stopPropagation();
			if (exports.isShowUnbinded == 0) {
				exports.isShowUnbinded = 1;
				$("#showUnbindedTerm i").removeClass().addClass('glyphicon glyphicon-ok-circle');
			} else {
				exports.isShowUnbinded = 0;
				$("#showUnbindedTerm i").removeClass().addClass('glyphicon glyphicon-unchecked');
			}
			exports.loadLivePage(exports.pageNum, true);
		});
	};

	/**
     * �����л���
     */
	function selectLanguage() {
        $(".meeting-title").html(languageJSON.meetingList);
		$("#liveSearch").attr("placeholder", languageJSON.pl_termSearch);
		$("#showUnbindedTerm").html('<i class="glyphicon glyphicon-unchecked"></i>' + languageJSON.displayUnbindedTerm);
	}

	// ����ҳ������
	exports.loadLivePage = function (pageNum, isSearch) {
		_pageNO = pageNum;
		nDisplayItems = parseInt(localStorage.getItem("pageSize") ? localStorage.getItem("pageSize") : 10);
		// loading
		$("#liveTable tbody").html('<i class="fa fa-refresh fa-spin" style="display:block; text-align: center; padding:10px;"></i>');

		var searchKeyword = $.trim($('#liveSearch').val());

		exports.pNum = pageNum;
		var data = JSON.stringify({
			project_name: CONFIG.projectName,
			action: 'getTermBindings',
            //action: 'getBindings',
			what: 'MeetingRoom',
			unbinding: exports.isShowUnbinded,
			Pager: {
				"per_page": nDisplayItems,
				"page": isSearch ? 1 : _pageNO,
				"keyword": searchKeyword,
			}
		});
		var url = CONFIG.serverRoot + '/backend_mgt/v2/term';
		UTIL.ajax('post', url, data, function (json) {
            $("#liveTable tbody").html("");
			//��ҳ

			var totalPages = Math.ceil(json.total / nDisplayItems);
			totalPages = Math.max(totalPages, 1);
			$('#live-table-pager').jqPaginator({
				// totalPages: totalPages,
				totalCounts: json.total,
                pageSize: nDisplayItems,
				visiblePages: CONFIG.pager.visiblePages,
				first: CONFIG.pager.first,
				prev: CONFIG.pager.prev,
				next: CONFIG.pager.next,
				last: CONFIG.pager.last,
				page: CONFIG.pager.page,
				currentPage: isSearch ? 1 : _pageNO,
				onPageChange: function (num, type) {
					if (type === 'change') {
						_pageNO = num;
						exports.loadLivePage(_pageNO, false);
					}
				}
			});
			//ƴ��
			if (json.terms != undefined) {
				var termsArray = json.terms;
				var termName = json.names;
				var termChannel = json.channels;
                var termCategory = json.categorys;
                var termBounds = json.bounds;
				$("#liveTable tbody").append('<tr>' +
                    '<th class="live_name">' + languageJSON.termName + '</th>' +
                    '<th class="live_category">' + languageJSON.category + '</th>' +
                    '<th class="live_termChannel">' + languageJSON.termChannel + '</th>' +
                    '<th class="live_operation">' + languageJSON.operation + '</th>' +
                    '</tr>');
				for (var i = 0; i < termsArray.length; i++) {
					//var stringArry;
					var tID = termsArray[i];
					var tName = termName[i];
					var tChannel = termChannel[i]
                    var tCategory = termCategory[i];
                    var tBound = termBounds[i];
                    var disabled_bind = tBound == 1 ? 'disabled' : '';
                    var disabled_unbind = tBound == 1 ? '' : 'disabled';
					var operation = '' +
                        '<a class="binding"><button ' + disabled_bind+ ' type="button" class="btn btn-default btn-xs">' + languageJSON.binding + '</button></a> ' +
                        '<a class="unbind"><button ' + disabled_unbind + '  type="button" class="btn btn-default btn-xs">' + languageJSON.unbind + '</button></a> ' +
                        '<a class="bindingList"><button ' + disabled_unbind + '  type="button" class="btn btn-default btn-xs">' + languageJSON.bindingList + '</button></a> ';
					var Live_tr = '<tr class="user-row" termID="' + tID + '" liveName="' + tName + '" liveCategory="' + tCategory + '">' +
                        '<td class="live_name">' + tName + '</td>' +
                        '<td class="live_category">' + tCategory + '</td>' +
                        '<td class="live_termChannel">' + tChannel + '</td>' +
                        '<td class="live_operation">' + operation + '</td>' +
                        '</tr>';
					$("#liveTable tbody").append(Live_tr);
				}
				exports.pageNum = _pageNO;

				//���б�
				$(".binding button").click(function () {
					var currentID = $(this).parents('tr').attr("termID");
					bindDevice("bindLive", currentID)
				});
				$(".unbind button").click(function () {
                    var currentID = $(this).parents('tr').attr("termID");
					bindDevice("unbind", currentID)
				});
				$(".bindingList button").click(function () {
                    var currentID = $(this).parents('tr').attr("termID");
					bindDevice("bindingList", currentID)
				});
				function bindDevice(tps, currentId) {
					UTIL.cover.load('resources/pages/store/getTerm_meeting.html');
					getClassAndTerm.title = languageJSON[tps];
                    getClassAndTerm.tps = tps;
                   // getClassAndTerm.loadLivePage = exports.loadLivePage;
					getClassAndTerm.Term = currentId;
					getClassAndTerm.save = function (data) {
						var post_data = JSON.stringify({
							project_name: CONFIG.projectName,
							action: data.action,
							bindings: data.termID,
							what: "MeetingRoom",
							term_id: currentId
						});
						var url = CONFIG.serverRoot + '/backend_mgt/v2/term';
						UTIL.ajax('post', url, post_data, function (msg) {
							if (msg.rescode == 200) {
                                alert(languageJSON.al_Success);
                                var obj = $('#liveTable tr[termid=' + currentId + ']');
                                if (tps == 'bindLive') {
                                    obj.find('.binding button')[0].disabled = true;
                                    obj.find('.unbind button')[0].disabled = false;
                                    obj.find('.bindingList button')[0].disabled = false;
                                } else {
                                    obj.find('.binding button')[0].disabled = false;
                                    obj.find('.unbind button')[0].disabled = true;
                                    obj.find('.bindingList button')[0].disabled = true;
                                }
								UTIL.cover.close();
							}
							else {
								alert(languageJSON.al_Failed);
								UTIL.cover.close();
							}
						});
					}
				}
			}
		});
	};

	//function render(json, isSearch) {

	//}
})