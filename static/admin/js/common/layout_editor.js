'use strict';

define(function (require, exports, module) {
    var UTIL = require("common/util.js");
    var CONFIG = require("common/config.js"),
        languageJSON = CONFIG.languageJson.channel;
    /**
     *
     * @type {{NONE: number, CONTENT: number, TOP: number, BOTTOM: number, LEFT_TOP: number, LEFT: number, LEFT_BOTTOM: number, RIGHT_TOP: number, RIGHT: number, RIGHT_BOTTOM: number}}
     */
    var WIDGET_AREA = {
        NONE: 0,
        CONTENT: 1,
        TOP: 2,
        BOTTOM: 3,
        LEFT_TOP: 4,
        LEFT: 5,
        LEFT_BOTTOM: 6,
        RIGHT_TOP: 7,
        RIGHT: 8,
        RIGHT_BOTTOM: 9
    };
    /**
     *
     * @type {number} widget边界模糊判断的半径
     */
    var WIDGET_BORDER_TOLERATE = 5;
    /**
     *
     * @type {number} widget的alpha值
     */
    var WIDGET_ALPHA = 0.9;
    /**
     *
     * @type {number} 标尺宽度
     */
    var RULER_WIDTH = 0;
    /**
     *
     * @type {number} 初始画布时，layout占屏幕的最大比例
     */
    var MIN_CANVAS_SCALE = 0.9;
    /**
     *
     * @type {number} 默认字体大小
     */
    var DEFAULT_FONT_SIZE = 14;

    /**
     * 生成一个颜色迭代器，能够确保色相尽量分散
     * 参考:
     * http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
     * http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
     * @returns {Function}
     */
    function createColorIterator() {

        /* accepts parameters
         * h  Object = {h:x, s:y, v:z}
         * OR
         * h, s, v
         */
        function HSVtoRGB(h, s, v) {
            var r, g, b, i, f, p, q, t;
            if (arguments.length === 1) {
                s = h.s, v = h.v, h = h.h;
            }
            i = Math.floor(h * 6);
            f = h * 6 - i;
            p = v * (1 - s);
            q = v * (1 - f * s);
            t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: r = v, g = t, b = p; break;
                case 1: r = q, g = v, b = p; break;
                case 2: r = p, g = v, b = t; break;
                case 3: r = p, g = q, b = v; break;
                case 4: r = t, g = p, b = v; break;
                case 5: r = v, g = p, b = q; break;
            }
            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        }

        var h = 0.8, s = 0.5, v = 0.95, a = WIDGET_ALPHA;

        return function () {
            h += 0.618033988749895;
            h %= 1;
            var rgb = HSVtoRGB(h, s, v);
            return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
        };

    }

    /**
     * 根据拖动事件，更新widget大小和位置
     * @param widget, 被拖动的widget
     * @param area, 初始拖动区域
     * @param reference, 参考点,对于拖动角而言，表示对角坐标；对于拖动边而言，表示对边的坐标
     * @param current，当前点的坐标
     */
    function onDragWidget(widget, area, reference, current) {
        var cx = current.x,
            cy = current.y,
            rx = reference.x,
            ry = reference.y,
            zf = widget.mContext.mZoomFactor,
            t = widget.mTop * widget.mContext.mZoomFactor,
            l = widget.mLeft * widget.mContext.mZoomFactor,
            w = widget.mWidth * widget.mContext.mZoomFactor,
            h = widget.mHeight * widget.mContext.mZoomFactor,
            offsetX, offsetY;
        switch (area) {
            case WIDGET_AREA.CONTENT:
                offsetX = (cx - rx) / zf;
                offsetY = (cy - ry) / zf;
                reference.x = cx;
                reference.y = cy;
                widget.translateTo(
                    Math.round(widget.mLeft + offsetX),
                    Math.round(widget.mTop + offsetY)
                );
                widget.requestFocus();
                return;
            case WIDGET_AREA.TOP:
            case WIDGET_AREA.BOTTOM:
                if (cy < ry) {
                    t = cy;
                    h = ry - cy;
                } else {
                    t = ry;
                    h = cy - ry;
                }
                break;
            case WIDGET_AREA.RIGHT:
            case WIDGET_AREA.LEFT:
                if (cx < rx) {
                    l = cx;
                    w = rx - cx;
                } else {
                    l = rx;
                    w = cx - rx;
                }
                break;
            case WIDGET_AREA.LEFT_TOP:
            case WIDGET_AREA.LEFT_BOTTOM:
            case WIDGET_AREA.RIGHT_TOP:
            case WIDGET_AREA.RIGHT_BOTTOM:
                if (rx < cx) {
                    l = rx;
                    w = cx - rx;
                } else {
                    l = cx;
                    w = rx - cx;
                }
                if (ry < cy) {
                    t = ry;
                    h = cy - ry;
                } else {
                    t = cy;
                    h = ry - cy;
                }
                break;
            default:
                return;
        }
        widget.resize({
            top     : Math.round(t / zf),
            left    : Math.round(l / zf),
            width   : Math.round(w / zf),
            height  : Math.round(h / zf)
        });
        widget.notifyDragEvent();
    }

    /**
     * 将鼠标位置映射为指针样式
     * @param area
     * @returns {*}
     */
    function mapArea2Cursor(area) {
        var cursorStyle;
        switch (area) {
            case WIDGET_AREA.LEFT:
                cursorStyle = 'w-resize';
                break;
            case WIDGET_AREA.RIGHT:
                cursorStyle = 'e-resize';
                break;
            case WIDGET_AREA.CONTENT:
                cursorStyle = 'move';
                break;
            case WIDGET_AREA.LEFT_TOP:
                cursorStyle = 'nw-resize';
                break;
            case WIDGET_AREA.TOP:
                cursorStyle = 'n-resize';
                break;
            case WIDGET_AREA.RIGHT_TOP:
                cursorStyle = 'ne-resize';
                break;
            case WIDGET_AREA.LEFT_BOTTOM:
                cursorStyle = 'sw-resize';
                break;
            case WIDGET_AREA.BOTTOM:
                cursorStyle = 's-resize';
                break;
            case WIDGET_AREA.RIGHT_BOTTOM:
                cursorStyle = 'se-resize';
                break;
            default:
                cursorStyle = 'default';
        }
        return cursorStyle;
    }

    /**
     * 根据widget和区域确定参考点坐标
     * @param widget
     * @param area
     * @returns {{x: number, y: number}}
     */
    function getReferencePoint(widget, area) {
        var t = widget.mTop,
            l = widget.mLeft,
            w = widget.mWidth,
            h = widget.mHeight,
            zf = widget.mContext.mZoomFactor,
            x, y;
        switch (area) {
            case WIDGET_AREA.LEFT:
            case WIDGET_AREA.LEFT_BOTTOM:
                x = l + w;
                y = t;
                break;
            case WIDGET_AREA.RIGHT:
            case WIDGET_AREA.BOTTOM:
            case WIDGET_AREA.RIGHT_BOTTOM:
                x = l;
                y = t;
                break;
            case WIDGET_AREA.LEFT_TOP:
                x = l + w;
                y = t + h;
                break;
            case WIDGET_AREA.TOP:
            case WIDGET_AREA.RIGHT_TOP:
                x = l;
                y = t + h;
                break;
        }
        return {
            x: x * zf,
            y: y * zf
        };
    }

    /**
     * LayoutEditor的构造函数
     * @param obj 适配过的配置参数
     * @param viewWidth 容器宽度
     * @param viewHeight 容器高度
     * {
     *   width: <number>,
     *   height: <number>,
     *   name: <string>,
     *   nameEng: <string>,
     *   id: <number>,
     *   leftMargin: <number>,
     *   rightMargin: <number>,
     *   topMargin: <number>,
     *   bottomMargin: <number>,
     *   backgroundColor: <string>,
     *   backgroundImage: {
     *      url: <string>,
     *      id: <number>,
     *      download_auth_type: <string>
     *   },
     *   widgets: [
     *      {
     *          ,
     *      }
     *   ]
     * }
     * @constructor
     */
    function LayoutEditor(obj, viewWidth, viewHeight, editable) {

        this.mTopRuler          = document.createElement('div');
        this.mLeftRuler         = document.createElement('div');
        this.mCanvas            = document.createElement('div');
        this.mCanvasContainer   = document.createElement('div');
        this.mCanvasContainer.appendChild(this.mCanvas);
        this.mElement           = document.createElement('div');
        this.mElement.appendChild(this.mTopRuler);
        this.mElement.appendChild(this.mLeftRuler);
        this.mElement.appendChild(this.mCanvasContainer);

        var zx          = (viewWidth - RULER_WIDTH) / obj.width;
        var zy          = (viewHeight - RULER_WIDTH) / obj.height;
        var zoomFactor  = Math.min(zx, zy) * MIN_CANVAS_SCALE;
        var wWidth      = viewWidth - RULER_WIDTH;
        var wHeight     = viewHeight - RULER_WIDTH;
        
        var layout = new Layout({
            width:              obj.width,
            height:             obj.height,
            backgroundColor:    obj.backgroundColor,
            backgroundImage:    obj.backgroundImage,
            topMargin:          obj.topMargin,
            bottomMargin:       obj.bottomMargin,
            leftMargin:         obj.leftMargin,
            rightMargin:        obj.rightMargin,
            id:                 obj.id,
            name:               obj.name,
            nameEng:            obj.nameEng,
            widgets:            obj.widgets,
            element:            this.mCanvas,
            context:            this
        });

        this.mWindowWidth   = wWidth;
        this.mWindowHeight  = wHeight;
        this.mViewWidth     = viewWidth;
        this.mViewHeight    = viewHeight;
        this.mLayout        = layout;
        this.mZoomFactor    = zoomFactor;
        this.mWidgetsChangedListener = null;
        this.mFocusChangedListener = null;

        this.mTopRuler.style.height =
            this.mLeftRuler.style.width =
                this.mCanvasContainer.style.top =
                    this.mCanvasContainer.style.left =
                        RULER_WIDTH + 'px';
        this.mCanvasContainer.style.position = 'absolute';
        this.mCanvasContainer.style.overflow = 'auto';
        this.mCanvas.style.position = 'absolute';

        this.registerEventListeners(editable);

    }

    LayoutEditor.prototype.registerEventListeners = function (editable) {

        var dragArea, dragWidget, referencePoint, isDragging = false, self = this;

        $(this.mCanvas).mouseenter(function (ev) {
            $(this).on('mousemove', function (evt) {
                var offset = $(this).offset(),
                    offsetX = evt.pageX - offset.left,
                    offsetY = evt.pageY - offset.top,
                    currentPoint = {x: offsetX, y: offsetY},
                    result = self.mLayout.determineWidgetByOffset(offsetX, offsetY);
                if (isDragging) {
                    onDragWidget(dragWidget, dragArea, referencePoint, currentPoint);
                }
                this.style.cursor = mapArea2Cursor(result.area);
                return false;
            });
            $(this).one('mouseleave', function (evt) {
                $(this).off('mousemove');
                isDragging = false;
                return false;
            });
            return false;
        });

        $(this.mCanvas).mousedown(function (ev) {
            var offset = $(this).offset(),
                offsetX = ev.pageX - offset.left,
                offsetY = ev.pageY - offset.top,
                result = self.mLayout.determineWidgetByOffset(offsetX, offsetY);
            if (editable) {
                dragArea = result.area;
                if (result.area === WIDGET_AREA.CONTENT) {
                    referencePoint = {x: offsetX, y: offsetY};
                    dragWidget = result.widget;
                    dragWidget.requestFocus();
                    isDragging = true;
                } else if (result.area !== WIDGET_AREA.NONE) {
                    dragWidget = result.widget;
                    referencePoint = getReferencePoint(dragWidget, result.area);
                    dragWidget.requestFocus();
                    isDragging = true;
                }
                $(this).one('mouseup', function (evt) {
                    isDragging = false;
                    return false;
                });
            } else {
                if (result.widget) {
                    result.widget.requestFocus();
                }
            }

            return false;
        });

    };

    /**
     * 绘制LayoutEditor
     */
    LayoutEditor.prototype.onDraw = function () {

        this.mElement.style.width = this.mViewWidth + 'px';
        this.mElement.style.height = this.mViewHeight + 'px';
        this.mTopRuler.style.width = this.mViewWidth + 'px';
        this.mLeftRuler.style.height = this.mViewHeight - RULER_WIDTH + 'px';
        this.mCanvasContainer.style.height = this.mWindowHeight + 'px';
        this.mCanvasContainer.style.width = this.mWindowWidth + 'px';
        this.mCanvas.style.top = (this.mWindowHeight - this.mLayout.mHeight * this.mZoomFactor) / 2 + 'px';
        this.mCanvas.style.left = (this.mWindowWidth - this.mLayout.mWidth * this.mZoomFactor) / 2 + 'px';

        this.mLayout.onDraw();

    };

    /**
     * 改变LayoutEditor容器的大小
     * @param viewWidth
     * @param viewHeight
     */
    LayoutEditor.prototype.resize = function (viewWidth, viewHeight) {
        var zx              = (viewWidth - RULER_WIDTH) / this.mLayout.mWidth;
        var zy              = (viewHeight - RULER_WIDTH) / this.mLayout.mHeight;
        this.mZoomFactor    = Math.min(zx, zy) * MIN_CANVAS_SCALE;
        this.mWindowWidth   = viewWidth - RULER_WIDTH;
        this.mWindowHeight  = viewHeight - RULER_WIDTH;
        this.onResize();
    };

    /**
     * LayoutEditor的Resize回调
     */
    LayoutEditor.prototype.onResize = function () {
        this.onDraw();
    };

    /**
     * 缩放LayoutEditor
     * @param zoomFactor
     */
    LayoutEditor.prototype.zoom = function (zoomFactor) {
        var temp = zoomFactor / this.mZoomFactor;
        this.mWindowWidth *= temp;
        this.mWindowHeight *= temp;
        this.mZoomFactor = zoomFactor;
        this.onDraw();
    };

    /**
     * 将LayoutEditor附着在DOM元素上
     * @param el
     */
    LayoutEditor.prototype.attachToDOM = function (el) {
        this.onDraw();
        el.appendChild(this.mElement);
        var self = this, $el = $(el);
        $(window).on('resize.canvas', function () {
            self.resize($el.width(), $el.height());
        });
    };

    /**
     * 返回LayoutEditor的layout
     * @returns {Layout|*}
     */
    LayoutEditor.prototype.getLayout = function () {
        return this.mLayout;
    };

    /**
     * 返回当前的缩放比例
     * @returns {number|*}
     */
    LayoutEditor.prototype.getZoomFactor = function () {
        return this.mZoomFactor;
    };

    /**
     * 设置聚焦widget改变的回调函数
     * @param listener
     */
    LayoutEditor.prototype.onFocusChanged = function (listener) {
        this.mFocusChangedListener = listener;
    };

    /**
     * 通知焦点改变的事件
     */
    LayoutEditor.prototype.notifyFocusChanged = function () {
        this.mFocusChangedListener && this.mFocusChangedListener();
    };

    /**
     * 设置layout包含widget改变回调函数
     * @param listener
     */
    LayoutEditor.prototype.onWidgetsChanged = function (listener) {
        this.mWidgetsChangedListener = listener;
    };

    /**
     * 通知layout包含widget改变的事件
     */
    LayoutEditor.prototype.notifyWidgetsChanged = function () {
        this.mWidgetsChangedListener && this.mWidgetsChangedListener(this);
    };

    LayoutEditor.prototype.showPreview = function (resources) {
        this.mLayout.showPreview(resources);
    };

    LayoutEditor.prototype.hidePreview = function () {
        this.mLayout.hidePreview();
    };

    LayoutEditor.prototype.destroy = function () {
        $(window).off('resize.canvas');
        $(this.mCanvas)
            .off('mousedown')
            .off('mouseup')
            .off('mouseenter')
            .off('mouseleave');
    };

    /**
     * Layout类的构造函数
     * @param obj
     * @constructor
     */
    function Layout(obj) {

        this.mWidth             = obj.width;
        this.mHeight            = obj.height;
        this.mBackgroundColor   = obj.backgroundColor;
        this.mBackgroundImage   = obj.backgroundImage;
        this.mTopMargin         = obj.topMargin;
        this.mBottomMargin      = obj.bottomMargin;
        this.mLeftMargin        = obj.leftMargin;
        this.mRightMargin       = obj.rightMargin;
        this.mId                = obj.id;
        this.mName              = obj.name;
        this.mNameEng           = obj.nameEng;
        this.mElement           = obj.element;
        this.mContext           = obj.context;

        this.mWidgets           = [];
        this.mColorIterator     = createColorIterator();
        
        this.mFocusMask                     = document.createElement('div');
        this.mFocusMask.style.position      = 'absolute';
        this.mContent                       = document.createElement('div');
        this.mContent.appendChild(this.mFocusMask);
        this.mContent.style.position        = 'absolute';
        this.mContent.style.top             = this.mTopMargin + 'px';
        this.mContent.style.left            = this.mLeftMargin + 'px';
        this.mContent.style.backgroundSize  = '100% 100%';
        this.mElement.appendChild(this.mContent);
        this.mElement.style.boxShadow = '0 5px 10px 0 rgba(0, 0, 0, 0.26)';

        /************* focus on last widget ***************/
        var lastWidget = null, self = this;
        var _widget1 = null, _widget2 = null;
        var mtrType = localStorage.getItem('mtrType');
        var currentURL = localStorage.getItem('ad_plan')|| window.location.hash.indexOf('adp_edit')> 0 ? true : false;
        obj.widgets.forEach(function (el) {
            var widget = Widget.create(el, self);
            self.addWidget(widget);
            lastWidget = widget;
            el.type == 'AdVideoBox' ? _widget1 = widget : '';
            el.type == 'AdImageBox' ? _widget2 = widget : '';
        });
        if (currentURL && mtrType == 'Video') {
            this.mFocusedWidget = _widget1;
        } else if (currentURL && mtrType == 'Image') {
            this.mFocusedWidget = _widget2;
        } else {
            this.mFocusedWidget = lastWidget;
        }
        /**************** end of this section **************/

    }

    Layout.prototype.toJSON = function () {
        var widgets = [];
        this.mWidgets.forEach(function (el, idx, arr) {
            widgets.push({
                top: el.mTop,
                left: el.mLeft,
                width: el.mWidth,
                height: el.mHeight,
                id: el.mId,
                type: el.mType,
                typeName: el.mTypeName,
                widget: el
            });
        });
        return {
            id: this.mId,
            name: this.mName,
            nameEng: this.mNameEng,
            width: this.mWidth,
            height: this.mHeight,
            topMargin: this.mTopMargin,
            leftMargin: this.mLeftMargin,
            rightMargin: this.mRightMargin,
            bottomMargin: this.mBottomMargin,
            backgroundImage: this.mBackgroundImage.type === 'Image' ? {
                url: this.mBackgroundImage.url,
                id: this.mBackgroundImage.id,
                type: this.mBackgroundImage.type,
                download_auth_type: this.mBackgroundImage.download_auth_type
            } : {
                id: 0,
                type: 'Unknown'
            },
            backgroundColor: this.mBackgroundColor,
            widgets: widgets,
            layout: this
        };
    };

    /**
     * 设置layout的名字
     * @param name
     */
    Layout.prototype.setName = function (name) {
        this.mName = name;
    };

    /**
     * 获取layout的名字
     * @returns {*}
     */
    Layout.prototype.getName = function () {
        return this.mName;
    };

    /**
     * 设置英文名
     * @param nameEng
     */
    Layout.prototype.setNameEng = function (nameEng) {
        this.mNameEng = nameEng;
    };

    /**
     * 获取英文名
     * @returns {*}
     */
    Layout.prototype.getNameEng = function () {
        return this.mNameEng;
    };

    /**
     * 设置id
     * @param id
     */
    Layout.prototype.setId = function (id) {
        this.mId = id;
    };

    /**
     * 获取id
     * @returns {paths.ID|{path, name}|*|RegExp}
     */
    Layout.prototype.getId = function () {
        return this.mId;
    };

    /**
     * 设置背景色
     * @param backgroundColor
     */
    Layout.prototype.setBackgroundColor = function (backgroundColor) {
        this.mBackgroundColor = backgroundColor;
        this.mContent.style.backgroundColor = backgroundColor;
    };

    /**
     * 设置背景图片
     * @param backgroundImage
     */
    Layout.prototype.setBackgroundImage = function (backgroundImage) {
        this.mBackgroundImage = backgroundImage;
        if (this.mBackgroundImage && this.mBackgroundImage.type === 'Image') {
            var realUrl = UTIL.getRealURL(this.mBackgroundImage.download_auth_type, this.mBackgroundImage.url);
            this.mContent.style.backgroundImage = 'url(' + realUrl + ')';
        } else {
            this.mContent.style.backgroundImage = 'none';
        }
    };

    /**
     * 添加widget
     * @param widget
     */
    Layout.prototype.addWidget = function (widget) {
        this.mWidgets.push(widget);
        widget.onDraw();
        this.mContent.insertBefore(widget.mElement, this.mFocusMask);
        this.mContext.notifyWidgetsChanged();
    };

    /**
     * 删除widget
     * @param widget
     */
    Layout.prototype.deleteWidget = function (widget) {
        var wIndex = -1;
        for (var i = 0; i < this.mWidgets.length; i++) {
            if (widget === this.mWidgets[i]) {
                wIndex = i;
                break;
            }
        }
        if (wIndex !== -1) {
            this.mContent.removeChild(widget.mElement);
            if (wIndex !== 0) {
                this.mWidgets.splice(wIndex, 1);
                this.mWidgets[wIndex - 1].requestFocus();
            } else {
                this.mWidgets.splice(wIndex, 1);
                if (this.mWidgets.length > 0) {
                    this.mWidgets[wIndex].requestFocus();
                } else {
                    this.mFocusedWidget = null;
                    this.focus(null);
                }
            }
            this.mContext.notifyWidgetsChanged();
        }
    };

    /**
     * 移动一个widget
     * @param widget
     * @param step
     */
    Layout.prototype.move = function (widget, step) {
        var wIndex = -1;
        for (var i = 0; i < this.mWidgets.length; i++) {
            if (widget === this.mWidgets[i]) {
                wIndex = i;
                break;
            }
        }
        if (wIndex !== -1 && step !== 0 && (wIndex + step < this.mWidgets.length && wIndex + step >= 0)) {
            this.mWidgets.splice(wIndex, 1);
            this.mWidgets.splice(wIndex + step, 0, widget);
            var el = this.mContent.childNodes[wIndex];
            this.mContent.removeChild(el);
            this.mContent.insertBefore(el, this.mContent.childNodes[wIndex + step]);
            this.mContext.notifyWidgetsChanged();
        }
    };

    /**
     * 判断当前hover的widget和位置
     * @param rx
     * @param ry
     * @returns {*}
     */
    Layout.prototype.determineWidgetByOffset = function (rx, ry) {

        function findAreaByOffset(widget, zoomFactor, rx, ry) {
            var l1, l2, t1, t2, r1, r2, b1, b2;
            l1 = widget.mLeft * zoomFactor - WIDGET_BORDER_TOLERATE;
            l2 = widget.mLeft * zoomFactor + WIDGET_BORDER_TOLERATE;
            t1 = widget.mTop * zoomFactor - WIDGET_BORDER_TOLERATE;
            t2 = widget.mTop * zoomFactor + WIDGET_BORDER_TOLERATE;
            r1 = (widget.mLeft  + widget.mWidth)    * zoomFactor - WIDGET_BORDER_TOLERATE;
            r2 = (widget.mLeft  + widget.mWidth)    * zoomFactor + WIDGET_BORDER_TOLERATE;
            b1 = (widget.mTop   + widget.mHeight)   * zoomFactor - WIDGET_BORDER_TOLERATE;
            b2 = (widget.mTop   + widget.mHeight)   * zoomFactor + WIDGET_BORDER_TOLERATE;
            if (ry < b2 && ry > t1) {
                if (rx < r1 && rx > l2) {
                    if (ry > t2) {
                        if (ry < b1) {
                            return WIDGET_AREA.CONTENT;
                        } else {
                            return WIDGET_AREA.BOTTOM;
                        }
                    } else {
                        return WIDGET_AREA.TOP;
                    }
                } else if (rx > l1 && rx <= l2) {
                    if (ry > t2) {
                        if (ry < b1) {
                            return WIDGET_AREA.LEFT;
                        } else {
                            return WIDGET_AREA.LEFT_BOTTOM;
                        }
                    } else {
                        return WIDGET_AREA.LEFT_TOP;
                    }
                } else if (rx >= r1 && rx < r2) {
                    if (ry > t2) {
                        if (ry < b1) {
                            return WIDGET_AREA.RIGHT;
                        } else {
                            return WIDGET_AREA.RIGHT_BOTTOM;
                        }
                    } else {
                        return WIDGET_AREA.RIGHT_TOP;
                    }
                }
            }
            return WIDGET_AREA.NONE;
        }

        if (!this.mFocusedWidget) {
            return {
                widget: null,
                area: WIDGET_AREA.NONE
            }
        }
        var widget = this.mFocusedWidget, area = findAreaByOffset(this.mFocusedWidget, this.mContext.mZoomFactor, rx, ry);
        for (var i = this.mWidgets.length - 1; i >= 0 && area === WIDGET_AREA.NONE; i--) {
            widget = this.mWidgets[i];
            if (this.mFocusedWidget === widget) {
                continue;
            }
            area = findAreaByOffset(widget, this.mContext.mZoomFactor, rx, ry);
        }

        return {
            widget: widget,
            area: area
        }
    };

    /**
     * 获取当前focus的widget
     * @returns {*|null}
     */
    Layout.prototype.getFocusedWidget = function () {
        return this.mFocusedWidget;
    };

    /**
     * 聚焦到某个元素，当widget 为null时，不显示
     * @param widget
     */
    Layout.prototype.focus = function (widget) {
        this.mFocusedWidget = widget;
        var zoomFactor = this.mContext.mZoomFactor;
        this.mFocusMask.style.top         = widget ? this.mFocusedWidget.mTop   * zoomFactor + 'px' : '0px';
        this.mFocusMask.style.left        = widget ? this.mFocusedWidget.mLeft  * zoomFactor + 'px' : '0px';
        this.mFocusMask.style.width       = widget ? this.mFocusedWidget.mWidth * zoomFactor + 'px' : '0px';
        this.mFocusMask.style.height      = widget ? this.mFocusedWidget.mHeight    * zoomFactor + 'px' : '0px';
        //this.mFocusMask.style.border      = widget ? 'solid 1px rgb(0,255,255)' : 'none';
        this.mFocusMask.style.border = widget ? 'solid 2px red' : 'none';
        this.mContext.notifyFocusChanged();
    };

    /**
     * 通过颜色迭代器产生下一个颜色
     * @returns {*}
     */
    Layout.prototype.nextColor = function () {
        return this.mColorIterator();
    };

    /**
     * 重新绘制的回调函数
     */
    Layout.prototype.onResize = function () {
        this.mContext.resize(this.mContext.mWindowWidth + RULER_WIDTH, this.mContext.mWindowHeight + RULER_WIDTH);
    };

    /**
     * 绘制Layout
     */
    Layout.prototype.onDraw = function () {
        var zoomFactor = this.mContext.mZoomFactor;
        this.mElement.style.width  = this.mWidth  * zoomFactor + 'px';
        this.mElement.style.height = this.mHeight * zoomFactor + 'px';
        this.mContent.style.width  = (this.mWidth - this.mLeftMargin - this.mRightMargin) * zoomFactor + 'px';
        this.mContent.style.height = (this.mHeight - this.mTopMargin - this.mBottomMargin) * zoomFactor + 'px';
        this.setBackgroundColor(this.mBackgroundColor);
        this.setBackgroundImage(this.mBackgroundImage);
        this.mWidgets.forEach(function (el) {
            el.onDraw();
        });
        this.focus(this.mFocusedWidget);
    };

    /**
     * 设置width，失败返回false
     * @param width
     * @returns {boolean}
     */
    Layout.prototype.setWidth = function (width) {
        if (!this.testWidth(width)) {
            return false;
        }
        this.mWidth = width;
        this.onResize();
        return true;
    };

    /**
     * 获取width
     * @returns {*}
     */
    Layout.prototype.getWidth = function () {
        return this.mWidth;
    };

    /**
     * 测试宽度
     * @param width
     * @returns {boolean}
     */
    Layout.prototype.testWidth = function (width) {
        if (typeof width !== 'number' || width < 0) {
            return false;
        }
        for (var i = 0; i < this.mWidgets.length; i++) {
            if (this.mWidgets[i].getLeft() + this.mWidgets[i].getWidth() > width) {
                return false;
            }
        }
        return true;
    };

    /**
     * 设置高度，失败返回false
     * @param height
     * @returns {boolean}
     */
    Layout.prototype.setHeight = function (height) {
        if (!this.testHeight(height)) {
            return false;
        }
        this.mHeight = height;
        this.onResize();
        return true;
    };

    /**
     * 获取高度
     * @returns {*}
     */
    Layout.prototype.getHeight = function () {
        return this.mHeight;
    };

    /**
     * 测试高度
     * @param height
     * @returns {boolean}
     */
    Layout.prototype.testHeight = function (height) {
        if (typeof height !== 'number' || height < 0) {
            return false;
        }
        for (var i = 0; i < this.mWidgets.length; i++) {
            if (this.mWidgets[i].getTop() + this.mWidgets[i].getHeight() > height) {
                return false;
            }
        }
        return true;
    };

    Layout.prototype.showPreview = function (resources) {
        var self = this;
        Object.keys(resources).forEach(function (id) {
            self.mWidgets.forEach(function (el, idx, arr) {
                if (Number(id) === el.mId) {
                    el.showPreview(resources[id]);
                }
            });
        });
    };

    Layout.prototype.hidePreview = function () {
        this.mWidgets.forEach(function (el, idx, arr) {
            el.hidePreview();
        });
    };

    /**
     * Widget类的构造函数
     * @param obj
     * @param layout
     * @constructor
     */
    function Widget(obj, layout) {
        this.mLeft      = obj.left;
        this.mTop       = obj.top;
        this.mWidth     = obj.width;
        this.mHeight    = obj.height;
        this.mId        = obj.id;
        this.mType      = obj.type;
        this.mTypeName  = obj.typeName;
        this.mLayout    = layout;
        this.mContext   = layout.mContext;
        this.mElement   = document.createElement('div');
        this.mBackgroundColor = layout.nextColor();
        this.mElement.style.textAlign       = 'center';
        this.mElement.style.position        = 'absolute';
        this.mElement.style.verticalAlign   = 'middle';
        this.mElement.style.color           = '#ffffff';
        this.mElement.innerText             = obj.typeName;
    }

    /**
     * Widget工厂函数
     * @param json
     * @param layout
     * @returns {*}
     */
    Widget.create = function (obj, layout) {
        switch (obj.type) {
            case 'ImageBox':
                return new ImageWidget(obj, layout);
            case 'WebBox':
                return new HTMLWidget(obj, layout);
            case 'ClockBox':
                return new ClockWidget(obj, layout);
            case 'AudioBox':
                return new AudioWidget(obj, layout);
            case 'VideoBox':
                return new VideoWidget(obj, layout);
            case 'WeatherBox':
                return new WeatherWidget(obj, layout);
            case 'OfficeBox':
                return new OfficeWidget(obj, layout);
            case 'AdVideoBox':
                //return new AdVideoWidget(obj, layout);
                return new VideoWidget(obj, layout);
            case 'AdImageBox':
                //return new AdImageWidget(obj, layout);
                return new ImageWidget(obj, layout);
        }
    };

    /**
     * 移动widget，失败返回false
     * @param x
     * @param y
     * @return {boolean}
     */
    Widget.prototype.translateTo = function (x, y) {
        if (x < 0 ||
            y < 0 ||
            x + this.mWidth > this.mLayout.mWidth - this.mLayout.mLeftMargin - this.mLayout.mRightMargin ||
            y + this.mHeight > this.mLayout.mHeight - this.mLayout.mTopMargin - this.mLayout.mBottomMargin
        ) {
            return false;
        }
        this.mLeft  = x;
        this.mTop   = y;
        this.onResize();
        return true;
    };

    /**
     * 移动widget
     * @param step
     */
    Widget.prototype.move = function (step) {
        this.mLayout.move(this, step);
    };

    /**
     * resize widget
     * @param obj
     */
    Widget.prototype.resize = function (obj) {
        this.mLeft  = obj.left;
        this.mTop   = obj.top;
        this.mWidth = obj.width;
        this.mHeight = obj.height;
        this.onResize();
    };

    /**
     * 当widget大小，位置改变的回调函数
     */
    Widget.prototype.onResize = function () {
        if (this === this.mLayout.mFocusedWidget) {
            this.requestFocus();
        }
        this.onDraw();
    };

    /**
     * 绘制widget
     */
    Widget.prototype.onDraw = function () {
        if ($('#channel-editor-wrapper .btn-channel-preview').attr("is_preview") == "false" || location.hash.indexOf('#layout/edit') != -1 || localStorage.getItem('ad_plan')) {
            this.mElement.style.backgroundColor = this.mBackgroundColor;
        }
        this.mElement.style.top             = this.mTop    * this.mContext.getZoomFactor() + 'px';
        this.mElement.style.left            = this.mLeft   * this.mContext.getZoomFactor() + 'px';
        this.mElement.style.width           = this.mWidth  * this.mContext.getZoomFactor() + 'px';
        this.mElement.style.lineHeight =
            this.mElement.style.height =
                this.mHeight * this.mContext.getZoomFactor() + 'px';
    };

    /**
     * 设置width，失败返回false
     * @param width
     * @returns {boolean}
     */
    Widget.prototype.setWidth = function (width) {
        if (!this.testWidth(width)) {
            return false;
        }
        this.mWidth = width;
        this.onResize();
        return true;
    };

    /**
     * 获取width
     * @returns {*}
     */
    Widget.prototype.getWidth = function () {
        return this.mWidth;
    };

    /**
     * 测试width
     * @param width
     * @returns {boolean}
     */
    Widget.prototype.testWidth = function (width) {
        if (typeof width !== 'number' || width < 0 || width + this.mLeft > this.mLayout.getWidth()) {
            return false;
        }
        return true;
    };

    /**
     * 设置高度，失败返回false
     * @param height
     * @returns {boolean}
     */
    Widget.prototype.setHeight = function (height) {
        if (!this.testHeight(height)) {
            return false;
        }
        this.mHeight = height;
        this.onResize();
        return true;
    };

    /**
     * 获取高度
     * @returns {*}
     */
    Widget.prototype.getHeight = function () {
        return this.mHeight;
    };

    /**
     *
     * @param height
     * @returns {boolean}
     */
    Widget.prototype.testHeight = function (height) {
        if (typeof height !== 'number' || height < 0 || height + this.mTop > this.mLayout.getHeight()) {
            return false;
        }
        return true;
    };

    /**
     * 设置top,失败返回false
     * @param top
     * @returns {boolean}
     */
    Widget.prototype.setTop = function (top) {
        if (!this.testTop(top)) {
            return false;
        }
        this.mTop = top;
        this.onResize();
        return true;
    };

    /**
     * 获取top
     * @returns {*}
     */
    Widget.prototype.getTop = function () {
        return this.mTop;
    };

    /**
     * 测试top
     * @param top
     * @returns {boolean}
     */
    Widget.prototype.testTop = function (top) {
        if (typeof top !== 'number' || top < 0 || top + this.mHeight > this.mLayout.getHeight()) {
            return false;
        }
        return true;
    };

    /**
     * 设置left，失败返回false
     * @param left
     * @returns {boolean}
     */
    Widget.prototype.setLeft = function (left) {
        if (!this.testLeft(left)) {
            return false;
        }
        this.mLeft = left;
        this.onResize();
        return true;
    };

    /**
     * 获取left
     * @returns {*}
     */
    Widget.prototype.getLeft = function () {
        return this.mLeft;
    };

    /**
     * 测试左边距
     * @param left
     * @returns {boolean}
     */
    Widget.prototype.testLeft = function (left) {
        if (typeof left !== 'number' || left < 0 || left + this.mWidth > this.mLayout.getWidth()) {
            return false;
        }
        return true;
    };

    /**
     * 聚焦到该widget
     */
    Widget.prototype.requestFocus = function () {
        this.mLayout.focus(this);
    };

    Widget.prototype.notifyDragEvent = function () {
        //if (this === this.mLayout.mFocusedWidget) {
        //this.requestFocus();
        //this.mContext.notifyFocusChanged();
        //}
    };

    Widget.prototype.showPreview = function () {
    };

    Widget.prototype.hidePreview = function () {
        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }
        this.mElement.textContent = this.mTypeName;
    };

    /**
     * 图片控件
     * @constructor
     */
    function ImageWidget() {
        Widget.apply(this, arguments);
    }
    ImageWidget.prototype = Object.create(Widget.prototype);
    ImageWidget.prototype.constructor = ImageWidget;
    ImageWidget.prototype.showPreview = function (data) {

        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }
        if (data.material == undefined) {
            data.material = "";
        }
        if (data.material.length === 0) {
            this.mElement.textContent = this.mTypeName;
            return;
        }

        this.mElement.dataset.background = this.mElement.style.backgroundColor;
        this.mElement.style.backgroundColor = 'transparent';
        var img = document.createElement('img');
        img.setAttribute('width', '100%');
        img.setAttribute('height', '100%');
        img.setAttribute('src', UTIL.getRealURL(data.download_auth_type, data.material));
        this.mElement.appendChild(img);

    };
    ImageWidget.prototype.hidePreview = function (data) {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        Widget.prototype.hidePreview.call(this);
    };

    /**
     * 视频控件
     * @constructor
     */
    function VideoWidget() {
        Widget.apply(this, arguments);
    }
    VideoWidget.prototype = Object.create(Widget.prototype);
    VideoWidget.prototype.constructor = VideoWidget;
    VideoWidget.prototype.showPreview = function (data) {
        
        function suffix(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        }

        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }

        if (data.material == undefined) {
            data.material = "";
        }
        if (data.material.length === 0) {
            this.mElement.textContent = this.mTypeName;
            return;
        }

        this.mElement.dataset.background = this.mElement.style.backgroundColor;
        this.mElement.style.backgroundColor = '#000';
        if (
            suffix.call(data.material, '.jpg') ||
            suffix.call(data.material, '.png') ||
            suffix.call(data.material, '.bmp') ||
            suffix.call(data.material, '.gif') ||
            suffix.call(data.material, '.jpeg')
        ) {
            var img = document.createElement('img');
            img.setAttribute('width', '100%');
            img.setAttribute('height', '100%');
            img.setAttribute('src', UTIL.getRealURL(data.download_auth_type, data.material));
            this.mElement.appendChild(img);
        } else {
            var video = document.createElement('video'),
                source = document.createElement('source');
            video.setAttribute('autoplay', '');
            video.setAttribute('loop', '');
            video.setAttribute('width', '100%');
            video.setAttribute('height', '100%');
            video.style.objectFit = 'fill';
            source.setAttribute('src', UTIL.getRealURL(data.download_auth_type, data.material));
            source.setAttribute('type', 'video/mp4');
            video.textContent = languageJSON.al_videoFormat;
            video.appendChild(source);
            this.mElement.appendChild(video);
        }
        this.mElement.style.backgroundImage = 'url(resources/img/videoTip.png)';
        this.mElement.style.backgroundSize = 'contain';
        this.mElement.style.backgroundRepeat = 'no-repeat';
        this.mElement.style.backgroundPosition = 'center';
    };
    VideoWidget.prototype.hidePreview = function (data) {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        this.mElement.style.backgroundImage = 'none';
        Widget.prototype.hidePreview.call(this);
    };

    /**
     * 音频控件
     * @constructor
     */
    function AudioWidget() {
        Widget.apply(this, arguments);
    }
    AudioWidget.prototype = Object.create(Widget.prototype);
    AudioWidget.prototype.constructor = AudioWidget;
    AudioWidget.prototype.showPreview = function (data) {
    };

    /**
     * Web文本控件
     * @constructor
     */
    function HTMLWidget() {
        Widget.apply(this, arguments);
    }
    HTMLWidget.prototype = Object.create(Widget.prototype);
    HTMLWidget.prototype.constructor = HTMLWidget;
    HTMLWidget.prototype.showPreview = function (data) {
        this.mElement.dataset.background = this.mElement.style.backgroundColor;
        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }

        if (data.material == undefined) {
            data.material = "";
        }
        if (data.material.length === 0) {
            this.mElement.textContent = this.mTypeName;
            return;
        }

        var scale = this.mContext.mZoomFactor;
        this.mElement.style.backgroundColor = 'transparent';
        this.mElement.style.overflow = 'hidden';
        if (data.style.type === 'Marquee') {
            if (data.style.speed > 0) {
                //var textLength = this.mElement.offsetHeight * 0.8 * data.material.length;
                var direction=data.style.direction,duration;
                if(direction=='Right_2_Left'){
                    var marquee = document.createElement('div');
                    marquee.innerHTML = data.material.replace(/px/g,'em');
                    marquee.setAttribute('class', 'marquee layout-preview-text');
                    marquee.style.fontSize = this.mElement.offsetHeight*0.7 + 'px';
                    marquee.style.color = data.style.color;
                    marquee.style.backgroundColor = data.style.backgroundColor;
                    this.mElement.appendChild(marquee);
                    direction='left';
                    $(marquee).marquee({
                        direction: direction,
                        duration: Math.floor(7800 * 1000 / (500 * scale * data.style.speed))
                    });
                }else if(direction=='Down_2_Up') {
                    var marquee2=document.createElement("marquee");
                    marquee2.style.cssText="width:"+this.mWidth+"px;height:"+this.mHeight+"px;transform:"+"scale("+scale+");"+"transform-origin:0 0;text-align:left;padding:10px;line-height:1;font-size:"+data.style.fontSize
                    marquee2.innerHTML =data.material;
                    marquee2.setAttribute('scrollamount', data.style.speed);
                    marquee2.setAttribute('direction','up');
                    marquee2.style.color = data.style.color;
                    marquee2.style.backgroundColor = data.style.backgroundColor;
                    this.mElement.appendChild(marquee2);
                }
            }
        }else if(data.style.type === 'Normal'){
            if(data.style.RefrashType === 'Roll'){
                var marquee2=document.createElement("marquee");
                marquee2.style.cssText="width:"+this.mWidth+"px;height:"+this.mHeight+"px;transform:"+"scale("+scale+");"+"transform-origin:0 0;text-align:left;padding:10px;line-height:1;font-size:"+data.style.fontSize
                marquee2.innerHTML =data.material;
                if(data.style.speed!=0){
                   marquee2.setAttribute('scrollamount', data.style.speed); 
                }else{
                    marquee2.setAttribute('scrollamount',0); 
                }
                marquee2.setAttribute('direction','up');
                marquee2.style.color = data.style.color;
                marquee2.style.backgroundColor = data.style.backgroundColor;
                this.mElement.appendChild(marquee2);
            }else {
                var div = document.createElement('div');
                div.innerHTML=data.material
                div.style.cssText="width:"+this.mWidth+"px;transform:"+"scale("+scale+");"+"transform-origin:0 0;text-align:left;padding:10px;line-height:1; transition:all 1s"
                this.mElement.appendChild(div);
                div.parentNode.style.backgroundColor = data.style.backgroundColor;
                if(!data.style.pageDownPeriod) return false
                if(div.offsetHeight>this.mHeight){
                    var windowHeight=this.mHeight
                    var step = this.mHeight
                    var trans=0
                    var timer
                    startScroll()
                    function startScroll(){
                        timer=setInterval(function(){
                            var offset=div.offsetHeight-(windowHeight+Math.abs(trans))
                            if(offset<=step){
                                trans-=offset
                                div.style.transform="scale("+scale+") translateY("+trans+"px)"
                                clearInterval(timer)
                                setTimeout(function(){
                                    div.style.transform="scale("+scale+") translateY("+0+"px)"
                                    trans=0
                                    startScroll()
                                },3000)
                            }else{
                                trans-=step
                                div.style.transform="scale("+scale+") translateY("+trans+"px)"
                            }
                        },data.style.pageDownPeriod*1000)
                    }
                }
            }
        } else {
           var iFrame = document.createElement('iframe');
            iFrame.setAttribute('frameborder', '0');
            iFrame.setAttribute('scrolling', 'no');
            iFrame.setAttribute('seamless', 'seamless');
            iFrame.setAttribute('allowtransparency', 'true');
            iFrame.src=data.material
            iFrame.style.cssText="width:"+this.mWidth+"px;height:"+this.mHeight+"px;transform:"+"scale("+scale+");"+"transform-origin:0 0;"
            this.mElement.appendChild(iFrame);
        }
    };
    HTMLWidget.prototype.hidePreview = function () {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        Widget.prototype.hidePreview.call(this);
    };

    /**
     * 时钟控件
     * @constructor
     */
    function ClockWidget() {
        Widget.apply(this, arguments);
    }
    ClockWidget.prototype = Object.create(Widget.prototype);
    ClockWidget.prototype.constructor = ClockWidget;
    ClockWidget.prototype.showPreview = function (resource) {
        this.mElement.dataset.background = this.mElement.style.backgroundColor;
        this.mElement.style.backgroundColor = 'transparent';
        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }

        if(resource.style.Type=="Clock"){
            console.error(1)
            this.mElement.style.backgroundImage = 'url(resources/img/clockbg.png)';
            this.mElement.style.backgroundSize = 'contain';
            this.mElement.style.backgroundPosition = 'center';
            this.mElement.style.backgroundRepeat = 'no-repeat';
        }else if(resource.style.Type=="ClockDial"){
            console.error(2)
            this.mElement.style.backgroundImage = 'url(resources/img/clock_new.png)';
            this.mElement.style.backgroundSize = 'contain';
            this.mElement.style.backgroundPosition = 'center';
            this.mElement.style.backgroundRepeat = 'no-repeat';
        }else {
            var format = {
                    Time: 'HH:MM:ss',
                    Date: 'yyyy-mm-dd',
                    Week: 'dddd',
                    DateTime: 'yyyy-mm-dd HH:MM:ss',
                    DateTimeWeekH: 'yyyy-mm-dd HH:MM:ss<br>dddd',
                    DateTimeWeekV: 'yyyy-mm-dd<br>HH:MM:ss<br>dddd',
                    TimeAnim: 'HH:MM:ss'
                }[resource.style.Type],
                now = new Date();
            if (!format) {
                format = 'HH:MM:ss';
            }
            var text = now.format(format),
                div = document.createElement('div'),
                lines = (text.match(/<br>/g) || []).length + 1,
                cHeight = this.mHeight * this.mContext.mZoomFactor;
            div.style.position='absolute'
            div.style.textAlign = 'center';
            div.style.fontSize = cHeight/ lines * 0.8 + 'px';
            div.style.color = resource.style.TextColor;
            div.style.overflow = 'hidden';
            div.style.whiteSpace = 'nowrap';
            div.style.lineHeight = cHeight / lines + 'px';
            div.style.height = '100%';
            div.innerHTML =text;
            this.mElement.appendChild(div);
            var originRatio=this.mWidth/this.mHeight   // 容器宽高比
            var ratio=div.offsetWidth/div.offsetHeight   // 时钟宽高比
            if(originRatio<=ratio){
                div.style.transformOrigin='0 50%'
                var scale=(this.mWidth* this.mContext.mZoomFactor)/div.offsetWidth
            }else{
                div.style.transformOrigin='50% 0'
                var scale=(this.mHeight* this.mContext.mZoomFactor)/div.offsetHeight
                // 居中设置
                div.style.left='50%'
                div.style.transform='translateX(-50%)'
            }
            // 缩放
            div.style.transform+=' scale('+scale+')'
        }


    };
    ClockWidget.prototype.hidePreview = function () {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        Widget.prototype.hidePreview.call(this);
        this.mElement.style.backgroundImage = 'none';
    };

    /**
     * 天气控件
     * @constructor
     */
    function WeatherWidget() {
        Widget.apply(this, arguments);
    }
    WeatherWidget.prototype = Object.create(Widget.prototype);
    WeatherWidget.prototype.constructor = WeatherWidget;
    WeatherWidget.prototype.showPreview = function (resource) {
        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }

        this.mElement.dataset.background = this.mElement.style.backgroundColor;
        this.mElement.style.backgroundColor = 'transparent';
        var div = document.createElement('div')
        if (resource.style.Type == "Normal") {
            var htmlStr='<div id="mtrC_weatherNormal_box" style="background:none;border:none;padding:0; width:340px;" class="mtrC_weather">'+
            '                        <div class="mtrC_weatherNormal_box_left"><img src="resources/img/img_weather_1.png"></div>'+
            '                        <div class="mtrC_weatherNormal_box_middle text_content">'+
            '                            <span id="weather_cloudy">多云</span>'+
            '                            </br><span id="weather_wind">无持续风向：微风</span>'+
            '                            <h3>15°～28°</h3>'+
            '                        </div>'+
            '                        <div class="mtrC_weatherNormal_box_right">'+
            '                            <h2 id="weather_beijing">北京</h2>'+
            '                            <span id="weather_today">今天</span>'+
            '                        </div>'+
            '                    </div>';
        } else if (resource.style.Type == "oneline") {
            var htmlStr='<div id="mtrC_weatherOneline_box" style="background:none;border:none;padding:0; width:340px;" class="mtrC_weather">'+
            '                        <div class="mtrC_weatherOneline_box_left"><img src="resources/img/img_weather_1.png"></div>'+
            '                        <div class="mtrC_weatherNormal_box_right text_content">'+
            '                            <span id="weather_bjtd">北京&nbsp;今天&nbsp;多云&nbsp;15°～28°</span>'+
            '                        </div>'+
            '                    </div>';
        }else if(resource.style.Type == "Type4"){
            var htmlStr='<div id="mtrC_weatherType4_box" style="background:none;border:none;padding:0; width:340px;" class="mtrC_weather">'+
            '                        <div class="bg_weather" style="height:140px">'+
            '                            <span class="city" style="color: orange">北京</span>'+
            '                            <div class="bg_content">'+
            '                                <span class="temp">12° ~ 20°</span> <br>'+
            '                                <span class="text">2017.12.29 阴</span>'+
            '                            </div>'+
            '                        </div>'+
            '                    </div>';
        }
        div.style.position='absolute'
        div.innerHTML=htmlStr
        div.style.color=resource.style.TextColor
        div.style.textAlign='left'
        div.style.lineHeight=1
        this.mElement.appendChild(div)
        var originRatio=this.mWidth/this.mHeight   // 容器宽高比
        var ratio=div.offsetWidth/div.offsetHeight   // 时钟宽高比
        if(originRatio<=ratio){
            div.style.top='50%'
            div.style.transform='translateY(-50%)'
            div.style.transformOrigin='0 50%'
            var scale=(this.mWidth* this.mContext.mZoomFactor)/div.offsetWidth
        }else{
            div.style.transformOrigin='50% 0'
            var scale=(this.mHeight* this.mContext.mZoomFactor)/div.offsetHeight
            // 居中设置
            div.style.left='50%'
            div.style.transform='translateX(-50%)'
        }
        // 缩放
        div.style.transform+=' scale('+scale+')'
    };
    WeatherWidget.prototype.hidePreview = function () {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        this.mElement.style.backgroundImage = 'none';
        Widget.prototype.hidePreview.call(this);
    };

    /**
     * 图片控件
     * @constructor
     */
    function OfficeWidget() {
        Widget.apply(this, arguments);
    }
    OfficeWidget.prototype = Object.create(Widget.prototype);
    OfficeWidget.prototype.constructor = OfficeWidget;
    OfficeWidget.prototype.showPreview = function (data) {

        while (this.mElement.firstChild) {
            this.mElement.removeChild(this.mElement.firstChild);
        }
        if (data.material == undefined) {
            data.material = "";
        }
        if (data.material.length === 0) {
            this.mElement.textContent = this.mTypeName;
            return;
        }

        this.mElement.dataset.background = this.mElement.style.backgroundColor;
        this.mElement.style.backgroundColor = 'transparent';
        var img = document.createElement('img');
        img.setAttribute('width', '100%');
        img.setAttribute('height', '100%');
        img.setAttribute('src', UTIL.getRealURL(data.download_auth_type, data.material));
        this.mElement.appendChild(img);

    };
    OfficeWidget.prototype.hidePreview = function (data) {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        Widget.prototype.hidePreview.call(this);
    };

    /**
    * 视频广告控件
    * @constructor
    */


    function AdVideoWidget() {
        Widget.apply(this, arguments);
    }
    AdVideoWidget.prototype = Object.create(Widget.prototype);
    AdVideoWidget.prototype.constructor = AdVideoWidget;
    AdVideoWidget.prototype.showPreview = function (data) {

    }
    AdVideoWidget.prototype.hidePreview = function (data) {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        this.mElement.style.backgroundImage = 'none';
        Widget.prototype.hidePreview.call(this);
    }

 /**
* 图片广告控件
* @constructor
*/


    function AdImageWidget() {
        Widget.apply(this, arguments);
    }
    AdImageWidget.prototype = Object.create(Widget.prototype);
    AdImageWidget.prototype.constructor = AdImageWidget;
    AdImageWidget.prototype.showPreview = function (data) {

    }
    AdImageWidget.prototype.hidePreview = function (data) {
        this.mElement.style.backgroundColor = this.mElement.dataset.background;
        this.mElement.style.backgroundImage = 'none';
        Widget.prototype.hidePreview.call(this);
    }


    exports.LayoutEditor = LayoutEditor;
    exports.Layout = Layout;
    exports.Widget = Widget;

});

