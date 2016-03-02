System.register(['./validation'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var validation_1;
    // TODO: translations support
    // TODO: default translations to formsConfig
    // TODO: range validator (min/max)
    // TODO: `when` to all validators
    function registerDefaultValidators() {
        validation_1.validators.push({
            name: 'required',
            shouldValidateEmpty: true,
            isValid: function (context) {
                if (context.validator.hasOwnProperty('exact')) {
                    return context.value === context.validator['exact'];
                }
                if (context.field.isEmpty) {
                    return false;
                }
                return true;
            },
            getError: function () {
                return 'Field is required.';
            }
        });
        validation_1.validators.push({
            name: 'number',
            isValid: function (context) { return isNaN(context.value) === false; },
            getError: function () { return 'Value needs to be a number.'; }
        });
        validation_1.validators.push({
            name: 'decimal',
            isValid: function (context) {
                var regex = /^[0-9]+[.]?[0-9]*$/;
                return regex.test(context.field.value);
            },
            getError: function () { return 'Value needs to be a number.'; }
        });
        validation_1.validators.push({
            name: 'integer',
            isValid: function (context) {
                var regex = /^\d+$/i;
                return regex.test(context.field.value);
            },
            getError: function () { return 'Value needs to be a number.'; }
        });
        validation_1.validators.push({
            name: 'email',
            isValid: function (context) {
                // RFC 5322 Official Standard
                // source: http://emailregex.com/
                var regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
                return regex.test(context.field.value);
            },
            getError: function () { return 'Value is not an email.'; }
        });
        validation_1.validators.push({
            name: 'url',
            isValid: function (context) {
                // inspired by: http://code.tutsplus.com/tutorials/8-regular-expressions-you-should-know--net-6149
                var regex = /^((https?:)?\/\/)?([\da-z\.-]+)\.([a-z\.]{2,})([\/\w \.-]*)*\/?$/;
                return regex.test(context.field.value);
            },
            getError: function () { return 'Value is not an url.'; }
        });
        validation_1.validators.push({
            name: 'phone',
            isValid: function (context) {
                // source: http://stackoverflow.com/a/33561517
                var regex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
                return regex.test(context.field.value);
            },
            getError: function () { return 'Value is not a phone number.'; }
        });
        validation_1.validators.push({
            name: 'pattern',
            isValid: function (context) {
                return context.validator['value'].test(context.field.value);
            },
            getError: function () { return 'Value does not match required pattern.'; }
        });
        validation_1.validators.push({
            name: 'length',
            isValid: function (context) {
                if (context.value !== undefined && context.value !== null && typeof context.value !== "string") {
                    throw new Error("Length validator works only with string values, but '" + typeof context.value + "' has been provided.");
                }
                var min = context.validator['min'];
                var max = context.validator['max'];
                if (min === undefined && max === undefined) {
                    throw new Error("Length validator requires defined at least either 'min' or 'max' property.");
                }
                if (min !== undefined && context.value.length < context.validator['min']) {
                    return false;
                }
                if (max !== undefined && context.value.length > context.validator['max']) {
                    return false;
                }
                return true;
            },
            getError: function (context) {
                if (context.value.length < context.validator['min']) {
                    return "Minimum length: " + context.validator['min'];
                }
                if (context.value.length > context.validator['max']) {
                    return "Maximum length: " + context.validator['max'];
                }
            }
        });
    }
    exports_1("registerDefaultValidators", registerDefaultValidators);
    return {
        setters:[
            function (validation_1_1) {
                validation_1 = validation_1_1;
            }],
        execute: function() {
        }
    }
});
