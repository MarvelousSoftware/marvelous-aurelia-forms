System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var formsConfig;
    return {
        setters:[],
        execute: function() {
            exports_1("formsConfig", formsConfig = {
                /**
                 * If true then custom elements related to forms will be available globaly.
                 * Default: true.
                 */
                globalizeResources: true,
                /**
                 * Default tab index for all fields. Might be overridden per field basis.
                 * Default: 1.
                 */
                tabIndex: 1,
                fields: {
                    textInput: {
                        templateUrl: 'marvelous-aurelia-forms/forms/templates/text-input.html'
                    },
                    textArea: {
                        templateUrl: 'marvelous-aurelia-forms/forms/templates/text-area.html',
                        rows: 2
                    },
                    checkboxInput: {
                        templateUrl: 'marvelous-aurelia-forms/forms/templates/checkbox-input.html'
                    },
                    numberInput: {
                        templateUrl: 'marvelous-aurelia-forms/forms/templates/number-input.html'
                    },
                    select: {
                        templateUrl: 'marvelous-aurelia-forms/forms/templates/select.html'
                    }
                },
                keyCodeMap: {
                    8: 'backspace',
                    9: 'tab',
                    13: 'enter',
                    35: 'end',
                    36: 'home',
                    37: 'left',
                    38: 'up',
                    39: 'right',
                    40: 'down',
                    45: 'insert',
                    46: 'delete',
                    110: ',',
                    188: ',',
                    190: '.'
                }
            });
        }
    }
});
