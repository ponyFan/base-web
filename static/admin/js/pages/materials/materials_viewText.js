define(function (require, exports, module) {
    var CONFIG = require("common/config.js");
    var UTIL = require("common/util.js");
    var languageJSON = CONFIG.languageJson.material;
    exports.materialID;
    exports.materialName;

    exports.init = function () {
        $('#mvt_close').click(function(){
            UTIL.cover.close();
        })
        $('#mvt_title').html(exports.materialName);
        var data={
            "Project": CONFIG.projectName,
            "Action": "GetCheckText"
        }
        UTIL.ajax(
            'POST', 
            CONFIG.serverRoot + '/backend_mgt/v1/webmaterials/'+exports.materialID, 
            JSON.stringify(data),
            function(data){
                if(data == ''){
                    $('#mvt_content').html(languageJSON.noContent)
                }
                else{
                    $('#mvt_content').html(data);
                }
                
            },
            'text'
        )
        
    }

})
