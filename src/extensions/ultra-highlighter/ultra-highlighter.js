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

            var selector = '.rowHeaderTable, .colHeaderTable, .dataTable';

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

                    if (!instance.isCtrl) {
                        instance.clearHighlight();
                    }
                };

                instance.mouseRelease = function (event) {
                    var $targetTable = $(event.currentTarget);
                    var $target = $(event.target);

                    if (instance.options.enableRowSelection && $targetTable.hasClass('rowHeaderTable')) {
                        if (instance.select($target, 'rhlt')) {
                            instance.highlightRowChildren($target);
                        }
                        else {
                            instance.dimRowChildren($target);
                        }
                    }
                    else if (instance.options.enableColSelection && $targetTable.hasClass('colHeaderTable')) {
                        if (instance.select($target, 'chlt')) {
                            instance.highlightColChildren($target);
                        }
                        else {
                            instance.dimColChildren($target);
                        }
                    }
                    else if (instance.options.enableDataSelection && $targetTable.hasClass('dataTable')) {
                        instance.select($target, 'dhlt');
                    }

                    instance.clearHighlightIfNeeded();
                };

                instance.select = function($target, className) {
                    var highlighted = $target.hasClass(className);
                    if (instance.isCtrl && highlighted) {
                        $target.removeClass(className);
                    }
                    else if (!highlighted) {
                        $target.addClass('hylyt');
                        $target.addClass(className);
                        return true;
                    }
                    return false;
                };

                instance.highlightRowChildren = function($target) {
                    var h = instance.renderer.getRowNode($target[0]);
                    instance.highlightChildren(h, 'rhlt');
                };

                instance.highlightColChildren = function($target) {
                    var h = instance.renderer.getColNode($target[0]);
                    instance.highlightChildren(h, 'chlt');
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
                    var h = instance.renderer.getRowNode($target[0]);
                    instance.dimParents(h, 'rhlt');
                    instance.dimChildren(h, 'rhlt');
                };

                instance.dimColChildren = function($target) {
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
