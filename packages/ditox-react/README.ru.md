# Пакет @nrgyjs/ditox-react

## Назначение пакета

Пакет `@nrgyjs/ditox-react` связывает React-ориентированные контроллеры и
view-model Nrgy с контейнером зависимостей `ditox-react`.

## Общая информация

Пакет предоставляет React-компонент-расширение, который читает активный
контейнер из `ditox-react` и передает его в создание контроллеров Nrgy через
`@nrgyjs/react`.

## Установка пакета

```bash
npm install @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react
```

```bash
yarn add @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react
```

```bash
pnpm add @nrgyjs/core @nrgyjs/ditox @nrgyjs/react @nrgyjs/ditox-react ditox ditox-react react
```

## Концептуальная архитектура

Пакет намеренно сосредоточен вокруг одного компонента:

1. `useDependencyContainer()` читает активный DI-контейнер из React Context.
2. `provideDependencyContainer()` превращает контейнер в Nrgy
   extension-provider.
3. `NrgyControllerExtension` внедряет provider в поддерево, чтобы
   `useController()` мог создавать контроллеры и view-model с поддержкой DI.

## Документация по функционалу

- [DitoxNrgyExtension](./src/DitoxNrgyExtension.ru.md): React-мост между
  `ditox-react` и созданием контроллеров Nrgy.

## Примеры использования

```tsx
import React from 'react';
import { DitoxNrgyExtension } from '@nrgyjs/ditox-react';

export function App() {
  return (
    <DitoxNrgyExtension>
      <FeatureRoot />
    </DitoxNrgyExtension>
  );
}
```
