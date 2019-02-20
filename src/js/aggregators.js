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
        $.ultraPivotUtils = $.pivotUtilities;

        var usFmtPct = $.ultraPivotUtils.numberFormat({
            digitsAfterDecimal: 1,
            scaler: 100,
            suffix: "%"
        });
        var aggregatorTemplates = $.ultraPivotUtils.aggregatorTemplates;
        var subtotalAggregatorTemplates = {
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
        $.ultraPivotUtils.subtotalAggregatorTemplates = subtotalAggregatorTemplates;
        $.ultraPivotUtils.subtotal_aggregators = {
            "Sum As Fraction Of Parent Row": subtotalAggregatorTemplates.fractionOf(aggregatorTemplates.sum(), "row", usFmtPct),
            "Sum As Fraction Of Parent Column": subtotalAggregatorTemplates.fractionOf(aggregatorTemplates.sum(), "col", usFmtPct),
            "Count As Fraction Of Parent Row": subtotalAggregatorTemplates.fractionOf(aggregatorTemplates.count(), "row", usFmtPct),
            "Count As Fraction Of Parent Column": subtotalAggregatorTemplates.fractionOf(aggregatorTemplates.count(), "col", usFmtPct)
        };
    });

}).call(this);
