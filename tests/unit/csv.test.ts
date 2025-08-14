import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvObjects } from '../../src/lib/csv';

describe('parseCsv', () => {
  it('parses plain rows', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quotes, escaped quotes, commas and newlines inside fields', () => {
    const text = 'name,note\n"Pot, clay","He said ""wow"""\n"multi\nline",x\r\n';
    expect(parseCsv(text)).toEqual([
      ['name', 'note'],
      ['Pot, clay', 'He said "wow"'],
      ['multi\nline', 'x'],
    ]);
  });

  it('keeps empty fields and a last line without newline', () => {
    expect(parseCsv('a,,c\n,,')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('maps rows to objects by header', () => {
    expect(parseCsvObjects('id,name\n1,Throw\n2,Pot')).toEqual([
      { id: '1', name: 'Throw' },
      { id: '2', name: 'Pot' },
    ]);
  });
});
