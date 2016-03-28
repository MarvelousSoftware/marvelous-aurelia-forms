import {customElement, noView, ViewSlot, CompositionEngine, ViewResources, View} from 'aurelia-templating';
import {Container, inject} from 'aurelia-dependency-injection';
import {bindingMode} from 'aurelia-binding';
import {AureliaUtils as au} from 'marvelous-aurelia-core/aureliaUtils';
import {Utils as _} from 'marvelous-aurelia-core/utils';
import {Compiler} from 'marvelous-aurelia-core/compiler';
import {IValidatorDictionary, ValidationExecutor, IValidationResultsPusher, IValidationResult} from './validation';
import {Row} from './schema';
import {FormsConfig, createConfiguration, globalConfig} from './config';

export const fieldMetadataKey = '__fieldMetadata__';

/**
 * Base class for all fields.
 */
export class Field {
  definition: IFieldDefinition;
  row: Row;
  rowIndex: number;
  customElementName: string;
  
  // bound fields
  name: string;
  label: string;
  visibility: string;
  span: number;
  value: any;
  parse: (value, field: Field) => void;
  tabIndex: number;
  templateUrl: string;
  validators: IValidatorDictionary;
  config: FormsConfig;
	
  /**
   * Value bound to the view. Parsed value is always available in the
   * `value` property.
   */
  internalValue: any;
  
  /**
	 * Errors from last validation. Displayed to the end-user.
	 */
  errors: string[] = [];

  touched: boolean = false;
  focused: boolean = false;

  onFocus: (fied: Field) => void;
  onBlur: (fied: Field) => void;
  onChange: (field: Field) => void;

  element: HTMLElement;
  field: Field;
  
  /**
   * Field creator. Allows to distinguish dynamic form and starndard one.
   */
  createdBy: string;

  private _prevValue;
  private _defaultValuesForProperties: any = {};
  private _validationExecutor: ValidationExecutor;
  private _changeListeners: ((field: Field) => void)[] = [];
  private _composed = false;
  
  get isEmpty() {
    return this.value === null || this.value === undefined || this.value === '';
  }

  constructor(field: IFieldDefinition) {
    this.defaultFor<Field>(() => this.visibility, () => fieldVisibility.enabled);
    this.defaultFor<Field>(() => this.span, () => 1);
    this.defaultFor<Field>(() => this.parse, () => this.defaultParse);
    this.defaultFor<Field>(() => this.validators, () => { return {}; });
    this.defaultFor<Field>(() => this.tabIndex, () => this.config.tabIndex);
    this.defaultFor<Field>(() => this.onFocus, () => _.noop);
    this.defaultFor<Field>(() => this.onBlur, () => _.noop);
    this.defaultFor<Field>(() => this.onChange, () => _.noop);

    this._validationExecutor = new ValidationExecutor(this);
  }

  bind() {
    this.internalValue = this.createInternalValue();
    
    if (this.createdBy == fieldCreator.dynamicForm) {
      return;
    }
    
    this._initConfig();
    this.applyDefaultValuesForProperties();
    this.compile();
  }
  
  /**
   * Automatically called to bind model based field.
   */
  bindModelBased() {
    this._initConfig();
    this.applyDefaultValuesForProperties();
  }
  
  /**
   * Compiles the template using provided templateUrl
   * but only in case of HTML based usage.
   * Model based is rendered by the m-row custom element.
   */
  compile() {
    let au = (<any>this.element).au;
    let view = <View>au.controller.view;
    if (view) {
      view.removeNodes();
    }

    let compiler = <Compiler>Container.instance.get(Compiler);
    return compiler.compileTemplate(this.element, this.templateUrl, this);
  }
  
  private _initConfig() {
    let getBaseConfig = () => {
      if(this.row && this.row.schema) {
        return this.row.schema.config;
      }
      return globalConfig;
    }
    
    if(this.config) {
      // config has been provided explicitly, but by convention this is not a properly created configuration instance
      // it's just a pure javascript object
      this.config = createConfiguration(this.config, getBaseConfig());
      return;
    }
    
    this.config = getBaseConfig();
  }
  
