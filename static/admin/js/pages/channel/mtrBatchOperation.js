define(function (require, exports, module) {
    var UTIL = require("common/util.js"),
        CONFIG = require('common/config');
    var languageJSON;

    exports.init = function () {
        selectLanguage();
        //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
        });

        //保存
        $("#btn-batchSubmit").click(function () {
            onSubmit();
        });

        loadPage();
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.channel;
        $("#cover_area .box-title").html(languageJSON.title4);
        $(".batchOperation-duration label").html(languageJSON.playDuration);
        $("#batchDuration").attr("placeholder", languageJSON.pl_playDuration);
        $(".batchOperation-time label").html(languageJSON.playTime);
        $("#batchTime").attr("placeholder", languageJSON.pl_playTime);
        $(".batchOperation-prompt").html('<i class="fa fa-info-circle" >&nbsp' + languageJSON.prompt2 + '</i>');
        $("#btn-batchSubmit").html(languageJSON.submit);
    }

    /**
     *载入页面
     */
    function loadPage() {
        // $("#batchDuration").inputmask("hh:mm:ss", {"placeholder": "hh:mm:ss"});

        layui.use('laydate', function(){
            var laydate = layui.laydate;
            laydate.render({
                elem: '#batchDuration',
                type:'time', //指定元素
                done:function(value){
                    $('#batchDuration').val(value)
                    $('#batchDuration').trigger('change')
                }
            })
        })
        
        $("input:checkbox[class='mtr_cb']:checked").each(function () {
            if ($(this).parents("tr").find($(".mtrCtrl_time")).attr("disabled") == "disabled") {
                $(".batchOperation-duration").hide();
            }
        })
        if ($("#mtrCtrl_playType").val() == "Percent") {
            $(".batchOperation-time").show();
        } else {
            $(".batchOperation-time").hide();
        }
    }

    /**
     *保存事件
     */
    function onSubmit() {
        if ($("#batchDuration").val() != "") {
            var attr = $("#batchDuration").val().split(":");
            if (isNaN(attr[0]) || isNaN(attr[1]) || isNaN(attr[2])) {
                alert(languageJSON.al_batchDuration);
                $("#batchDuration").focus();
                return;
            }
        }
        var obj1,
            obj2;
        $("input:checkbox[class='mtr_cb']:checked").each(function () {
            obj1 = $(this).parents("tr").find(".mtrCtrl_time");
            obj2 = $(this).parents("tr").find(".mtrC_times");
            if ($("#batchDuration").val() != "") {
                if (obj1.attr("disabled") == undefined) {
                    obj1.val($("#batchDuration").val());
                    obj1.trigger("change");
                }
            }
            if ($("#batchTime").val() != "") {
                obj2.val($("#batchTime").val());
                obj2.trigger("change");
            }
        })
        UTIL.cover.close();
    }
})