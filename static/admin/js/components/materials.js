'use strict';

define(function (require, exports, module) {
    loadCSS({ content: ".materailDialog .search-input {float: right;width: 200px;}.materailDialog .top {margin-bottom: 20px;}.materailDialog .page-wrap {text-align: center;padding: 10px 0}.materailDialog .el-tag {margin: 0 10px 10px 0}" });

    var CONFIG = require('common/config');
    var UTIL = require('common/util');
    module.exports = Vue.extend({
        props: ['value', 'checked'],
        data: function data() {
            return {
                type: {
                    value: 1,
                    label: '视频',
                    type: 'Video'
                },
                options: [{
                    value: 1,
                    label: '视频',
                    type: 'Video'
                }, {
                    value: 2,
                    label: '图片',
                    type: 'Image'
                }, {
                    value: 5,
                    label: '直播',
                    type: 'Live'
                }, {
                    value: 6,
                    label: '互联网广告',
                    type: 'RTBAdv'
                }, {
                    value: 8,
                    label: '节目包',
                    type: 'Program'
                }, {
                    value: 9,
                    label: '联屏资源',
                    type: 'UnionScreen'
                }],
                keyword: '',
                total: 0,
                currentPage: 1,
                dialogVisible: false,
                checkedTerminal: [],
                tableData: [],
                currentSelected: [],
                selectedMaterial: [],
                loading: false
            };
        },
        computed: {
            placeholder: function placeholder() {
                return '搜索' + this.type.label;
            }
        },
        watch: {
            value: function value(val) {
                this.dialogVisible = val;
            },
            dialogVisible: function dialogVisible(val) {
                this.$emit('input', val);
            },

            filterText: function filterText(val) {
                this.$refs.tree.filter(val);
            }
        },
        methods: {
            init: function init() {
                var _this = this;

                this.$nextTick(function () {
                    _this.$refs.searchInput.focus();
                });
                this.selectedMaterial = JSON.parse(JSON.stringify(this.checked));
                this.getMaterials(1);
            },
            getMaterials: function getMaterials(page, keyword) {
                var _this2 = this;

                this.loading = true;
                this.currentPage = page;
                var param = {
                    'project_name': CONFIG.projectName,
                    'action': 'GetPage',
                    'token': CONFIG.token,
                    'user': CONFIG.userName,
                    'material_type': this.type.type,
                    'search': '',
                    'Pager': {
                        page: page + '',
                        total: '0',
                        per_page: 10,
                        orderby: 'CreateTime',
                        sortby: 'DESC',
                        keyword: keyword ? keyword : '',
                        status: ''
                    }
                };
                axios.post(CONFIG.serverRoot + '/backend_mgt/v1/materials', param).then(function (res) {
                    var data = res.data;
                    if (data.rescode === '200') {
                        _this2.tableData = data.Materials;
                        _this2.total = data.Pager.total;
                        _this2.selectedMaterial.forEach(function (i) {
                            var selectIdx = _this2.tableData.findIndex(function (item) {
                                return item.ID === i.ID;
                            });
                            if (selectIdx > -1) {
                                _this2.$nextTick(function () {
                                    _this2.$refs.table.toggleRowSelection(_this2.tableData[selectIdx]);
                                });
                            }
                        });
                        _this2.loading = false;
                    } else {
                        _this2.$message.error('获取失败');
                    }
                });
            },
            handleTypeChange: function handleTypeChange() {
                this.currentPage = 1;
                this.getMaterials(1, this.keyword);
            },
            filterNode: function filterNode(value, data) {
                if (!value) return true;
                return data.name.indexOf(value) !== -1;
            },
            resetChecked: function resetChecked() {
                this.$refs.tree.setCheckedKeys([]);
            },
            submit: function submit() {
                this.$emit('change', this.selectedMaterial);
                this.dialogVisible = false;
            },
            handleSelect: function handleSelect(selection, row) {
                if (selection.indexOf(row) > -1) {
                    this.selectedMaterial.push(row);
                } else {
                    var idx = this.selectedMaterial.findIndex(function (item) {
                        return item.ID = row.ID;
                    });
                    idx > -1 && this.selectedMaterial.splice(idx, 1);
                }
            },

            // 换页时页面抖动，效果不好
            // handleSelectChange(selection){
            //     let remove=[]
            //     let add=[]
            //     this.tableData.forEach(item=>{
            //         let i=selection.find(i=>{
            //             return i.ID===item.ID
            //         })
            //         if(i){
            //             add.push(item)
            //         }else{
            //             remove.push(item)
            //         }
            //     })
            //     for (var i = this.selectedMaterial.length - 1; i >= 0; i--) {
            //         for (var k = 0; k < remove.length; k++) {
            //             if (this.selectedMaterial[i].ID == remove[k].ID) {
            //                 this.selectedMaterial.splice(i, 1);
            //                 break;
            //             }
            //         }
            //     }
            //     add.forEach(item=>{
            //         let i=this.selectedMaterial.find(i=>{
            //             return i.ID===item.ID
            //         })
            //         if(!i){
            //             this.selectedMaterial.push(item)
            //         }
            //     })
            // },
            handleSelectAll: function handleSelectAll(selection) {
                var _this3 = this;

                if (selection.length === this.tableData.length) {
                    selection.forEach(function (item) {
                        var select = _this3.selectedMaterial.find(function (i) {
                            return i.ID === item.ID;
                        });
                        if (!select) {
                            _this3.selectedMaterial.push(item);
                        }
                    });
                } else {
                    for (var i = this.selectedMaterial.length - 1; i >= 0; i--) {
                        for (var k = 0; k < this.tableData.length; k++) {
                            if (this.selectedMaterial[i].ID == this.tableData[k].ID) {
                                this.selectedMaterial.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            },
            clearAll: function clearAll() {
                this.$refs.table.clearSelection();
                this.selectedMaterial = [];
            },
            handleClose: function handleClose() {
                this.$refs.table.clearSelection();
                this.selectedMaterial = [];
                this.keyword = '';
                this.type = {
                    value: 1,
                    label: '视频',
                    type: 'Video'
                };
            },
            search: function search() {
                this.getMaterials(1, this.keyword);
            }
        },
        template: '<el-dialog class="materailDialog" title="请选择资源" :visible.sync="dialogVisible" width="50%" @open="init" @close="handleClose"><div class="top"><el-select v-model="type" placeholder="请选择" @change="handleTypeChange"><el-option v-for="item in options" :key="item.value" :label="item.label" :value="item"></el-option></el-select><el-input v-model="keyword" class="search-input" ref="searchInput" :placeholder="placeholder"><el-button type="primary" slot="append" icon="el-icon-search" @click="search(keyword)"></el-button></el-input></div><el-table ref="table" :data="tableData" v-loading="loading" border="" @select="handleSelect" @select-all="handleSelectAll"><el-table-column type="selection" width="55"></el-table-column><el-table-column prop="Name" label="文件名"></el-table-column><el-table-column prop="Size" label="大小" width="100"></el-table-column></el-table><div class="page-wrap" style="margin-bottom:20px"><el-pagination background="" :current-page="currentPage" layout="prev, pager, next" :total="total" @current-change="getMaterials($event,keyword)"></el-pagination></div>已选择资源：<el-tag v-for="(item,index) in selectedMaterial" :key="index">{{item.Name}}</el-tag><span slot="footer" class="dialog-footer"><el-button @click="clearAll">清空所有</el-button><el-button type="primary" @click="submit">确 定</el-button></span></el-dialog>'
    });
});