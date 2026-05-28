import { atom, compute, createScope } from '@nrgyjs/core';
import { render, waitFor } from '@testing-library/react';
import React, { type FC, useEffect } from 'react';
import { describe, expect, it } from 'vitest';

import { useAtom } from './useAtom';

describe('Stories feed reproduction (rendering children call setItemIndex)', () => {
  it('feed compute resolves to latest itemIndex after N children render and set it', async () => {
    for (const N of [5, 10, 11, 12, 15, 20]) {
      const itemIndex = atom<number | null>(null);
      const allStories = atom<string[]>(
        Array.from({ length: N }, (_, i) => `Story-${i}`),
      );

      const feed = compute(() => {
        const index = itemIndex();
        if (index !== null) {
          return allStories()[index];
        }
        return null;
      });

      const setItemIndex = (i: number) => {
        itemIndex.set(i);
      };

      const Child: FC<{ index: number }> = ({ index }) => {
        useEffect(() => {
          setItemIndex(index);
        }, [index]);
        return <div data-testid={`child-${index}`}>child {index}</div>;
      };

      const Viewer: FC = () => {
        const story = useAtom(feed);
        return (
          <div data-testid="viewer">
            <div data-testid="story">{story ?? 'NULL'}</div>
            {Array.from({ length: N }, (_, i) => (
              <Child key={i} index={i} />
            ))}
          </div>
        );
      };

      const { unmount, getByTestId } = render(<Viewer />);

      await waitFor(() => {
        const text = getByTestId('story').textContent;
        expect(text).toBe(`Story-${N - 1}`);
      });

      unmount();
    }
  });

  it('scope.effect on itemIndex fires after rapid sets', async () => {
    for (const N of [10, 12, 15, 20]) {
      const itemIndex = atom<number | null>(null);
      const scope = createScope();
      const results: Array<number | null> = [];

      scope.effect(itemIndex, (v) => results.push(v));

      const setItemIndex = (i: number) => {
        itemIndex.set(i);
      };

      const Child: FC<{ index: number }> = ({ index }) => {
        useEffect(() => {
          setItemIndex(index);
        }, [index]);
        return <div>child {index}</div>;
      };

      const Viewer: FC = () => (
        <>
          {Array.from({ length: N }, (_, i) => (
            <Child key={i} index={i} />
          ))}
        </>
      );

      const { unmount } = render(<Viewer />);

      await waitFor(() => {
        expect(results[results.length - 1]).toBe(N - 1);
      });

      unmount();
      scope.destroy();
    }
  });
});
