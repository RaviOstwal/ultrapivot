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
                    enableDataSelection: true,
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
                    if (instance.options.enableRowSelection || instance.options.enableColSelection) {
                        instance.selectionType += 'header ';
                    }
                    if (instance.options.enableDataSelection) {
                        instance.selectionType += 'data ';
                    }
                    if (instance.options.enableTotalSelection) {
                        instance.selectionType += 'total ';
                    }

                    instance.initEvents();
                };

                instance.initEvents = function () {
                    var $target = $(instance.renderer.getTableElement()).find(selector);
                    $target.on('mousedown', instance.mousePress);
                    $target.on('mouseup', instance.mouseRelease);
                };

                // ctrlKey, metaKey ,shiftKey
                instance.isCtrl = false;
                instance.isShift = false;

                instance.mousePress = function (event) {
                    instance.isCtrl = event.ctrlKey || event.metaKey;
                    instance.isShift = event.shiftKey;

                    if (!instance.isCtrl && !instance.isShift) {
                        instance.clearHighlight();
                    }
                };

                instance.mouseRelease = function (event) {
                    var $targetTable = $(event.currentTarget);
                    var $target = $(event.target);

                    if ($targetTable.hasClass('axisTable')) {
                        instance.clearHighlight();
                        return;
                    }
                    else if (instance.options.enableRowSelection && $targetTable.hasClass('rowHeaderTable')) {
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
                    else if (instance.options.enableDataSelection && $targetTable.hasClass('dataTable')) {
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
                    console.log(x1, y1, x2, y2);

                    var elements = [];
                    $targetTable.find(selector).each(function() {
                        var $this = $(this);
                        var offset = $this.offset();
                        x = offset.left;
                        y = offset.top;
                        w = $this.width();
                        h = $this.height();

                        if (x >= x1
                            && y >= y1
                            && x + w <= x2
                            && y + h <= y2) {
                            // this element fits inside the selection rectangle
                            elements.push($this);
                        }
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
