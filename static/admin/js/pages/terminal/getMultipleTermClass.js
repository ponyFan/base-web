define(function (require, exports, module) {

    var CONFIG = require('common/config'),
        UTIL = require("common/util.js"),
        TREE = require("common/treetree.js"),
        _tree,
        languageJSON;
    
    exports.save;
    exports.title;
    exports.roleID;
    exports.close;
    exports.categoryData = [];

    exports.init = function () {
        selectLanguage();
        $('#mul-TermClass-title').html(exports.title);
        // initTree();
        var item =  Vue.extend({
            template: '#item-template',
            props: {
                model: Object
            },
            data: function () {
                return {
                    open: true
                    // categoryData: exports.categoryData
                }
            },
            computed: {
                isFolder: function () {
                    return this.model.children &&
                        this.model.children.length
                }
                // isChecked:function(){
                //     var flag =false
                //     for(var i=0;i<this.categoryData.length;i++){
                //         if(this.categoryData[i].categoryID == this.model.id){
                //             flag = true
                //         }
                //     }
                //     return flag
                // }
            },
            methods: {
                toggle: function () {
                    if (this.isFolder) {
                        this.open = !this.open
                    }
                },
                changeItem: function(data){
                    
                }
                // changeChecked:function(){
                //     console.log(this.categoryData)
                //     if(this.isChecked){
                //         for(var i=0;i<this.categoryData.length;i++){
                //             if(this.categoryData[i].categoryID == this.model.id){
                //                 this.categoryData.splice(i,1)
                //             }
                //         }
                //     }else{
                //         this.categoryData.push({
                //             categoryID:this.model.id,
                //             name:this.model.name
                //         })
                //     }
                // }
            }
        })
        Vue.component('item',item)
        var app = new Vue({
            el: '#vue-terminal',
            data:function(){
                return{
                    treeData: {},
                    categoryData: exports.categoryData,
                    list:[]
                }
            },
            methods:{
                getTree: function(){
                    let that =this
                    var dataParameter = {
                        "project_name": CONFIG.projectName,
                        "action": "getTree"
                    };
                    UTIL.ajax(
                        'POST',
                        CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
                        JSON.stringify(dataParameter),
                        function (data) {
                            if (data.rescode === '200') {
                                if(data.TermTree.children && data.TermTree.children.length){
                                    that.treeData = data.TermTree.children[0];
                                    that.initChecked()
                                }else{
                                    that.treeData = {}
                                }                      
                            }
                        }
                    );
                },
                initChecked:function(){
                    for(var i=0;i<this.categoryData.length;i++){
                        this.isChecked(this.treeData,this.categoryData[i].categoryID)
                    }
                },
                isChecked:function(obj, id){
                    if(obj.id == id){
                        obj.isChecked = 1
                        // console.log(obj.id+'----'+ id)
                    }
                    if(obj.children && obj.children.length > 0){
                        for(var j=0;j<obj.children.length;j++){
                            this.isChecked(obj.children[j],id)
                        }
                    }
                },
                getAllChecked:function(){
                    this.list = []
                    this.addToList(this.treeData)
                    return this.list
                },
                addToList:function(obj){
                    if(obj.isChecked == 1){
                        this.list.push ({
                            categoryID: obj.id,
                            name: obj.name
                        })
                        //只保存勾选的根结点
                        return
                    }
                    if(obj.children && obj.children.length > 0){
                        for(var j=0;j<obj.children.length;j++){
                            this.addToList(obj.children[j])
                        }
                    }
                }
            },
            mounted:function(){
                this.getTree()
            }
        })
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
            // var categoryList = _tree.getSelectedNodeID();
            // categoryList = JSON.parse(JSON.stringify(categoryList).replace(/nodeId/g, 'categoryID'));
            // var categoryList
            
            var categoryList = app.getAllChecked()
            // console.log(categoryList)
            if (categoryList.length === 0 && exports.title !== '请选择终端组') {
                alert('已取消所有终端权限！');
                exports.save(categoryList);
            } else {
                exports.save(categoryList);
            }
        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        languageJSON = CONFIG.languageJson.termList;
        $("#mul-term-class-save").html(languageJSON.save);
    }

    function initTree() {
        var dataParameter = {
            "project_name": CONFIG.projectName,
            "action": "getTree"
        };

        if (exports.roleID) {
            dataParameter.roleID = Number(exports.roleID);
            exports.roleID = '';
        }

        UTIL.ajax(
            'POST',
            CONFIG.serverRoot + '/backend_mgt/v2/termcategory',
            JSON.stringify(dataParameter),
            function (data) {
                if (data.rescode === '200') {
                    data = data.TermTree.children;
                    _tree = {domId: 'mul-termclass-tree', checkMode: 'multiple'};
                    _tree = TREE.new(_tree);
                    //setChecked(data);
                    _tree.createTree($('#' + _tree.domId), data);
                    // 选中、打开第一个结点
                    var li = $('#' + _tree.domId).find('li:nth(0)');
                    _tree.openNode(li);
                    _tree.setFocus(li);
                } else {
                    alert(languageJSON.al_gainTtFaild);
                }
            }
        );
    }

    function setChecked(children) {
        for (var i = 0; i < children.length; i++) {
            if (children[i].children.length > 0) {
                setChecked(children[i].children);
            }
            var flag = false;
            var j = 0;
            for(j = 0; j < exports.categoryData.length; j++) {
                if (exports.categoryData[j].categoryID === children[i].id) {
                    children[i].isChecked = 1;
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                children[i].isChecked = 0;
            }
        }
    }

});
