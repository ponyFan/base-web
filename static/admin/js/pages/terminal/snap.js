define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        _snap,
        _snapCheck,
        languageJSON;

    exports.termID;
    exports.init = function () {
        selectLanguage();
        // close
        $('#term_snap_close').click(function () {
            if (_snapCheck) {
                clearTimeout(_snapCheck);
            }
            if (_snap) {
                clearTimeout(_snap);
            }
            UTIL.cover.close();
        })

        snap();

        // 截屏超时
        _snapCheck = setTimeout(function () {
            if ($('#snap_box').length === 0) {
                return;
            }

            // console.log('check snap wait time');

            if ($('#snap_info').css('display') !== 'none') {
                if (_snap) {
                    clearTimeout(_snap);
                }
                $('#snap_info').html(languageJSON.screenshotsTimeout);
            }
        }, CONFIG.termSnapWait)

    };

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.termList;
        $("#snap-title").html(languageJSON.screenshots);
        $("#snap_info").html('<i class="fa fa-refresh fa-spin"></i> ' + languageJSON.screenshotting + '...')
    }

    function snap() {

        if ($('#snap_box').length === 0) {
            return;
        }

        var data = {
            "project_name": CONFIG.projectName,
            "action": "getInfo",
            "ID": exports.termID
        }

        // console.log('get SnapshotPicURL');

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/term',
            JSON.stringify(data),
            function (data) {
                if (data.SnapshotPicURL === '') {
                    _snap = setTimeout(function () {
                        snap();
                    }, CONFIG.termSnapInterval)
                } else {
                    var img = new Image();
                    img.src = data.SnapshotPicURL;
                    img.onload = function () {
                        $('#snap_info').css('display', 'none');
                        // $('#snap_box').css('background', 'url(' + img.src + ') no-repeat').css('background-size', 'contain');
                        $('#snap_img img').attr('src', img.src)
                        $('#snap_img').css('display', 'block');
                    }
                }
            }
        );
    }

    $(document).on('click','#snap_rote',function(){
        var imgHeight = $('#snap_img img').css('height'),
            height = imgHeight.substring(0,imgHeight.length-2);
        var imgWidth = $('#snap_img img').css('width'),
            width = imgWidth.substring(0,imgWidth.length-2);
        // height:100%;width:auto;
        var values = $('#snap_img img').css('transform').split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var c = values[2];
        var d = values[3];
        var scale = Math.sqrt(a * a + b * b);
        var sin = b / scale;
        var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        var current = (angle+90)%360;
        
        if(current == 0 || current == 180){
            //初始状态
            $('#snap_img ').css('transform','scale(1)');
        }else{
            //旋转90度
            if(height > width){
                //竖图
                $('#snap_img ').css('transform','scale(1.6)');
            }else{
                //横图
                $('#snap_img ').css('transform','scale(0.5)');
            }
        }
        
        $('#snap_img img').css('transform','rotate('+current+'deg)')
    })
});
