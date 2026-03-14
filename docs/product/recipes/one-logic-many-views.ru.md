# Одна логика, несколько представлений

## Задача

Переиспользовать один слой бизнес-логики в нескольких UI-представлениях.

## Решение

Держать логику в одной view model и позволять разным views
потреблять один и тот же публичный контракт.

## Код

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

## На что обратить внимание

- публичный контракт должен оставаться маленьким и UI-agnostic
- в общую логику не стоит рано протаскивать view-specific formatting
- переиспользовать нужно логику, а не отрендеренную разметку

## Частые ошибки

- дублировать один и тот же workflow для каждого экрана или виджета
- слишком рано добавлять во view model presentation-specific fields
- жёстко привязывать переиспользуемую логику к одному framework-specific
  компоненту
