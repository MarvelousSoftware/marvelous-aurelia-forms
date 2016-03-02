System.register(['marvelous-aurelia-core/aureliaUtils', './config', './fields.base'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var aureliaUtils_1, config_1, fields_base_1;
    var TextInput, CheckboxInput, NumberInput, TextArea, Select;
    return {
        setters:[
            function (aureliaUtils_1_1) {
                aureliaUtils_1 = aureliaUtils_1_1;
            },
            function (config_1_1) {
                config_1 = config_1_1;
            },
            function (fields_base_1_1) {
                fields_base_1 = fields_base_1_1;
            }],
        execute: function() {
            // TODO: create following controls 
            // * Time
            // * Date
            // * DateTime
            // * File
            /////////////////////////////////////
            //// Text Field
            /////////////////////////////////////
            TextInput = (function (_super) {
                __extends(TextInput, _super);
                function TextInput(field) {
                    var _this = this;
                    _super.call(this, field);
                    this.defaultFor(function () { return _this.templateUrl; }, function () { return config_1.formsConfig.fields.textInput.templateUrl; });
                    this.defaultFor(function () { return _this.type; }, function () { return 'text'; });
                }
                TextInput.prototype.bind = function () {
                    _super.prototype.bind.call(this);
                    switch (this.type.toLowerCase()) {
                        case 'email':
                            this.validators['email'] = this.validators['email'] === undefined ? true : this.validators['email'];
                            break;
                        case 'url':
                            this.validators['url'] = this.validators['url'] === undefined ? true : this.validators['url'];
                            break;
                        case 'phone':
                            this.validators['phone'] = this.validators['phone'] === undefined ? true : this.validators['phone'];
                            break;
                    }
                };
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], TextInput.prototype, "type", void 0);
                TextInput = __decorate([
                    fields_base_1.customField('m-text-input')
                ], TextInput);
                return TextInput;
            }(fields_base_1.Field));
            exports_1("TextInput", TextInput);
            /////////////////////////////////////
            //// Checkbox Field
            /////////////////////////////////////
            CheckboxInput = (function (_super) {
                __extends(CheckboxInput, _super);
                function CheckboxInput(field) {
                    var _this = this;
                    _super.call(this, field);
                    this.defaultFor(function () { return _this.templateUrl; }, function () { return config_1.formsConfig.fields.checkboxInput.templateUrl; });
                }
                CheckboxInput.prototype.bind = function () {
                    _super.prototype.bind.call(this);
                    // In case of checkbox required validation has to work a bit differently.
                    // It should check whether value is TRUE instead of checking whether
                    // value is defined.
                    this.validators['required'] = this.validators['required'] === true ? { exact: true } : false;
                };
                CheckboxInput.prototype.createInternalValue = function () {
                    if (this.value === undefined || this.value === null) {
                        return false;
                    }
                    return this.value;
                };
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], CheckboxInput.prototype, "AT_LEAST_ONE_BINDABLE_IS_REQUIRED", void 0);
                CheckboxInput = __decorate([
                    fields_base_1.customField('m-checkbox')
                ], CheckboxInput);
                return CheckboxInput;
            }(fields_base_1.Field));
            exports_1("CheckboxInput", CheckboxInput);
            /////////////////////////////////////
            //// Number Field
            /////////////////////////////////////
            NumberInput = (function (_super) {
                __extends(NumberInput, _super);
                function NumberInput(field) {
                    var _this = this;
                    _super.call(this, field);
                    this.defaultFor(function () { return _this.templateUrl; }, function () { return config_1.formsConfig.fields.numberInput.templateUrl; });
                    this.defaultFor(function () { return _this.type; }, function () { return 'integer'; });
                    this.defaultFor(function () { return _this.decimalSeparator; }, function () { return '.'; });
                    this.defaultFor(function () { return _this.autoChangeToSeparator; }, function () { return [',']; });
                    this.defaultFor(function () { return _this.suppressFromInvalidInput; }, function () { return true; });
                }
                NumberInput.prototype.bind = function () {
                    _super.prototype.bind.call(this);
                    var internalParse;
                    switch (this.type) {
                        case 'integer': {
                            internalParse = parseInt;
                            this.validators['integer'] = this.validators['integer'] === undefined ? true : this.validators['integer'];
                            break;
                        }
                        case 'decimal': {
                            internalParse = parseFloat;
                            this.validators['decimal'] = this.validators['decimal'] === undefined ? { separator: this.decimalSeparator } : this.validators['decimal'];
                            break;
                        }
                        default: throw new Error("NumberInput doesn't supprot '" + this.type + "' type. Supported types are 'integer' and 'decimal'.");
                    }
                    if (this.parse === this.defaultParse) {
                        // parsing has been not overriden by user, so it needs to be tweaked to work with
                        // given type
                        this.parse = (function (value) {
                            if (!value) {
                                return undefined;
                            }
                            return internalParse(value);
                        });
                    }
                };
                NumberInput.prototype.onKeyUp = function () {
                    var _this = this;
                    if (!!this.internalValue === false) {
                        this.value = undefined;
                        return;
                    }
                    // changes separator to the proper one
                    if (this.autoChangeToSeparator instanceof Array) {
                        this.autoChangeToSeparator.forEach(function (x) {
                            _this.internalValue = _this.internalValue.replace(x, _this.decimalSeparator);
                        });
                    }
                    this.onChanged();
                };
                NumberInput.prototype.onKeyDown = function (e) {
                    // TODO: allow only one decimal separator
                    if (this.suppressFromInvalidInput == false) {
                        return true;
                    }
                    var key = config_1.formsConfig.keyCodeMap[e.which];
                    switch (key) {
                        case 'home':
                        case 'end':
                        case 'insert':
                        case 'delete':
                        case 'backspace':
                        case 'tab':
                        case 'enter':
                        case 'left':
                        case 'up':
                        case 'right':
                        case 'down':
                            return true;
                    }
                    // normal + num pad
                    var isInteger = (e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105);
                    switch (this.type) {
                        case 'integer': {
                            return isInteger;
                        }
                        case 'decimal': {
                            if (isInteger) {
                                return true;
                            }
                            if (key === this.decimalSeparator) {
                                return true;
                            }
                            if (this.autoChangeToSeparator.indexOf(key) >= 0) {
                                return true;
                            }
                            return false;
                        }
                    }
                    return true;
                };
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], NumberInput.prototype, "decimalSeparator", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], NumberInput.prototype, "autoChangeToSeparator", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], NumberInput.prototype, "suppressFromInvalidInput", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], NumberInput.prototype, "type", void 0);
                NumberInput = __decorate([
                    fields_base_1.customField('m-number')
                ], NumberInput);
                return NumberInput;
            }(fields_base_1.Field));
            exports_1("NumberInput", NumberInput);
            /////////////////////////////////////
            //// TextArea Field
            /////////////////////////////////////
            TextArea = (function (_super) {
                __extends(TextArea, _super);
                function TextArea(field) {
                    var _this = this;
                    _super.call(this, field);
                    this.defaultFor(function () { return _this.templateUrl; }, function () { return config_1.formsConfig.fields.textArea.templateUrl; });
                    this.defaultFor(function () { return _this.rows; }, function () { return config_1.formsConfig.fields.textArea.rows; });
                }
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], TextArea.prototype, "rows", void 0);
                TextArea = __decorate([
                    fields_base_1.customField('m-text-area')
                ], TextArea);
                return TextArea;
            }(fields_base_1.Field));
            exports_1("TextArea", TextArea);
            /////////////////////////////////////
            //// Enumerated Field
            /////////////////////////////////////
            Select = (function (_super) {
                __extends(Select, _super);
                function Select(field) {
                    var _this = this;
                    _super.call(this, field);
                    this.defaultFor(function () { return _this.templateUrl; }, function () { return config_1.formsConfig.fields.select.templateUrl; });
                    this.defaultFor(function () { return _this.getText; }, function () { return _this.defaultGetTextImpl; });
                    this.defaultFor(function () { return _this.getValue; }, function () { return _this.defaultGetValueImpl; });
                    this.defaultFor(function () { return _this.defaultText; }, function () { return '--- select ---'; });
                }
                Select.prototype.defaultGetTextImpl = function (item) {
                    return item;
                };
                Select.prototype.defaultGetValueImpl = function (item) {
                    return item;
                };
                Select.prototype.invokeGetText = function (item) {
                    if (this.createdBy === fields_base_1.fieldCreator.standard && this.getText !== this.defaultGetTextImpl) {
                        return this.getText({
                            $item: item
                        });
                    }
                    return this.getText(item);
                };
                Select.prototype.invokeGetValue = function (item) {
                    if (this.createdBy === fields_base_1.fieldCreator.standard && this.getValue !== this.defaultGetValueImpl) {
                        return this.getValue({
                            $item: item
                        });
                    }
                    return this.getValue(item);
                };
                Select.prototype.createInternalValue = function () {
                    return this.value;
                };
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], Select.prototype, "defaultText", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], Select.prototype, "items", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], Select.prototype, "getText", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], Select.prototype, "getValue", void 0);
                Select = __decorate([
                    fields_base_1.customField('m-select')
                ], Select);
                return Select;
            }(fields_base_1.Field));
            exports_1("Select", Select);
        }
    }
});
