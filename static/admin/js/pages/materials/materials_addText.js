define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var _mtrId,
        mtrTextType = "0";
    var languageJSON = CONFIG.languageJson.material;

    exports.init = function () {
        selectLanguage();
        var DispClose = false;
        $(window).bind('beforeunload', function () {
            var data =  $('#editor').froalaEditor('html.get', true);//获取编辑器内容
            if (data != "") {
                DispClose = true;
            }
            if (DispClose) {
                return languageJSON.al_editText + "?";
            }
        });

        $('#editor').froalaEditor({
            language: 'zh_cn',
            toolbarButtons:['fullscreen','bold',  'underline', 'strikeThrough', '|', 'fontFamily', 'fontSize', 'color',  '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', '-', 'insertTable', '|', 'emoticons', 'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting', '|', 'help', 'html', '|', 'undo', 'redo'],
            quickInsertButtons:['table'],
            fontFamily: {
                '宋体': '宋体',
                '黑体': '黑体',
                '仿宋': '仿宋',
                '楷体': '楷体',
                '隶书': '隶书',
            }
        })

        $("#getBtn").click(function(){
            console.log($('#editor').froalaEditor('html.get', true))
        })

        if (UTIL.getLocalParameter('config_checkSwitch') == '0') {
            $('#Tmtr_viewlast').hide();
            $('#Tmtr_submit').hide();
        }
        loadPage();

        //销毁
        // try {
        //     var editor = CKEDITOR.instances['editor1'];
        //     if (editor) {
        //         editor.destroy(true);
        //     }
        // } catch (e) {
        // }
        // CKEDITOR.replace('editor1');
        //关闭窗口
        $("#Tmtr_back").click(function () {
            backList();
        });

        $('#Tmtr_viewlast').click(function () {
            var viewText = require("pages/materials/materials_viewText.js");
            var mtrId = location.hash.substring(location.hash.lastIndexOf('?id=') + 4);
            viewText.materialID = mtrId;
            viewText.materialName = languageJSON.checkedContent;
            var page = "resources/pages/materials/materials_viewText.html";
            UTIL.cover.load(page);
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $("#lbl_webName").html(languageJSON.webName + ":");
        $("#lbl_webType").html(languageJSON.webType + ":");
        $("#lbl_text").html(languageJSON.normalText);
        $("#lbl_url").html(languageJSON.webUrl);
        $("#mtr-input-url label").html(languageJSON.webUrl + ":");
        $("#Tmtr_viewlast").html(languageJSON.queryCheck);
        $("#Tmtr_submit").html(languageJSON.saveSubmit);
        $("#Tmtr_save").html(languageJSON.save);
        $("#Tmtr_back").html(languageJSON.exit);
    }

    function loadPage() {
        _mtrId = null;
        mtrTextType = "0";
        if (location.hash.indexOf('?id=') != -1) {			//编辑
            $("#mtr_atTitle").html(languageJSON.editWeb);
            $('input[type="radio"].Tmtr-minimal').prop("disabled", true);
            _mtrId = location.hash.substring(location.hash.lastIndexOf('?id=') + 4);
            var data1 = JSON.stringify({
                Action: 'Get',
                Project: CONFIG.projectName,
            })
            var url = CONFIG.serverRoot + "/backend_mgt/v1/webmaterials/" + _mtrId;
            UTIL.ajax('POST', url, data1, function (msg) {
                $("#Tmtr_name").val(msg.Materials[0].Name);
            })

            var data2 = JSON.stringify({
                Action: 'GetText',
                Project: CONFIG.projectName,
            })
            UTIL.ajax('POST', url, data2, function (msg) {
                if (!msg || msg.substring(0, 1) == "<") {
                    // CKEDITOR.instances['editor1'].setData(msg);
                    $('#editor').froalaEditor('html.set', msg)
                } else {
                    $("#Tmtr-type-url").iCheck("check");
                    $("#Tmtr_url").val(msg);
                }
            }, 'text');

        } else {        //添加
            $('#Tmtr_viewlast').hide();
            $("#mtr_atTitle").html(languageJSON.addWeb);
        }

        //保存
        $("#Tmtr_save").click(function () {
            if (!inputCheck()) return;
            onSubmit();
        })

        //保存并提交
        $("#Tmtr_submit").click(function () {
            if (!inputCheck()) return;
            onSaveAndSubmit();
        })

        //iCheck for radio inputs
        $('input[type="radio"].Tmtr-minimal').iCheck({
            radioClass: 'iradio_minimal-blue'
        }).on("ifChecked", function () {
            mtrTextType = $('input[type="radio"].Tmtr-minimal:checked').val();
            if (Number(mtrTextType) === 0) {
                $("#mtr-input-text").show();
                $("#mtr-input-url").hide();
            } else {
                $("#mtr-input-text").hide();
                $("#mtr-input-url").show();
            }
        });

    }

    /**
     * 返回
     */
    function backList() {
        // var editor = CKEDITOR.instances['editor1'];
        // if (editor) {
        //     editor.destroy(true);
        // }
        location.hash = '#materials/materials_list';
    }

    function onSaveAndSubmit() {
        if (Number(mtrTextType) === 0) {
            // var editor_data = CKEDITOR.instances.editor1.getData();
            var editor_data = $('#editor').froalaEditor('html.get', true);
        } else {
            var editor_data = $("#Tmtr_url").val();
        }
        if (_mtrId == null) {
            var data = JSON.stringify({
                action: "Post",
                project: CONFIG.projectName,
                name: $("#Tmtr_name").val(),
                content: editor_data,
                Is_Live: Number(mtrTextType)
            })
        } else {
            var data = JSON.stringify({
                action: "Update",
                project: CONFIG.projectName,
                name: $("#Tmtr_name").val(),
                ID: _mtrId,
                content: editor_data,
                Is_Live: Number(mtrTextType)
            })
        }
        var url = CONFIG.serverRoot + "/backend_mgt/v1/webmaterials";
        UTIL.ajax('POST', url, data, function (msg) {
            if (parseInt(msg.rescode) == 200) {
                submitToCheck();
            } else {
                alert(languageJSON.al_saveFaild);
            }
        })

        function submitToCheck() {
            var data = JSON.stringify({
                action: "submitToCheck",
                project_name: CONFIG.projectName,
                material_type: "WebText",
                MaterialIDs: [_mtrId]
            });
            UTIL.ajax(
                'POST',
                CONFIG.serverRoot + '/backend_mgt/v1/materials',
                data,
                function (data) {
                    if (data.rescode === '200') {
                        alert(languageJSON.al_saveSubSuc);
                        backList();
                        //解除绑定，一般放在提交触发事件中
                        $(window).unbind('beforeunload');
                    } else {
                        alert(languageJSON.al_saveSubFaild);
                    }
                }
            )
        }
    }

    function onSubmit() {
        if (Number(mtrTextType) === 0) {
            // var editor_data = CKEDITOR.instances.editor1.getData();
            var editor_data = $('#editor').froalaEditor('html.get', true);
        } else {
            var editor_data = $("#Tmtr_url").val().replace(/^\s+|\s+$/g,"");
        }

        var url = CONFIG.serverRoot + "/backend_mgt/v1/webmaterials";
        if (_mtrId == null) {
            var data = JSON.stringify({
                action: "Post",
                project: CONFIG.projectName,
                name: $("#Tmtr_name").val().replace(/^\s+|\s+$/g,""),
                content: editor_data,
                Is_Live: Number(mtrTextType)
            })
        } else {
            var data = JSON.stringify({
                action: "Update",
                project: CONFIG.projectName,
                name: $("#Tmtr_name").val(),
                ID: _mtrId,
                content: editor_data,
                Is_Live: Number(mtrTextType)
            })
        }
        UTIL.ajax('POST', url, data, function (msg) {
            if (msg.rescode == 200) {
                if (UTIL.getLocalParameter('config_checkSwitch') == '0' && _mtrId != null) {         //未开启权限
                    var data2 = JSON.stringify({
                        action: "UpdateWebMaterialInternal",
                        project_name: CONFIG.projectName,
                        material_type: "WebText",
                        webmaterialID: _mtrId
                    });
                    UTIL.ajax(
                        'POST',
                        CONFIG.serverRoot + '/backend_mgt/v2/channels/',
                        data2,
                        function (data) {
                            if (data.rescode === '200') {
                                alert(languageJSON.al_saveSuc);
                                backList();
                                //解除绑定，一般放在提交触发事件中
                                $(window).unbind('beforeunload');
                            } else {
                                alert(languageJSON.al_saveFaild);
                            }
                        }
                    )
                } else {
                    alert(languageJSON.al_saveSuc);
                    backList();
                    //解除绑定，一般放在提交触发事件中
                    $(window).unbind('beforeunload');
                }
            } else {
                alert(languageJSON.al_saveFaild);
            }
        })
    }

    /**
     * 检测文本框事件
     */
    function inputCheck() {
        var errormsg = "";
        if ($("#Tmtr_name").val().replace(/^\s+|\s+$/g,"") == "") {
            errormsg += languageJSON.al_inWebName + "！\n";
            $("#Tmtr_name").val('')
        }
        if (Number(mtrTextType) === 1) {
            if ($("#Tmtr_url").val().replace(/^\s+|\s+$/g,"") == "") {
                errormsg += languageJSON.al_inWebUrl + "！\n";
                $("#Tmtr_url").val('')
            }
            // var url = $("#Tmtr_url").val();
            // var regExp = /^(ht|f)tp(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?$/;
            // else if (!regExp.test(url)) {
            //     errormsg += languageJSON.al_inRiWebUrl + "！\n";
            // }
        }
        if (errormsg != "") {
            alert(errormsg);
            return false;
        } else {
            return true;
        }

    }
})
