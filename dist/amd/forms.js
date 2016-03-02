System.register(['./forms/validation.default', './forms/config', './forms/fields', './forms/fields.base', './forms/schema', './forms/validation'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var validation_default_1, config_1;
    function configure(aurelia, configFunc) {
        validation_default_1.registerDefaultValidators();
        if (typeof configFunc === "function") {
            configFunc(config_1.formsConfig);
        }
        if (config_1.formsConfig.globalizeResources) {
            aurelia.globalResources('./forms/fields');
            aurelia.globalResources('./forms/schema.viewModels');
        }
    }
    exports_1("configure", configure);
    var exportedNames_1 = {
        'configure': true,
        'formsConfig': true
    };
    function exportStar_1(m) {
        var exports = {};
        for(var n in m) {
            if (n !== "default"&& !exportedNames_1.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters:[
            function (validation_default_1_1) {
                validation_default_1 = validation_default_1_1;
            },
            function (config_1_1) {
                config_1 = config_1_1;
                exports_1({
                    "formsConfig": config_1_1["formsConfig"]
                });
            },
            function (fields_1_1) {
                exportStar_1(fields_1_1);
            },
            function (fields_base_1_1) {
                exportStar_1(fields_base_1_1);
            },
            function (schema_1_1) {
                exportStar_1(schema_1_1);
            },
            function (validation_1_1) {
                exportStar_1(validation_1_1);
            }],
        execute: function() {
        }
    }
});