  /**
   * Initializes the field with provided or default values.
   * Called in the constructor, through customField decorator.
   * Shouldn't be called manually, that's why it's private
   * even though it is called from external scope.
   */
  private _applyDefinitionBase(field: IFieldDefinition) {
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
  }

  applyDefinition(field: IFieldDefinition) {
    for (let key in field) {
      this[key] = field[key];
    }
  }

  defaultFor(propertyName: string, action: () => any);
  defaultFor<T>(expression: (x: T) => any, action: () => any);
  defaultFor(propertyNameOrExpression: any, action: () => any) {
    let propertyName = propertyNameOrExpression;
    if (propertyNameOrExpression instanceof Function) {
      propertyName = _.property(propertyNameOrExpression);
    }

    this._defaultValuesForProperties[propertyName] = action;
  }
  
  /**
   * Default implementation of `parse` method. Could be overriden by user or
   * custom field implementation.
   */
  defaultParse(value) {
    return value;
  }

  valueChanged() {
    if (this._prevValue === this.value) {
      // internal change, already handled in onChanged method
      return;
    }
    this.onExternalyChanged();
  }
  
	/**
	 * Internal control implementation should invoke this method on focus.
	 */
  onFocused() {
    this.focused = true;
    this.onFocus(this);
  }
	
	/**
	 * Internal control implementation should invoke this method on blur.
	 */
  onBlured() {
    this.focused = false;
    this.touched = true;
    
    if(this.config.validation.shouldValidateOnBlur(this)) {
      this.validate();
    }
    
    this.onBlur(this);
  }
	
  /**
	 * Internal control implementation should invoke this method on `internalValue` change.
	 */
  onChanged() {
    this.value = this.parse(this.internalValue, this);

    if (this._prevValue === this.value) {
      return;
    }

    this._prevValue = this.value;
    this.onChange(this);
    this._emitChange();
  }
  
  /**
   * Triggered if value changed externally, i.e. if library user
   * changed the value on it's own. In such scenario internal representation
   * of value has to stay in sync.
   */
  onExternalyChanged() {
    this.internalValue = this.createInternalValue();
    
    // onChanged has to be invoked on each internalValue change
    this.onChanged();
  }
  
  /**
   * Serializes `value` property so that it could be used as `internalValue`
   * and displayed to the end-user.
   * If `internalValue` is any other then string then this method should be
   * overriden in derived class.
   */
  createInternalValue() {
    if (this.value === undefined || this.value === null) {
      return '';
    }
    return this.value.toString();
  }

  validate(resultsPusher: IValidationResultsPusher = undefined) {
    return this._validationExecutor.execute(resultsPusher);
  }

  listenOnChange(listener: (field: Field) => void) {
    this._changeListeners.push(listener);
  }

  private _emitChange() {
    let x = this._changeListeners;
    switch (x.length) {
      case 0: break;
      case 1: x[0](this); break;
      case 2: x[0](this); x[1](this); break;
      case 3: x[0](this); x[1](this); x[2](this); break;
      default: x.forEach(l => l(this));
    }
  }

  applyDefaultValuesForProperties() {
    for (let propertyName in this._defaultValuesForProperties) {
      if (this[propertyName] === undefined) {
        this[propertyName] = this._defaultValuesForProperties[propertyName]();
      }
    }
  }
}

export interface IFieldDefinition {  
	/**
	 * Name of the field. Used to access to the field and to create form model. 
	 */
  name?: string;
	
  /**
   * Name of the row field should belong to.
   */
  row?: string;
  
  /**
   * Field's label.
   */
  label?: string;
  
	/**
	 * Initial value of the field. 
	 */
  value?: any;
		
	/**
	 * Initial field visibility. All supported values are stored in the FieldVisibility type. 
	 */
  visibility?: string;
	
  /**
   * Number of columns given field spans.
   */
  span?: number;
  
