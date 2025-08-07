import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvObjects } from '../../src/lib/csv';

describe('parseCsv', () => {
  it('parses plain rows', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('maps rows to objects by header', () => {
    expect(parseCsvObjects('id,name\n1,Throw\n2,Pot')).toEqual([
      { id: '1', name: 'Throw' },
      { id: '2', name: 'Pot' },
    ]);
  });
});
