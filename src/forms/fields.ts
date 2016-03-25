import {Utils as _} from 'marvelous-aurelia-core/utils';
import {AureliaUtils as au} from 'marvelous-aurelia-core/aureliaUtils';
import {customField, Field, IFieldDefinition, fieldCreator} from './fields.base';

// TODO: create following controls 
// * Time
// * Date
// * DateTime
// * File

/////////////////////////////////////
//// Text Field
/////////////////////////////////////
@customField('m-text-input')
export class TextInput extends Field {
	@au.bindable() type: string;
	  
  constructor(field: ITextInputDefinition) {
    super(field);
    this.defaultFor(() => this.templateUrl, () => this.config.fields.textInput.templateUrl);
    this.defaultFor(() => this.type, () => 'text');
  }
  
  bind() {
    super.bind();
        
    switch(this.type.toLowerCase()) {
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
  }
}
export interface ITextInputDefinition extends IFieldDefinition {
	/**
	 * HTML based input type, e.g. password, email, text. Default: text.
	 */
	type?: string;
}

/////////////////////////////////////
//// Checkbox Field
/////////////////////////////////////
@customField('m-checkbox')
export class CheckboxInput extends Field {
  @au.bindable() private AT_LEAST_ONE_BINDABLE_IS_REQUIRED: string;
  
	constructor(field: ICheckboxInputDefinition) {
    super(field);
    this.defaultFor(() => this.templateUrl, () => this.config.fields.checkboxInput.templateUrl);  
	}
  
  bind() {
    super.bind();
     
    // In case of checkbox required validation has to work a bit differently.
    // It should check whether value is TRUE instead of checking whether
    // value is defined.
    this.validators['required'] = this.validators['required'] === true ? { exact: true } : false;
  }
  
  createInternalValue() {
    if(this.value === undefined || this.value === null) {
      return false;
    }
    return this.value;
  }
}
export interface ICheckboxInputDefinition extends IFieldDefinition {
}

/////////////////////////////////////
//// Number Field
/////////////////////////////////////
@customField('m-number')
export class NumberInput extends Field {  
  @au.bindable() decimalSeparator: string;
  @au.bindable() autoChangeToSeparator: string[];
  @au.bindable() suppressFromInvalidInput: boolean;
  @au.bindable() type: string;
  
  constructor(field: INumberInputDefinition) {
    super(field);
    this.defaultFor(() => this.templateUrl, () => this.config.fields.numberInput.templateUrl);
    this.defaultFor(() => this.type, () => 'integer');
    this.defaultFor(() => this.decimalSeparator, () => '.');
    this.defaultFor(() => this.autoChangeToSeparator, () => [',']);
    this.defaultFor(() => this.suppressFromInvalidInput, () => true);
  }
  
  bind() {
    super.bind();
    let internalParse: (value)=>number;
    
    switch(this.type) {
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
      default: throw new Error(`NumberInput doesn't supprot '${this.type}' type. Supported types are 'integer' and 'decimal'.`);
    }
    
    if(this.parse === this.defaultParse) {
      // parsing has been not overriden by user, so it needs to be tweaked to work with
      // given type
      this.parse = (value => {
        if(!value) {
          return undefined;
        }
        return internalParse(value);
      });
    }
  }
  
  onKeyUp() {
    if(!!this.internalValue === false) {
      this.value = undefined;
      return;
    }
    
    // changes separator to the proper one
    if(this.autoChangeToSeparator instanceof Array) {
      this.autoChangeToSeparator.forEach(x => {
        this.internalValue = this.internalValue.replace(x, this.decimalSeparator);              
      });
    }
    
    this.onChanged();
  }
  
  onKeyDown(e) {
    // TODO: allow only one decimal separator
    if(this.suppressFromInvalidInput == false) {
      return true;
    }
    
    let key = this.config.keyCodeMap[e.which];

    switch(key) {
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
    let isInteger = (e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105);
    
    switch(this.type) {
      case 'integer': {
        return isInteger;
      }
      case 'decimal': {
        if(isInteger) {
          return true;
        }
        
        if(key === this.decimalSeparator) {
          return true;
        }        
        
        if(this.autoChangeToSeparator.indexOf(key) >= 0) {
          return true;
        }
        
        return false;
      }
    }
    return true;
  }
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

/////////////////////////////////////
//// TextArea Field
/////////////////////////////////////
@customField('m-text-area')
export class TextArea extends Field {
	@au.bindable() rows: number;
		
  constructor(field: ITextAreaDefinition) {
    super(field);
    this.defaultFor(() => this.templateUrl, () => this.config.fields.textArea.templateUrl);
    this.defaultFor(() => this.rows, () => this.config.fields.textArea.rows);
  }
}
export interface ITextAreaDefinition extends IFieldDefinition {
	rows?: number;
}

/////////////////////////////////////
//// Enumerated Field
/////////////////////////////////////
@customField('m-select')
export class Select extends Field {
	@au.bindable() defaultText: string;
	@au.bindable() items: any[];
  @au.bindable() getText: (item)=>string;
  @au.bindable() getValue: (item)=>any;
  
  constructor(field: ISelectDefinition) {
    super(field);
    
    this.defaultFor(() => this.templateUrl, () => this.config.fields.select.templateUrl);
    this.defaultFor(() => this.getText, () => this.defaultGetTextImpl);
    this.defaultFor(() => this.getValue, () => this.defaultGetValueImpl);
    this.defaultFor(() => this.defaultText, () => '--- select ---');
  }
  
  defaultGetTextImpl(item) {
    return item;
  }
  
  defaultGetValueImpl(item) {
    return item;
  }
  
  invokeGetText(item) {
    if(this.createdBy === fieldCreator.standard && this.getText !== this.defaultGetTextImpl) {
      return this.getText({
        $item: item
      });
    }
    
    return this.getText(item);
  }
  
  invokeGetValue(item) {
    if(this.createdBy === fieldCreator.standard && this.getValue !== this.defaultGetValueImpl) {
      return this.getValue({
        $item: item
      });
    }
    
    return this.getValue(item);
  }
  
  createInternalValue() {
    return this.value;
  }
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
  getText?: (item)=>string;
  
  /**
   * Function called to get the value of selected item.
   * Default: (item) => item
   */
  getValue?: (item)=>any;
  
	/**
	 * An array of items to be listed.
	 */
	items?: any[];
}