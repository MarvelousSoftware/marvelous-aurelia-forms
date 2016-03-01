import {PubSub} from 'marvelous-aurelia-core/pubsub';
import {Schema, Row, events, IRowDefinition} from './schema';
import {TextInput} from './fields';
import {OnSignalValidationResultsPusher} from './validation';

describe('', () => {
  let rows: { foo: Row, bar: Row };
  let fields: { foo: TextInput, bar: TextInput, baz: TextInput, fooBar: TextInput };
  let sampleRows: Row[];
  let pubSub: { publish: Sinon.SinonStub } & PubSub;

  let testForEvent = (action: (schema: Schema) => void, eventName: string, payload: any) => {
    let schema = new Schema();
    schema.pubSub = pubSub;

    action(schema);

    expect(pubSub.publish.calledWithExactly(eventName, payload)).toBe(true);
  }

  beforeEach(() => {
    pubSub = <any>new PubSub();
    sinon.stub(pubSub, 'publish');

    rows = {
      foo: new Row({
        name: 'foo',
        fields: []
      }),
      bar: new Row({
        name: 'bar',
        fields: []
      })
    };
    fields = {
      foo: new TextInput({
        name: 'foo'
      }),
      bar: new TextInput({
        name: 'bar'
      }),
      baz: new TextInput({
        name: 'baz'
      }),
      fooBar: new TextInput({
        name: 'foobar'
      })
    };
    sampleRows = [
      new Row({
        name: 'base',
        fields: [
          fields.foo,
          fields.bar
        ]
      }),
      new Row({
        name: 'additional',
        fields: [
          fields.baz
        ]
      })
    ];
  });

  describe('Schema', () => {
    describe('constructor', () => {

      it('should register fields in default rows', () => {
        let schema = new Schema([fields.bar, fields.foo]);

        expect(schema.hasRow('default')).toBe(true);
        expect(schema.rows['default']).toBeTruthy();
        expect(schema.rows['default'].schema).toBe(schema);
        expect(schema.defaultRow.fields['bar']).toBe(fields.bar);
        expect(schema.defaultRow.fields['foo']).toBe(fields.foo);
      });

      it('should register rows', () => {
        let schema = new Schema([rows.foo, rows.bar]);

        expect(schema.hasRow('default')).toBe(false);
        expect(schema.rows['foo']).toBe(rows.foo);
        expect(schema.rows['bar']).toBe(rows.bar);
        expect(schema.rows['foo'].schema).toBe(schema);
        expect(schema.rows['bar'].schema).toBe(schema);
      });

      it('should register default row if empty array is given', () => {
        let schema = new Schema([]);

        expect(schema.defaultRow).toBeTruthy();
        expect(schema.hasRow('default')).toBe(true);
        expect(schema.rows['default']).toBeTruthy();
        expect(schema.rows['default'].schema).toBe(schema);
      });

      it('should not register anything if schema is undefined', () => {
        let schema = new Schema();

        expect(schema.defaultRow).toBeFalsy();
        expect(schema.hasRow('default')).toBe(false);
      });

      it('should allow to use fields dictionary with default row', () => {
        var form = {
          foo: new TextInput({}),
          bar: new TextInput({})
        };
        let schema = new Schema(form);

        expect(schema.fields['foo']).toBe(form.foo);
        expect(schema.fields['bar']).toBe(form.bar);
      });

      it('should allow to use fields dictionary with explicit defined row', () => {
        var form = {
          foo: new TextInput({ row: 'first' }),
          bar: new TextInput({ row: 'second' }),
          baz: new TextInput({ row: 'second' })
        };
        let schema = new Schema(form, ['first', 'second']);

        expect(schema.rows['first'].fields['foo']).toBe(form.foo);
        expect(schema.rows['second'].fields['bar']).toBe(form.bar);
        expect(schema.rows['second'].fields['baz']).toBe(form.baz);
      });

      it('should allow to declare rows explicitly', () => {
        var form = {
          foo: new TextInput({ row: 'first' }),
          bar: new TextInput({ row: 'second' })
        };
        let rows = {
          first: new Row({ name: 'first' }),
          second: new Row({ name: 'second' })
        }
        let schema = new Schema(form, [rows.first, rows.second]);

        expect(schema.rows['first']).toBe(rows.first);
        expect(schema.rows['second']).toBe(rows.second);
        expect(schema.rows['first'].fields['foo']).toBe(form.foo);
        expect(schema.rows['second'].fields['bar']).toBe(form.bar);
      });
      
      it('should allow to declare columns', () => {
        var form = {
          foo: new TextInput({})
        };
        let schema = new Schema(form, 3);

        expect(schema.defaultRow.columns).toBe(3);
      });
      
      it('should allow to define non-field property in fields dictionary', () => {
        var form = {
          foo: new TextInput({}),
          bar: 1
        };
        let schema = new Schema(form);

        expect(schema.fields['foo']).toBe(form.foo);
        expect(Object.keys(schema.fields).length).toBe(1);
      });

      it('should throw when row with given name does not exist', () => {
        var form = {
          foo: new TextInput({ row: 'foo' })
        };
        expect(() => new Schema(form, ['bar'])).toThrowError(`Row '${form.foo.definition.row}' doesn't exist.`);
      });

    });

    describe('addRow method', () => {

      it('should add new row', () => {
        let schema = new Schema();

        schema.addRow(rows.foo);

        expect(schema.hasRow('foo')).toBe(true);
        expect(rows.foo.schema).toBe(schema);
        expect(schema.rowsAsArray).toEqual([rows.foo]);
      });

      it('should publish appropriate event', () => {
        testForEvent((schema) => {
          schema.addRow(rows.foo);
        }, events.rowAdded, rows.foo);
      });

      it('should allow to add row without name', () => {
        let schema = new Schema();
        rows.foo.name = undefined;
        rows.bar.name = undefined;

        schema.addRow(rows.foo);
        schema.addRow(rows.bar);

        expect(schema.rowsAsArray).toEqual([rows.foo, rows.bar]);
      });

      it('should throw if row with name name exists', () => {
        let schema = new Schema();
        let fooRow2 = new Row({
          name: 'foo',
          fields: []
        });
        schema.addRow(rows.foo);

        expect(() => schema.addRow(fooRow2)).toThrow(new Error(`Multiple rows with '${fooRow2.name}' name has been detected. Names has to be unique.`));
      });

      it('should throw if default row registered', () => {
        let schema = new Schema([new TextInput({
          name: 'foo',
          label: 'Foo'
        })]);

        expect(() => schema.addRow(rows.bar))
          .toThrow(new Error(`Cannot add new rows if schema has been initialized with default row. Please use constructor with 'Row[]' signature.`));
      });

    });

    describe('removeRow method', () => {

      it('should remove existing row', () => {
        let schema = new Schema();
        schema.addRow(rows.foo);

        schema.removeRow(rows.foo.name);

        expect(schema.hasRow('foo')).toBe(false);
        expect(rows.foo.schema).toBeFalsy();
        expect(schema.rowsAsArray).toEqual([]);
      });

      it('should publish appropriate event', () => {
        testForEvent((schema) => {
          schema.addRow(rows.foo);
          schema.removeRow(rows.foo.name);
        }, events.rowRemoved, rows.foo);
      });

      it('should throw if row is missing', () => {
        let schema = new Schema();

        expect(() => schema.removeRow(rows.foo.name))
          .toThrowError(`Row named as '${rows.foo.name}' is missing.`)
      })

    });

    describe('addField method', () => {

      it('should add field to single row', () => {
        let schema = new Schema([new Row({ name: 'foo', fields: [] })]);

        schema.addField(fields.foo);

        expect(schema.rows['foo'].fields[fields.foo.name]).toBeTruthy();
      });

      it('should add field to named row', () => {
        let schema = new Schema(sampleRows);

        schema.addField(fields.foo, 'additional');

        expect(schema.rows['additional'].fields[fields.foo.name]).toBeTruthy();
      });

      it('should publish appropriate event', () => {
        let schema = new Schema([]);
        schema.pubSub = pubSub;

        schema.addField(fields.foo);

        expect(pubSub.publish.calledOnce).toBe(true);
        expect(pubSub.publish.calledWith(events.fieldAdded, fields.foo)).toBe(true);
      });

      it('should throw if row with given name does not exist', () => {
        let schema = new Schema(sampleRows);

        expect(() => schema.addField(fields.foo, 'other'))
          .toThrow(new Error(`Row 'other' is not defined in the schema.`));
      });

      it('should register default row if no rows registered', () => {
        let schema = new Schema();

        schema.addField(fields.foo);

        expect(schema.defaultRow).toBeTruthy();
        expect(schema.defaultRow.fields[fields.foo.name]).toBeTruthy();
      });

      it('should throw if there is more then one row registered and no name provided', () => {
        let schema = new Schema(sampleRows);

        expect(() => schema.addField(fields.foo))
          .toThrow(new Error('There are multiple rows registered. In order to add field name of the row has to be specified on the second parameter.'));
      });

    });

    describe('fields property', () => {

      it('should return fields from all rows', () => {
        let schema = new Schema(sampleRows);

        expect(schema.fields[fields.foo.name]).toBe(fields.foo);
        expect(schema.fields[fields.bar.name]).toBe(fields.bar);
        expect(schema.fields[fields.baz.name]).toBe(fields.baz);
      });

    });

    describe('hasAnyRow method', () => {

      it('should return true if any row defined', () => {
        let schema = new Schema();

        schema.addRow(rows.foo);

        expect(schema.hasAnyRow()).toBe(true);
      });

      it('should return false if no rows defined', () => {
        let schema = new Schema();

        expect(schema.hasAnyRow()).toBe(false);
      });

    });

    describe('hasRow method', () => {

      it('should return true if row with given name defined', () => {
        let schema = new Schema();

        schema.addRow(rows.foo);

        expect(schema.hasRow(rows.foo.name)).toBe(true);
      });

      it('should return false if row with given name not defined', () => {
        let schema = new Schema();

        expect(schema.hasRow(rows.foo.name)).toBe(false);
      });

    });

    describe('getModel method', () => {

      it('should generate model', () => {
        let schema = new Schema([
          new Row({
            name: 'base',
            fields: [
              new TextInput({ name: 'firstName', value: 'damian' }),
              new TextInput({ name: 'lastName', value: 'kaminski' }),
              new TextInput({ name: 'age', value: '99' })
            ]
          }),
          new Row({
            name: 'additional',
            fields: [
              new TextInput({ name: 'middleName', value: 'none' }),
              new TextInput({ name: 'comment', value: 'foo' })
            ]
          })
        ]);

        let model = schema.getModel();

        expect(model).toEqual({
          firstName: 'damian',
          lastName: 'kaminski',
          age: '99',
          middleName: 'none',
          comment: 'foo'
        });
      });

      it('should throw if field name is duplicated', () => {
        let schema = new Schema([
          new Row({
            name: 'base',
            fields: [
              new TextInput({ name: 'firstName', value: 'damian' })
            ]
          }),
          new Row({
            name: 'additional',
            fields: [
              new TextInput({ name: 'firstName', value: 'none' })
            ]
          })
        ]);

        expect(() => schema.getModel()).toThrow(new Error(`Multiple fields with 'firstName' name has been detected.`));
      });

    });

    describe('validate method', () => {

      it('should validate all rows', (done) => {
        rows.foo.validate = sinon.stub().returns(new Promise((resolve) => resolve([1, 3])));
        rows.bar.validate = sinon.stub().returns(new Promise((resolve) => resolve([2])));
        let schema = new Schema([rows.foo, rows.bar]);

        schema.validate().then(results => {
          expect(results).toContain(1);
          expect(results).toContain(2);
          expect(results).toContain(3);
          expect(results.length).toBe(3);
          done();
        });
      });

      it('should push errors to fields', (done) => {
        fields.foo.validators = {
          inline: {
            isValid: () => false,
            getError: () => '1'
          },
          inline2: {
            isValid: () => false,
            getError: () => '2'
          }
        };
        rows.foo.addField(fields.foo);
        fields.bar.validators = {
          inline: {
            isValid: () => false,
            getError: () => '3'
          }
        };
        rows.bar.addField(fields.bar)
        fields.foo.value = 'foo';
        fields.bar.value = 'bar';
        let schema = new Schema([rows.foo, rows.bar]);

        schema.validate().then(results => {
          expect(fields.foo.errors).toContain('1');
          expect(fields.foo.errors).toContain('2');
          expect(fields.bar.errors).toContain('3');
          done();
        });
      });

      it('should allow to use custom pusher', (done) => {
        fields.foo.validators = {
          inline: {
            isValid: () => false,
            getError: () => '1'
          },
          inline2: {
            isValid: () => false,
            getError: () => '2'
          }
        };
        rows.foo.addField(fields.foo);
        fields.bar.validators = {
          inline: {
            isValid: () => false,
            getError: () => '3'
          }
        };
        rows.bar.addField(fields.bar)
        fields.foo.value = 'foo';
        fields.bar.value = 'bar';
        let schema = new Schema([rows.foo, rows.bar]);

        let pusher = new OnSignalValidationResultsPusher();

        schema.validate(pusher).then(results => {
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

  describe('Row', () => {
    let emptyDefinition: IRowDefinition;

    beforeEach(() => {
      emptyDefinition = {
        name: 'base',
        columns: 2,
        fields: []
      };
    });

    describe('constructor', () => {

      it('should initialize instance with provided definition', () => {
        let row = new Row({
          name: 'base',
          columns: 2,
          fields: [fields.foo, fields.bar]
        });

        expect(row.name).toBe('base');
        expect(row.columns).toBe(2);
        expect(row.fieldsAsArray).toEqual([fields.foo, fields.bar]);
      });

    });

    describe('addField method', () => {

      it('should use addFieldAt with proper position', () => {
        let row = new Row(emptyDefinition);
        let spy = sinon.spy(() => {
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

    describe('addFieldAt method', () => {

      it('should be able to add fields on empty row', () => {
        let row = new Row(emptyDefinition);

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

      it('should be able to add field in the middle of existing fields', () => {
        let row = new Row(emptyDefinition);

        row.addFieldAt(fields.foo, 0);
        row.addFieldAt(fields.bar, 1);

        row.addFieldAt(fields.fooBar, 1);
        expect(row.fieldsAsArray).toEqual([fields.foo, fields.fooBar, fields.bar]);

        row.addFieldAt(fields.baz, 1);
        expect(row.fieldsAsArray).toEqual([fields.foo, fields.baz, fields.fooBar, fields.bar]);
      });

      it('should publish appropriate event', () => {
        let schema = new Schema([new Row(emptyDefinition)]);
        let row = schema.rows[emptyDefinition.name];
        schema.pubSub = pubSub;
        row.pubSub = pubSub;

        row.addFieldAt(fields.foo, 0);

        expect(pubSub.publish.calledTwice).toBe(true);
        expect(pubSub.publish.firstCall.calledWith(events.fieldAdded, fields.foo)).toBe(true);
        expect(pubSub.publish.secondCall.calledWith(events.fieldAdded, fields.foo)).toBe(true);
      });

      it('should throw if field with same name already added', () => {
        let row = new Row(emptyDefinition);
        row.addFieldAt(fields.foo, 0);

        expect(() => {
          row.addFieldAt(fields.foo, 1);
        }).toThrowError(`Multiple fields with '${fields.foo.name}' name in '${row.name}' row has been detected.`);
      });

      it('should throw if index is out of range', () => {
        let row = new Row(emptyDefinition);

        expect(() => {
          row.addFieldAt(fields.foo, 1);
        }).toThrowError(`Out of range. Max: 0, given: 1.`);
      });

    });

    describe('removeField method', () => {

      it('should remove existing field', () => {
        let row = new Row(emptyDefinition);
        row.addField(fields.foo);
        row.addField(fields.bar);

        row.removeField(fields.foo.name);

        expect(row.fields[fields.foo.name]).toBeFalsy();
        expect(row.fieldsAsArray).toEqual([fields.bar]);
        expect(fields.foo.row).toBeFalsy();
        expect(fields.foo.rowIndex).toBeFalsy();
      });

      it('should publish appropriate event', () => {
        let schema = new Schema([new Row(emptyDefinition)]);
        let row = schema.rows[emptyDefinition.name];
        schema.pubSub = pubSub;
        row.pubSub = pubSub;
        row.addField(fields.foo);
        row.addField(fields.bar);

        row.removeField(fields.bar.name);

        expect(pubSub.publish.lastCall.calledWith(events.fieldRemoved, fields.bar)).toBe(true);
      });

      it('should throw if field does not exist', () => {
        let row = new Row(emptyDefinition);

        expect(() => row.removeField(fields.foo.name))
          .toThrowError(`Field '${fields.foo.name}' doesn't exist in '${row.name}' row.`)
      });

    });

    describe('hasField method', () => {

      it('should return true if field found', () => {
        let row = new Row(emptyDefinition);
        row.addField(fields.foo);

        expect(row.hasField(fields.foo.name)).toBe(true);
      });

      it('should return false if row does not contain field with given name', () => {
        let row = new Row(emptyDefinition);

        expect(row.hasField(fields.foo.name)).toBe(false);
      });

    });

    describe('getModel method', () => {

      it('should create model using added fields', () => {
        let row = new Row(emptyDefinition);
        fields.foo.value = 'John';
        fields.bar.value = 'Doe';
        row.addField(fields.foo);
        row.addField(fields.bar);

        let model = row.getModel();

        expect(model).toEqual({
          foo: 'John',
          bar: 'Doe'
        });
      });

    });

  });

});