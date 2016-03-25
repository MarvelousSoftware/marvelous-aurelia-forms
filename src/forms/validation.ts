import {Debouncer, Utils as _} from 'marvelous-aurelia-core/utils';
import {Field} from './fields.base';

export class ValidationExecutor {
  /**
   * True if field has been validated at least once.
   */
  private _validated = false;
  
  constructor(private _field: Field) {
    let changeDebouncer = new Debouncer(this.getDebounceTime());
    
    _field.listenOnChange(() => {
      if(!!this._validated === false) return;
      changeDebouncer.do(() => { this.execute(); });
    });
  }
  
  /**
   * Gets greatest debounce time using values from field's validators.
   */
  getDebounceTime() {
    let debounce = 0;
    
    this._forEachValidator(validator => {	
      if(validator.debounce === undefined) {
        return;
      }
      if(validator.debounce > debounce) {
        debounce = validator.debounce;
      }
    });
    
    return debounce;
  }
  
  execute(resultsPusher: IValidationResultsPusher = new InstantValidationResultsPusher()) {
    let promises: Promise<IValidationResult>[] = [];
    
    this._forEachValidator((validator, validatorDefinition) => {
			if(!!validator.shouldValidateEmpty === false && this._field.isEmpty) {
				// if field is empty and validator shouldn't run on empty values
				return true;
			}
			
			promises.push(this._validate(validator, {
				field: this._field,
				validator: validatorDefinition,
				value: this._field.value
			}));
      
      return true;
    });
    
    let all = Promise.all(promises);
		all.then(validations => {
      this._validated = true;
      resultsPusher.push(this._field, validations);
    });
		
		return all;
  }
  
  private _validate(validator: IValidator, context: IValidatorContext): Promise<IValidationResult> {
    let isValid = validator.isValid(context);
    if(isValid === undefined) {
      throw new Error(`isValid method of '${validator.name}' validator should return a Promise<boolean> or boolean. It returned undefined instead.`);
    }
    		
		return _.when(isValid).then(valid => {
			if(!valid) {
        let error = validator.getError(context);
        if(error === undefined) {
          throw new Error(`getError method of '${validator.name}' validator should return a Promise<string> or string. It returned undefined instead.`);
        }
        
				return _.when(error).then(error => {
					return <IValidationResult> {
						definition: context.validator,
						validator: validator,
						field: context.field,
						isValid: false,
						error: error
					};
				}, () => { throw new Error(`Rejected promise in 'getError' validator's method ('${validator.name}').`); })
			}
			
			return {
				definition: context.validator,
				validator: validator,
				field: context.field,
				isValid: true
			};
		}, () => { throw new Error(`Rejected promise in 'isValid' validator's method ('${validator.name}').`); });
	}
  
  private _forEachValidator(action: (validator: IValidator, validatorDefinition: ValidatorDefinition)=>boolean|void) {
    _.forOwn(this._field.validators, (validatorDefinition: ValidatorDefinition, validatorName: string) => {
      if(validatorDefinition === false) {
				// validators: { required: false }
				// validator disabled, just moves on	
				return true;
			}
			
			let validator = this._getValidator(validatorName, validatorDefinition);
      return action(validator, validatorDefinition);
    });
  }
  
  private _getValidator(name: string, definition: ValidatorDefinition): IValidator {
    if(definition === true) {
      // validators: { required: true }
      let validator = validators.get(name);
      if(!validator) {
        throw new Error(`Validator '${name}' is not defined.`);
      }
      
      return validator;
    }
    
    if(!validators.has(name)) {
      // if ValidatorsArray doesn't contain validator with given name then it
      // is a custom validator, e.g.
      // validators: { custom: { /* ...custom validation properties and methods */ } }
      // therefore it needs to contain all required fields and properties
      let validator = <any>Object.assign({ name }, definition);
      ValidatorsArray.validateValidatorProperties(validator);
      return validator;
    }
    
    // existing validator with extra configuration, e.g.
    // validators: { required: { /* ... */ } }			
    
    return Object.assign(validators.get(name), definition);    
  }
}

export class ValidatorsArray extends Array<IValidator> {			
	push(...validators: IValidator[]): number {
		validators.forEach(validator => {
			ValidatorsArray.validateValidatorProperties(validator);
			
			if(this.get(validator.name)) {
				throw new Error(`Validator '${validator.name}' is already defined.`);
			}
			
			super.push(validator);
		});
		
		return validators.length;
	}
	
  override(validator: IValidator) {
    ValidatorsArray.validateValidatorProperties(validator);
    let index = this.findIndex(x => x.name === validator.name);
    if(index === -1) {
      throw new Error(`Validator '${validator.name}' doesn't exist.`);
    }
    
    this.splice(index, 1, validator);
  }
  
	get(name: string) {
		return this.find(x => x.name === name);
	}
	
	has(name: string): boolean {
		return !!this.get(name);
	}
	
	static validateValidatorProperties(validator: IValidator) {
		if(!validator.name || !validator.getError || !validator.isValid) {
			throw new Error(`Validator '${validator.name}' has missing properties or methods.`);
		}
	}
}

export interface IValidationResultsPusher {
  push(field: Field, results: IValidationResult[]);
}

/**
 * Instantly pushes errors to the field.
 */
export class InstantValidationResultsPusher implements IValidationResultsPusher {  
  push(field: Field, results: IValidationResult[]) {
    field.errors.splice(0);
    results.filter(x => x.isValid === false).forEach(x => field.errors.push(x.error));
  }
}

/**
 * Allows to wait with pushing errors to the field till the signal.
 */
export class OnSignalValidationResultsPusher implements IValidationResultsPusher {
  private _readyForSignalSlots: Map<Field, string[]> = new Map<Field, string[]>();
    
  push(field: Field, results: IValidationResult[]) {
    let slot = [];
    this._readyForSignalSlots.set(field, slot);
    
    results.filter(x => x.isValid === false).forEach(x => slot.push(x.error));
  }
  
  signal() {
    this._readyForSignalSlots.forEach((slot, field) => {
      field.errors.splice(0);
      slot.forEach(error => field.errors.push(error));      
    });
  }
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
export declare type ValidatorDefinition = IValidator | boolean  | {[key:string]: any};

/**
 * An instance of validators array. Should be used to define globally available validators.
 */
export let validators = new ValidatorsArray();

export interface IValidatorDictionary {
	[key:string]: ValidatorDefinition
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
	validator: IValidator,
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