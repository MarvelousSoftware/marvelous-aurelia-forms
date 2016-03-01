import {registerDefaultValidators} from './forms/validation.default';
import {formsConfig} from './forms/config';

// default exports
export {formsConfig} from './forms/config';
export * from './forms/fields';
export * from './forms/fields.base';
export * from './forms/schema';
export * from './forms/validation';

export function configure(aurelia, configFunc) {
  registerDefaultValidators();
  
  if(typeof configFunc === "function") {
    configFunc(formsConfig);    
  }
  
  if(formsConfig.globalizeResources) {
    aurelia.globalResources('./forms/fields');
    aurelia.globalResources('./forms/schema.viewModels');
  }
}