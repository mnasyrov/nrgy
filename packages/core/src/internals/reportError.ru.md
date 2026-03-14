# `reportError.ts`

## Назначение файла

Модуль предоставляет `nrgyReportError`, нормализованную функцию репорта ошибок
для окружения выполнения.

## Общая информация

Некоторые runtime-callback'и, например отложенные lifecycle-хуки контроллеров,
должны публиковать неожиданные ошибки, не ломая внутреннюю логику очистки.
Модуль использует `globalThis.reportError`, если он доступен, и no-op fallback
в остальных случаях.

## Концептуальная архитектура

Реализация предельно компактна:

1. Проверяет наличие вызываемой `globalThis.reportError`.
2. Использует нативную функцию, если она существует.
3. Иначе экспортирует no-op функцию.

Такой подход делает host error reporting опциональным, но сохраняет единый
call site.

## Описание публичного API

### `nrgyReportError: (error: unknown) => void`

- Сообщает о неожиданных ошибках в host-окружение, если поддерживается.
- В средах без `reportError` молча ничего не делает.

## Примеры использования

```ts
import { nrgyReportError } from './reportError';

try {
  throw new Error('unexpected');
} catch (error) {
  nrgyReportError(error);
}
```

---

Translation: [EN](./reportError.md) | RU
