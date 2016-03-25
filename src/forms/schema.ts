import {IDictionary} from 'marvelous-aurelia-core/interfaces';
import {Utils as _} from 'marvelous-aurelia-core/utils';
import {PubSub} from 'marvelous-aurelia-core/pubsub';
import {Field, fieldVisibility} from './fields.base';
import {IFieldValidationResult, IValidationResultsPusher, OnSignalValidationResultsPusher} from './validation';
import {globalConfig, FormsConfig, createConfiguration} from './config';

export let events = {
  fieldAdded: 'fieldAdded',
  fieldRemoved: 'fieldRemoved',
  rowAdded: 'rowAdded',
  rowRemoved: 'rowRemoved'
};

export class Schema {
	/**
	 * Dictionary of rows. If schema has been declared with fields only
	 * then this dictionary will be empty. In such case use `defaultRow`
	 * instead. 
	 */
  public rows: IDictionary<Row> = {};
	
  /**
   * `rows` dictionary as array.
   */
  public rowsAsArray: Row[] = [];
  
	/**
	 * If schema has been declared with fields only then this property will contain
	 * automatically generated row.
	 */
  public defaultRow: Row;
	
	/**
	 * Indicates wheter whole schema is in the read only state.
	 */
  public isReadOnly: boolean = false;
  
  /**
   * True if schema has been submitted at least once.
   */
  public submitted = false;
  
  public pubSub = new PubSub();

  private _uniqueNameCount = 0;

  public get fields() {
    let fields: IDictionary<Field> = {};
    _.forOwn(this.rows, (row: Row) => {
      _.forOwn(row.fields, (field: Field) => {
        fields[field.name] = field;
      });
    });
    return fields;
  }

  private _config: FormsConfig = globalConfig;
  
  /**
   * Gets configuration used by the form. By default it is taken from marvelous-aurelia-forms plugin configuration.
   */  
  public get config() {
    return this._config;
  }
  
  /**
   * Sets configuration used by the form. By default it is taken from marvelous-aurelia-forms plugin configuration.
   */  
  public set config(config: FormsConfig) {
    this._config = createConfiguration(config, globalConfig);
  }

  constructor(schema: Row[] | Field[] | IDictionary<any> = undefined, rowsOrColumns: Row[] | string[] | number = undefined) {
    let definitions = <any>schema;
    if (!definitions) {
      // array is empty, no need to register anything
      return;
    }

    if ((rowsOrColumns && rowsOrColumns instanceof Array && rowsOrColumns.length) || typeof rowsOrColumns === 'number') {
      this._createRowsFromArrayOrNumber(rowsOrColumns);
    }

    if (definitions instanceof Array === false) {
      this._createFieldsFromProperties(definitions);
      return;
    }

    if (!definitions.length || definitions[0] instanceof Field) {
      // schema is empty array or an array of fields
      this._assignDefaultRow(definitions);
      return;
    }

    if (definitions[0] instanceof Row) {
      // schema is an array of rows
      (<Row[]>definitions).forEach(x => this.addRow(x));
      return;
    }
  }

  private _createRowsFromArrayOrNumber(rowsOrColumns: Row[] | string[] | number) {
    if(typeof rowsOrColumns === 'number') {
      let columns = rowsOrColumns;
      this._assignDefaultRow([], columns);
      return;
    }
    
    (<any[]>rowsOrColumns).forEach(rowOrRowName => {
      let row: Row;
      if (rowOrRowName instanceof Row) {
        row = rowOrRowName;
      } else if (typeof rowOrRowName === 'string') {
        row = new Row({
          name: rowOrRowName,
          fields: []
        });
      } else {
        throw new Error('Rows should be either instances of Rows or Strings.');
      }

      this.addRow(row);
    });
  }

