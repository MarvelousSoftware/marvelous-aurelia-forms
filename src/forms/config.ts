import {Utils} from 'marvelous-aurelia-core/utils';
import {Field} from './fields.base';

export interface FormsConfig {
  [index: string]: any;
  
  /**
   * If true then custom elements related to forms will be available globaly.
   * Default: true.
   */
  globalizeResources?: boolean;
  
  /**
   * Default tab index for all fields. Might be overridden per field basis.
   * Default: 1.
   */
  tabIndex?: number;
  
  fields?: {
    textInput?: {
      templateUrl?: string;
    };
    textArea?: {
      templateUrl?: string;
      rows?: number;
    };
    checkboxInput?: {
      templateUrl?: string;
    };
    numberInput?: {
      templateUrl?: string;
    };
    select?: {
      templateUrl?: string;
    };
  };
  
  validation?: {
    shouldValidateOnBlur?: (field: Field) => boolean
  };
  
  keyCodeMap?: { [index: number]: any; };
};

let defaultConfig: FormsConfig = {
  globalizeResources: true,
  tabIndex: 1,
  fields: {
    textInput: {
      templateUrl: 'marvelous-aurelia-forms/forms/templates/text-input.html'
    },
    textArea: {
      templateUrl: 'marvelous-aurelia-forms/forms/templates/text-area.html',
      rows: 2
    },
    checkboxInput: {
      templateUrl: 'marvelous-aurelia-forms/forms/templates/checkbox-input.html'
    },
    numberInput: {
      templateUrl: 'marvelous-aurelia-forms/forms/templates/number-input.html'
    },
    select: {
      templateUrl: 'marvelous-aurelia-forms/forms/templates/select.html'
    }
  },
  validation: {
    shouldValidateOnBlur: (field: Field) => field.touched && (!field.row || field.row.schema.submitted)  
  },
  keyCodeMap: {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    45: 'insert',
    46: 'delete',
    110: ',',
    188: ',',
    190: '.'
  }
};

export let globalConfig = createConfiguration(defaultConfig, undefined);

export function createConfiguration(values: FormsConfig, parent: FormsConfig): FormsConfig {
  if(values === null || values === undefined) {
    if(parent === null || parent === undefined) {
      throw new Error(`Invalid forms configuration provided: ${values}`);
    } 
    
    return parent;
  }
  
  if(typeof values !== "object") {
    throw new Error(`Invalid forms configuration provided: ${values}`)
  }
  
  return deepCreate(values, parent);
  
  function deepCreate(current: any, parent: any) {
    let result = Object.create(parent || null);
    for (let key in current) {
      if(typeof current[key] === 'object' && parent) {
        result[key] = deepCreate(current[key], parent[key]);
        continue;
      }
      
      result[key] = current[key];
    }
    return result;
  }
}