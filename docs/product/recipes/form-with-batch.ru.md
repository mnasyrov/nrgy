# Форма с несколькими полями и batch

## Задача

Сделать небольшую форму с несколькими полями так, чтобы наблюдатели видели
только согласованные переходы состояния.

## Решение

Держать состояние формы внутри view model, строить валидацию через `compute()`
и использовать `batch()`, когда несколько полей должны обновиться как один
логический шаг.

## Код

```ts
import { batch, compute, declareViewModel, readonlyAtom } from '@nrgyjs/core';

export const ProfileFormViewModel = declareViewModel(({ scope }) => {
  const firstName = scope.atom('');
  const lastName = scope.atom('');

  const fullName = compute(() => `${firstName()} ${lastName()}`.trim());
  const isValid = compute(
    () => firstName().length > 0 && lastName().length > 0,
  );

  return {
    state: {
      firstName: readonlyAtom(firstName),
      lastName: readonlyAtom(lastName),
      fullName: readonlyAtom(fullName),
      isValid: readonlyAtom(isValid),
    },
    fillFromProfile: (profile: { firstName: string; lastName: string }) => {
      batch(() => {
        firstName.set(profile.firstName);
        lastName.set(profile.lastName);
      });
    },
    setFirstName: (value: string) => firstName.set(value),
    setLastName: (value: string) => lastName.set(value),
  };
});
```

## На что обратить внимание

- форму обычно лучше моделировать через view model, а не через разрозненный
  UI-state
- поля могут оставаться независимыми, но часть обновлений всё равно образует
  единый переход состояния
- `compute()` должен только выводить значения, а не записывать их
- `batch()` важен, когда промежуточные состояния были бы вводящими в заблуждение

## Частые ошибки

- обновлять связанные поля по одному, когда наблюдатели ожидают один переход
- выполнять side effects внутри `compute()`
- держать слишком много form workflow прямо в UI-компонентах