  private _createFieldsFromProperties(definitions: IDictionary<any>) {
    for (let key in definitions) {
      if (definitions[key] instanceof Field === false) {
        // property is not Field, move on
        continue;
      }

      let field = <Field>definitions[key];
      field.name = key;

      if (!!field.definition.row === false && !!this.defaultRow === false) {
        // belongs to default row which is not created yet
        this._assignDefaultRow([]);
      }

      if (!!field.definition.row === false) {
        // field has not declared row, therefore default is used
        this.defaultRow.addField(field);
      } else {
        // row is declared
        let row = this.rows[field.definition.row];
        if (!!row === false) {
          throw new Error(`Row '${field.definition.row}' doesn't exist.`);
        }

        row.addField(field);
      }
    }
  }

  addRow(row: Row) {
    if (!row.name) {
      row.name = this._generateUniqueName();
    }

    if (this.defaultRow) {
      throw new Error(`Cannot add new rows if schema has been initialized with default row. Please use constructor with 'Row[]' signature.`);
    }

    if (this.rows[row.name]) {
      throw new Error(`Multiple rows with '${row.name}' name has been detected. Names has to be unique.`);
    }

    row.schema = this;
    this.rows[row.name] = row;
    this.rowsAsArray.push(row);

    this.pubSub.publish(events.rowAdded, row);
  }

  private _generateUniqueName() {
    let name: string;
    do {
      name = 'default-' + this._uniqueNameCount;
      this._uniqueNameCount++;
    } while (this.hasRow(name));

    return name;
  }

  removeRow(name: string) {
    let row = this.rows[name];

    if (!row) {
      throw new Error(`Row named as '${name}' is missing.`);
    }

    row.schema = undefined;
    delete this.rows[name];
    this.rowsAsArray.splice(this.rowsAsArray.indexOf(row), 1);
    this.pubSub.publish(events.rowRemoved, row);
  }

  addField(field: Field, rowName: string = undefined) {
    if (!rowName && this.rowCount > 1) {
      throw new Error('There are multiple rows registered. In order to add field name of the row has to be specified on the second parameter.');
    }

    if (this.rowCount === 0) {
      this._assignDefaultRow([]);
    }

    if (rowName && !this.rows[rowName]) {
      throw new Error(`Row '${rowName}' is not defined in the schema.`);
    }

    let row = rowName ? this.rows[rowName] : this.rows[this.rowNames[0]];
    row.addField(field);
  }

  get rowCount() {
    return this.rowNames.length;
  }
	
	/**
	 * Names of all added rows.
	 */
  get rowNames() {
    return Object.keys(this.rows);
  }

  hasAnyRow() {
    return !!this.rowCount;
  }

  hasRow(name: string) {
    return !!this.rows[name];
  }

  forEachField(action: (field: Field) => void) {
    this.rowsAsArray.forEach(row => {
      row.fieldsAsArray.forEach(field => {
        action(field);
      });
    })
  }
  
	/**
	 * Generates model using assigned rows. Any modification to the created model won't be tracked.
	 * If modification of field value is needed do it on the field instance.
	 */
  getModel(): any {
    let model = {};
    _.forOwn(this.rows, (row: Row) => {
      let rowModel = row.getModel();
      _.forOwn(rowModel, (value: any, property: string) => {
        if (model[property] !== undefined) {
          throw new Error(`Multiple fields with '${property}' name has been detected.`);
        }

        model[property] = rowModel[property];
      });
    });
    return model;
  }

  validate(resultsPusher: IValidationResultsPusher = undefined): Promise<IFieldValidationResult[]> {
    let onSignalPusher: OnSignalValidationResultsPusher;
    if (resultsPusher === undefined) {
      // By default on signal pusher is used to avoid not desirable
      // behaviour of errors being shown one by one to the user.
      // This is especially important in case of long running
      // validators (e.g. these which are calling external services
      // to get the work done)
      onSignalPusher = new OnSignalValidationResultsPusher();
      resultsPusher = onSignalPusher;
    }

    let validations = this.rowsAsArray.map(row => row.validate(resultsPusher));
    return Promise.all(validations).then(results => {
      if (onSignalPusher) onSignalPusher.signal();
      return results;
    }).then(_.flatten);
  }

