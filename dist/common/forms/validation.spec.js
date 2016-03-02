System.register(['./validation'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var validation_1;
    return {
        setters:[
            function (validation_1_1) {
                validation_1 = validation_1_1;
            }],
        execute: function() {
            describe('', function () {
                var fields;
                var changeHandler;
                var emitChange = function () {
                    changeHandler();
                };
                var sampleValidator;
                beforeEach(function () {
                    validation_1.validators.splice(0);
                    sampleValidator = {
                        name: 'sample',
                        isValid: sinon.stub(),
                        getError: sinon.stub()
                    };
                    validation_1.validators.push(sampleValidator);
                    validation_1.validators.push({
                        name: 'sample2',
                        isValid: sinon.stub(),
                        getError: sinon.stub()
                    });
                    changeHandler = undefined;
                    fields = {
                        foo: function (validators) {
                            return {
                                errors: [],
                                listenOnChange: function (handler) {
                                    if (changeHandler) {
                                        throw new Error('Opps. Multiple registrations, but mock allows only a single one.');
                                    }
                                    changeHandler = handler;
                                },
                                validators: validators
                            };
                        }
                    };
                    sampleValidator.isValid = sinon.stub().returns(true);
                    sampleValidator.getError = sinon.stub().returns('Invalid value.');
                });
                describe('ValidationExecutor', function () {
                    describe('execute method', function () {
                        it('should be able to invoke existing validator', function (done) {
                            var field = fields.foo({
                                sample: true
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (x) {
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
                        it('should be able to invoke existing validator with additional configuration and valid context', function (done) {
                            var definition = {
                                min: 10,
                                max: 100
                            };
                            var field = fields.foo({
                                sample: definition
                            });
                            field.value = 'John Doe';
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (x) {
                                expect(x[0].definition).toBe(definition);
                                expect(sampleValidator.isValid.calledOnce).toBe(true);
                                var context = sampleValidator.isValid.firstCall.args[0];
                                expect(context.validator).toBe(definition);
                                expect(context.field).toBe(field);
                                expect(context.value).toBe(field.value);
                                done();
                            });
                        });
                        it('should capture errors when occurred', function (done) {
                            var error = 'Something went wrong.';
                            sampleValidator.isValid.returns(false);
                            sampleValidator.getError.returns(error);
                            var field = fields.foo({ sample: true });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (x) {
                                expect(x[0].isValid).toBe(false);
                                expect(x[0].error).toBe(error);
                                expect(sampleValidator.isValid.calledOnce).toBe(true);
                                expect(sampleValidator.getError.calledOnce).toBe(true);
                                done();
                            });
                        });
                        it('should create valid context for getError method', function (done) {
                            var error = 'Something went wrong.';
                            sampleValidator.isValid.returns(false);
                            sampleValidator.getError.returns(error);
                            var definition = { min: 10 };
                            var field = fields.foo({ sample: definition });
                            field.value = 'John';
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (x) {
                                expect(sampleValidator.getError.calledOnce).toBe(true);
                                var context = sampleValidator.getError.firstCall.args[0];
                                expect(context.field).toBe(field);
                                expect(context.validator).toBe(definition);
                                expect(context.value).toBe(field.value);
                                done();
                            });
                        });
                        it('should handle promises from isValid and getError methods', function (done) {
                            var error = 'Something went wrong.';
                            sampleValidator.isValid.returns(new Promise(function (resolve) { resolve(false); }));
                            sampleValidator.getError.returns(new Promise(function (resolve) { resolve(error); }));
                            var field = fields.foo({ sample: true });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (x) {
                                expect(x[0].isValid).toBe(false);
                                expect(x[0].error).toBe(error);
                                expect(sampleValidator.isValid.calledOnce).toBe(true);
                                expect(sampleValidator.getError.calledOnce).toBe(true);
                                done();
                            });
                        });
                        it('should handle inline validators', function (done) {
                            var error = 'Something went wrong.';
                            var customInline = {
                                isValid: sinon.stub().returns(false),
                                getError: sinon.stub().returns(error)
                            };
                            var field = fields.foo({ customInline: customInline });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (x) {
                                expect(x[0].isValid).toBe(false);
                                expect(x[0].error).toBe(error);
                                expect(customInline.isValid.calledOnce).toBe(true);
                                expect(customInline.getError.calledOnce).toBe(true);
                                done();
                            });
                        });
                        it('should handle multiple validators', function (done) {
                            var error = 'Something went wrong.';
                            var customInline = {
                                isValid: sinon.stub().returns(false),
                                getError: sinon.stub().returns(error)
                            };
                            var field = fields.foo({
                                customInline: customInline,
                                sample: true
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (results) {
                                expect(results.length).toBe(2);
                                var customResult = results.filter(function (x) { return x.validator.name === 'customInline'; })[0];
                                expect(customResult.isValid).toBe(false);
                                expect(customResult.error).toBe(error);
                                expect(customInline.isValid.calledOnce).toBe(true);
                                expect(customInline.getError.calledOnce).toBe(true);
                                var sampleResult = results.filter(function (x) { return x.validator.name === 'sample'; })[0];
                                expect(sampleResult.isValid).toBe(true);
                                expect(sampleResult.error).toBeFalsy();
                                expect(sampleValidator.isValid.calledOnce).toBe(true);
                                expect(sampleValidator.getError.called).toBe(false);
                                done();
                            });
                        });
                        it('should be able to validate empty value on demand', function (done) {
                            var error = 'Invalid.';
                            var custom = {
                                isValid: sinon.stub().returns(false),
                                getError: sinon.stub().returns(error),
                                shouldValidateEmpty: true
                            };
                            var field = fields.foo({
                                custom: custom
                            });
                            field.isEmpty = true;
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (results) {
                                var result = results.filter(function (x) { return x.validator.name === 'custom'; })[0];
                                expect(result.isValid).toBe(false);
                                expect(result.error).toBe(error);
                                expect(custom.isValid.calledOnce).toBe(true);
                                expect(custom.getError.calledOnce).toBe(true);
                                done();
                            });
                        });
                        it('should be able skip validator if field is empty and validator does not handle empty values', function (done) {
                            var custom = {
                                isValid: sinon.stub().returns(false),
                                getError: sinon.stub().returns('Invalid.')
                            };
                            var field = fields.foo({ custom: custom });
                            field.isEmpty = true;
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (results) {
                                expect(results.length).toBe(0);
                                expect(custom.isValid.calledOnce).toBe(false);
                                expect(custom.getError.calledOnce).toBe(false);
                                done();
                            });
                        });
                        it('should skip valudators defined as `validatorName: false`', function (done) {
                            var field = fields.foo({ sample: false });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (results) {
                                expect(results.length).toBe(0);
                                expect(sampleValidator.isValid.calledOnce).toBe(false);
                                expect(sampleValidator.getError.calledOnce).toBe(false);
                                done();
                            });
                        });
                        it('should allow to override default `isValid` method implementation', function (done) {
                            var isValid = sinon.stub().returns(false);
                            var field = fields.foo({
                                sample: { isValid: isValid }
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (results) {
                                expect(isValid.calledOnce).toBe(true);
                                expect(sampleValidator.getError.calledOnce).toBe(true);
                                done();
                            });
                        });
                        it('should allow to override default `getError` method implementation', function (done) {
                            var error = 'Invalid.';
                            var getError = sinon.stub().returns(error);
                            sampleValidator.isValid.returns(false);
                            var field = fields.foo({
                                sample: { getError: getError }
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            executor.execute().then(function (results) {
                                expect(getError.calledOnce).toBe(true);
                                expect(results[0].error).toBe(error);
                                done();
                            });
                        });
                        it('should call result pusher with proper parameters', function (done) {
                            var field = fields.foo({
                                sample: true
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            var push = sinon.stub();
                            executor.execute({ push: push }).then(function (results) {
                                expect(push.calledOnce).toBe(true);
                                var field = push.firstCall.args[0];
                                var validationResults = push.firstCall.args[1];
                                expect(field).toBe(field);
                                expect(validationResults).toBe(results);
                                done();
                            });
                        });
                    });
                    describe('getDebounceTime method', function () {
                        it('should get greatest time from validators', function () {
                            var field = fields.foo({
                                sample: { debounce: 1000 },
                                sample2: { debounce: 8000 },
                                custom: { debounce: 5000, getError: function () { return ''; }, isValid: function () { return true; } },
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            var time = executor.getDebounceTime();
                            expect(time).toBe(8000);
                        });
                        it('should get greatest time from validators even when this value comes from global validator', function () {
                            sampleValidator.debounce = 10000;
                            var field = fields.foo({
                                sample: {},
                                sample2: { debounce: 8000 },
                                custom: { debounce: 5000, getError: function () { return ''; }, isValid: function () { return true; } },
                            });
                            var executor = new validation_1.ValidationExecutor(field);
                            var time = executor.getDebounceTime();
                            expect(time).toBe(10000);
                        });
                    });
                    it('should listen on changes and execute if validated at least once', function (done) {
                        var field = fields.foo({});
                        var executor = new validation_1.ValidationExecutor(field);
                        executor.execute().then(function () {
                            var exec = sinon.spy();
                            executor.execute = exec;
                            emitChange();
                            expect(exec.calledOnce).toBe(true);
                            done();
                        });
                    });
                    it('should listen on changes and do nothing if not validated at least once', function () {
                        var field = fields.foo({});
                        var executor = new validation_1.ValidationExecutor(field);
                        var exec = sinon.spy();
                        executor.execute = exec;
                        emitChange();
                        expect(exec.calledOnce).toBe(false);
                    });
                    it('should throw if validator is not defined', function () {
                        var field = fields.foo({
                            undefinedValidator: true
                        });
                        var action = function () { return new validation_1.ValidationExecutor(field); };
                        expect(action).toThrowError("Validator 'undefinedValidator' is not defined.");
                    });
                });
                describe('InstantValidationResultsPusher', function () {
                    it('should clear existing errors and push results instantly', function () {
                        var pusher = new validation_1.InstantValidationResultsPusher();
                        var field = fields.foo({});
                        field.errors = ['1', '2', '3'];
                        pusher.push(field, [{
                                isValid: true
                            }, {
                                isValid: false,
                                error: 'foo'
                            }, {
                                isValid: false,
                                error: 'bar'
                            }]);
                        expect(field.errors).toEqual(['foo', 'bar']);
                    });
                });
                describe('OnSignalValidationResultsPusher', function () {
                    it('should wait for signal to push', function () {
                        var pusher = new validation_1.OnSignalValidationResultsPusher();
                        var field = fields.foo({});
                        field.errors = ['1', '2', '3'];
                        var field2 = fields.foo({});
                        field2.errors = ['4', '5'];
                        pusher.push(field, [{
                                isValid: true
                            }, {
                                isValid: false,
                                error: 'foo'
                            }, {
                                isValid: false,
                                error: 'bar'
                            }]);
                        pusher.push(field2, [{
                                isValid: false,
                                error: 'foobar'
                            }, {
                                isValid: false,
                                error: 'barfoo'
                            }]);
                        expect(field.errors).toEqual(['1', '2', '3']);
                        expect(field2.errors).toEqual(['4', '5']);
                        pusher.signal();
                        expect(field.errors).toEqual(['foo', 'bar']);
                        expect(field2.errors).toEqual(['foobar', 'barfoo']);
                    });
                    it('should apply only last errors', function () {
                        var pusher = new validation_1.OnSignalValidationResultsPusher();
                        var field = fields.foo({});
                        field.errors = ['1', '2', '3'];
                        pusher.push(field, [{
                                isValid: true
                            }, {
                                isValid: false,
                                error: 'foo'
                            }, {
                                isValid: false,
                                error: 'bar'
                            }]);
                        pusher.push(field, [{
                                isValid: false,
                                error: 'foobar'
                            }, {
                                isValid: false,
                                error: 'barfoo'
                            }]);
                        expect(field.errors).toEqual(['1', '2', '3']);
                        pusher.signal();
                        expect(field.errors).toEqual(['foobar', 'barfoo']);
                    });
                });
                describe('ValidatorsArray', function () {
                    describe('push method', function () {
                        it('should add new validator', function () {
                            var validators = new validation_1.ValidatorsArray();
                            validators.push(sampleValidator);
                            expect(validators.indexOf(sampleValidator)).toBeGreaterThan(-1);
                        });
                        it('should validate properties', function () {
                            var validators = new validation_1.ValidatorsArray();
                            var validate = sinon.stub();
                            var original = validation_1.ValidatorsArray.validateValidatorProperties;
                            validation_1.ValidatorsArray.validateValidatorProperties = validate;
                            validators.push(sampleValidator);
                            expect(validate.calledOnce).toBe(true);
                            validation_1.ValidatorsArray.validateValidatorProperties = original;
                        });
                        it('should throw if already defined', function () {
                            var validators = new validation_1.ValidatorsArray();
                            validators.push(sampleValidator);
                            var action = function () { return validators.push(sampleValidator); };
                            expect(action).toThrowError("Validator '" + sampleValidator.name + "' is already defined.");
                        });
                    });
                    describe('override method', function () {
                        it('should override already existing validators', function () {
                            var validators = new validation_1.ValidatorsArray();
                            validators.push(sampleValidator);
                            var newValidator = {
                                name: sampleValidator.name,
                                isValid: function () { return true; },
                                getError: function () { return ''; }
                            };
                            validators.override(newValidator);
                            expect(validators.find(function (x) { return x.name === newValidator.name; })).toBe(newValidator);
                        });
                        it('should validate properties', function () {
                            var validators = new validation_1.ValidatorsArray();
                            validators.push(sampleValidator);
                            var validate = sinon.stub();
                            var original = validation_1.ValidatorsArray.validateValidatorProperties;
                            validation_1.ValidatorsArray.validateValidatorProperties = validate;
                            validators.override(sampleValidator);
                            expect(validate.calledOnce).toBe(true);
                            validation_1.ValidatorsArray.validateValidatorProperties = original;
                        });
                        it('should throw if validator does not exist', function () {
                            var validators = new validation_1.ValidatorsArray();
                            var action = function () { return validators.override({ name: 'undefinedValidator', getError: function () { return ''; }, isValid: function () { return true; } }); };
                            expect(action).toThrowError("Validator 'undefinedValidator' doesn't exist.");
                        });
                    });
                    describe('get and has methods', function () {
                        it('should return validator if exists', function () {
                            var validators = new validation_1.ValidatorsArray();
                            validators.push(sampleValidator);
                            expect(validators.get(sampleValidator.name)).toBe(sampleValidator);
                            expect(validators.has(sampleValidator.name)).toBe(true);
                        });
                        it('should return undefined if not exists', function () {
                            var validators = new validation_1.ValidatorsArray();
                            expect(validators.get('undefinedValidator')).toBe(undefined);
                            expect(validators.has('undefinedValidator')).toBe(false);
                        });
                    });
                    describe('validateValidatorProperties', function () {
                        it('should throw if any property is missing', function () {
                            var action = function () { return validation_1.ValidatorsArray.validateValidatorProperties({
                                name: 'bar',
                                isValid: function () { }
                            }); };
                            var action2 = function () { return validation_1.ValidatorsArray.validateValidatorProperties({
                                name: 'bar',
                                getError: function () { }
                            }); };
                            var action3 = function () { return validation_1.ValidatorsArray.validateValidatorProperties({
                                isValid: function () { },
                                getError: function () { }
                            }); };
                            expect(action).toThrowError("Validator 'bar' has missing properties or methods.");
                            expect(action2).toThrowError("Validator 'bar' has missing properties or methods.");
                            expect(action3).toThrowError("Validator 'undefined' has missing properties or methods.");
                        });
                    });
                });
            });
        }
    }
});
