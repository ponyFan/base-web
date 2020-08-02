'use strict';

define(function (require, exports, module) {
    loadCSS({ content: ".terminalDev .main:after {content: '';display: block;clear: both;}.terminalDev .top {margin-bottom: 10px;line-height: 40px;}.terminalDev .left {float: left;width: 300px;}.terminalDev .left .el-input {margin-bottom: 20px;}.terminalDev .right {margin-left: 320px;}.terminalDev .page-wrap {text-align: center;padding: 10px 0}.terminalDev .top-bar {text-align: right;margin-bottom: 20px;}.terminalDev .top-bar:after {content: '';}.terminalDev .top-bar .el-input {width: 200px;}.terminalDev .title {float: left;line-height: 40px;font-size: 14px;}.terminalDev .title b {font-weight: bold}" });

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
                terminalList: [],
                tableData: [],
                total: 0,
                currentPage: 1,
                keyword: '',
                radio: '',
                currentCate: null,
                currentTerminal: null,
                loading: false
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
                this.currentTerminal = this.checked;
                this.radio = this.checked.ID;
                this.getTerminalGroup();
            },
            search: function search(key) {
                this.getTerminal(1, this.currentCate.id, key);
            },
            getTerminalGroup: function getTerminalGroup() {
                var _this2 = this;

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
                        _this2.terminalList = data.TermTree.children;
                        _this2.openNode = data.TermTree.children[0].id;
                        _this2.currentCate = data.TermTree.children[0];
                        _this2.getTerminal(1, _this2.currentCate.id);
                    } else {
                        alert(languageJSON.al_gainTtFaild);
                    }
                });
            },
            getTerminal: function getTerminal(pageNum, categoryID, keyword) {
                var _this3 = this;

                this.currentPage = pageNum;
                this.loading = true;
                var param = {
                    'project_name': CONFIG.projectName,
                    'action': 'getTermList',
                    'token': CONFIG.token,
                    'user': CONFIG.userName,
                    'categoryID': categoryID,
                    'Pager': {
                        'total': -1,
                        'per_page': 10,
                        'page': pageNum,
                        'orderby': '',
                        'sortby': '',
                        'keyword': keyword ? keyword : '',
                        'status': ''
                    }
                };
                axios.post(CONFIG.serverRoot + '/backend_mgt/v2/termcategory', param).then(function (res) {
                    var data = res.data;
                    if (data.rescode === '200') {
                        _this3.tableData = data.termList.terms;
                        _this3.total = data.termList.totalTermNum;
                        _this3.loading = false;
                    } else {
                        alert(languageJSON.al_gainTtFaild);
                    }
                });
            },
            setTerminalGroup: function setTerminalGroup(data) {
                this.currentCate = data;
                this.currentPage = 1;
                this.getTerminal(1, data.id);
            },
            setTerminal: function setTerminal(id, data) {
                this.currentTerminal = data;
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
            handleRowClick: function handleRowClick(row, event, column) {
                this.radio = row.ID;
                this.currentTerminal = row;
            },
            submit: function submit() {
                this.$emit('change', this.currentTerminal);
                this.dialogVisible = false;
            },
            handleClose: function handleClose() {
                this.filterText = '';
                this.keyword = '';
            }
        },
        template: '<el-dialog class="terminalDev" title="请选择终端" :visible.sync="dialogVisible" width="90%" @open="init" @close="handleClose"><div class="top">已选择终端：<el-tag v-if="currentTerminal&amp;&amp;currentTerminal.Name">{{currentTerminal.Name}}</el-tag></div><div class="main"><div class="left"><el-input placeholder="输入过滤终端组" v-model="filterText" ref="searchInput"></el-input><el-tree :data="terminalList" node-key="id" :default-expanded-keys="[openNode]" :props="treeProps" ref="tree" :check-strictly="true" :filter-node-method="filterNode" empty-text="无可用终端组" @node-click="setTerminalGroup" :expand-on-click-node="false"></el-tree></div><div class="right"><div class="top-bar"><div class="title" v-if="currentCate"><b>当前终端组：</b> {{currentCate.name}}</div><el-input placeholder="输入过滤终端组" v-model="keyword" ref="searchInput"><el-button type="primary" slot="append" icon="el-icon-search" @click="search(keyword)"></el-button></el-input></div><el-table border="" :data="tableData" style="width: 100%;" @row-click="handleRowClick" v-loading="loading"><el-table-column width="50"><template slot-scope="scope"><el-radio :label="scope.row.ID" v-model="radio" @change="setTerminal($event,scope.row)">{{&#39;&#39;}}</el-radio></template></el-table-column><el-table-column prop="Name" label="终端名"></el-table-column><el-table-column prop="IP" label="IP"></el-table-column><el-table-column prop="TermVersion" label="版本"></el-table-column></el-table><div class="page-wrap"><el-pagination background="" layout="prev, pager, next" :total="total" @current-change="getTerminal($event,currentCate.id,keyword)" :current-page="currentPage"></el-pagination></div></div></div><span slot="footer" class="dialog-footer"><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">确 定</el-button></span></el-dialog>'
    });
});