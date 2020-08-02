define(function (require, exports, module) {
    'use strict';

    var templates = require('common/templates'),
        config = require('common/config');
    var languageJSON = config.languageJson.channel;

    Array.prototype.includes = Array.prototype.includes || function (val) {
            for (var i = 0; i < this.length; i++) {
                if (val === this[i]) {
                    return true;
                }
            }
            return false;
        };

    /**
     *
     * @param obj
     * @constructor
     */
    function Timer(obj) {
        this.type = 0;
        this.tSeconds = obj.tSeconds;
        this.tMinutes = obj.tMinutes;
        this.tHours = obj.tHours;
        this.tDays = obj.tDays;
        this.tDates = obj.tDates;
        this.tMonths = obj.tMonths;
        this.tDuration = obj.tDuration;
        this.tGranularity = this.maxGranularity();
    }

    Timer.prototype.open = function (type,saveCallback) {
        this.type = type;
        this.saveCallback = saveCallback;
        var data = {
            months: this.tMonths,
            dates: this.tDates,
            days: this.tDays,
            hours: this.tHours,
            minutes: this.tMinutes,
            seconds: this.tSeconds,
            lang: {
                timingTrigger: languageJSON.timingTrigger,
                year: languageJSON.year,
                month: languageJSON.month,
                week: languageJSON.week,
                day: languageJSON.day,
                timer_annually: languageJSON.timer_annually,
                timer_monthly: languageJSON.timer_monthly,
                timer_everyDay: languageJSON.timer_everyDay,
                timer_everyHour: languageJSON.timer_everyHour,
                timer_everyMin: languageJSON.timer_everyMin,
                Month: [languageJSON.Jan,
                    languageJSON.Feb,
                    languageJSON.Mar,
                    languageJSON.Apr,
                    languageJSON.May,
                    languageJSON.Jun,
                    languageJSON.Jul,
                    languageJSON.Aug,
                    languageJSON.Sep,
                    languageJSON.Oct,
                    languageJSON.Nov,
                    languageJSON.Dec],
                Week: [languageJSON.Monday,
                    languageJSON.Tuesday,
                    languageJSON.Wednesday,
                    languageJSON.Thursday,
                    languageJSON.Friday,
                    languageJSON.Saturday,
                    languageJSON.Sunday,],
                annually: languageJSON.annually,
                monthly: languageJSON.monthly,
                everyWeek: languageJSON.everyWeek,
                everyDay: languageJSON.everyDay,
                everyHour: languageJSON.everyHour,
                everyMin: languageJSON.everyMin,
                save: languageJSON.save
            }
        };
        if(type == 3){
            //  z-index 2010
            $('#cover_area_preview').html(templates.channel_edit_timer(data))
            .css({display: 'flex'});
        }else if(type == 2){
            //  z-index 2009
            $('#cover_area2').html(templates.channel_edit_timer(data))
            .css({display: 'flex'});
        }else{
            //  z-index 2008
            $('#cover_area').html(templates.channel_edit_timer(data))
            .css({display: 'flex'});
        }
        
        $('#channel-editor-timer .timer-container')
            .addClass('granularity-' + this.tGranularity);
        $('#channel-editor-timer input[type="checkbox"]').iCheck({
            checkboxClass: 'icheckbox_minimal-blue'
        });
        $('#channel-editor-timer .select2')
            .select2();
        this.registerEventListeners();
    };

    Timer.prototype.registerEventListeners = function () {
        var self = this;
        $('#channel-editor-timer .btn-close').click(function () {
            self.destroy();
        });
        $('#channel-editor-timer .btn-save').click(function () {
            self.notifySave();
            self.destroy();
        });
        $('#channel-editor-timer .granularity-selector button').click(function () {
            self.updateGranularity(this.getAttribute('data-selector'));
        });
        $('#channel-editor-timer .check-all-month').on('ifToggled', function () {
            var bool = this.checked;
            $('#channel-editor-timer .month-selector input[type="checkbox"]')
                .iCheck(bool ? 'check' : 'uncheck');
        });
        $('#channel-editor-timer .check-all-date').on('ifToggled', function () {
            var bool = this.checked;
            $('#channel-editor-timer .date-selector input[type="checkbox"]')
                .iCheck(bool ? 'check' : 'uncheck');
        });
        $('#channel-editor-timer .check-all-day').on('ifToggled', function () {
            var bool = this.checked;
            $('#channel-editor-timer .day-selector input[type="checkbox"]')
                .iCheck(bool ? 'check' : 'uncheck');
        });
        //判断全选按钮
        //周
        $('.day-selector ul input').on('ifToggled', function () {
            var days = $('.day-selector ul input');
            var allCheck = true;
            //console.log(days.length);
            for (var i = 0; i < days.length; i++) {
                if (!days[i].checked) {
                    allCheck = false;
                }
            }
            if (allCheck == true) {
                $('.day-selector .check-all-day').parent().addClass('checked');
            } else {
                $('.day-selector .check-all-day').parent().removeClass('checked');
            }
        });
        //月
        $('.month-selector ul input').on('ifToggled', function () {
            var months = $('.month-selector ul input');
            var allCheck = true;
            //console.log(days.length);
            for (var i = 0; i < months.length; i++) {
                if (!months[i].checked) {
                    allCheck = false;
                }
            }
            if (allCheck == true) {
                $('.month-selector .check-all-month').parent().addClass('checked');
            } else {
                $('.month-selector .check-all-month').parent().removeClass('checked');
            }
        });
        //日
        $('.date-selector ul input').on('ifToggled', function () {
            var dates = $('.date-selector ul input');
            var allCheck = true;
            //console.log(days.length);
            for (var i = 0; i < dates.length; i++) {
                if (!dates[i].checked) {
                    allCheck = false;
                }
            }
            if (allCheck == true) {
                $('.date-selector .check-all-date').parent().addClass('checked');
            } else {
                $('.date-selector .check-all-date').parent().removeClass('checked');
            }
        });


        var checkAllHours = this.tHours.length === 24,
            checkAllMinutes = this.tMinutes.length === 60,
            checkAllSeconds = this.tSeconds.length === 60;
        $('#channel-editor-timer .hour-selector select').change(function () {
            var $this = $(this), val = $this.val();
            if (val === null) {
            } else if (val.includes('*') && val.length > 1) {
                if (!checkAllHours) {
                    checkAllHours = true;
                    $this.select2('val', ['*']);
                } else {
                    var newVal = [];
                    checkAllHours = false;
                    val.forEach(function (el) {
                        if (el !== '*') {
                            newVal.push(el);
                        }
                    });
                    $this.select2('val', newVal);
                }
            } else {
                checkAllHours = val.includes('*');
            }
        });
        $('#channel-editor-timer .minute-selector select').change(function () {
            var $this = $(this), val = $this.val();
            if (val === null) {
            } else if (val.includes('*') && val.length > 1) {
                if (!checkAllMinutes) {
                    checkAllMinutes = true;
                    $this.select2('val', ['*']);
                } else {
                    var newVal = [];
                    checkAllMinutes = false;
                    val.forEach(function (el) {
                        if (el !== '*') {
                            newVal.push(el);
                        }
                    });
                    $this.select2('val', newVal);
                }
            } else {
                checkAllMinutes = val.includes('*');
            }
        });
        $('#channel-editor-timer .second-selector select').change(function () {
            var $this = $(this), val = $this.val();
            if (val === null) {
            } else if (val.includes('*') && val.length > 1) {
                if (!checkAllSeconds) {
                    checkAllSeconds = true;
                    $this.select2('val', ['*']);
                } else {
                    var newVal = [];
                    checkAllSeconds = false;
                    val.forEach(function (el) {
                        if (el !== '*') {
                            newVal.push(el);
                        }
                    });
                    $this.select2('val', newVal);
                }
            } else {
                checkAllSeconds = val.includes('*');
            }
        });
    };

    Timer.prototype.updateGranularity = function (selector) {
        $('#channel-editor-timer .timer-container')
            .removeClass('granularity-' + this.tGranularity)
            .addClass('granularity-' + selector);
        this.tGranularity = selector;
    };

    Timer.prototype.notifySave = function () {
        var self = this;
        this.tMonths = [];
        $('#channel-editor-timer .month-selector input').each(function (idx, el) {
            if ($(el).hasClass('check-all-month')) {
                return;
            }
            el.checked && self.tMonths.push(parseInt(el.parentNode.parentNode.parentNode.getAttribute('data-id')));
        });
        this.tDates = [];
        $('#channel-editor-timer .date-selector input').each(function (idx, el) {
            if ($(el).hasClass('check-all-date')) {
                return;
            }
            el.checked && self.tDates.push(parseInt(el.parentNode.parentNode.parentNode.getAttribute('data-id')));
        });
        this.tDays = [];
        $('#channel-editor-timer .day-selector input').each(function (idx, el) {
            if ($(el).hasClass('check-all-day')) {
                return;
            }
            el.checked && self.tDays.push(parseInt(el.parentNode.parentNode.parentNode.getAttribute('data-id')));
        });
        var th = $('#channel-editor-timer .hour-selector select').val();
        if (th === null || th.includes('*')) {
            this.tHours = range(24);
        } else {
            this.tHours = th.map(function (el) {
                return parseInt(el);
            });
        }
        var tm = $('#channel-editor-timer .minute-selector select').val();
        if (tm === null || tm.includes('*')) {
            this.tMinutes = range(60);
        } else {
            this.tMinutes = tm.map(function (el) {
                return parseInt(el);
            });
        }
        var ts = $('#channel-editor-timer .second-selector select').val();
        if (tm === null || ts.includes('*')) {
            this.tSeconds = range(60);
        } else {
            this.tSeconds = ts.map(function (el) {
                return parseInt(el);
            });
        }
        this.saveCallback && this.saveCallback(Timer.encode(this));
    };

    Timer.prototype.unregisterEventListeners = function () {
    };

    Timer.prototype.maxGranularity = function () {
        var i;
        for (i = 1; i <= 7; i++) {
            if (!this.tDays.includes(i)) {
                return 'day';
            }
        }
        for (i = 1; i <= 12; i++) {
            if (!this.tMonths.includes(i)) {
                return 'month';
            }
        }
        for (i = 1; i <= 31; i++) {
            if (!this.tDates.includes(i)) {
                return 'date';
            }
        }
        return 'everyday';
    };

    Timer.prototype.destroy = function () {
        if(this.type == 3){
            //  z-index 2010
            $('#cover_area_preview')
            .empty()
            .css({display: 'none'});
        }else if(this.type == 2){
            //  z-index 2009
            $('#cover_area2')
            .empty()
            .css({display: 'none'});
        }else{
            //  z-index 2008
            $('#cover_area')
            .empty()
            .css({display: 'none'});
        }
        
        this.unregisterEventListeners();
    };

    function range(n, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        var arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i + start);
        }
        return arr;
    }

    function asArray(str) {
        var numbers = str.split(','),
            arr = [];
        numbers.forEach(function (el) {
            arr.push(parseInt(el));
        });
        arr.sort();
        return arr;
    }

    Timer.decode = function (str) {

        var segments = str.split(' '), obj = {};

        obj.tMonths = segments[4] === '*' ? range(12, 1) : asArray(segments[4]);
        obj.tDates = segments[3] === '*' ? range(31, 1) : asArray(segments[3]);
        obj.tDays = segments[6] === '*' ? range(7, 1) : asArray(segments[6]);
        obj.tHours = segments[2] === '*' ? range(24, 0) : asArray(segments[2]);
        obj.tMinutes = segments[1] === '*' ? range(60, 0) : asArray(segments[1]);
        obj.tSeconds = segments[0] === '*' ? range(60, 0) : asArray(segments[0]);
        return obj;

    };

    function checkRange(array, n, start) {
        if (typeof start !== 'number') {
            start = 1;
        }
        for (var i = start; i < (n + start); i++) {
            if (array.indexOf(i) === -1) {
                return false;
            }
        }
        return true;
    }

    Timer.encode = function (timer) {
        var segments = [], bool;
        if (timer.tGranularity === 'date' || timer.tGranularity === 'month') {
            segments[6] = '*';
            bool = checkRange(timer.tMonths, 12, 1) || timer.tMonths.length === 0;
            if (!bool && timer.tGranularity === 'month') {
                segments[4] = timer.tMonths.join(',');
            } else {
                segments[4] = '*';
            }
            bool = checkRange(timer.tDates, 31, 1) || timer.tDates.length === 0;
            segments[3] = bool ? '*' : timer.tDates.join(',');
        } else {
            segments[4] = '*';
            segments[3] = '*';
            bool = checkRange(timer.tDays, 7, 1) || timer.tDays.length === 0;
            if (!bool && timer.tGranularity === 'day') {
                segments[6] = timer.tDays.join(',');
            } else {
                segments[6] = '*';
            }
        }
        segments[5] = '*';
        segments[0] = checkRange(timer.tSeconds, 60, 0) ? '*' : timer.tSeconds.join(',');
        segments[1] = checkRange(timer.tMinutes, 60, 0) ? '*' : timer.tMinutes.join(',');
        segments[2] = checkRange(timer.tHours, 24, 0) ? '*' : timer.tHours.join(',');
        return segments.join(' ');
    };

    exports.Timer = Timer;

});