	/**
	 * Method to be called to parse the value. Default implementation returns pure value. 
	 * Useful if value should be transformed to other type.
	 */
  parse?: (value: any, field: Field) => any;
  
  /**
   * Tab order of an element. Default: 1.
   */
  tabIndex?: number;
  
  /**
   * If specified then custom template will be used.
   * Warning: Relative paths are not supported.
   */
  templateUrl?: string;
    	
	/**
	 * Dictionary of validators.
	 */
  validators?: IValidatorDictionary;
	
	/**
	 * Invoked on focus.
	 */
  onFocus?: (field: Field) => void;
	
	/**
	 * Invoked on blur.
	 */
  onBlur?: (field: Field) => void;
  
  /**
   * Invoked on value change.
   */
  onChange?: (field: Field) => void;
}

export let fieldVisibility = {
  hidden: 'hidden',
  readOnly: 'readOnly',
  disabled: 'disabled',
  enabled: 'enabled',
}

// TODO: rename to fieldCreationApproach(HtmlBased,ModelBased)?
export let fieldCreator = {
  dynamicForm: 'dynamic-form',
  standard: 'standard'
}

export function customField(name: string) {
  return function(target: any) {
    let original = target;

    if ((original.prototype instanceof Field) === false) {
      throw new Error(`It looks like you're trying to create a new custom field. The problem is that ` +
        `you forgot about using Field as a base class in '${original.name}' type. Just import Field from ` +
        `'marvelous-aurelia-forms/forms/fields.base' and then write 'class ${original.name} extends Field'. ` +
        `Once you do it everything should start working properly.`);
    }
    
    // a utility function to generate instances of a class
    function construct(constructor, args) {
      let c: any = function() {
        return constructor.apply(this, args);
      }
      c.prototype = constructor.prototype;
      return new c();
    }
    
    // the new constructor behaviour
    let newConstructor: any = function(...args) {
      let decorated: Field = construct(original, args);
      decorated[fieldMetadataKey] = decorated[fieldMetadataKey] || {};

      let fieldOrElement: IFieldDefinition | Element = args[0];
      let isFieldDefinition = (fieldOrElement instanceof Element) == false;
      let field: IFieldDefinition = isFieldDefinition ? fieldOrElement : <any>{};

      decorated.definition = field;

      if (fieldOrElement instanceof Element) {
        decorated.element = <any>fieldOrElement;
      }

      if (isFieldDefinition) {
        decorated.createdBy = fieldCreator.dynamicForm;
        
        // definitions are applied only for manually created, schema based objects
        // these kind of objects are not view models, that's why `!isViewModel`.
        (<any>decorated)._applyDefinitionBase(field);
        decorated.applyDefinition(field);
      }

      decorated.customElementName = name;
      decorated.defaultFor('createdBy', () => fieldCreator.standard);
      return decorated;
    }
  
    // copy prototype so intanceof operator still works
    newConstructor.prototype = original.prototype;
    newConstructor.constructor = original.constructor;
    
    // rewrites custom data
    for (let key in original) {
      if (original.hasOwnProperty(key)) {
        newConstructor[key] = original[key];
      }
    }

    // base decorators
    customElement(name)(newConstructor);
    inject(Element)(newConstructor);
    noView()(newConstructor);
    
    // Base properties registration.
    // It is a workaround for a lack of inheritence support in case of bindable properties.
    // Unfortunatelly it stopped working after some update.
    // According to Rob's post (https://github.com/aurelia/framework/issues/210#issuecomment-141605960)
    // inheritence will be supported someday and therefore I'd leave it for now.
    let bindableProp = (name: string, bindingMode = undefined) => {
      au.bindable(bindingMode)(original.prototype, name);
    }
    bindableProp('name');
    bindableProp('label');
    bindableProp('visibility');
    bindableProp('span');
    bindableProp('value', bindingMode.twoWay);
    bindableProp('parse');
    bindableProp('tabIndex');
    bindableProp('templateUrl');
    bindableProp('validators');
    bindableProp('field');
    bindableProp('config');

    return newConstructor;
  }
}