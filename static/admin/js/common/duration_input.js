
define(function (require, exports, module) {
    'use strict';

    var templates = require('common/templates');

    function DurationInput(opts) {
        // required
        this.element = opts.element;
        // optional
        this.duration = typeof opts.duration === 'number' ? opts.duration : 0;
        this.onChange = typeof opts.onChange === 'function' ? opts.onChange : null;
        $(this.element).html(this.html());
        this.focused = null;
        this.$container = $(this.element).find('.duration-input-container');
        this.$text = $(this.element).find('.duration-input-text');
        this.$hidden = $(this.element).find('.duration-input-hidden');
        this.$hour = $(this.element).find('.duration-input-hour');
        this.$minute = $(this.element).find('.duration-input-minute');
        this.$second = $(this.element).find('.duration-input-second');
        this.bindEvents();
    }

    function duration2TextWithPad(duration) {
        var h = Math.floor(duration / 3600);
        duration -= h * 3600;
        var m = Math.floor(duration / 60);
        var s = duration - m * 60;
        h = h > 9 ? h : '0' + h;
        m = m > 9 ? m : '0' + m;
        s = s > 9 ? s : '0' + s;
        return {
            hour: h,
            minute: m,
            second: s
        };
    }

    DurationInput.prototype.html = function() {
        var texts = duration2TextWithPad(this.duration);
        return templates.common_duration_input({
            hour: texts.hour,
            minute: texts.minute,
            second: texts.second,
            duration: this.duration
        });
    };

    function keyCode2Number(keyCode) {
        if (keyCode >= 48 && keyCode <= 57) {
            return keyCode - 48;
        } else if (keyCode >= 96 && keyCode <= 105) {
            return keyCode - 96;
        }
        return null;
    }

    // http://stackoverflow.com/questions/7621711/how-to-prevent-blur-running-when-clicking-a-link-in-jquery
    DurationInput.prototype.bindEvents = function() {
        var self = this, clickInside = false;
        this.$text.focusin(function () {
            if (self.focused === null) {
                self.focus('hour');
            }
        });
        this.$text.focusout(function () {
            if (clickInside === true) {
                self.$text.focus();
                clickInside = false;
                return;
            }
            self.validate();
            self.focus(null);
        });
        this.$hour.on('mousedown', function () {
            self.focus('hour');
            clickInside = true;
            self.$text.focus();
        });
        this.$minute.on('mousedown', function () {
            self.focus('minute');
            clickInside = true;
            self.$text.focus();
        });
        this.$second.on('mousedown', function () {
            self.focus('second');
            clickInside = true;
            self.$text.focus();
        });
        this.$text.keydown(function (ev) {
            var keyCode = ev.keyCode || ev.which, digit, field, content;
            // tab
            if (keyCode === 9) {
                if (self.focused === 'hour') {
                    self.focus('minute');
                } else if (self.focused === 'minute') {
                    self.focus('second');
                } else {
                    self.focus('hour');
                }
                ev.preventDefault();
                return;
            }
            // backspace
            if (keyCode === 8) {
                switch (self.focused) {
                    case 'hour':
                        content = self.$hour.text();
                        content = content.substring(0, content.length - 1);
                        content = content.length < 2 ? '0' + content : content;
                        self.$hour.text(content);
                        break;
                    case 'minute':
                        content = self.$minute.text();
                        content = content.substring(0, content.length - 1);
                        content = content.length < 2 ? '0' + content : content;
                        self.$minute.text(content);
                        break;
                    case 'second':
                        content = self.$second.text();
                        content = content.substring(0, content.length - 1);
                        content = content.length < 2 ? '0' + content : content;
                        self.$second.text(content);
                        break;
                }
                ev.preventDefault();
                return;
            }
            // others
            digit = keyCode2Number(keyCode);
            if (digit === null) {
                return;
            }
            // digit
            switch (self.focused) {
                case 'hour':
                    content = self.$hour.text();
                    content += digit;
                    content = content.length > 2 && content[0] === '0' ? content.substring(1) : content;
                    self.$hour.text(content);
                    break;
                case 'minute':
                    content = self.$minute.text();
                    content += digit;
                    content = content.length > 2 ? content.substring(1) : content;
                    self.$minute.text(content);
                    break;
                case 'second':
                    content = self.$second.text();
                    content += digit;
                    content = content.length > 2 ? content.substring(1) : content;
                    self.$second.text(content);
                    break;
            }
        });
        this.$hidden.change(function () {
            var duration = parseInt(this.value);
            if (duration != self.duration) {
                self.duration = duration;
                var texts = duration2TextWithPad(duration);
                self.$hour.text(texts.hour);
                self.$minute.text(texts.minute);
                self.$second.text(texts.second);
                typeof self.onChange === 'function' && self.onChange(self.duration);
            }
        });
    };

    DurationInput.prototype.focus = function (current) {
        var old = this.focused, $old = null, $current = null;
        switch (old) {
            case 'hour':
                $old = this.$hour;
                break;
            case 'minute':
                $old = this.$minute;
                break;
            case 'second':
                $old = this.$second;
                break;
        }
        switch (current) {
            case 'hour':
                $current = this.$hour;
                break;
            case 'minute':
                $current = this.$minute;
                break;
            case 'second':
                $current = this.$second;
                break;
        }
        if ($old !== $current) {
            if ($old !== null) {
                $old.removeClass('active');
            }
            if ($current !== null) {
                $current.addClass('active');
            }
            this.validate();
        }
        this.focused = current;
    };

    DurationInput.prototype.validate = function () {
        var h = parseInt(this.$hour.text());
        var m = parseInt(this.$minute.text());
        m = m >= 60 ? 0 : m;
        var s = parseInt(this.$second.text());
        s = s >= 60 ? 0 : s;
        var duration = h * 3600 + m * 60 + s,
            texts = duration2TextWithPad(duration);
        this.$hour.text(texts.hour);
        this.$minute.text(texts.minute);
        this.$second.text(texts.second);
        if (duration !== this.duration) {
            this.duration = duration;
            typeof this.onChange === 'function' && this.onChange(this.duration);
        }
    };

    DurationInput.prototype.unbindEvents = function() {};

    DurationInput.prototype.destroy = function() {
        this.unbindEvents();
        $(this.element).empty();
    };

    exports.DurationInput = DurationInput;

});
