

define(function(require, exports, module) {
    'use strict';

    var defaultDuration = 5000,
        timerHandles = {},
        maxToast = 3,
        maxToastId = 0;

    function show(msg) {
        var $jq = $('#toast-container');
        if ($jq.size() === 0) {
            $jq = $('<div id="toast-container"></div>')
                .appendTo($(document.body));
        }
        var toastId = maxToastId++;
        var toasts = $('#toast-container [data-toast-id]');
        if (toasts.size() === maxToast) {
            var id = parseInt(toasts.first().attr('data-toast-id'));
            clearTimeout(timerHandles[id]);
            delete timerHandles[id];
            toasts.first().remove();
        }
        var setTimeoutHandle = setTimeout(function() {
            $('#toast-container [data-toast-id=' + toastId + ']')
                .remove();
            delete timerHandles[toastId];
        }, defaultDuration);
        var newNode = $('<div data-toast-id="' + toastId + '">' + msg + '</div>')
            .appendTo($jq);
        timerHandles[toastId] = setTimeoutHandle;
    }

    exports.show = show;

});
