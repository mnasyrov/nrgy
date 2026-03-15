# Счётчик

## Задача

Собрать самый маленький полезный feature-пример на controller:

- локальное состояние
- одно или два actions
- явный lifecycle контроллера

## Решение

Использовать controller с одним atom, отдать его наружу как readonly state и
держать все изменения внутри явных actions.

## Код

```ts
import { declareController, readonlyAtom } from '@nrgyjs/core';

export const CounterController = declareController(({ scope }) => {
  const count = scope.atom(0, { label: 'count' });

  return {
    state: {
      count: readonlyAtom(count),
    },
    increase: () => count.update((value) => value + 1),
    decrease: () => count.update((value) => value - 1),
  };
});

const controller = new CounterController();

controller.increase();
console.log(controller.state.count());

controller.destroy();
```

## На что обратить внимание

- во view лучше отдавать readonly state
- все записи в state должны жить в именованных actions
- controller надо уничтожать, когда feature завершается

## Частые ошибки

- отдавать во UI writable atoms напрямую
- менять state из случайного внешнего кода
- забывать вызывать `destroy()` в неглобальных сценариях
