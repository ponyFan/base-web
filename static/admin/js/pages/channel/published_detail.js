define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
	var LIST = require("pages/channel/list.js");
    var languageJSON;

    exports.init = function () {
        selectLanguage();
        var cID = LIST.chnID;
		var termList = $("#termList").html();
		var term = $("#term").html();
        console.log(cID+termList+term);


        //列表分类点击事件
        function chnChoise(obj) {
            $("#chnChoise li").removeClass('active');
            obj.parent().attr("class", "active");
        }


        //点击事件
        $('#chnpub').click(function () {
            chnChoise($(this));
            //显示已发布的相关信息
            $("#termList").html(languageJSON.publishInfo);
            $("#term").html(languageJSON.publishInfo);
        })
        $('#chnpre').click(function () {
            chnChoise($(this));
            //显示已预发布的相关信息
            $("#termList").html(languageJSON.prePublishInfo);
            $("#term").html(languageJSON.prePublishInfo);
        })


        //确定
        $('#chnSubmit').click(function(){
            UTIL.cover.close();
            type = "";
        })

		 //关闭窗口
        $(".CA_close").click(function () {
            UTIL.cover.close();
			type = "";
        });
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.channel;
        $("#chnpub").html('<i class="fa fa-video-camera"></i> ' + languageJSON.publish)
        $("#chnpre").html('<i class="fa fa-video-camera"></i> ' + languageJSON.prePublish)
        $("#lbl_termList").html(languageJSON.termCf + ':')
        $("#termList").html(languageJSON.termCf + ',xx,xx')
        $("#lbl_termList").html(languageJSON.termCf + ":")
        $("#term").html(languageJSON.termCf + ',xx,xx')
        $("#chnSubmit").html(languageJSON.submit)
    }
})
