(function() {
    var callWithJQuery, slice = [].slice;

    callWithJQuery = function(pivotModule) {
        if (typeof exports === "object" && typeof module === "object") {
            return pivotModule(require("jquery"));
        } else if (typeof define === "function" && define.amd) {
            return define(["jquery"], pivotModule);
        } else {
            return pivotModule(jQuery);
        }
    };

    callWithJQuery(function($) {
        var aggregatorTemplates, subtotalAggregatorTemplates, usFmtPct;

        usFmtPct = $.pivotUtilities.numberFormat({
            digitsAfterDecimal: 1,
            scaler: 100,
            suffix: "%"
        });
        aggregatorTemplates = $.pivotUtilities.aggregatorTemplates;
        subtotalAggregatorTemplates = {
            fractionOf: function(wrapped, type, formatter) {
                if (type == null) {
                    type = "row";
                }
                if (formatter == null) {
                    formatter = usFmtPct;
                }
                return function() {
                    var x;
                    x = 1 <= arguments.length ? slice.call(arguments, 0) : [];
                    return function(data, rowKey, colKey) {
                        if (typeof rowKey === "undefined") {
                            rowKey = [];
                        }
                        if (typeof colKey === "undefined") {
                            colKey = [];
                        }
                        return {
                            selector: {
                                row: [rowKey.slice(0, -1), []],
                                col: [[], colKey.slice(0, -1)]
                            }[type],
                            inner: wrapped.apply(null, x)(data, rowKey, colKey),
                            push: function(record) {
                                return this.inner.push(record);
                            },
                            format: formatter,
                            value: function() {
                                return this.inner.value() / data.getAggregator.apply(data, this.selector).inner.value();
                            },
                            numInputs: wrapped.apply(null, x)().numInputs
                        };
                    };
                };
            }
        };
        $.pivotUtilities.subtotalAggregatorTemplates = subtotalAggregatorTemplates;
        return $.pivotUtilities.subtotal_aggregators = (function(tpl, sTpl) {
            return {
                "Sum As Fraction Of Parent Row": sTpl.fractionOf(tpl.sum(), "row", usFmtPct),
                "Sum As Fraction Of Parent Column": sTpl.fractionOf(tpl.sum(), "col", usFmtPct),
                "Count As Fraction Of Parent Row": sTpl.fractionOf(tpl.count(), "row", usFmtPct),
                "Count As Fraction Of Parent Column": sTpl.fractionOf(tpl.count(), "col", usFmtPct)
            };
        })(aggregatorTemplates, subtotalAggregatorTemplates);
    });

}).call(this);
