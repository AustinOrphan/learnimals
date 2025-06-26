/**
 * Sample Test to verify testing framework setup
 * This file can be removed once real tests are running
 */

import { describe, it, expect } from 'vitest';

describe('Testing Framework Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
  
  it('should work with objects', () => {
    const obj = { name: 'Learnimals', type: 'Educational App' };
    expect(obj).toEqual({
      name: 'Learnimals',
      type: 'Educational App'
    });
  });
  
  it('should work with arrays', () => {
    const subjects = ['Math', 'Science', 'Reading', 'Art', 'Coding'];
    expect(subjects).toContain('Math');
    expect(subjects.length).toBe(5);
  });
});