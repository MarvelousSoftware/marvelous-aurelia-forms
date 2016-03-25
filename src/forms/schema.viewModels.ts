import {customElement, noView, ViewSlot, CompositionEngine, ViewResources, bindable, useView, 
  inlineView, processContent, CompositionContext, viewStrategy, HtmlBehaviorResource, BindableProperty} from 'aurelia-templating';
import {Container, inject} from 'aurelia-dependency-injection';
import {bindingMode, BindingEngine} from 'aurelia-binding';
  
import {Compiler} from 'marvelous-aurelia-core/compiler';
import {Utils as _} from 'marvelous-aurelia-core/utils';
import {AureliaUtils as au} from 'marvelous-aurelia-core/aureliaUtils';
import {metadata} from 'aurelia-metadata';
import {Schema, Row, events} from './schema';
import {Field} from './fields.base';
import {IFieldValidationResult} from './validation';

// TODO: custom template
@inlineView(`<template>
  <form submit.trigger="onSubmit()">
    <template replaceable part="before"></template>
    <m-row repeat.for="row of schema.rowsAsArray" row.bind="row"></m-row>
    <div class="form-group"><template replaceable part="after"></template></div>
  </form>
</template>`)
@customElement('m-form')
@inject(BindingEngine)
export class FormViewModel {
  @au.bindable() schema: Schema;
  @au.bindable() submit;
  @au.bindable() beforeSubmit;
  @au.bindable(bindingMode.twoWay) model;

  modelObservers = [];

  constructor(private _bindingEngine: BindingEngine) {
  }

  attached() {
    this._registerModelObservation();
  }

  detached() {
    this._unregisterModelObservation();
  }

  modelChanged() {
    this._unregisterModelObservation();
    this._registerModelObservation();
    this.schema.forEachField(field => {
      field.value = this.model[field.name];
    });
  }

  private _registerModelObservation() {
    if (!this.model) {
      this.model = {};
      return;
    }
    
    this.modelObservers.push(this.schema.pubSub.subscribe(events.fieldAdded, (field: Field) => {
      this._registerFieldObservation(field);
    }));
    this.modelObservers.push(this.schema.pubSub.subscribe(events.rowAdded, (row: Row) => {
      row.fieldsAsArray.forEach(field => {
        this._registerFieldObservation(field);
      });
    }));
    
    this.schema.forEachField(field => {
      this._registerFieldObservation(field);
    });
  }

  private _registerFieldObservation(field: Field) {
    field.listenOnChange(() => {
      this.model[field.name] = field.value;
    });

    let observer = this._bindingEngine
      .propertyObserver(this.model, field.name)
      .subscribe((n) => { field.value = n; });

    this.modelObservers.push(observer.dispose);
  }

  private _unregisterModelObservation() {
    this.modelObservers.forEach(x => x());
    this.modelObservers = [];
  }

  onSubmit() {
    if (this.beforeSubmit && this.beforeSubmit instanceof Function) {
      this.beforeSubmit();
    }
    
    this.schema.submitted = true;
    
    if (this.submit && this.submit instanceof Function) {
      // TODO: schema validation should return this context directly
      this.schema.validate().then(x => {
        this.submit({
          $context: this._createSubmitContext(x)
        });
      });
    }
  }

  private _createSubmitContext(validationResults: IFieldValidationResult[]) {
    return {
      model: this.schema.getModel(),
      isValid: validationResults.every(x => x.isValid),
      validations: validationResults.map(x => {
        return {
          field: x.field,
          errors: x.validations.filter(v => v.isValid === false).map(v => v.error)
        }
      }).filter(x => x.errors.length > 0) // TODO: maybe validations should include also valid fields?
    }
  }
}

@noView()
@customElement('m-row')
@inject(Compiler, Element, BindingEngine, CompositionEngine, ViewResources)
export class RowViewModel {
  @au.bindable() row: Row;

  private _subs: Function[] = [];
  private _row: Element;

  constructor(private _compiler: Compiler, private _element: Element, private _bindingEngine: BindingEngine, 
  private _compositionEngine: CompositionEngine, private _viewResources: ViewResources) {
  }

  bind() {
    this.render();

    this.row.pubSub.subscribe(events.fieldAdded, (field: Field) => {
      let allElements = this._element.querySelectorAll('[m-target-id]');
      let switchElement = allElements.length > field.rowIndex - 1 ? allElements[field.rowIndex] : undefined;

      if (switchElement) {
        this._renderFieldInTheMiddle(field, switchElement);
      } else {
        this._renderFieldAtTheEnd(field, this._row);
      }
    });

    this.row.pubSub.subscribe(events.fieldRemoved, (field: Field) => {
      let fieldElement = this._element.querySelector(`[m-target-id=${field.name}]`);
      // TODO: it might be needed to unbind the ViewSlot created in the _createFieldElement method
      fieldElement.remove();
    });
  }

  detached() {
    this._subs.forEach(x => x());
  }

  render() {
    let row = document.createElement('div');
    row.setAttribute('class', 'row');
    this._row = row;

    let fragment = document.createDocumentFragment();
    fragment.appendChild(row);

    _.forOwn(this.row.fields, (field: Field) => {
      this._renderFieldAtTheEnd(field, row);
    });

    this._element.appendChild(row);
  }

  private _renderFieldAtTheEnd(field: Field, parent: Element) {
    let el = this._renderField(field);
    parent.appendChild(el);
  }

  private _renderFieldInTheMiddle(field: Field, elementToSwitch: Element) {
    let el = this._renderField(field);
    elementToSwitch.parentElement.insertBefore(el, elementToSwitch);
  }

  private _renderField(field: Field) {
    let wrapper = document.createElement('div');
    // TODO: template to formsConfig
    
    // NOTE about m-target-id: field name is good enough as an unique identifier since
    // there cannot be more than one field with same name in the very same row.
    
    field.bindModelBased();
    
    wrapper.innerHTML = `
    <div m-target-id="${field.name}" class="col-sm-${(12 / field.row.columns)*field.span}">
    </div>`.trim();
    let holder = <HTMLElement>wrapper.querySelector('div');
    field.element = holder;
    
    let viewSlot = new ViewSlot(holder, true, undefined);    
    
    // registers custom element so that it is available in the composition
    let constructor = Object.getPrototypeOf(field).constructor;
    let resource = <HtmlBehaviorResource>metadata.get(metadata.resource, constructor, undefined);
    this._viewResources.registerElement(field.customElementName, resource);
    
    this._compositionEngine.compose({
      bindingContext: field,
      container: Container.instance,
      viewModel: field,
      viewResources: this._viewResources,
      view: field.templateUrl,
      viewSlot: viewSlot
    }).then(x => x.attached());
    
    return holder;
  }
}