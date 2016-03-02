declare module "marvelous-aurelia-forms/forms/schema" {
	import { IDictionary } from 'marvelous-aurelia-core/interfaces';
	import { PubSub } from 'marvelous-aurelia-core/pubsub';
	import { Field } from 'marvelous-aurelia-forms/forms/fields.base';
	import { IFieldValidationResult, IValidationResultsPusher } from 'marvelous-aurelia-forms/forms/validation';
	export let events: {
	    fieldAdded: string;
	    fieldRemoved: string;
	    rowAdded: string;
	    rowRemoved: string;
	};
	export class Schema {
	    /**
	     * Dictionary of rows. If schema has been declared with fields only
	     * then this dictionary will be empty. In such case use `defaultRow`
	     * instead.
	     */
	    rows: IDictionary<Row>;
	    /**
	     * `rows` dictionary as array.
	     */
	    rowsAsArray: Row[];
	    /**
	     * If schema has been declared with fields only then this property will contain
	     * automatically generated row.
	     */
	    defaultRow: Row;
	    /**
	     * Indicates wheter whole schema is in the read only state.
	     */
	    isReadOnly: boolean;
	    pubSub: PubSub;
	    private _uniqueNameCount;
	    fields: IDictionary<Field>;
	    constructor(schema?: Row[] | Field[] | IDictionary<any>, rowsOrColumns?: Row[] | string[] | number);
	    private _createRowsFromArrayOrNumber(rowsOrColumns);
	    private _createFieldsFromProperties(definitions);
	    addRow(row: Row): void;
	    private _generateUniqueName();
	    removeRow(name: string): void;
	    addField(field: Field, rowName?: string): void;
	    rowCount: number;
	    /**
	     * Names of all added rows.
	     */
	    rowNames: string[];
	    hasAnyRow(): boolean;
	    hasRow(name: string): boolean;
	    forEachField(action: (field: Field) => void): void;
	    /**
	     * Generates model using assigned rows. Any modification to the created model won't be tracked.
	     * If modification of field value is needed do it on the field instance.
	     */
	    getModel(): any;
	    validate(resultsPusher?: IValidationResultsPusher): Promise<IFieldValidationResult[]>;
	    private _assignDefaultRow(fields, columns?);
	}
	export interface IRowDefinition {
	    /**
	     * Name of the row. Allows easy schema traversal.
	     */
	    name?: string;
	    /**
	     * Name of the row. Default: 'default'.
	     */
	    columns?: number;
	    /**
	     * Fields associated with an instance of row.
	     */
	    fields?: Field[];
	}
	export class Row {
	    /**
	     * Associated schema with an instance of row.
	     */
	    schema: Schema;
	    /**
	     * Name of the row. Default: 'default'.
	     */
	    name: string;
	    /**
	     * Numbers of columns to be displayed in the row.
	     */
	    columns: number;
	    /**
	     * Fields associated with an instance of row. Should be added only with
	     * `addField` method. Any other usage may lead to some issues.
	     */
	    fields: IDictionary<Field>;
	    /**
	     * Fields as array. Always in sync with `fields` property.
	     */
	    fieldsAsArray: Field[];
	    pubSub: PubSub;
	    constructor(row: IRowDefinition);
	    /**
	     * Adds new field at the end of the row.
	     */
	    addField(field: Field): void;
	    /**
	     * Adds new field at given position.
	     */
	    addFieldAt(field: Field, index: number): void;
	    removeField(name: string): void;
	    private _publish(eventName, payload);
	    hasField(name: string): boolean;
	    /**
	     * Generates model using assigned fields. Any modification to the created model won't be tracked.
	     */
	    getModel(): {};
	    validate(resultsPusher?: IValidationResultsPusher): Promise<IFieldValidationResult[]>;
	}
}
declare module "marvelous-aurelia-forms/forms/config" {
	export let formsConfig: {
	    globalizeResources: boolean;
	    tabIndex: number;
	    fields: {
	        textInput: {
	            templateUrl: string;
	        };
	        textArea: {
	            templateUrl: string;
	            rows: number;
	        };
	        checkboxInput: {
	            templateUrl: string;
	        };
	        numberInput: {
	            templateUrl: string;
	        };
	        select: {
	            templateUrl: string;
	        };
	    };
	    keyCodeMap: {
	        8: string;
	        9: string;
	        13: string;
	        35: string;
	        36: string;
	        37: string;
	        38: string;
	        39: string;
	        40: string;
	        45: string;
	        46: string;
	        110: string;
	        188: string;
	        190: string;
	    };
	};
}
declare module "marvelous-aurelia-forms/forms/fields.base" {
	import { ViewSlot } from 'aurelia-templating';
	import { IValidatorDictionary, IValidationResultsPusher, IValidationResult } from 'marvelous-aurelia-forms/forms/validation';
	import { Row } from 'marvelous-aurelia-forms/forms/schema';
	export const fieldMetadataKey: string;
	/**
	 * Base class for all fields.
	 */
	export class Field {
	    definition: IFieldDefinition;
	    row: Row;
	    rowIndex: number;
	    customElementName: string;
	    name: string;
	    label: string;
	    visibility: string;
	    span: number;
	    value: any;
	    parse: (value, field: Field) => void;
	    tabIndex: number;
	    templateUrl: string;
	    validators: IValidatorDictionary;
	    /**
	     * Value bound to the view. Parsed value is always available in the
	     * `value` property.
	     */
	    internalValue: any;
	    /**
	       * Errors from last validation. Displayed to the end-user.
	       */
	    errors: string[];
	    focused: boolean;
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
	    private _defaultValuesForProperties;
	    private _validationExecutor;
	    private _changeListeners;
	    isEmpty: boolean;
	    constructor(field: IFieldDefinition);
	    private _composed;
	    activate(): Promise<ViewSlot>;
	    /**
	     * Initializes the field with provided or default values.
	     * Called in the constructor, through customField decorator.
	     * Shouldn't be called manually, that's why it's private
	     * even though it is called from external scope.
	     */
	    private _applyDefinitionBase(field);
	    applyDefinition(field: IFieldDefinition): void;
	    defaultFor(propertyName: string, action: () => any): any;
	    defaultFor<T>(expression: (x: T) => any, action: () => any): any;
	    /**
	     * Default implementation of `parse` method. Could be overriden by user or
	     * custom field implementation.
	     */
	    defaultParse(value: any): any;
	    bind(): void;
	    valueChanged(): void;
	    /**
	     * Internal control implementation should invoke this method on focus.
	     */
	    onFocused(): void;
	    /**
	     * Internal control implementation should invoke this method on blur.
	     */
	    onBlured(): void;
	    /**
	       * Internal control implementation should invoke this method on `internalValue` change.
	       */
	    onChanged(): void;
	    /**
	     * Triggered if value changed externally, i.e. if library user
	     * changed the value on it's own. In such scenario internal representation
	     * of value has to stay in sync.
	     */
	    onExternalyChanged(): void;
	    /**
	     * Serializes `value` property so that it could be used as `internalValue`
	     * and displayed to the end-user.
	     * If `internalValue` is any other then string then this method should be
	     * overriden in derived class.
	     */
	    createInternalValue(): any;
	    validate(resultsPusher?: IValidationResultsPusher): Promise<IValidationResult[]>;
	    listenOnChange(listener: (field: Field) => void): void;
	    private _emitChange();
	    applyDefaultValuesForProperties(): void;
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
	export let fieldVisibility: {
	    hidden: string;
	    readOnly: string;
	    disabled: string;
	    enabled: string;
	};
	export let fieldCreator: {
	    dynamicForm: string;
	    standard: string;
	};
	export function customField(name: string): (target: any) => any;
}
declare module "marvelous-aurelia-forms/forms/validation" {
	import { Field } from 'marvelous-aurelia-forms/forms/fields.base';
	export class ValidationExecutor {
	    private _field;
	    /**
	     * True if field has been validated at least once.
	     */
	    private _validated;
	    constructor(_field: Field);
	    /**
	     * Gets greatest debounce time using values from field's validators.
	     */
	    getDebounceTime(): number;
	    execute(resultsPusher?: IValidationResultsPusher): Promise<IValidationResult[]>;
	    private _validate(validator, context);
	    private _forEachValidator(action);
	    private _getValidator(name, definition);
	}
	export class ValidatorsArray extends Array<IValidator> {
	    push(...validators: IValidator[]): number;
	    override(validator: IValidator): void;
	    get(name: string): IValidator;
	    has(name: string): boolean;
	    static validateValidatorProperties(validator: IValidator): void;
	}
	export interface IValidationResultsPusher {
	    push(field: Field, results: IValidationResult[]): any;
	}
	/**
	 * Instantly pushes errors to the field.
	 */
	export class InstantValidationResultsPusher implements IValidationResultsPusher {
	    push(field: Field, results: IValidationResult[]): void;
	}
	/**
	 * Allows to wait with pushing errors to the field till the signal.
	 */
	export class OnSignalValidationResultsPusher implements IValidationResultsPusher {
	    private _readyForSignalSlots;
	    push(field: Field, results: IValidationResult[]): void;
	    signal(): void;
	}
	/**
	 * Definition for a user decalared validator. Examples:
	 *
	 * // boolean
	 * required: true
	 *
	 * // {[key:string]: any}
	 * length: {
	 * 	min: 5,
	 *  max: 20
	 * }
	 *
	 * // IValidator
	 * custom: {
	 * 	isValid: ...,
	 *  getError: ...
	 * }
	 */
	export type ValidatorDefinition = IValidator | boolean | {
	    [key: string]: any;
	};
	/**
	 * An instance of validators array. Should be used to define globally available validators.
	 */
	export let validators: ValidatorsArray;
	export interface IValidatorDictionary {
	    [key: string]: ValidatorDefinition;
	}
	export interface IValidator {
	    name?: string;
	    /**
	     * If true then validator will be invoked even if field is empty.
	     * Default: false.
	     */
	    shouldValidateEmpty?: boolean;
	    isValid(context: IValidatorContext): Promise<boolean> | boolean;
	    getError(context: IValidatorContext): Promise<string> | string;
	    /**
	     * Debounce time in milliseconds.
	     *
	     * Once field is validated for the first time validation will refresh on
	     * any value change. It is a good practice to wait a moment
	     * in order to not make too much pressure on the browser and external
	     * resources (if used). Debounce is the wait time in milliseconds.
	     * Use 0 or undefined to make it disabled.
	     *
	     * Default: undefined.
	     */
	    debounce?: number;
	}
	export interface IValidatorContext {
	    field: Field;
	    validator: ValidatorDefinition;
	    /**
	     * Calculated value of a field.
	     * If field has custom parser then it will be
	     * used to instantiate the value.
	     */
	    value: any;
	}
	/**
	 * Holds the result of single validator invokation on a particular field.
	 */
	export interface IValidationResult {
	    field: Field;
	    validator: IValidator;
	    definition: ValidatorDefinition;
	    isValid: boolean;
	    error?: string;
	}
	/**
	 * Holds validations of specific field.
	 */
	export interface IFieldValidationResult {
	    field: Field;
	    validations: IValidationResult[];
	    /**
	     * If true then all validations are valid; otherwise, false.
	     */
	    isValid: boolean;
	}
}
declare module "marvelous-aurelia-forms/forms/validation.default" {
	export function registerDefaultValidators(): void;
}
declare module "marvelous-aurelia-forms/forms/fields" {
	import { Field, IFieldDefinition } from 'marvelous-aurelia-forms/forms/fields.base';
	export class TextInput extends Field {
	    type: string;
	    constructor(field: ITextInputDefinition);
	    bind(): void;
	}
	export interface ITextInputDefinition extends IFieldDefinition {
	    /**
	     * HTML based input type, e.g. password, email, text. Default: text.
	     */
	    type?: string;
	}
	export class CheckboxInput extends Field {
	    private AT_LEAST_ONE_BINDABLE_IS_REQUIRED;
	    constructor(field: ICheckboxInputDefinition);
	    bind(): void;
	    createInternalValue(): any;
	}
	export interface ICheckboxInputDefinition extends IFieldDefinition {
	}
	export class NumberInput extends Field {
	    decimalSeparator: string;
	    autoChangeToSeparator: string[];
	    suppressFromInvalidInput: boolean;
	    type: string;
	    constructor(field: INumberInputDefinition);
	    bind(): void;
	    onKeyUp(): void;
	    onKeyDown(e: any): boolean;
	}
	export interface INumberInputDefinition extends IFieldDefinition {
	    /**
	     * 'integer' or 'decimal'.
	     * Default: 'integer'
	     */
	    type?: string;
	    /**
	     * Default: '.'
	     */
	    decimalSeparator?: string;
	    /**
	     * An array of strings which should be automatically changed
	     * to decimal separator.
	     * Default: [',']
	     */
	    autoChangeToSeparator?: string[];
	    /**
	     * If true then user won't be able to write invalid (not numeric) values.
	     * Default: true
	     */
	    suppressFromInvalidInput?: boolean;
	}
	export class TextArea extends Field {
	    rows: number;
	    constructor(field: ITextAreaDefinition);
	}
	export interface ITextAreaDefinition extends IFieldDefinition {
	    rows?: number;
	}
	export class Select extends Field {
	    defaultText: string;
	    items: any[];
	    getText: (item) => string;
	    getValue: (item) => any;
	    constructor(field: ISelectDefinition);
	    defaultGetTextImpl(item: any): any;
	    defaultGetValueImpl(item: any): any;
	    invokeGetText(item: any): string;
	    invokeGetValue(item: any): any;
	    createInternalValue(): any;
	}
	export interface ISelectDefinition extends IFieldDefinition {
	    /**
	     * Default text to be displayed on the select element.
	     */
	    defaultText?: string;
	    /**
	     * Function called to get display text.
	     * Default: (item) => item.text
	     */
	    getText?: (item) => string;
	    /**
	     * Function called to get the value of selected item.
	     * Default: (item) => item
	     */
	    getValue?: (item) => any;
	    /**
	     * An array of items to be listed.
	     */
	    items?: any[];
	}
}
declare module "marvelous-aurelia-forms" {
	export { formsConfig } from 'marvelous-aurelia-forms/forms/config';
	export * from 'marvelous-aurelia-forms/forms/fields';
	export * from 'marvelous-aurelia-forms/forms/fields.base';
	export * from 'marvelous-aurelia-forms/forms/schema';
	export * from 'marvelous-aurelia-forms/forms/validation';
	export function configure(aurelia: any, configFunc: any): void;
}
declare module "marvelous-aurelia-forms/forms/schema.viewModels" {
	import { CompositionEngine, ViewResources } from 'aurelia-templating';
	import { BindingEngine } from 'aurelia-binding';
	import { Compiler } from 'marvelous-aurelia-core/compiler';
	import { Schema, Row } from 'marvelous-aurelia-forms/forms/schema';
	export class FormViewModel {
	    private _bindingEngine;
	    schema: Schema;
	    submit: any;
	    beforeSubmit: any;
	    model: any;
	    modelObservers: any[];
	    constructor(_bindingEngine: BindingEngine);
	    attached(): void;
	    detached(): void;
	    modelChanged(): void;
	    private _registerModelObservation();
	    private _registerFieldObservation(field);
	    private _unregisterModelObservation();
	    onSubmit(): void;
	    private _createSubmitContext(validationResults);
	}
	export class RowViewModel {
	    private _compiler;
	    private _element;
	    private _bindingEngine;
	    private _compositionEngine;
	    private _viewResources;
	    row: Row;
	    private _subs;
	    private _row;
	    constructor(_compiler: Compiler, _element: Element, _bindingEngine: BindingEngine, _compositionEngine: CompositionEngine, _viewResources: ViewResources);
	    bind(): void;
	    detached(): void;
	    render(): void;
	    private _renderFieldAtTheEnd(field, parent);
	    private _renderFieldInTheMiddle(field, elementToSwitch);
	    private _renderField(field);
	}
}