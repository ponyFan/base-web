define(function (require, exports, module) {
    var templates = require('common/templates'),
        CONFIG = require('common/config'),
        UTIL = require('common/util'),
        languageJSON = CONFIG.languageJson.termList

    exports.init = function () {
        selectLanguage()
        var app = new Vue({
            el: '#app',
            data: {
                loading: false,
                showTerminalGroup: false,
                showTerminalDev: false,
                showMeterials: false,
                checkGroup: false,
                checkTerminal: false,
                loadingExport: false,
                dateRange: [],
                startDate: UTIL.formatDate('yyyy/MM/dd', new Date(new Date() - 24 * 60 * 60 * 1000)),
                endDate: UTIL.formatDate('yyyy/MM/dd', new Date()),
                startTime: '00:00',
                endTime: '24:00',
                checkedTerminalGroup: {
                    name: ''
                },
                checkedTerminal: {
                    name: ''
                },
                checkedMaterials: [],
                pickerOptions: {
                    disabledDate: function (time) {
                        return time.getTime() > Date.now();
                    }
                },
                devKeyword: '',
                tableData: []
            },
            computed: {},
            methods: {
                changeTerminalGroup: function (val) {
                    if (!val) {
                        this.checkedTerminalGroup = {
                            name: ''
                        }
                    } else {
                        this.checkedTerminalGroup = val
                    }
                },
                changeTerminal: function (val) {
                    if (!val) {
                        this.checkedTerminal = {
                            name: ''
                        }
                    } else {
                        this.checkedTerminal = val
                    }
                },
                changeMaterials: function (val) {
                    this.checkedMaterials = JSON.parse(JSON.stringify(val))
                },
                focusGroup: function (el) {
                    this.showTerminalGroup = true
                    this.checkGroup = true
                    this.checkTerminal = false
                },
                focusTermialDev: function (el) {
                    this.showTerminalDev = true
                    this.checkGroup = false
                    this.checkTerminal = true
                },
                search: function () {
                    function getMinutes(time) {
                        return time.split(":")[0] * 60 + time.split(":")[1] * 1
                    }

                    var _this = this

                    let maxDate = Math.max(new Date(this.startDate).getTime(), new Date(this.endDate).getTime())
                    let minDate = Math.min(new Date(this.startDate).getTime(), new Date(this.endDate).getTime())

                    var startDate = UTIL.formatDate('yyyy/MM/dd', new Date(minDate)) + ' 00:00:00'
                    var endDate = UTIL.formatDate('yyyy/MM/dd', new Date(maxDate)) + ' 23:59:59'

                    var startTime = getMinutes(this.startTime)
                    var endTime = getMinutes(this.endTime)

                    var url = CONFIG.serverRoot + '/backend_mgt/advertisement_statis'

                    var terminal = this.checkTerminal ? {
                        id: this.checkedTerminal.ID,
                        mac: this.checkedTerminal.MAC
                    } : {}

                    var category = this.checkGroup ? {
                        id: this.checkedTerminalGroup.id,
                        name: this.checkedTerminalGroup.name
                    } : {}

                    var material = this.checkedMaterials.map(function (item) {
                        return {
                            id: item.ID,
                            name: item.Name
                        }
                    })

                    if (material.length === 0) {
                        this.$message.error('请选择资源')
                        return
                    }

                    var param = {
                        project_name: CONFIG.projectName,
                        action: "get_play_statis",
                        start_date: startDate,
                        end_date: endDate,
                        start_minute: startTime,
                        end_minute: endTime,
                        terms: terminal.id ? [terminal] : [],
                        categories: category.id ? [category] : [],
                        materials: material
                    }

                    this.exportParam = {
                        project_name: CONFIG.projectName,
                        action: "export_play_statis_xls",
                        start_date: UTIL.formatDate('yyyy/MM/dd', new Date(minDate)),
                        end_date: UTIL.formatDate('yyyy/MM/dd', new Date(maxDate)),
                        start_time: this.startTime,
                        end_time: this.endTime,
                        term: this.checkTerminal && this.checkedTerminal.ID ? this.checkedTerminal.Name : '所有终端',
                        category: this.checkGroup && category.id ? category.name : '所有终端组'
                    }

                    this.loading = true
                    UTIL.ajax('post', url, JSON.stringify(param), function (res) {
                        _this.loading = false

                        _this.tableData = res.statis

                        _this.exportParam.data = _this.tableData.map(function (item) {
                            return {
                                "0": item.MName,
                                "1": item.PlayCount,
                                "2": item.TName,
                                "3": item.Duration,
                                "4": item.CreateUser,
                                "5": item.CreateTime
                            }
                        })
                    })
                },
                exportTable: function () {
                    var _this = this
                    if (!this.exportParam || (this.exportParam && this.exportParam.data.length < 1)) {
                        this.$message.error('没有数据可以导出')
                        return
                    }

                    var url = CONFIG.serverRoot + '/backend_mgt/advertisement_statis'
                    var param = this.exportParam
                    this.loadingExport = true
                    UTIL.ajax('post', url, JSON.stringify(param), function (res) {
                        $('#download_link').attr('href', res.url)
                        $('#download_link').attr('download', res.url)
                        fake_click($('#download_link')[0])
                        _this.loadingExport = false
                    })
                }
            }

        })
    }

    /**
     * 语言切换绑定
     */
    function selectLanguage() {
        $(".page-title").html(languageJSON.playStatistics)
    }

    function fake_click(obj) {
        var ev = document.createEvent("MouseEvents");
        ev.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        obj.dispatchEvent(ev);
    }
})