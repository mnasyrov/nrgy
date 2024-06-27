import { ListItem, removeFromList } from './list';

describe('removeFromList()', () => {
  it('should remove nodes from the linked list', () => {
    const list: ListItem<{ value: number }> = {
      value: 1,
      next: { value: 2, next: { value: 3, next: { value: 4 } } },
    };

    const result = removeFromList(list, (node) => node.value % 2 === 0);
    expect(result).toEqual({ value: 1, next: { value: 3 } });
  });
});
