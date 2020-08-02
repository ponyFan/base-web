'use strict';

define(function (require, exports, module) {
    var CONFIG = require('common/config');
    var UTIL = require('common/util');
    var languageJSON = CONFIG.languageJson.termList;
    module.exports = Vue.extend({
        props: ['value', 'checked'],
        data: function data() {
            return {
                filterText: '',
                openNode: '',
                dialogVisible: false,
                checkedTerminal: [],
                treeProps: {
                    label: 'name'
                },
                terminalList: []
            };
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
                var param = {
                    'project_name': CONFIG.projectName,
                    'action': 'getTree',
                    'token': CONFIG.token,
                    'user': CONFIG.userName
                };
                axios.post(CONFIG.serverRoot + '/backend_mgt/v2/termcategory', param).then(function (res) {
                    var data = res.data;
                    if (data.rescode === '200') {
                        data.TermTree.children[0].disabled = true;
                        _this.terminalList = data.TermTree.children;
                        _this.openNode = data.TermTree.children[0].id;
                        if (_this.checked.name) {
                            _this.$refs.tree.setCheckedKeys([_this.checked.id]);
                        }
                    } else {
                        alert(languageJSON.al_gainTtFaild);
                    }
                });
            },
            setCheckedTerminal: function setCheckedTerminal(data, checked, indeterminate) {
                if (checked) {
                    this.$refs.tree.setCheckedNodes([data]);
                    this.checkedTerminal = data;
                }
                this.checkedTerminal = this.$refs.tree.getCheckedNodes();
            },
            filterNode: function filterNode(value, data) {
                if (!value) return true;
                return data.name.indexOf(value) !== -1;
            },
            resetChecked: function resetChecked() {
                this.$refs.tree.setCheckedKeys([]);
            },
            submit: function submit() {
                this.$emit('change', this.checkedTerminal[0]);
                this.dialogVisible = false;
                this.filterText = '';
            }
        },
        template: '<el-dialog title="请选择终端组" :visible.sync="dialogVisible" width="50%" @open="init"><el-input placeholder="输入关键字进行过滤" v-model="filterText" ref="searchInput"></el-input><div class="h30"></div><div v-if="checkedTerminal.length>0">已选择：<el-tag v-if="item.name" v-for="(item,index) in checkedTerminal" :key="index">{{item.name}}</el-tag><div class="h30"></div></div><el-tree :data="terminalList" show-checkbox="" node-key="id" :default-expanded-keys="[openNode]" :props="treeProps" ref="tree" :check-strictly="true" @check-change="setCheckedTerminal" :filter-node-method="filterNode" empty-text="无可用终端组"></el-tree><span slot="footer" class="dialog-footer"><el-button @click="resetChecked">清 空</el-button><el-button type="primary" @click="submit">确 定</el-button></span></el-dialog>'
    });
});