define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var languageJSON;
    var queryCheck;
    var getInfo;
    var flag = false;

    // var pagerCount;
    // var perPageCount;
    // var

    exports.termID;
    exports.MAC
    exports.termName;
    exports.chnID;
    exports.chnName;
    exports.preChnID;
    exports.preChnName;

    exports.init = function () {
        selectLanguage();

        $('#term-name').html(exports.termName);
        // $('#chn-name').html(exports.chnName);
        $('#load-process').html('<i class="fa fa-refresh fa-spin"></i> ' + languageJSON.materialsLoading);

        $('#download-close').click(function () {
            UTIL.cover.close();
        });

        loadDownloadInfo();

        queryCheck = setTimeout(function () {
            if (flag) {
                return;
            }
            if ($('#load-process').css('display') !== 'none') {
                if (getInfo) {
                    clearTimeout(getInfo);
                }
                $('#load-process').html(CONFIG.languageJson.termList.loadDownloadInfoTimeout);
            }
        }, CONFIG.termSnapWait)
    };

    function loadDownloadInfo() {
        if (flag) {
            return;
        }

        var data = {
            "project_name": CONFIG.projectName,
            "action": "queryDownloadTask",
            "ID": exports.termID,
            "MAC": exports.MAC
        };
        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/term',
            JSON.stringify(data),
            function (data) {
                if (data.rescode !== '200') {
                    getInfo = setTimeout(function () {
                        loadDownloadInfo();
                    }, CONFIG.termSnapInterval)
                } else {
                    $('#load-process').css("display", "none");
                    $('.download_list').css("visibility", "visible");
                    renderTaskList(data);
                }
            }
        );
    }

    function renderTaskList(data) {
        $("#material_list").html('');
        //拼接

        $("#material_list").append('<tr>' +
            '<th class="resName">' + languageJSON.resourceName + '</th>' +
            '<th class="resType" style="text-align: center">' + languageJSON.resType + '</th>' +
            '<th class="downloadProc" style="text-align: center">' + languageJSON.downloadProc + '</th>' +
            '</tr>');

        if (data.materials.length !== 0) {
            for (var x = 0; x < data.materials.length; x++) {
                var material = data.materials[x];

                var typeName = "-";
                if (material.typeID === 1) {
                    typeName = languageJSON.video;
                } else if (material.typeID === 2) {
                    typeName = languageJSON.image;
                } else if (material.typeID === 3) {
                    typeName = languageJSON.audio;
                } else if (material.typeID === 5) {
                    typeName = "Office/PDF";
                }

                var downloadProc = "下载完成";
                var downloadSize = material.downloadFinishedSize;
                var totalSize = material.downloadTotalSize === -1 ? "-" : material.downloadTotalSize;
                if (downloadSize !== totalSize) {
                    downloadProc = downloadSize + "/" + totalSize;
                }

                var trEle = '<tr>' +
                    '<td class="resName">' + material.name + '</td>' +
                    '<td class="resType" style="text-align: center">' + typeName + '</td>' +
                    '<td class="downloadProc" style="text-align: center">' + downloadProc + '</td>' +
                    '</tr>';
                $("#material_list").append(trEle);
            }
        } else {
            $("#material_list").empty();
            // $('#term-table-pager').empty();
            $("material_list").append('<h5 style="text-align:center;color:grey;">（' + languageJSON.empty + '）</h5>');
        }
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.material;
    }

})
