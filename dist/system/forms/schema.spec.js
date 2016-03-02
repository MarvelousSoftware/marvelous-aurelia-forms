System.register(['marvelous-aurelia-core/pubsub', './schema', './fields', './validation'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var pubsub_1, schema_1, fields_1, validation_1;
    return {
        setters:[
            function (pubsub_1_1) {
                pubsub_1 = pubsub_1_1;
            },
            function (schema_1_1) {
                schema_1 = schema_1_1;
            },
            function (fields_1_1) {
                fields_1 = fields_1_1;
            },
            function (validation_1_1) {
                validation_1 = validation_1_1;
            }],
        execute: function() {
            describe('', function () {
                var rows;
                var fields;
                var sampleRows;
                var pubSub;
                var testForEvent = function (action, eventName, payload) {
                    var schema = new schema_1.Schema();
                    schema.pubSub = pubSub;
                    action(schema);
                    expect(pubSub.publish.calledWithExactly(eventName, payload)).toBe(true);
                };
                beforeEach(function () {
                    pubSub = new pubsub_1.PubSub();
                    sinon.stub(pubSub, 'publish');
                    rows = {
                        foo: new schema_1.Row({
                            name: 'foo',
                            fields: []
                        }),
                        bar: new schema_1.Row({
                            name: 'bar',
                            fields: []
                        })
                    };
                    fields = {
                        foo: new fields_1.TextInput({
                            name: 'foo'
                        }),
                        bar: new fields_1.TextInput({
                            name: 'bar'
                        }),
                        baz: new fields_1.TextInput({
                            name: 'baz'
                        }),
                        fooBar: new fields_1.TextInput({
                            name: 'foobar'
                        })
                    };
                    sampleRows = [
                        new schema_1.Row({
                            name: 'base',
                            fields: [
                                fields.foo,
                                fields.bar
                            ]
                        }),
                        new schema_1.Row({
                            name: 'additional',
                            fields: [
                                fields.baz
                            ]
                        })
                    ];
                });
                describe('Schema', function () {
                    describe('constructor', function () {
                        it('should register fields in default rows', function () {
                            var schema = new schema_1.Schema([fields.bar, fields.foo]);
                            expect(schema.hasRow('default')).toBe(true);
                            expect(schema.rows['default']).toBeTruthy();
                            expect(schema.rows['default'].schema).toBe(schema);
                            expect(schema.defaultRow.fields['bar']).toBe(fields.bar);
                            expect(schema.defaultRow.fields['foo']).toBe(fields.foo);
                        });
                        it('should register rows', function () {
                            var schema = new schema_1.Schema([rows.foo, rows.bar]);
                            expect(schema.hasRow('default')).toBe(false);
                            expect(schema.rows['foo']).toBe(rows.foo);
                            expect(schema.rows['bar']).toBe(rows.bar);
                            expect(schema.rows['foo'].schema).toBe(schema);
                            expect(schema.rows['bar'].schema).toBe(schema);
                        });
                        it('should register default row if empty array is given', function () {
                            var schema = new schema_1.Schema([]);
                            expect(schema.defaultRow).toBeTruthy();
                            expect(schema.hasRow('default')).toBe(true);
                            expect(schema.rows['default']).toBeTruthy();
                            expect(schema.rows['default'].schema).toBe(schema);
                        });
                        it('should not register anything if schema is undefined', function () {
                            var schema = new schema_1.Schema();
                            expect(schema.defaultRow).toBeFalsy();
                            expect(schema.hasRow('default')).toBe(false);
                        });
                        it('should allow to use fields dictionary with default row', function () {
                            var form = {
                                foo: new fields_1.TextInput({}),
                                bar: new fields_1.TextInput({})
                            };
                            var schema = new schema_1.Schema(form);
                            expect(schema.fields['foo']).toBe(form.foo);
                            expect(schema.fields['bar']).toBe(form.bar);
                        });
                        it('should allow to use fields dictionary with explicit defined row', function () {
                            var form = {
                                foo: new fields_1.TextInput({ row: 'first' }),
                                bar: new fields_1.TextInput({ row: 'second' }),
                                baz: new fields_1.TextInput({ row: 'second' })
                            };
                            var schema = new schema_1.Schema(form, ['first', 'second']);
                            expect(schema.rows['first'].fields['foo']).toBe(form.foo);
                            expect(schema.rows['second'].fields['bar']).toBe(form.bar);
                            expect(schema.rows['second'].fields['baz']).toBe(form.baz);
                        });
                        it('should allow to declare rows explicitly', function () {
                            var form = {
                                foo: new fields_1.TextInput({ row: 'first' }),
                                bar: new fields_1.TextInput({ row: 'second' })
                            };
                            var rows = {
                                first: new schema_1.Row({ name: 'first' }),
                                second: new schema_1.Row({ name: 'second' })
                            };
                            var schema = new schema_1.Schema(form, [rows.first, rows.second]);
                            expect(schema.rows['first']).toBe(rows.first);
                            expect(schema.rows['second']).toBe(rows.second);
                            expect(schema.rows['first'].fields['foo']).toBe(form.foo);
                            expect(schema.rows['second'].fields['bar']).toBe(form.bar);
                        });
                        it('should allow to declare columns', function () {
                            var form = {
                                foo: new fields_1.TextInput({})
                            };
                            var schema = new schema_1.Schema(form, 3);
                            expect(schema.defaultRow.columns).toBe(3);
                        });
                        it('should allow to define non-field property in fields dictionary', function () {
                            var form = {
                                foo: new fields_1.TextInput({}),
                                bar: 1
                            };
                            var schema = new schema_1.Schema(form);
                            expect(schema.fields['foo']).toBe(form.foo);
                            expect(Object.keys(schema.fields).length).toBe(1);
                        });
                        it('should throw when row with given name does not exist', function () {
                            var form = {
                                foo: new fields_1.TextInput({ row: 'foo' })
                            };
                            expect(function () { return new schema_1.Schema(form, ['bar']); }).toThrowError("Row '" + form.foo.definition.row + "' doesn't exist.");
                        });
                    });
                    describe('addRow method', function () {
                        it('should add new row', function () {
                            var schema = new schema_1.Schema();
                            schema.addRow(rows.foo);
                            expect(schema.hasRow('foo')).toBe(true);
                            expect(rows.foo.schema).toBe(schema);
                            expect(schema.rowsAsArray).toEqual([rows.foo]);
                        });
                        it('should publish appropriate event', function () {
                            testForEvent(function (schema) {
                                schema.addRow(rows.foo);
                            }, schema_1.events.rowAdded, rows.foo);
                        });
                        it('should allow to add row without name', function () {
                            var schema = new schema_1.Schema();
                            rows.foo.name = undefined;
                            rows.bar.name = undefined;
                            schema.addRow(rows.foo);
                            schema.addRow(rows.bar);
                            expect(schema.rowsAsArray).toEqual([rows.foo, rows.bar]);
                        });
                        it('should throw if row with name name exists', function () {
                            var schema = new schema_1.Schema();
                            var fooRow2 = new schema_1.Row({
                                name: 'foo',
                                fields: []
                            });
                            schema.addRow(rows.foo);
                            expect(function () { return schema.addRow(fooRow2); }).toThrow(new Error("Multiple rows with '" + fooRow2.name + "' name has been detected. Names has to be unique."));
                        });
                        it('should throw if default row registered', function () {
                            var schema = new schema_1.Schema([new fields_1.TextInput({
                                    name: 'foo',
                                    label: 'Foo'
                                })]);
                            expect(function () { return schema.addRow(rows.bar); })
                                .toThrow(new Error("Cannot add new rows if schema has been initialized with default row. Please use constructor with 'Row[]' signature."));
                        });
                    });
                    describe('removeRow method', function () {
                        it('should remove existing row', function () {
                            var schema = new schema_1.Schema();
                            schema.addRow(rows.foo);
                            schema.removeRow(rows.foo.name);
                            expect(schema.hasRow('foo')).toBe(false);
                            expect(rows.foo.schema).toBeFalsy();
                            expect(schema.rowsAsArray).toEqual([]);
                        });
                        it('should publish appropriate event', function () {
                            testForEvent(function (schema) {
                                schema.addRow(rows.foo);
                                schema.removeRow(rows.foo.name);
                            }, schema_1.events.rowRemoved, rows.foo);
                        });
                        it('should throw if row is missing', function () {
                            var schema = new schema_1.Schema();
                            expect(function () { return schema.removeRow(rows.foo.name); })
                                .toThrowError("Row named as '" + rows.foo.name + "' is missing.");
                        });
                    });
                    describe('addField method', function () {
                        it('should add field to single row', function () {
                            var schema = new schema_1.Schema([new schema_1.Row({ name: 'foo', fields: [] })]);
                            schema.addField(fields.foo);
                            expect(schema.rows['foo'].fields[fields.foo.name]).toBeTruthy();
                        });
                        it('should add field to named row', function () {
                            var schema = new schema_1.Schema(sampleRows);
                            schema.addField(fields.foo, 'additional');
                            expect(schema.rows['additional'].fields[fields.foo.name]).toBeTruthy();
                        });
                        it('should publish appropriate event', function () {
                            var schema = new schema_1.Schema([]);
                            schema.pubSub = pubSub;
                            schema.addField(fields.foo);
                            expect(pubSub.publish.calledOnce).toBe(true);
                            expect(pubSub.publish.calledWith(schema_1.events.fieldAdded, fields.foo)).toBe(true);
                        });
                        it('should throw if row with given name does not exist', function () {
                            var schema = new schema_1.Schema(sampleRows);
                            expect(function () { return schema.addField(fields.foo, 'other'); })
                                .toThrow(new Error("Row 'other' is not defined in the schema."));
                        });
                        it('should register default row if no rows registered', function () {
                            var schema = new schema_1.Schema();
                            schema.addField(fields.foo);
                            expect(schema.defaultRow).toBeTruthy();
                            expect(schema.defaultRow.fields[fields.foo.name]).toBeTruthy();
                        });
                        it('should throw if there is more then one row registered and no name provided', function () {
                            var schema = new schema_1.Schema(sampleRows);
                            expect(function () { return schema.addField(fields.foo); })
                                .toThrow(new Error('There are multiple rows registered. In order to add field name of the row has to be specified on the second parameter.'));
                        });
                    });
                    describe('fields property', function () {
                        it('should return fields from all rows', function () {
                            var schema = new schema_1.Schema(sampleRows);
                            expect(schema.fields[fields.foo.name]).toBe(fields.foo);
                            expect(schema.fields[fields.bar.name]).toBe(fields.bar);
                            expect(schema.fields[fields.baz.name]).toBe(fields.baz);
                        });
                    });
                    describe('hasAnyRow method', function () {
                        it('should return true if any row defined', function () {
                            var schema = new schema_1.Schema();
                            schema.addRow(rows.foo);
                            expect(schema.hasAnyRow()).toBe(true);
                        });
                        it('should return false if no rows defined', function () {
                            var schema = new schema_1.Schema();
                            expect(schema.hasAnyRow()).toBe(false);
                        });
                    });
                    describe('hasRow method', function () {
                        it('should return true if row with given name defined', function () {
                            var schema = new schema_1.Schema();
                            schema.addRow(rows.foo);
                            expect(schema.hasRow(rows.foo.name)).toBe(true);
                        });
                        it('should return false if row with given name not defined', function () {
                            var schema = new schema_1.Schema();
                            expect(schema.hasRow(rows.foo.name)).toBe(false);
                        });
                    });
                    describe('getModel method', function () {
                        it('should generate model', function () {
                            var schema = new schema_1.Schema([
                                new schema_1.Row({
                                    name: 'base',
                                    fields: [
                                        new fields_1.TextInput({ name: 'firstName', value: 'damian' }),
                                        new fields_1.TextInput({ name: 'lastName', value: 'kaminski' }),
                                        new fields_1.TextInput({ name: 'age', value: '99' })
                                    ]
                                }),
                                new schema_1.Row({
                                    name: 'additional',
                                    fields: [
                                        new fields_1.TextInput({ name: 'middleName', value: 'none' }),
                                        new fields_1.TextInput({ name: 'comment', value: 'foo' })
                                    ]
                                })
                            ]);
                            var model = schema.getModel();
                            expect(model).toEqual({
                                firstName: 'damian',
                                lastName: 'kaminski',
                                age: '99',
                                middleName: 'none',
                                comment: 'foo'
                            });
                        });
                        it('should throw if field name is duplicated', function () {
                            var schema = new schema_1.Schema([
                                new schema_1.Row({
                                    name: 'base',
                                    fields: [
                                        new fields_1.TextInput({ name: 'firstName', value: 'damian' })
                                    ]
                                }),
                                new schema_1.Row({
                                    name: 'additional',
                                    fields: [
                                        new fields_1.TextInput({ name: 'firstName', value: 'none' })
                                    ]
                                })
                            ]);
                            expect(function () { return schema.getModel(); }).toThrow(new Error("Multiple fields with 'firstName' name has been detected."));
                        });
                    });
                    describe('validate method', function () {
                        it('should validate all rows', function (done) {
                            rows.foo.validate = sinon.stub().returns(new Promise(function (resolve) { return resolve([1, 3]); }));
                            rows.bar.validate = sinon.stub().returns(new Promise(function (resolve) { return resolve([2]); }));
                            var schema = new schema_1.Schema([rows.foo, rows.bar]);
                            schema.validate().then(function (results) {
                                expect(results).toContain(1);
                                expect(results).toContain(2);
                                expect(results).toContain(3);
                                expect(results.length).toBe(3);
                                done();
                            });
                        });
                        it('should push errors to fields', function (done) {
                            fields.foo.validators = {
                                inline: {
                                    isValid: function () { return false; },
                                    getError: function () { return '1'; }
                                },
                                inline2: {
                                    isValid: function () { return false; },
                                    getError: function () { return '2'; }
                                }
                            };
                            rows.foo.addField(fields.foo);
                            fields.bar.validators = {
                                inline: {
                                    isValid: function () { return false; },
                                    getError: function () { return '3'; }
                                }
                            };
                            rows.bar.addField(fields.bar);
                            fields.foo.value = 'foo';
                            fields.bar.value = 'bar';
                            var schema = new schema_1.Schema([rows.foo, rows.bar]);
                            schema.validate().then(function (results) {
                                expect(fields.foo.errors).toContain('1');
                                expect(fields.foo.errors).toContain('2');
                                expect(fields.bar.errors).toContain('3');
                                done();
                            });
                        });
                        it('should allow to use custom pusher', function (done) {
                            fields.foo.validators = {
                                inline: {
                                    isValid: function () { return false; },
                                    getError: function () { return '1'; }
                                },
                                inline2: {
                                    isValid: function () { return false; },
                                    getError: function () { return '2'; }
                                }
                            };
                            rows.foo.addField(fields.foo);
                            fields.bar.validators = {
                                inline: {
                                    isValid: function () { return false; },
                                    getError: function () { return '3'; }
                                }
                            };
                            rows.bar.addField(fields.bar);
                            fields.foo.value = 'foo';
                            fields.bar.value = 'bar';
                            var schema = new schema_1.Schema([rows.foo, rows.bar]);
                            var pusher = new validation_1.OnSignalValidationResultsPusher();
                            schema.validate(pusher).then(function (results) {
                                expect(fields.foo.errors).toEqual([]);
                                expect(fields.foo.errors).toEqual([]);
                                expect(fields.bar.errors).toEqual([]);
                                pusher.signal();
                                expect(fields.foo.errors).toContain('1');
                                expect(fields.foo.errors).toContain('2');
                                expect(fields.bar.errors).toContain('3');
                                done();
                            });
                        });
                    });
                });
                describe('Row', function () {
                    var emptyDefinition;
                    beforeEach(function () {
                        emptyDefinition = {
                            name: 'base',
                            columns: 2,
                            fields: []
                        };
                    });
                    describe('constructor', function () {
                        it('should initialize instance with provided definition', function () {
                            var row = new schema_1.Row({
                                name: 'base',
                                columns: 2,
                                fields: [fields.foo, fields.bar]
                            });
                            expect(row.name).toBe('base');
                            expect(row.columns).toBe(2);
                            expect(row.fieldsAsArray).toEqual([fields.foo, fields.bar]);
                        });
                    });
                    describe('addField method', function () {
                        it('should use addFieldAt with proper position', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            var spy = sinon.spy(function () {
                                row.fieldsAsArray.push(undefined);
                            });
                            row.addFieldAt = spy;
                            row.addField(fields.foo);
                            row.addField(fields.bar);
                            expect(spy.calledTwice).toBe(true);
                            expect(spy.firstCall.calledWithExactly(fields.foo, 0)).toBe(true);
                            expect(spy.secondCall.calledWithExactly(fields.bar, 1)).toBe(true);
                        });
                    });
                    describe('addFieldAt method', function () {
                        it('should be able to add fields on empty row', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            row.addFieldAt(fields.foo, 0);
                            row.addFieldAt(fields.bar, 1);
                            expect(row.fields[fields.foo.name]).toBeTruthy();
                            expect(row.fields[fields.bar.name]).toBeTruthy();
                            expect(row.fieldsAsArray).toEqual([fields.foo, fields.bar]);
                            expect(fields.foo.row).toBe(row);
                            expect(fields.bar.row).toBe(row);
                            expect(fields.foo.rowIndex).toBe(0);
                            expect(fields.bar.rowIndex).toBe(1);
                        });
                        it('should be able to add field in the middle of existing fields', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            row.addFieldAt(fields.foo, 0);
                            row.addFieldAt(fields.bar, 1);
                            row.addFieldAt(fields.fooBar, 1);
                            expect(row.fieldsAsArray).toEqual([fields.foo, fields.fooBar, fields.bar]);
                            row.addFieldAt(fields.baz, 1);
                            expect(row.fieldsAsArray).toEqual([fields.foo, fields.baz, fields.fooBar, fields.bar]);
                        });
                        it('should publish appropriate event', function () {
                            var schema = new schema_1.Schema([new schema_1.Row(emptyDefinition)]);
                            var row = schema.rows[emptyDefinition.name];
                            schema.pubSub = pubSub;
                            row.pubSub = pubSub;
                            row.addFieldAt(fields.foo, 0);
                            expect(pubSub.publish.calledTwice).toBe(true);
                            expect(pubSub.publish.firstCall.calledWith(schema_1.events.fieldAdded, fields.foo)).toBe(true);
                            expect(pubSub.publish.secondCall.calledWith(schema_1.events.fieldAdded, fields.foo)).toBe(true);
                        });
                        it('should throw if field with same name already added', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            row.addFieldAt(fields.foo, 0);
                            expect(function () {
                                row.addFieldAt(fields.foo, 1);
                            }).toThrowError("Multiple fields with '" + fields.foo.name + "' name in '" + row.name + "' row has been detected.");
                        });
                        it('should throw if index is out of range', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            expect(function () {
                                row.addFieldAt(fields.foo, 1);
                            }).toThrowError("Out of range. Max: 0, given: 1.");
                        });
                    });
                    describe('removeField method', function () {
                        it('should remove existing field', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            row.addField(fields.foo);
                            row.addField(fields.bar);
                            row.removeField(fields.foo.name);
                            expect(row.fields[fields.foo.name]).toBeFalsy();
                            expect(row.fieldsAsArray).toEqual([fields.bar]);
                            expect(fields.foo.row).toBeFalsy();
                            expect(fields.foo.rowIndex).toBeFalsy();
                        });
                        it('should publish appropriate event', function () {
                            var schema = new schema_1.Schema([new schema_1.Row(emptyDefinition)]);
                            var row = schema.rows[emptyDefinition.name];
                            schema.pubSub = pubSub;
                            row.pubSub = pubSub;
                            row.addField(fields.foo);
                            row.addField(fields.bar);
                            row.removeField(fields.bar.name);
                            expect(pubSub.publish.lastCall.calledWith(schema_1.events.fieldRemoved, fields.bar)).toBe(true);
                        });
                        it('should throw if field does not exist', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            expect(function () { return row.removeField(fields.foo.name); })
                                .toThrowError("Field '" + fields.foo.name + "' doesn't exist in '" + row.name + "' row.");
                        });
                    });
                    describe('hasField method', function () {
                        it('should return true if field found', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            row.addField(fields.foo);
                            expect(row.hasField(fields.foo.name)).toBe(true);
                        });
                        it('should return false if row does not contain field with given name', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            expect(row.hasField(fields.foo.name)).toBe(false);
                        });
                    });
                    describe('getModel method', function () {
                        it('should create model using added fields', function () {
                            var row = new schema_1.Row(emptyDefinition);
                            fields.foo.value = 'John';
                            fields.bar.value = 'Doe';
                            row.addField(fields.foo);
                            row.addField(fields.bar);
                            var model = row.getModel();
                            expect(model).toEqual({
                                foo: 'John',
                                bar: 'Doe'
                            });
                        });
                    });
                });
            });
        }
    }
});
