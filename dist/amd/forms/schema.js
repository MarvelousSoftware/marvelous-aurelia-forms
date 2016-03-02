System.register(['marvelous-aurelia-core/utils', 'marvelous-aurelia-core/pubsub', './fields.base', './validation'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var utils_1, pubsub_1, fields_base_1, validation_1;
    var events, Schema, Row;
    return {
        setters:[
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (pubsub_1_1) {
                pubsub_1 = pubsub_1_1;
            },
            function (fields_base_1_1) {
                fields_base_1 = fields_base_1_1;
            },
            function (validation_1_1) {
                validation_1 = validation_1_1;
            }],
        execute: function() {
            exports_1("events", events = {
                fieldAdded: 'fieldAdded',
                fieldRemoved: 'fieldRemoved',
                rowAdded: 'rowAdded',
                rowRemoved: 'rowRemoved'
            });
            Schema = (function () {
                function Schema(schema, rowsOrColumns) {
                    var _this = this;
                    if (schema === void 0) { schema = undefined; }
                    if (rowsOrColumns === void 0) { rowsOrColumns = undefined; }
                    /**
                     * Dictionary of rows. If schema has been declared with fields only
                     * then this dictionary will be empty. In such case use `defaultRow`
                     * instead.
                     */
                    this.rows = {};
                    /**
                     * `rows` dictionary as array.
                     */
                    this.rowsAsArray = [];
                    /**
                     * Indicates wheter whole schema is in the read only state.
                     */
                    this.isReadOnly = false;
                    this.pubSub = new pubsub_1.PubSub();
                    this._uniqueNameCount = 0;
                    var definitions = schema;
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
                    if (!definitions.length || definitions[0] instanceof fields_base_1.Field) {
                        // schema is empty array or an array of fields
                        this._assignDefaultRow(definitions);
                        return;
                    }
                    if (definitions[0] instanceof Row) {
                        // schema is an array of rows
                        definitions.forEach(function (x) { return _this.addRow(x); });
                        return;
                    }
                }
                Object.defineProperty(Schema.prototype, "fields", {
                    get: function () {
                        var fields = {};
                        utils_1.Utils.forOwn(this.rows, function (row) {
                            utils_1.Utils.forOwn(row.fields, function (field) {
                                fields[field.name] = field;
                            });
                        });
                        return fields;
                    },
                    enumerable: true,
                    configurable: true
                });
                Schema.prototype._createRowsFromArrayOrNumber = function (rowsOrColumns) {
                    var _this = this;
                    if (typeof rowsOrColumns === 'number') {
                        var columns = rowsOrColumns;
                        this._assignDefaultRow([], columns);
                        return;
                    }
                    rowsOrColumns.forEach(function (rowOrRowName) {
                        var row;
                        if (rowOrRowName instanceof Row) {
                            row = rowOrRowName;
                        }
                        else if (typeof rowOrRowName === 'string') {
                            row = new Row({
                                name: rowOrRowName,
                                fields: []
                            });
                        }
                        else {
                            throw new Error('Rows should be either instances of Rows or Strings.');
                        }
                        _this.addRow(row);
                    });
                };
                Schema.prototype._createFieldsFromProperties = function (definitions) {
                    for (var key in definitions) {
                        if (definitions[key] instanceof fields_base_1.Field === false) {
                            // property is not Field, move on
                            continue;
                        }
                        var field = definitions[key];
                        field.name = key;
                        if (!!field.definition.row === false && !!this.defaultRow === false) {
                            // belongs to default row which is not created yet
                            this._assignDefaultRow([]);
                        }
                        if (!!field.definition.row === false) {
                            // field has not declared row, therefore default is used
                            this.defaultRow.addField(field);
                        }
                        else {
                            // row is declared
                            var row = this.rows[field.definition.row];
                            if (!!row === false) {
                                throw new Error("Row '" + field.definition.row + "' doesn't exist.");
                            }
                            row.addField(field);
                        }
                    }
                };
                Schema.prototype.addRow = function (row) {
                    if (!row.name) {
                        row.name = this._generateUniqueName();
                    }
                    if (this.defaultRow) {
                        throw new Error("Cannot add new rows if schema has been initialized with default row. Please use constructor with 'Row[]' signature.");
                    }
                    if (this.rows[row.name]) {
                        throw new Error("Multiple rows with '" + row.name + "' name has been detected. Names has to be unique.");
                    }
                    row.schema = this;
                    this.rows[row.name] = row;
                    this.rowsAsArray.push(row);
                    this.pubSub.publish(events.rowAdded, row);
                };
                Schema.prototype._generateUniqueName = function () {
                    var name;
                    do {
                        name = 'default-' + this._uniqueNameCount;
                        this._uniqueNameCount++;
                    } while (this.hasRow(name));
                    return name;
                };
                Schema.prototype.removeRow = function (name) {
                    var row = this.rows[name];
                    if (!row) {
                        throw new Error("Row named as '" + name + "' is missing.");
                    }
                    row.schema = undefined;
                    delete this.rows[name];
                    this.rowsAsArray.splice(this.rowsAsArray.indexOf(row), 1);
                    this.pubSub.publish(events.rowRemoved, row);
                };
                Schema.prototype.addField = function (field, rowName) {
                    if (rowName === void 0) { rowName = undefined; }
                    if (!rowName && this.rowCount > 1) {
                        throw new Error('There are multiple rows registered. In order to add field name of the row has to be specified on the second parameter.');
                    }
                    if (this.rowCount === 0) {
                        this._assignDefaultRow([]);
                    }
                    if (rowName && !this.rows[rowName]) {
                        throw new Error("Row '" + rowName + "' is not defined in the schema.");
                    }
                    var row = rowName ? this.rows[rowName] : this.rows[this.rowNames[0]];
                    row.addField(field);
                };
                Object.defineProperty(Schema.prototype, "rowCount", {
                    get: function () {
                        return this.rowNames.length;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Schema.prototype, "rowNames", {
                    /**
                     * Names of all added rows.
                     */
                    get: function () {
                        return Object.keys(this.rows);
                    },
                    enumerable: true,
                    configurable: true
                });
                Schema.prototype.hasAnyRow = function () {
                    return !!this.rowCount;
                };
                Schema.prototype.hasRow = function (name) {
                    return !!this.rows[name];
                };
                Schema.prototype.forEachField = function (action) {
                    this.rowsAsArray.forEach(function (row) {
                        row.fieldsAsArray.forEach(function (field) {
                            action(field);
                        });
                    });
                };
                /**
                 * Generates model using assigned rows. Any modification to the created model won't be tracked.
                 * If modification of field value is needed do it on the field instance.
                 */
                Schema.prototype.getModel = function () {
                    var model = {};
                    utils_1.Utils.forOwn(this.rows, function (row) {
                        var rowModel = row.getModel();
                        utils_1.Utils.forOwn(rowModel, function (value, property) {
                            if (model[property] !== undefined) {
                                throw new Error("Multiple fields with '" + property + "' name has been detected.");
                            }
                            model[property] = rowModel[property];
                        });
                    });
                    return model;
                };
                Schema.prototype.validate = function (resultsPusher) {
                    if (resultsPusher === void 0) { resultsPusher = undefined; }
                    var onSignalPusher;
                    if (resultsPusher === undefined) {
                        // By default on signal pusher is used to avoid not desirable
                        // behaviour of errors being shown one by one to the user.
                        // This is especially important in case of long running
                        // validators (e.g. these which are calling external services
                        // to get the work done)
                        onSignalPusher = new validation_1.OnSignalValidationResultsPusher();
                        resultsPusher = onSignalPusher;
                    }
                    var validations = this.rowsAsArray.map(function (row) { return row.validate(resultsPusher); });
                    return Promise.all(validations).then(function (results) {
                        if (onSignalPusher)
                            onSignalPusher.signal();
                        return results;
                    }).then(utils_1.Utils.flatten);
                };
                Schema.prototype._assignDefaultRow = function (fields, columns) {
                    if (columns === void 0) { columns = undefined; }
                    if (this.defaultRow) {
                        throw new Error('Default row is already created.');
                    }
                    var row = new Row({
                        name: 'default',
                        fields: fields,
                        columns: columns
                    });
                    this.addRow(row);
                    this.defaultRow = row;
                };
                return Schema;
            }());
            exports_1("Schema", Schema);
            Row = (function () {
                function Row(row) {
                    var _this = this;
                    /**
                     * Fields associated with an instance of row. Should be added only with
                     * `addField` method. Any other usage may lead to some issues.
                     */
                    this.fields = {};
                    /**
                     * Fields as array. Always in sync with `fields` property.
                     */
                    this.fieldsAsArray = [];
                    this.pubSub = new pubsub_1.PubSub();
                    row.fields = row.fields || [];
                    this.name = row.name;
                    this.columns = row.columns === undefined ? 1 : row.columns;
                    row.fields.forEach(function (x) { return _this.addField(x); });
                }
                /**
                 * Adds new field at the end of the row.
                 */
                Row.prototype.addField = function (field) {
                    this.addFieldAt(field, this.fieldsAsArray.length);
                };
                /**
                 * Adds new field at given position.
                 */
                Row.prototype.addFieldAt = function (field, index) {
                    if (this.fields[field.name]) {
                        throw new Error("Multiple fields with '" + field.name + "' name in '" + this.name + "' row has been detected.");
                    }
                    if (index > this.fieldsAsArray.length) {
                        throw new Error("Out of range. Max: " + this.fieldsAsArray.length + ", given: " + index + ".");
                    }
                    field.row = this;
                    field.rowIndex = index;
                    this.fields[field.name] = field;
                    if (this.fieldsAsArray.length === index) {
                        this.fieldsAsArray.push(field);
                    }
                    else {
                        // adds item in the middle of an array
                        this.fieldsAsArray.push(undefined);
                        var i = this.fieldsAsArray.length - 1;
                        while (i !== index) {
                            this.fieldsAsArray[i] = this.fieldsAsArray[i - 1];
                            i--;
                        }
                        this.fieldsAsArray[index] = field;
                    }
                    this._publish(events.fieldAdded, field);
                };
                Row.prototype.removeField = function (name) {
                    var field = this.fields[name];
                    if (!!field === false) {
                        throw new Error("Field '" + name + "' doesn't exist in '" + this.name + "' row.");
                    }
                    this.fieldsAsArray.splice(this.fieldsAsArray.indexOf(field), 1);
                    delete this.fields[name].row;
                    delete this.fields[name].rowIndex;
                    delete this.fields[name];
                    this._publish(events.fieldRemoved, field);
                };
                Row.prototype._publish = function (eventName, payload) {
                    this.pubSub.publish(eventName, payload);
                    if (this.schema) {
                        this.schema.pubSub.publish(eventName, payload);
                    }
                };
                Row.prototype.hasField = function (name) {
                    return !!this.fields[name];
                };
                /**
                 * Generates model using assigned fields. Any modification to the created model won't be tracked.
                 */
                Row.prototype.getModel = function () {
                    var model = {};
                    utils_1.Utils.forOwn(this.fields, function (field) {
                        model[field.name] = field.value;
                    });
                    return model;
                };
                Row.prototype.validate = function (resultsPusher) {
                    if (resultsPusher === void 0) { resultsPusher = undefined; }
                    // TODO: test it
                    var deferred = utils_1.Utils.defer();
                    var fields = this.fieldsAsArray.filter(function (x) { return x.visibility !== fields_base_1.fieldVisibility.hidden; });
                    var promises = fields.map(function (x) {
                        return x.validate(resultsPusher).then(function (validations) {
                            return {
                                field: x,
                                validations: validations,
                                isValid: validations.every(function (x) { return x.isValid; })
                            };
                        });
                    });
                    Promise.all(promises).then(function (fields) {
                        deferred.resolve(fields);
                    }, function () { throw new Error("Field validation has failed due to unknown reason."); });
                    return deferred.promise;
                };
                return Row;
            }());
            exports_1("Row", Row);
        }
    }
});
