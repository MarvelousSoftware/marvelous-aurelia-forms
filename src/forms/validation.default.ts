import {validators} from './validation';

// TODO: translations support
// TODO: default translations to formsConfig
// TODO: range validator (min/max)
// TODO: `when` to all validators

export function registerDefaultValidators() {		
		validators.push({
			name: 'required',
			shouldValidateEmpty: true,
			isValid: context => {
        if(context.validator.hasOwnProperty('exact')) {
          return context.value === context.validator['exact'];
        }
        
				if(context.field.isEmpty) {
					return false;
				}
				return true;
			},
			getError: function() {
				return 'Field is required.';
			}
		});
		
		validators.push({
			name: 'number',
			isValid: context => isNaN(context.value) === false,
			getError: () => 'Value needs to be a number.'
		});
		
		validators.push({
			name: 'decimal',
			isValid: context => {
				let regex = /^[0-9]+[.]?[0-9]*$/;
				return regex.test(context.field.value);
			},
			getError: () => 'Value needs to be a number.'
		});
		
		validators.push({
			name: 'integer',
			isValid: context => {
				let regex = /^\d+$/i
				return regex.test(context.field.value);
			},	
			getError: () => 'Value needs to be a number.'
		});
		
		validators.push({
			name: 'email',
			isValid: context => {
				// RFC 5322 Official Standard
				// source: http://emailregex.com/
				let regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
				return regex.test(context.field.value);
			},
			getError: () => 'Value is not an email.'
		});
		
		validators.push({
			name: 'url',
			isValid: context => {
				// inspired by: http://code.tutsplus.com/tutorials/8-regular-expressions-you-should-know--net-6149
				var regex = /^((https?:)?\/\/)?([\da-z\.-]+)\.([a-z\.]{2,})([\/\w \.-]*)*\/?$/
				return regex.test(context.field.value);
			},
			getError: () => 'Value is not an url.'
		});
		
		validators.push({
			name: 'phone',
			isValid: context => {
				// source: http://stackoverflow.com/a/33561517
				let regex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
				return regex.test(context.field.value);
			},
			getError: () => 'Value is not a phone number.'
		});
		
		validators.push({
			name: 'pattern',
			isValid: context => {
				return context.validator['value'].test(context.field.value);
			},
			getError: () => 'Value does not match required pattern.'
		});
		
		validators.push({
			name: 'length',
			isValid: context => {
				if(context.value !== undefined && context.value !== null && typeof context.value !== "string") {
					throw new Error(`Length validator works only with string values, but '${typeof context.value}' has been provided.`);
				}
				
				let min = context.validator['min'];
				let max = context.validator['max'];
				
				if(min === undefined && max === undefined) {
					throw new Error(`Length validator requires defined at least either 'min' or 'max' property.`);
				}
				
				if(min !== undefined && context.value.length < context.validator['min']) {
					return false;
				}
				if(max !== undefined && context.value.length > context.validator['max']) {
					return false;
				}
				return true;
			},
			getError: context => {
				if(context.value.length < context.validator['min']) {
          return `Minimum length: ${context.validator['min']}`;
				}
				if(context.value.length > context.validator['max']) {
          return `Maximum length: ${context.validator['max']}`;
				}
			}
		});
}