  private _assignDefaultRow(fields: Field[], columns = undefined) {
    if (this.defaultRow) {
      throw new Error('Default row is already created.');
    }

    let row = new Row({
      name: 'default',
      fields: fields,
      columns: columns
    });

    this.addRow(row);
    this.defaultRow = row;
  }
}

export interface IRowDefinition {
	/**
	 * Name of the row. Allows easy schema traversal.
	 */
  name?: string;
	
	/**
	 * Name of the row. Default: 'default'.
	 */
  columns?: number;
	
	/**
	 * Fields associated with an instance of row.
	 */
  fields?: Field[];
}

export class Row {
	/**
	 * Associated schema with an instance of row.
	 */
  schema: Schema;
	
	/**
	 * Name of the row. Default: 'default'.
	 */
  name: string;
	
	/**
	 * Numbers of columns to be displayed in the row. 
	 */
  columns: number;
	
	/**
	 * Fields associated with an instance of row. Should be added only with
	 * `addField` method. Any other usage may lead to some issues.
	 */
  fields: IDictionary<Field> = {};
  
  /**
   * Fields as array. Always in sync with `fields` property.
   */
  fieldsAsArray: Field[] = [];

  pubSub = new PubSub();

  constructor(row: IRowDefinition) {
    row.fields = row.fields || [];

    this.name = row.name;
    this.columns = row.columns === undefined ? 1 : row.columns;
    row.fields.forEach(x => this.addField(x));
  }
	
  /**
   * Adds new field at the end of the row.
   */
  addField(field: Field) {
    this.addFieldAt(field, this.fieldsAsArray.length);
  }
	
  /**
   * Adds new field at given position.
   */
  addFieldAt(field: Field, index: number) {
    if (this.fields[field.name]) {
      throw new Error(`Multiple fields with '${field.name}' name in '${this.name}' row has been detected.`);
    }

    if (index > this.fieldsAsArray.length) {
      throw new Error(`Out of range. Max: ${this.fieldsAsArray.length}, given: ${index}.`);
    }

    field.row = this;
    field.rowIndex = index;
    this.fields[field.name] = field;

    if (this.fieldsAsArray.length === index) {
      this.fieldsAsArray.push(field);
    } else {
      // adds item in the middle of an array
      this.fieldsAsArray.push(undefined);
      let i = this.fieldsAsArray.length - 1;
      while (i !== index) {
        this.fieldsAsArray[i] = this.fieldsAsArray[i - 1];
        i--;
      }
      this.fieldsAsArray[index] = field;
    }

    this._publish(events.fieldAdded, field);
  }

  removeField(name: string) {
    let field = this.fields[name];
    if (!!field === false) {
      throw new Error(`Field '${name}' doesn't exist in '${this.name}' row.`);
    }

    this.fieldsAsArray.splice(this.fieldsAsArray.indexOf(field), 1);
    delete this.fields[name].row;
    delete this.fields[name].rowIndex;
    delete this.fields[name];

    this._publish(events.fieldRemoved, field);
  }

  private _publish(eventName: string, payload: any) {
    this.pubSub.publish(eventName, payload);
    if (this.schema) {
      this.schema.pubSub.publish(eventName, payload);
    }
  }

  hasField(name: string) {
    return !!this.fields[name];
  }
	
	/**
	 * Generates model using assigned fields. Any modification to the created model won't be tracked.
	 */
  getModel() {
    let model = {};

    _.forOwn(this.fields, (field: Field) => {
      model[field.name] = field.value;
    });

    return model;
  }

  validate(resultsPusher: IValidationResultsPusher = undefined): Promise<IFieldValidationResult[]> {
    // TODO: test it
    let deferred = _.defer();
    let fields = this.fieldsAsArray.filter(x => x.visibility !== fieldVisibility.hidden);
    let promises = fields.map(x => {
      return x.validate(resultsPusher).then(validations => {
        return {
          field: x,
          validations: validations,
          isValid: validations.every(x => x.isValid)
        }
      });
    });

    Promise.all<IFieldValidationResult>(promises).then(fields => {
      deferred.resolve(fields);
    }, () => { throw new Error(`Field validation has failed due to unknown reason.`); });

    return deferred.promise;
  }

}