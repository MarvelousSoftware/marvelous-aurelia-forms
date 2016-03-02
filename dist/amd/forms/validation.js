System.register(['marvelous-aurelia-core/utils'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var utils_1;
    var ValidationExecutor, ValidatorsArray, InstantValidationResultsPusher, OnSignalValidationResultsPusher, validators;
    return {
        setters:[
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }],
        execute: function() {
            ValidationExecutor = (function () {
                function ValidationExecutor(_field) {
                    var _this = this;
                    this._field = _field;
                    /**
                     * True if field has been validated at least once.
                     */
                    this._validated = false;
                    var changeDebouncer = new utils_1.Debouncer(this.getDebounceTime());
                    _field.listenOnChange(function () {
                        if (!!_this._validated === false)
                            return;
                        changeDebouncer.do(function () { _this.execute(); });
                    });
                }
                /**
                 * Gets greatest debounce time using values from field's validators.
                 */
                ValidationExecutor.prototype.getDebounceTime = function () {
                    var debounce = 0;
                    this._forEachValidator(function (validator) {
                        if (validator.debounce === undefined) {
                            return;
                        }
                        if (validator.debounce > debounce) {
                            debounce = validator.debounce;
                        }
                    });
                    return debounce;
                };
                ValidationExecutor.prototype.execute = function (resultsPusher) {
                    var _this = this;
                    if (resultsPusher === void 0) { resultsPusher = new InstantValidationResultsPusher(); }
                    var promises = [];
                    this._forEachValidator(function (validator, validatorDefinition) {
                        if (!!validator.shouldValidateEmpty === false && _this._field.isEmpty) {
                            // if field is empty and validator shouldn't run on empty values
                            return true;
                        }
                        promises.push(_this._validate(validator, {
                            field: _this._field,
                            validator: validatorDefinition,
                            value: _this._field.value
                        }));
                        return true;
                    });
                    var all = Promise.all(promises);
                    all.then(function (validations) {
                        _this._validated = true;
                        resultsPusher.push(_this._field, validations);
                    });
                    return all;
                };
                ValidationExecutor.prototype._validate = function (validator, context) {
                    var isValid = validator.isValid(context);
                    if (isValid === undefined) {
                        throw new Error("isValid method of '" + validator.name + "' validator should return a Promise<boolean> or boolean. It returned undefined instead.");
                    }
                    return utils_1.Utils.when(isValid).then(function (valid) {
                        if (!valid) {
                            var error = validator.getError(context);
                            if (error === undefined) {
                                throw new Error("getError method of '" + validator.name + "' validator should return a Promise<string> or string. It returned undefined instead.");
                            }
                            return utils_1.Utils.when(error).then(function (error) {
                                return {
                                    definition: context.validator,
                                    validator: validator,
                                    field: context.field,
                                    isValid: false,
                                    error: error
                                };
                            }, function () { throw new Error("Rejected promise in 'getError' validator's method ('" + validator.name + "')."); });
                        }
                        return {
                            definition: context.validator,
                            validator: validator,
                            field: context.field,
                            isValid: true
                        };
                    }, function () { throw new Error("Rejected promise in 'isValid' validator's method ('" + validator.name + "')."); });
                };
                ValidationExecutor.prototype._forEachValidator = function (action) {
                    var _this = this;
                    utils_1.Utils.forOwn(this._field.validators, function (validatorDefinition, validatorName) {
                        if (validatorDefinition === false) {
                            // validators: { required: false }
                            // validator disabled, just moves on	
                            return true;
                        }
                        var validator = _this._getValidator(validatorName, validatorDefinition);
                        return action(validator, validatorDefinition);
                    });
                };
                ValidationExecutor.prototype._getValidator = function (name, definition) {
                    if (definition === true) {
                        // validators: { required: true }
                        var validator = validators.get(name);
                        if (!validator) {
                            throw new Error("Validator '" + name + "' is not defined.");
                        }
                        return validator;
                    }
                    if (!validators.has(name)) {
                        // if ValidatorsArray doesn't contain validator with given name then it
                        // is a custom validator, e.g.
                        // validators: { custom: { /* ...custom validation properties and methods */ } }
                        // therefore it needs to contain all required fields and properties
                        var validator = Object.assign({ name: name }, definition);
                        ValidatorsArray.validateValidatorProperties(validator);
                        return validator;
                    }
                    // existing validator with extra configuration, e.g.
                    // validators: { required: { /* ... */ } }			
                    return Object.assign(validators.get(name), definition);
                };
                return ValidationExecutor;
            }());
            exports_1("ValidationExecutor", ValidationExecutor);
            ValidatorsArray = (function (_super) {
                __extends(ValidatorsArray, _super);
                function ValidatorsArray() {
                    _super.apply(this, arguments);
                }
                ValidatorsArray.prototype.push = function () {
                    var _this = this;
                    var validators = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        validators[_i - 0] = arguments[_i];
                    }
                    validators.forEach(function (validator) {
                        ValidatorsArray.validateValidatorProperties(validator);
                        if (_this.get(validator.name)) {
                            throw new Error("Validator '" + validator.name + "' is already defined.");
                        }
                        _super.prototype.push.call(_this, validator);
                    });
                    return validators.length;
                };
                ValidatorsArray.prototype.override = function (validator) {
                    ValidatorsArray.validateValidatorProperties(validator);
                    var index = this.findIndex(function (x) { return x.name === validator.name; });
                    if (index === -1) {
                        throw new Error("Validator '" + validator.name + "' doesn't exist.");
                    }
                    this.splice(index, 1, validator);
                };
                ValidatorsArray.prototype.get = function (name) {
                    return this.find(function (x) { return x.name === name; });
                };
                ValidatorsArray.prototype.has = function (name) {
                    return !!this.get(name);
                };
                ValidatorsArray.validateValidatorProperties = function (validator) {
                    if (!validator.name || !validator.getError || !validator.isValid) {
                        throw new Error("Validator '" + validator.name + "' has missing properties or methods.");
                    }
                };
                return ValidatorsArray;
            }(Array));
            exports_1("ValidatorsArray", ValidatorsArray);
            /**
             * Instantly pushes errors to the field.
             */
            InstantValidationResultsPusher = (function () {
                function InstantValidationResultsPusher() {
                }
                InstantValidationResultsPusher.prototype.push = function (field, results) {
                    field.errors.splice(0);
                    results.filter(function (x) { return x.isValid === false; }).forEach(function (x) { return field.errors.push(x.error); });
                };
                return InstantValidationResultsPusher;
            }());
            exports_1("InstantValidationResultsPusher", InstantValidationResultsPusher);
            /**
             * Allows to wait with pushing errors to the field till the signal.
             */
            OnSignalValidationResultsPusher = (function () {
                function OnSignalValidationResultsPusher() {
                    this._readyForSignalSlots = new Map();
                }
                OnSignalValidationResultsPusher.prototype.push = function (field, results) {
                    var slot = [];
                    this._readyForSignalSlots.set(field, slot);
                    results.filter(function (x) { return x.isValid === false; }).forEach(function (x) { return slot.push(x.error); });
                };
                OnSignalValidationResultsPusher.prototype.signal = function () {
                    this._readyForSignalSlots.forEach(function (slot, field) {
                        field.errors.splice(0);
                        slot.forEach(function (error) { return field.errors.push(error); });
                    });
                };
                return OnSignalValidationResultsPusher;
            }());
            exports_1("OnSignalValidationResultsPusher", OnSignalValidationResultsPusher);
            /**
             * An instance of validators array. Should be used to define globally available validators.
             */
            exports_1("validators", validators = new ValidatorsArray());
        }
    }
});
