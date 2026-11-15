import { describe, expect, it } from 'vitest';

import { activityLabel } from './activityLabel';

describe('activityLabel', () => {
  it.each([
    ['3 位成员正在工作中…', '3 位成员正在工作中'],
    ['Alice and Bob are working…', 'Alice and Bob are working'],
    ['Alice · Working...', 'Alice · Working'],
    ['Agents receiving your message…', 'Agents receiving your message'],
    ['Alice · Typing… ', 'Alice · Typing'],
    ['Alice · Waiting for device approval', 'Alice · Waiting for device approval'],
    ['Agent... Smith · Replied', 'Agent... Smith · Replied'],
  ])('avoids duplicate typing dots in %s', (label, expected) => {
    expect(activityLabel(label)).toBe(expected);
  });
});
