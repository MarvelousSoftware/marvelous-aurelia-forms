import {ValidationExecutor, IValidatorDictionary, validators, IValidatorContext, IValidator, 
  InstantValidationResultsPusher, OnSignalValidationResultsPusher, ValidatorsArray} from './validation';
import {Field} from './fields.base';

describe('', () => {
  
  let fields: { foo: (validators: IValidatorDictionary) => Field };
  let changeHandler: Function;
  let emitChange = () => {
    changeHandler();
  }
  
  let sampleValidator: {
    name: string,
    isValid: Sinon.SinonStub,
    getError: Sinon.SinonStub
  };
  
  beforeEach(() => {
    validators.splice(0);
    sampleValidator = {
      name: 'sample',
      isValid: sinon.stub(),
      getError: sinon.stub()
    };
    validators.push(sampleValidator);
    validators.push({
      name: 'sample2',
      isValid: sinon.stub(),
      getError: sinon.stub()
    });
    
    changeHandler = undefined;
    fields = {
      foo: (validators: IValidatorDictionary) => {
        return <any> {
          errors: [],
          listenOnChange: (handler: Function) => {
            if(changeHandler) {
              throw new Error('Opps. Multiple registrations, but mock allows only a single one.');
            }
            changeHandler = handler;
          },
          validators
        }        
      }
    };
    
    sampleValidator.isValid = sinon.stub().returns(true);
    sampleValidator.getError = sinon.stub().returns('Invalid value.');
  });
  
  describe('ValidationExecutor', () => {
    
    describe('execute method', () => {
      
      it('should be able to invoke existing validator', (done) => {
        let field = fields.foo({
          sample: true
        });
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(x => {
          expect(x.length).toBe(1);
          expect(x[0].isValid).toBe(true);
          expect(x[0].field).toBe(field);
          expect(x[0].validator).toBe(sampleValidator);
          expect(x[0].definition).toBe(true);
          expect(sampleValidator.getError.notCalled).toBe(true);
          expect(sampleValidator.isValid.calledOnce).toBe(true);
          done();
        });
      });
      
      it('should be able to invoke existing validator with additional configuration and valid context', (done) => {
        let definition = {
          min: 10,
          max: 100
        };
        let field = fields.foo({
          sample: definition
        });
        field.value = 'John Doe';
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(x => {
          expect(x[0].definition).toBe(definition);
          expect(sampleValidator.isValid.calledOnce).toBe(true);
          
          let context: IValidatorContext = sampleValidator.isValid.firstCall.args[0];
          expect(context.validator).toBe(definition);
          expect(context.field).toBe(field);
          expect(context.value).toBe(field.value);
          done();
        });
      });
      
      it('should capture errors when occurred', (done) => {
        let error = 'Something went wrong.';
        sampleValidator.isValid.returns(false);
        sampleValidator.getError.returns(error);
        let field = fields.foo({ sample: true });
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(x => {
          expect(x[0].isValid).toBe(false);
          expect(x[0].error).toBe(error);
          expect(sampleValidator.isValid.calledOnce).toBe(true);
          expect(sampleValidator.getError.calledOnce).toBe(true);
          done();
        });
      });
      
      it('should create valid context for getError method', (done) => {
        let error = 'Something went wrong.';
        sampleValidator.isValid.returns(false);
        sampleValidator.getError.returns(error);
        let definition = { min: 10 };
        let field = fields.foo({ sample: definition });
        field.value = 'John';
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(x => {
          expect(sampleValidator.getError.calledOnce).toBe(true);
          let context: IValidatorContext = sampleValidator.getError.firstCall.args[0];
          expect(context.field).toBe(field);
          expect(context.validator).toBe(definition);
          expect(context.value).toBe(field.value);
          done();
        });
      });
      
      it('should handle promises from isValid and getError methods', (done) => {
        let error = 'Something went wrong.';        
        sampleValidator.isValid.returns(new Promise((resolve) => { resolve(false); }));
        sampleValidator.getError.returns(new Promise((resolve) => { resolve(error); }));
        let field = fields.foo({ sample: true });
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(x => {
          expect(x[0].isValid).toBe(false);
          expect(x[0].error).toBe(error);
          expect(sampleValidator.isValid.calledOnce).toBe(true);
          expect(sampleValidator.getError.calledOnce).toBe(true);
          done();
        });
      });
      
      it('should handle inline validators', (done) => {
        let error = 'Something went wrong.';
        let customInline = {
          isValid: sinon.stub().returns(false),
          getError: sinon.stub().returns(error)
        };
        let field = fields.foo({ customInline });
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(x => {
          expect(x[0].isValid).toBe(false);
          expect(x[0].error).toBe(error);
          expect(customInline.isValid.calledOnce).toBe(true);
          expect(customInline.getError.calledOnce).toBe(true);
          done();
        });
      });
      
      it('should handle multiple validators', (done) => {
        let error = 'Something went wrong.';
        let customInline = {
          isValid: sinon.stub().returns(false),
          getError: sinon.stub().returns(error)
        };
        let field = fields.foo({
          customInline,
          sample: true
        });
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(results => {
          expect(results.length).toBe(2);
          
          let customResult = results.filter(x => x.validator.name === 'customInline')[0];
          expect(customResult.isValid).toBe(false);
          expect(customResult.error).toBe(error);
          expect(customInline.isValid.calledOnce).toBe(true);
          expect(customInline.getError.calledOnce).toBe(true);
          
          let sampleResult = results.filter(x => x.validator.name === 'sample')[0];
          expect(sampleResult.isValid).toBe(true);
          expect(sampleResult.error).toBeFalsy();
          expect(sampleValidator.isValid.calledOnce).toBe(true);
          expect(sampleValidator.getError.called).toBe(false);
          
          done();
        });
      });

      it('should be able to validate empty value on demand', (done) => {
        let error = 'Invalid.';
        let custom = {
          isValid: sinon.stub().returns(false),
          getError: sinon.stub().returns(error),
          shouldValidateEmpty: true
        };
        let field = fields.foo({
          custom
        });
        field.isEmpty = true;
        
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(results => {          
          let result = results.filter(x => x.validator.name === 'custom')[0];
          expect(result.isValid).toBe(false);
          expect(result.error).toBe(error);
          expect(custom.isValid.calledOnce).toBe(true);
          expect(custom.getError.calledOnce).toBe(true);
          
          done();
        });
      });

      it('should be able skip validator if field is empty and validator does not handle empty values', (done) => {
        let custom = {
          isValid: sinon.stub().returns(false),
          getError: sinon.stub().returns('Invalid.')
        };
        let field = fields.foo({ custom });
        field.isEmpty = true;
        
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(results => {
          expect(results.length).toBe(0);          
          expect(custom.isValid.calledOnce).toBe(false);
          expect(custom.getError.calledOnce).toBe(false);
          
          done();
        });
      });
      
      it('should skip valudators defined as `validatorName: false`', (done) => {
        let field = fields.foo({ sample: false });
        
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(results => {
          expect(results.length).toBe(0);          
          expect(sampleValidator.isValid.calledOnce).toBe(false);
          expect(sampleValidator.getError.calledOnce).toBe(false);
          
          done();
        });
      });
      
      it('should allow to override default `isValid` method implementation', (done) => {
        let isValid = sinon.stub().returns(false);
        let field = fields.foo({ 
          sample: { isValid } 
        });
        
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(results => {
          expect(isValid.calledOnce).toBe(true);
          expect(sampleValidator.getError.calledOnce).toBe(true);
          done();
        });
      });
         
      it('should allow to override default `getError` method implementation', (done) => {
        let error = 'Invalid.';
        let getError = sinon.stub().returns(error);
        sampleValidator.isValid.returns(false);
        let field = fields.foo({ 
          sample: { getError } 
        });
        
        let executor = new ValidationExecutor(field);
        
        executor.execute().then(results => {
          expect(getError.calledOnce).toBe(true);
          expect(results[0].error).toBe(error);
          done();
        });
      });
      
      it('should call result pusher with proper parameters', (done) => {
        let field = fields.foo({
          sample: true
        });
        let executor = new ValidationExecutor(field);
        let push = sinon.stub();
        
        executor.execute({ push }).then(results => {
          expect(push.calledOnce).toBe(true);
          let field = push.firstCall.args[0];
          let validationResults = push.firstCall.args[1];
          expect(field).toBe(field);
          expect(validationResults).toBe(results);
          done();
        });
      });            
    });
    
    describe('getDebounceTime method', () => {
      
      it('should get greatest time from validators', () => {
        let field = fields.foo({
          sample: { debounce: 1000 },
          sample2: { debounce: 8000 },
          custom: { debounce: 5000, getError: ()=>'', isValid: () => true },
        });
        let executor = new ValidationExecutor(field);
        
        let time = executor.getDebounceTime();
        
        expect(time).toBe(8000);
      });
      
      it('should get greatest time from validators even when this value comes from global validator', () => {
        (<any>sampleValidator).debounce = 10000;
        let field = fields.foo({
          sample: { },
          sample2: { debounce: 8000 },
          custom: { debounce: 5000, getError: ()=>'', isValid: () => true },
        });
        let executor = new ValidationExecutor(field);
        
        let time = executor.getDebounceTime();
        
        expect(time).toBe(10000);
      });
      
    });
    
    it('should listen on changes and execute if validated at least once', (done) => {
      let field = fields.foo({});
      let executor = new ValidationExecutor(field);
      
      executor.execute().then(() => {
        let exec = sinon.spy();
        executor.execute = exec;
        
        emitChange();
        
        expect(exec.calledOnce).toBe(true);
        done();
      });
    });
    
    it('should listen on changes and do nothing if not validated at least once', () => {
      let field = fields.foo({});
      let executor = new ValidationExecutor(field);
      let exec = sinon.spy();
      executor.execute = exec;
      
      emitChange();
      
      expect(exec.calledOnce).toBe(false);
    });
    
    it('should throw if validator is not defined', () => {
      let field = fields.foo({
        undefinedValidator: true
      });
      
      let action = () => new ValidationExecutor(field); 
      expect(action).toThrowError(`Validator 'undefinedValidator' is not defined.`);
    });
    
  });
  
  describe('InstantValidationResultsPusher', () => {
    
    it('should clear existing errors and push results instantly', () => {
      let pusher = new InstantValidationResultsPusher();
      let field = fields.foo({});
      field.errors = ['1', '2', '3'];
      
      pusher.push(field, [<any>{
        isValid: true
      }, <any>{
        isValid: false,
        error: 'foo'
      }, <any>{
        isValid: false,
        error: 'bar'
      }]);
      
      expect(field.errors).toEqual(['foo', 'bar']);
    });
    
  });
  
  describe('OnSignalValidationResultsPusher', () => {
    
    it('should wait for signal to push', () => {
      let pusher = new OnSignalValidationResultsPusher();
      let field = fields.foo({});
      field.errors = ['1', '2', '3'];
      let field2 = fields.foo({});
      field2.errors = ['4', '5'];
      
      pusher.push(field, [<any>{
        isValid: true
      }, <any>{
        isValid: false,
        error: 'foo'
      }, <any>{
        isValid: false,
        error: 'bar'
      }]);
      
      pusher.push(field2, [<any>{
        isValid: false,
        error: 'foobar'
      }, <any>{
        isValid: false,
        error: 'barfoo'
      }]);
      
      expect(field.errors).toEqual(['1', '2', '3']);
      expect(field2.errors).toEqual(['4', '5']);
      
      pusher.signal();
      
      expect(field.errors).toEqual(['foo', 'bar']);
      expect(field2.errors).toEqual(['foobar', 'barfoo']);
    });
    
    it('should apply only last errors', () => {
      let pusher = new OnSignalValidationResultsPusher();
      let field = fields.foo({});
      field.errors = ['1', '2', '3'];
      
      pusher.push(field, [<any>{
        isValid: true
      }, <any>{
        isValid: false,
        error: 'foo'
      }, <any>{
        isValid: false,
        error: 'bar'
      }]);
      
      pusher.push(field, [<any>{
        isValid: false,
        error: 'foobar'
      }, <any>{
        isValid: false,
        error: 'barfoo'
      }]);
      
      expect(field.errors).toEqual(['1', '2', '3']);
      pusher.signal();
      expect(field.errors).toEqual(['foobar', 'barfoo']);
    });
    
  });
  
  describe('ValidatorsArray', () => {
    
    describe('push method', () => {
      
      it('should add new validator', () => {
        let validators = new ValidatorsArray();
        validators.push(sampleValidator);
        expect(validators.indexOf(sampleValidator)).toBeGreaterThan(-1);
      });
      
      it('should validate properties', () => {
        let validators = new ValidatorsArray();
        let validate = sinon.stub();
        let original = ValidatorsArray.validateValidatorProperties;
        ValidatorsArray.validateValidatorProperties = validate;
        
        validators.push(sampleValidator);
        
        expect(validate.calledOnce).toBe(true);
        ValidatorsArray.validateValidatorProperties = original;
      });
      
      it('should throw if already defined', () => {
        let validators = new ValidatorsArray();
        validators.push(sampleValidator)
        
        let action = () => validators.push(sampleValidator);
        
        expect(action).toThrowError(`Validator '${sampleValidator.name}' is already defined.`);
      });
      
    });
    
    describe('override method', () => {
      
      it('should override already existing validators', () => {
        let validators = new ValidatorsArray();
        validators.push(sampleValidator);
        let newValidator: IValidator = {
          name: sampleValidator.name,
          isValid: () => true,
          getError: () => ''
        };
        
        validators.override(newValidator);
        
        expect(validators.find(x => x.name === newValidator.name)).toBe(newValidator);
      });
      
      it('should validate properties', () => {
        let validators = new ValidatorsArray();
        validators.push(sampleValidator);        
        let validate = sinon.stub();
        let original = ValidatorsArray.validateValidatorProperties;
        ValidatorsArray.validateValidatorProperties = validate;
        
        validators.override(sampleValidator);
        
        expect(validate.calledOnce).toBe(true);
        ValidatorsArray.validateValidatorProperties = original;
      });
      
      it('should throw if validator does not exist', () => {
        let validators = new ValidatorsArray();
        
        let action = () => validators.override({name: 'undefinedValidator', getError: () => '', isValid: () => true});
        
        expect(action).toThrowError(`Validator 'undefinedValidator' doesn't exist.`);
      });
      
    });
    
    describe('get and has methods', () => {
      
      it('should return validator if exists', () => {
        let validators = new ValidatorsArray();
        validators.push(sampleValidator);
        
        expect(validators.get(sampleValidator.name)).toBe(sampleValidator);
        expect(validators.has(sampleValidator.name)).toBe(true);
      });
      
      it('should return undefined if not exists', () => {
        let validators = new ValidatorsArray();
        
        expect(validators.get('undefinedValidator')).toBe(undefined);
        expect(validators.has('undefinedValidator')).toBe(false);
      });
      
    });
    
    describe('validateValidatorProperties', () => {
      
      it('should throw if any property is missing', () => {
        let action = () => ValidatorsArray.validateValidatorProperties(<any>{
          name: 'bar',
          isValid: () => {}
        });
        let action2 = () => ValidatorsArray.validateValidatorProperties(<any>{
          name: 'bar',
          getError: () => {}
        });
        let action3 = () => ValidatorsArray.validateValidatorProperties(<any>{
          isValid: () => {},
          getError: () => {}
        });
        
        expect(action).toThrowError(`Validator 'bar' has missing properties or methods.`);
        expect(action2).toThrowError(`Validator 'bar' has missing properties or methods.`);
        expect(action3).toThrowError(`Validator 'undefined' has missing properties or methods.`);
      });
      
    })
    
  });
  
});