System.register(['aurelia-templating', 'aurelia-dependency-injection', 'aurelia-binding', 'marvelous-aurelia-core/aureliaUtils', 'marvelous-aurelia-core/utils', 'marvelous-aurelia-core/compiler', './validation', './config'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var aurelia_templating_1, aurelia_dependency_injection_1, aurelia_binding_1, aureliaUtils_1, utils_1, compiler_1, validation_1, config_1;
    var fieldMetadataKey, Field, fieldVisibility, fieldCreator;
    function customField(name) {
        return function (target) {
            var original = target;
            if ((original.prototype instanceof Field) === false) {
                throw new Error("It looks like you're trying to create a new custom field. The problem is that " +
                    ("you forgot about using Field as a base class in '" + original.name + "' type. Just import Field from ") +
                    ("'marvelous-aurelia-forms/forms/fields.base' and then write 'class " + original.name + " extends Field'. ") +
                    "Once you do it everything should start working properly.");
            }
            // a utility function to generate instances of a class
            function construct(constructor, args) {
                var c = function () {
                    return constructor.apply(this, args);
                };
                c.prototype = constructor.prototype;
                return new c();
            }
            // the new constructor behaviour
            var newConstructor = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                var decorated = construct(original, args);
                decorated[fieldMetadataKey] = decorated[fieldMetadataKey] || {};
                var fieldOrElement = args[0];
                var isFieldDefinition = (fieldOrElement instanceof Element) == false;
                var field = isFieldDefinition ? fieldOrElement : {};
                decorated.definition = field;
                if (fieldOrElement instanceof Element) {
                    decorated.element = fieldOrElement;
                }
                if (isFieldDefinition) {
                    decorated.createdBy = fieldCreator.dynamicForm;
                    // definitions are applied only for manually created, schema based objects
                    // these kind of objects are not view models, that's why `!isViewModel`.
                    decorated._applyDefinitionBase(field);
                    decorated.applyDefinition(field);
                }
                decorated.customElementName = name;
                decorated.defaultFor('createdBy', function () { return fieldCreator.standard; });
                return decorated;
            };
            // copy prototype so intanceof operator still works
            newConstructor.prototype = original.prototype;
            newConstructor.constructor = original.constructor;
            // rewrites custom data
            for (var key in original) {
                if (original.hasOwnProperty(key)) {
                    newConstructor[key] = original[key];
                }
            }
            // base decorators
            aurelia_templating_1.customElement(name)(newConstructor);
            aurelia_dependency_injection_1.inject(Element)(newConstructor);
            aurelia_templating_1.noView()(newConstructor);
            // Base properties registration.
            // It is a workaround for a lack of inheritence support in case of bindable properties.
            // Unfortunatelly it stopped working after some update.
            // According to Rob's post (https://github.com/aurelia/framework/issues/210#issuecomment-141605960)
            // inheritence will be supported someday and therefore I'd leave it for now.
            var bindableProp = function (name, bindingMode) {
                if (bindingMode === void 0) { bindingMode = undefined; }
                aureliaUtils_1.AureliaUtils.bindable(bindingMode)(original.prototype, name);
            };
            bindableProp('name');
            bindableProp('label');
            bindableProp('visibility');
            bindableProp('span');
            bindableProp('value', aurelia_binding_1.bindingMode.twoWay);
            bindableProp('parse');
            bindableProp('tabIndex');
            bindableProp('templateUrl');
            bindableProp('validators');
            bindableProp('field');
            return newConstructor;
        };
    }
    exports_1("customField", customField);
    return {
        setters:[
            function (aurelia_templating_1_1) {
                aurelia_templating_1 = aurelia_templating_1_1;
            },
            function (aurelia_dependency_injection_1_1) {
                aurelia_dependency_injection_1 = aurelia_dependency_injection_1_1;
            },
            function (aurelia_binding_1_1) {
                aurelia_binding_1 = aurelia_binding_1_1;
            },
            function (aureliaUtils_1_1) {
                aureliaUtils_1 = aureliaUtils_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (compiler_1_1) {
                compiler_1 = compiler_1_1;
            },
            function (validation_1_1) {
                validation_1 = validation_1_1;
            },
            function (config_1_1) {
                config_1 = config_1_1;
            }],
        execute: function() {
            exports_1("fieldMetadataKey", fieldMetadataKey = '__fieldMetadata__');
            /**
             * Base class for all fields.
             */
            Field = (function () {
                function Field(field) {
                    var _this = this;
                    /**
                       * Errors from last validation. Displayed to the end-user.
                       */
                    this.errors = [];
                    this.focused = false;
                    this._defaultValuesForProperties = {};
                    this._changeListeners = [];
                    this._composed = false;
                    this.defaultFor(function () { return _this.visibility; }, function () { return fieldVisibility.enabled; });
                    this.defaultFor(function () { return _this.span; }, function () { return 1; });
                    this.defaultFor(function () { return _this.parse; }, function () { return _this.defaultParse; });
                    this.defaultFor(function () { return _this.validators; }, function () { return {}; });
                    this.defaultFor(function () { return _this.tabIndex; }, function () { return config_1.formsConfig.tabIndex; });
                    this.defaultFor(function () { return _this.onFocus; }, function () { return utils_1.Utils.noop; });
                    this.defaultFor(function () { return _this.onBlur; }, function () { return utils_1.Utils.noop; });
                    this.defaultFor(function () { return _this.onChange; }, function () { return utils_1.Utils.noop; });
                    this._validationExecutor = new validation_1.ValidationExecutor(this);
                }
                Object.defineProperty(Field.prototype, "isEmpty", {
                    get: function () {
                        return this.value === null || this.value === undefined || this.value === '';
                    },
                    enumerable: true,
                    configurable: true
                });
                Field.prototype.activate = function () {
                    this.internalValue = this.createInternalValue();
                    if (this.createdBy == fieldCreator.standard) {
                        // compiles the template using provided templateUrl
                        // but only in case of HTML based usage
                        // Model based is rendered in the m-row custom element
                        var au_1 = this.element.au;
                        var view = au_1.controller.view;
                        if (view) {
                            view.removeNodes();
                        }
                        var compiler = aurelia_dependency_injection_1.Container.instance.get(compiler_1.Compiler);
                        return compiler.compileTemplate(this.element, this.templateUrl, this);
                    }
                };
                /**
                 * Initializes the field with provided or default values.
                 * Called in the constructor, through customField decorator.
                 * Shouldn't be called manually, that's why it's private
                 * even though it is called from external scope.
                 */
                Field.prototype._applyDefinitionBase = function (field) {
                    this.name = field.name;
                    this.label = field.label;
                    this.visibility = field.visibility;
                    this.span = field.span;
                    this.value = field.value;
                    this.validators = field.validators;
                    this.parse = field.parse;
                    this.tabIndex = field.tabIndex;
                    this.onFocus = field.onFocus;
                    this.onBlur = field.onBlur;
                    this.onChange = field.onChange;
                };
                Field.prototype.applyDefinition = function (field) {
                    for (var key in field) {
                        this[key] = field[key];
                    }
                };
                Field.prototype.defaultFor = function (propertyNameOrExpression, action) {
                    var propertyName = propertyNameOrExpression;
                    if (propertyNameOrExpression instanceof Function) {
                        propertyName = utils_1.Utils.property(propertyNameOrExpression);
                    }
                    this._defaultValuesForProperties[propertyName] = action;
                };
                /**
                 * Default implementation of `parse` method. Could be overriden by user or
                 * custom field implementation.
                 */
                Field.prototype.defaultParse = function (value) {
                    return value;
                };
                Field.prototype.bind = function () {
                    this.applyDefaultValuesForProperties();
                    this.activate();
                };
                Field.prototype.valueChanged = function () {
                    if (this._prevValue === this.value) {
                        // internal change, already handled in onChanged method
                        return;
                    }
                    this.onExternalyChanged();
                };
                /**
                 * Internal control implementation should invoke this method on focus.
                 */
                Field.prototype.onFocused = function () {
                    this.focused = true;
                    this.onFocus(this);
                };
                /**
                 * Internal control implementation should invoke this method on blur.
                 */
                Field.prototype.onBlured = function () {
                    this.focused = false;
                    this.onBlur(this);
                };
                /**
                   * Internal control implementation should invoke this method on `internalValue` change.
                   */
                Field.prototype.onChanged = function () {
                    this.value = this.parse(this.internalValue, this);
                    if (this._prevValue === this.value) {
                        return;
                    }
                    this._prevValue = this.value;
                    this.onChange(this);
                    this._emitChange();
                };
                /**
                 * Triggered if value changed externally, i.e. if library user
                 * changed the value on it's own. In such scenario internal representation
                 * of value has to stay in sync.
                 */
                Field.prototype.onExternalyChanged = function () {
                    this.internalValue = this.createInternalValue();
                    // onChanged has to be invoked on each internalValue change
                    this.onChanged();
                };
                /**
                 * Serializes `value` property so that it could be used as `internalValue`
                 * and displayed to the end-user.
                 * If `internalValue` is any other then string then this method should be
                 * overriden in derived class.
                 */
                Field.prototype.createInternalValue = function () {
                    if (this.value === undefined || this.value === null) {
                        return '';
                    }
                    return this.value.toString();
                };
                Field.prototype.validate = function (resultsPusher) {
                    if (resultsPusher === void 0) { resultsPusher = undefined; }
                    return this._validationExecutor.execute(resultsPusher);
                };
                Field.prototype.listenOnChange = function (listener) {
                    this._changeListeners.push(listener);
                };
                Field.prototype._emitChange = function () {
                    var _this = this;
                    var x = this._changeListeners;
                    switch (x.length) {
                        case 0: break;
                        case 1:
                            x[0](this);
                            break;
                        case 2:
                            x[0](this);
                            x[1](this);
                            break;
                        case 3:
                            x[0](this);
                            x[1](this);
                            x[2](this);
                            break;
                        default: x.forEach(function (l) { return l(_this); });
                    }
                };
                Field.prototype.applyDefaultValuesForProperties = function () {
                    for (var propertyName in this._defaultValuesForProperties) {
                        if (this[propertyName] === undefined) {
                            this[propertyName] = this._defaultValuesForProperties[propertyName]();
                        }
                    }
                };
                return Field;
            }());
            exports_1("Field", Field);
            exports_1("fieldVisibility", fieldVisibility = {
                hidden: 'hidden',
                readOnly: 'readOnly',
                disabled: 'disabled',
                enabled: 'enabled',
            });
            exports_1("fieldCreator", fieldCreator = {
                dynamicForm: 'dynamic-form',
                standard: 'standard'
            });
        }
    }
});
