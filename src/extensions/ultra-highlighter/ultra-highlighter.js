(function() {

    var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        hasProp = {}.hasOwnProperty;

    var callWithJQuery = function(pivotModule) {
        if (typeof exports === "object" && typeof module === "object") {
            return pivotModule(require("jquery"));
        } else if (typeof define === "function" && define.amd) {
            return define(["jquery"], pivotModule);
        } else {
            return pivotModule(jQuery);
        }
    };

    callWithJQuery(function ($) {
        (function(superClass) {

            extend(UltraHighlighter, superClass);

            var selector = '.axisTable, .rowHeaderTable, .colHeaderTable, .dataTable';

            function UltraHighlighter() {
                UltraHighlighter.__super__.constructor.call(this);

                var defaultOpts = {
                    enableRowSelection: true,
                    enableColSelection: true,
                    enableTotalSelection: false,
                    selectedRows: [],
                    selectedCols: [],
                    selectedData: []
                };
                var instance = this;
                instance.options = null;
                instance.renderer = null;
                instance.container = null;

                instance.selectionType = '';
                instance.lastSelectedRow = null;
                instance.lastSelectedCol = null;
                instance.lastSelectedCell = null;

                instance.enabled = function(renderer) {
                    var options = renderer.getOptions();
                    options.highlightOptions = options.highlightOptions ? options.highlightOptions : {};
                    extend(options.highlightOptions, defaultOpts);
                    instance.options = options.highlightOptions;
                    instance.renderer = renderer;
                    instance.container = $(renderer.getTableElement()).find('.ultraPivotContainer');
                    instance.dataTable = $(instance.container.find('.dataTable')[0]);
                    instance.dataTable.css('position', 'relative');
                    if (instance.options.enableRowSelection || instance.options.enableColSelection) {
                        instance.selectionType += 'header ';
                    }
                    instance.selectionType += 'data ';
                    if (instance.options.enableTotalSelection) {
                        instance.selectionType += 'total ';
                    }

                    instance.initEvents();
                };

                instance.initEvents = function () {
                    var $target = $(instance.renderer.getTableElement()).find(selector);
                    $target.on('mousedown', instance.mousePress);

                    instance.dataTable.on('mousemove', instance.mouseMove);
                    instance.dataTable.on('mouseover', instance.mouseIn);
                    instance.dataTable.on('mouseout', instance.mouseOut);

                    $target.on('mouseup', instance.mouseRelease);
                };

                // ctrlKey, metaKey ,shiftKey
                instance.isCtrl = false;
                instance.isShift = false;
                instance.dataTableBound = null;
                instance.dragStartPoint = null;
                instance.dragRectBound = null;
                instance.scrollView = null;

                instance.dragRect = $('<div class="dragRect"></div>');

                instance.mousePress = function (event) {
                    instance.isCtrl = event.ctrlKey || event.metaKey;
                    instance.isShift = event.shiftKey;

                    if (!instance.isCtrl && !instance.isShift) {
                        instance.clearHighlight();
                    }

                    if ($(event.currentTarget).hasClass('dataTable')) {
                        instance.dataTableBound = instance.dataTable[0].getBoundingClientRect();
                        instance.dragStartPoint = {x1: event.clientX - instance.dataTableBound.x, y1: event.clientY - instance.dataTableBound.y};
                        var viewBox = instance.container.find('.c2.r2')[0];
                        instance.scrollView = {x1: viewBox.offsetLeft, y1: viewBox.offsetTop, x2: viewBox.offsetLeft + viewBox.clientWidth, y2: viewBox.offsetTop + viewBox.clientHeight};
                    }
                };

                instance.mouseMove = function (event) {
                    if (!instance.dragStartPoint) return;
                    var rect;
                    if (!instance.dragRectBound) {
                        instance.dragRectBound = instance.dragStartPoint;
                        rect = instance.dragRectBound;
                        instance.dataTable.append(instance.dragRect);
                        instance.dragRect.css('left', rect.x1);
                        instance.dragRect.css('top', rect.y1);
                        rect.x2 = rect.x1;
                        rect.y2 = rect.y1;
                        return;
                    }
                    else {
                        rect = instance.dragRectBound;
                    }
                    rect.x2 = event.clientX - instance.dataTableBound.x;
                    rect.y2 = event.clientY - instance.dataTableBound.y;

                    instance.dragRect.css('left', Math.min(rect.x1, rect.x2));
                    instance.dragRect.css('top', Math.min(rect.y1, rect.y2));
                    instance.dragRect.css('width', Math.abs(rect.x2 - rect.x1));
                    instance.dragRect.css('height', Math.abs(rect.y2 - rect.y1));
                };

                instance.scroller = null;
                instance.mouseOut = function (event) {
                    if (!instance.scrollView) return;

                    var scrolled = instance.renderer.scroll();
                    var viewBox = instance.scrollView, yScroll = '+= 0px', xScroll = '+= 0px', sx = 0, sy = 0;

                    if (scrolled.x.ratio !== 1 && viewBox.x2 - event.clientX < 15) {
                        xScroll = '+= 30px'; sx = 30;
                    }
                    else if (scrolled.x.ratio !== 1 && event.clientX - viewBox.x1 < 15) {
                        xScroll = '-= 30px'; sx = -30;
                    }
                    if (scrolled.y.ratio !== 1 && viewBox.y2 - event.clientY < 15) {
                        yScroll = '+= 30px'; sy = +30;
                    }
                    else if (scrolled.y.ratio !== 1 && event.clientY - viewBox.y1 < 15) {
                        yScroll = '-= 30px'; sy = -30;
                    }

                    if (sx === 0 && sy === 0) {
                        return;
                    }

                    instance.scroller = setInterval(function () {
                        if (scrolled.x.ratio !== 1 || scrolled.y.ratio !== 1) {
                            if (sx !== 0) {
                                var left = instance.dragRect.offset().left;
                                var width = instance.dragRect.width();
                                if (sx < 0) left += sx;
                                width += Math.abs(sx);

                                if ((left + width + 10) < instance.dataTableBound.right) {
                                    instance.dragRect.css('left', left);
                                    instance.dragRect.css('width', width);
                                }
                            }
                            if (sy !== 0) {
                                var top = instance.dragRect.offset().top;
                                var height = instance.dragRect.height();
                                if (sy < 0) top += sy;
                                height += Math.abs(sy);

                                if ((top + height + 10) < instance.dataTableBound.bottom) {
                                    instance.dragRect.css('top', top);
                                    instance.dragRect.css('height', height);
                                }
                            }
                            instance.renderer.scroll({ x : xScroll, y : yScroll }, 40);
                        }
                        else {
                            clearInterval(instance.scroller);
                            instance.scroller = null;
                        }
                    }, 50);
                };

                instance.mouseIn = function (event) {
                    if (instance.scroller) {
                        clearInterval(instance.scroller);
                        instance.scroller = null;

                        var rect = instance.dragRectBound;
                        rect.x2 = event.clientX - instance.dataTableBound.x;
                        rect.y2 = event.clientY - instance.dataTableBound.y;

                        instance.dragRect.css('left', Math.min(rect.x1, rect.x2));
                        instance.dragRect.css('top', Math.min(rect.y1, rect.y2));
                        instance.dragRect.css('width', Math.abs(rect.x2 - rect.x1));
                        instance.dragRect.css('height', Math.abs(rect.y2 - rect.y1));
                    }
                };

                instance.mouseRelease = function(event) {
                    instance._mouseRelease(event);

                    instance.dragRect.remove();
                    instance.dragRect.css('width', 0);
                    instance.dragRect.css('height', 0);
                    instance.dragStartPoint = null;
                    instance.dragRectBound = null;
                    instance.scrollView = null;
                };

                instance._mouseRelease = function (event) {
                    var $targetTable = $(event.currentTarget);
                    var $target = $(event.target);
                    if ($targetTable.hasClass('axisTable')) {
                        instance.clearHighlight();
                        return;
                    }

                    if (instance.dragRectBound) {
                        var i, rect = instance.dragRectBound, $cells;
                        $cells = rectangleSelect(instance.dataTable,'td',
                            instance.dataTableBound.x + Math.min(rect.x1, rect.x2), instance.dataTableBound.y + Math.min(rect.y1, rect.y2),
                            instance.dataTableBound.x + Math.max(rect.x1, rect.x2), instance.dataTableBound.y + Math.max(rect.y1, rect.y2));
                        for (i = 0; i < $cells.length; i++) {
                            $cells[i].addClass('dhlt');
                            $cells[i].addClass('hylyt');
                        }

                        instance.container.addClass('highlighted');
                        return;
                    }

                    if (!instance.options.enableTotalSelection
                        && ($target.hasClass('rowTotal') || $target.hasClass('colTotal') || $target.hasClass('pvtRowSubtotal') || $target.hasClass('pvtColSubtotal'))) {
                        return;
                    }

                    if (instance.options.enableRowSelection && $targetTable.hasClass('rowHeaderTable')) {
                        if (instance.isShift && instance.lastSelectedRow) {
                            instance.highlightRowRange($target);
                        }
                        else if (instance.select($target, 'rhlt')) {
                            instance.highlightRowChildren($target);
                        }
                        else {
                            instance.dimRowChildren($target);
                        }
                    }
                    else if (instance.options.enableColSelection && $targetTable.hasClass('colHeaderTable')) {
                        if (instance.isShift && instance.lastSelectedCol) {
                            instance.highlightColRange($target);
                        }
                        else if (instance.select($target, 'chlt')) {
                            instance.highlightColChildren($target);
                        }
                        else {
                            instance.dimColChildren($target);
                        }
                    }
                    else if ($targetTable.hasClass('dataTable')) {
                        if (instance.isShift && instance.lastSelectedCell) {
                            instance.highlightDataRange($targetTable, $target);
                        }
                        else {
                            instance.lastSelectedCell = instance.select($target, 'dhlt') ? $target[0] : null;
                        }
                    }

                    instance.clearHighlightIfNeeded();
                };

                instance.highlightRowRange = function($target) {
                    instance.lastSelectedRow = instance.highlightHeaderRange(instance.renderer.getRowNode($target[0]),
                        instance.lastSelectedRow,
                        instance.renderer.getRowHeadersTree(),
                        'rhlt');
                    instance.lastSelectedCol = null;
                    instance.lastSelectedCell = null;
                };

                instance.highlightColRange = function($target) {
                    instance.lastSelectedCol = instance.highlightHeaderRange(instance.renderer.getColNode($target[0]),
                                                        instance.lastSelectedCol,
                                                        instance.renderer.getColHeadersTree(),
                                            'chlt');
                    instance.lastSelectedRow = null;
                    instance.lastSelectedCell = null;
                };

                instance.highlightHeaderRange = function(h, last, headersTree, className) {
                    var i, hdr, row, start, end;
                    if (last.col === h.col) {
                        start = Math.min(last.row, h.row);
                        end = Math.max(last.row, h.row);
                        for (i = 0; i < headersTree.length; i++) {
                            hdr = headersTree[i];
                            row = hdr.row;
                            if (row !== last.row && hdr.col === h.col && row >= start && row <= end) {
                                instance.highlightChildren(hdr, className);
                            }
                        }
                        return h;
                    }
                    instance.highlightChildren(h, className);
                    return h;
                };

                instance.highlightDataRange = function($targetTable, $target) {
                    var startCell = instance.lastSelectedCell;
                    var endCell = $target[0];
                    startCell = startCell.getBoundingClientRect();
                    endCell = endCell.getBoundingClientRect();

                    var $cells = rectangleSelect($targetTable,'td',
                                                    Math.min(startCell.left, endCell.left), Math.min(startCell.top, endCell.top),
                                                    Math.max(startCell.right, endCell.right), Math.max(startCell.bottom, endCell.bottom));
                    for (var i = 0; i < $cells.length; i++) {
                        $cells[i].addClass('dhlt');
                        $cells[i].addClass('hylyt');
                    }

                    instance.lastSelectedCell = $target[0];
                    instance.lastSelectedRow = null;
                    instance.lastSelectedCol = null;
                };

                // x1, y1 would be mouse coordinates onmousedown
                // x2, y2 would be mouse coordinates onmouseup
                // all coordinates are considered relative to the document
                function rectangleSelect($targetTable, selector, x1, y1, x2, y2) {
                    var x, y, w, h;
                    var l1 = {x: x1, y: y1}, r1 = {x: x2, y: y2}, l2, r2;

                    var elements = [];
                    $targetTable.find(selector).each(function() {
                        var $this = $(this);
                        if (!instance.options.enableTotalSelection
                            && ($this.hasClass('rowTotal') || $this.hasClass('colTotal') || $this.hasClass('pvtRowSubtotal') || $this.hasClass('pvtColSubtotal'))) {
                            return;
                        }
                        var offset = $this.offset();
                        x = offset.left;
                        y = offset.top;
                        w = $this.width();
                        h = $this.height();
                        l2 = {x: x, y: y};
                        r2 = {x: x + w, y: y + h};

                        if (r2.x <= l1.x || r1.x <= l2.x
                            || r2.y <= l1.y || r1.y <= l2.y) {
                            return;
                        }

                        // this element fits inside the selection rectangle
                        elements.push($this);
                    });
                    return elements;
                }

                instance.select = function($target, className) {
                    var highlighted = $target.hasClass(className);
                    if (instance.isCtrl && highlighted) {
                        $target.removeClass(className);
                        return false;
                    }
                    else if (!highlighted) {
                        $target.addClass('hylyt');
                        $target.addClass(className);
                    }
                    return true;
                };

                instance.highlightRowChildren = function($target) {
                    instance.lastSelectedRow = instance.renderer.getRowNode($target[0]);
                    instance.highlightChildren(instance.lastSelectedRow, 'rhlt');
                };

                instance.highlightColChildren = function($target) {
                    instance.lastSelectedCol = instance.renderer.getColNode($target[0]);
                    instance.highlightChildren(instance.lastSelectedCol, 'chlt');
                };

                instance.highlightChildren = function(h, className) {
                    var i, child, children = instance.renderer.getChildren(h, instance.selectionType);
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        child.addClass(className);
                        child.addClass('hylyt');
                    }
                };

                instance.dimRowChildren = function($target) {
                    instance.lastSelectedRow = null;
                    var h = instance.renderer.getRowNode($target[0]);
                    instance.dimParents(h, 'rhlt');
                    instance.dimChildren(h, 'rhlt');
                };

                instance.dimColChildren = function($target) {
                    instance.lastSelectedCol = null;
                    var h = instance.renderer.getColNode($target[0]);
                    instance.dimParents(h, 'chlt');
                    instance.dimChildren(h, 'chlt');
                };

                instance.dimChildren = function(h, className) {
                    var i, child, children = instance.renderer.getChildren(h, instance.selectionType);
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        child.removeClass(className);
                    }
                };

                instance.dimParents = function(h, className) {
                    if (h.parent) {
                        $(h.parent.th).removeClass(className);
                        instance.dimParents(h.parent, className);
                    }
                };

                instance.clearHighlight = function () {
                    instance.container.find('.hylyt').removeClass('hylyt').removeClass('rhlt').removeClass('chlt').removeClass('dhlt');
                    instance.container.removeClass('highlighted');
                };

                instance.clearHighlightIfNeeded = function () {
                    instance.container.find('.hylyt').not('.rhlt').not('.chlt').not('.dhlt').removeClass('hylyt');
                    if (instance.container.find('.hylyt').length > 0) {
                        instance.container.addClass('highlighted');
                    }
                    else {
                        instance.container.removeClass('highlighted');
                    }
                };
            }

            $.ultraPivotUtils.registerExtension('table-highlight', UltraHighlighter);

        })($.ultraPivotUtils.UltraPivotExtension)
    });

}).call(this);
