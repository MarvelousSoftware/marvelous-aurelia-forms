System.register(['aurelia-templating', 'aurelia-dependency-injection', 'aurelia-binding', 'marvelous-aurelia-core/compiler', 'marvelous-aurelia-core/utils', 'marvelous-aurelia-core/aureliaUtils', 'aurelia-metadata', './schema'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var aurelia_templating_1, aurelia_dependency_injection_1, aurelia_binding_1, compiler_1, utils_1, aureliaUtils_1, aurelia_metadata_1, schema_1;
    var FormViewModel, RowViewModel;
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
            function (compiler_1_1) {
                compiler_1 = compiler_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (aureliaUtils_1_1) {
                aureliaUtils_1 = aureliaUtils_1_1;
            },
            function (aurelia_metadata_1_1) {
                aurelia_metadata_1 = aurelia_metadata_1_1;
            },
            function (schema_1_1) {
                schema_1 = schema_1_1;
            }],
        execute: function() {
            // TODO: custom template
            FormViewModel = (function () {
                function FormViewModel(_bindingEngine) {
                    this._bindingEngine = _bindingEngine;
                    this.modelObservers = [];
                }
                FormViewModel.prototype.attached = function () {
                    this._registerModelObservation();
                };
                FormViewModel.prototype.detached = function () {
                    this._unregisterModelObservation();
                };
                FormViewModel.prototype.modelChanged = function () {
                    var _this = this;
                    this._unregisterModelObservation();
                    this._registerModelObservation();
                    this.schema.forEachField(function (field) {
                        field.value = _this.model[field.name];
                    });
                };
                FormViewModel.prototype._registerModelObservation = function () {
                    var _this = this;
                    if (!this.model) {
                        this.model = {};
                        return;
                    }
                    this.modelObservers.push(this.schema.pubSub.subscribe(schema_1.events.fieldAdded, function (field) {
                        _this._registerFieldObservation(field);
                    }));
                    this.modelObservers.push(this.schema.pubSub.subscribe(schema_1.events.rowAdded, function (row) {
                        row.fieldsAsArray.forEach(function (field) {
                            _this._registerFieldObservation(field);
                        });
                    }));
                    this.schema.forEachField(function (field) {
                        _this._registerFieldObservation(field);
                    });
                };
                FormViewModel.prototype._registerFieldObservation = function (field) {
                    var _this = this;
                    field.listenOnChange(function () {
                        _this.model[field.name] = field.value;
                    });
                    var observer = this._bindingEngine
                        .propertyObserver(this.model, field.name)
                        .subscribe(function (n) { field.value = n; });
                    this.modelObservers.push(observer.dispose);
                };
                FormViewModel.prototype._unregisterModelObservation = function () {
                    this.modelObservers.forEach(function (x) { return x(); });
                    this.modelObservers = [];
                };
                FormViewModel.prototype.onSubmit = function () {
                    var _this = this;
                    if (this.beforeSubmit && this.beforeSubmit instanceof Function) {
                        this.beforeSubmit();
                    }
                    if (this.submit && this.submit instanceof Function) {
                        this.schema.validate().then(function (x) {
                            _this.submit({
                                $context: _this._createSubmitContext(x)
                            });
                        });
                    }
                };
                FormViewModel.prototype._createSubmitContext = function (validationResults) {
                    return {
                        model: this.schema.getModel(),
                        isValid: validationResults.every(function (x) { return x.isValid; }),
                        validations: validationResults.map(function (x) {
                            return {
                                field: x.field,
                                errors: x.validations.filter(function (v) { return v.isValid === false; }).map(function (v) { return v.error; })
                            };
                        }).filter(function (x) { return x.errors.length > 0; }) // TODO: maybe validations should include also valid fields?
                    };
                };
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], FormViewModel.prototype, "schema", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], FormViewModel.prototype, "submit", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], FormViewModel.prototype, "beforeSubmit", void 0);
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable(aurelia_binding_1.bindingMode.twoWay)
                ], FormViewModel.prototype, "model", void 0);
                FormViewModel = __decorate([
                    aurelia_templating_1.inlineView("<template>\n  <form submit.trigger=\"onSubmit()\">\n    <template replaceable part=\"before\"></template>\n    <m-row repeat.for=\"row of schema.rowsAsArray\" row.bind=\"row\"></m-row>\n    <div class=\"form-group\"><template replaceable part=\"after\"></template></div>\n  </form>\n</template>"),
                    aurelia_templating_1.customElement('m-form'),
                    aurelia_dependency_injection_1.inject(aurelia_binding_1.BindingEngine)
                ], FormViewModel);
                return FormViewModel;
            }());
            exports_1("FormViewModel", FormViewModel);
            RowViewModel = (function () {
                function RowViewModel(_compiler, _element, _bindingEngine, _compositionEngine, _viewResources) {
                    this._compiler = _compiler;
                    this._element = _element;
                    this._bindingEngine = _bindingEngine;
                    this._compositionEngine = _compositionEngine;
                    this._viewResources = _viewResources;
                    this._subs = [];
                }
                RowViewModel.prototype.bind = function () {
                    var _this = this;
                    this.render();
                    this.row.pubSub.subscribe(schema_1.events.fieldAdded, function (field) {
                        var allElements = _this._element.querySelectorAll('[m-target-id]');
                        var switchElement = allElements.length > field.rowIndex - 1 ? allElements[field.rowIndex] : undefined;
                        if (switchElement) {
                            _this._renderFieldInTheMiddle(field, switchElement);
                        }
                        else {
                            _this._renderFieldAtTheEnd(field, _this._row);
                        }
                    });
                    this.row.pubSub.subscribe(schema_1.events.fieldRemoved, function (field) {
                        var fieldElement = _this._element.querySelector("[m-target-id=" + field.name + "]");
                        // TODO: it might be needed to unbind the ViewSlot created in the _createFieldElement method
                        fieldElement.remove();
                    });
                };
                RowViewModel.prototype.detached = function () {
                    this._subs.forEach(function (x) { return x(); });
                };
                RowViewModel.prototype.render = function () {
                    var _this = this;
                    var row = document.createElement('div');
                    row.setAttribute('class', 'row');
                    this._row = row;
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(row);
                    utils_1.Utils.forOwn(this.row.fields, function (field) {
                        _this._renderFieldAtTheEnd(field, row);
                    });
                    this._element.appendChild(row);
                };
                RowViewModel.prototype._renderFieldAtTheEnd = function (field, parent) {
                    var el = this._renderField(field);
                    parent.appendChild(el);
                };
                RowViewModel.prototype._renderFieldInTheMiddle = function (field, elementToSwitch) {
                    var el = this._renderField(field);
                    elementToSwitch.parentElement.insertBefore(el, elementToSwitch);
                };
                RowViewModel.prototype._renderField = function (field) {
                    var wrapper = document.createElement('div');
                    // TODO: template to formsConfig
                    // NOTE about m-target-id: field name is good enough as an unique identifier since
                    // there cannot be more than one field with same name in the very same row.
                    field.applyDefaultValuesForProperties();
                    wrapper.innerHTML = ("\n    <div m-target-id=\"" + field.name + "\" class=\"col-sm-" + (12 / field.row.columns) * field.span + "\">\n    </div>").trim();
                    var holder = wrapper.querySelector('div');
                    field.element = holder;
                    var viewSlot = new aurelia_templating_1.ViewSlot(holder, true, undefined);
                    // registers custom element so that it is available in the composition
                    var constructor = Object.getPrototypeOf(field).constructor;
                    var resource = aurelia_metadata_1.metadata.get(aurelia_metadata_1.metadata.resource, constructor, undefined);
                    this._viewResources.registerElement(field.customElementName, resource);
                    this._compositionEngine.compose({
                        bindingContext: field,
                        container: aurelia_dependency_injection_1.Container.instance,
                        viewModel: field,
                        viewResources: this._viewResources,
                        view: field.templateUrl,
                        viewSlot: viewSlot
                    }).then(function (x) { return x.attached(); });
                    return holder;
                };
                __decorate([
                    aureliaUtils_1.AureliaUtils.bindable()
                ], RowViewModel.prototype, "row", void 0);
                RowViewModel = __decorate([
                    aurelia_templating_1.noView(),
                    aurelia_templating_1.customElement('m-row'),
                    aurelia_dependency_injection_1.inject(compiler_1.Compiler, Element, aurelia_binding_1.BindingEngine, aurelia_templating_1.CompositionEngine, aurelia_templating_1.ViewResources)
                ], RowViewModel);
                return RowViewModel;
            }());
            exports_1("RowViewModel", RowViewModel);
        }
    }
});
