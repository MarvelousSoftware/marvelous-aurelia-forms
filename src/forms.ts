import {registerDefaultValidators} from './forms/validation.default';
import {globalConfig, createConfiguration} from './forms/config';

// default exports
export {FormsConfig} from './forms/config';
export * from './forms/fields';
export * from './forms/fields.base';
export * from './forms/schema';
export * from './forms/validation';

export function configure(aurelia, configFunc) {
  registerDefaultValidators();
  
  if(typeof configFunc === "function") {
    configFunc(globalConfig);
  }
  
  if(globalConfig.globalizeResources) {
    aurelia.globalResources('./forms/fields');
    aurelia.globalResources('./forms/schema.viewModels');
  }
}