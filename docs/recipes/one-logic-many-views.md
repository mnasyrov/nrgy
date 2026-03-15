# One Logic, Several Views

## Task

Reuse one business-logic layer across several UI representations.

## Solution

Keep the logic in one view model and let different views consume the same
public contract.

## Code

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

export const InboxViewModel = declareViewModel(({ scope }) => {
  const unreadCount = scope.atom(3);

  return {
    state: {
      unreadCount: readonlyAtom(unreadCount),
    },
    markAllRead: () => unreadCount.set(0),
  };
});
```

```tsx
import { useAtom } from '@nrgyjs/react';
import { withViewModel } from '@nrgyjs/react';

const InboxBadge = withViewModel(InboxViewModel)(({ viewModel }) => {
  const unreadCount = useAtom(viewModel.state.unreadCount);

  return <span>{unreadCount}</span>;
});

const InboxPage = withViewModel(InboxViewModel)(({ viewModel }) => {
  const unreadCount = useAtom(viewModel.state.unreadCount);

  return (
    <section>
      <h1>Unread: {unreadCount}</h1>
      <button onClick={viewModel.markAllRead}>Mark all read</button>
    </section>
  );
});
```

## What to Watch Out For

- keep the public contract small and UI-agnostic
- avoid leaking view-specific formatting into the shared logic
- reuse logic, not rendered markup

## Common Mistakes

- duplicating the same workflow for each screen or widget
- putting presentation-specific fields into the view model too early
- coupling reusable logic to one framework-specific component
