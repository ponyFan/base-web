define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        languageJSON;

    exports.save;
    exports.title;
    exports.close;
    exports.labelData = [];

    exports.init = function () {
        selectLanguage();
        getAllLabels();

        // 关闭
        $('#mul-term-class-close').click(function () {
            if (exports.close !== undefined && exports.close !== '') {
                exports.close();
                exports.close = '';
            } else {
                UTIL.cover.close(2);
            }
        })

        // 保存
        $('#mul-term-class-save').click(function () {
            var labelList = [];
            $('#selectedLabels').children().each(function(i,v){
                labelList.push({
                    labelId: $(v).attr('labelId'),
                    labelName: $(v).text()
                })
            })
            exports.save(labelList);
            
        })

        $('#allLabels').on('click', function(e){
            var target = $(e.target);
            var labelname = target.text();
            target.addClass('removeEffect');
            setTimeout(function(){target.remove()}, 400);
            var _li = '<li>'+labelname+'<span><i class="fa fa-close"></i></span></li>'
            $('#selectedLabels').append(_li);
        })

        $('#selectedLabels').on('click', function(e){
            if(e.target.tagName !== 'I') return;
            var target = $(e.target).parents('li');
            var labelname = target.text();
            target.addClass('removeEffect');
            setTimeout(function(){target.remove()}, 400);
            var _li = '<li>'+labelname+'</li>'
            $('#allLabels').append(_li);
        })

        $('#labelpools input').iCheck({
            checkboxClass: "icheckbox_flat-blue",
            radioClass: "iradio_flat-blue"
        });
    }

    function selectLanguage() {
        $('#mul-TermClass-title').html(exports.title);
        $("#mul-term-class-save").html('确定');
    }

    function getAllLabels(){

    }


});
