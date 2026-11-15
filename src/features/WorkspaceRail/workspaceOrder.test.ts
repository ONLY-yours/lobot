import { describe, expect, it } from 'vitest';

import { sortByWorkspaceOrder } from './workspaceOrder';

const list = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('sortByWorkspaceOrder', () => {
  it('keeps the server order when the user never rearranged', () => {
    expect(ids(sortByWorkspaceOrder(list('a', 'b', 'c'), undefined))).toEqual(['a', 'b', 'c']);
    expect(ids(sortByWorkspaceOrder(list('a', 'b', 'c'), []))).toEqual(['a', 'b', 'c']);
  });

  it('lays the list out in the saved order', () => {
    expect(ids(sortByWorkspaceOrder(list('a', 'b', 'c'), ['c', 'a', 'b']))).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('skips workspaces the user has left', () => {
    expect(ids(sortByWorkspaceOrder(list('a', 'c'), ['c', 'gone', 'a']))).toEqual(['c', 'a']);
  });

  it('puts workspaces the order does not know yet after it, in server order', () => {
    expect(ids(sortByWorkspaceOrder(list('new-1', 'a', 'new-2', 'b'), ['b', 'a']))).toEqual([
      'b',
      'a',
      'new-1',
      'new-2',
    ]);
  });
});
