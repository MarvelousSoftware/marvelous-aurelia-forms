import {createConfiguration} from './config';

describe('createConfiguration', () => {

  it('should create valid configuration without parent', () => {
    let conf = createConfiguration({ fields: { select: 1 } }, undefined);

    expect(conf.fields.select).toBe(1);
    expect(conf.tabIndex).toBe(undefined);
    expect(conf.fields.numberInput).toBe(undefined);
  });

  it('should create valid configuration with defined parent', () => {
    let parent = { fields: { select: 1 } };
    let base = {};

    let conf = createConfiguration(base, parent);

    expect(conf.fields.select).toBe(1);
    expect(conf.tabIndex).toBe(undefined);
    expect(conf.fields.numberInput).toBe(undefined);
  });

  it('should create valid configuration even when there are overlaps in parent and base configs', () => {
    let parent = { fields: { checkboxInput: 2 } };
    let base = { fields: { select: 1 } };

    let conf = createConfiguration(base, parent);

    expect(conf.fields.checkboxInput).toBe(2);
    expect(conf.fields.select).toBe(1);
  });

  it('should get value from first configuration', () => {
    let parent = { fields: { select: 2, numberInput: 3 } };
    let base = { fields: { select: 1 } };

    let conf = createConfiguration(base, parent);

    expect(conf.fields.select).toBe(1);
    expect(conf.tabIndex).toBe(undefined);
    expect(conf.fields.numberInput).toBe(3);
  });

});