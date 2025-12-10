import * as fc from 'fast-check';

describe('Test Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should run a fast-check property test', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 100 }
    );
  });
});
