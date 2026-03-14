# Интеграции

## Назначение

Этот раздел показывает, как Nrgy.js связывается с UI-фреймворками, DI и
сторонними реактивными системами.

## Основные пути интеграции

- [React](./react.ru.md): hooks, создание controllers, подписка на atoms и
  higher-level React bindings.
- [Dependency Injection](./dependency-injection.ru.md): `ditox`,
  `ditox-react`, wiring container и injected controller dependencies.

## RxJS и rx-effects

Nrgy.js умеет интегрироваться и с потоковыми реактивными библиотеками.

`@nrgyjs/rxjs`:

- `observe()`
- `fromObservable()`

`@nrgyjs/rx-effects`:

- `toQuery()`
- `fromQuery()`

`@nrgyjs/rxjs` остаётся полезной интеграцией, если часть системы уже построена
на RxJS streams, а остальная часть хочет использовать atoms и controller
lifecycle.

`@nrgyjs/rx-effects` теперь лучше считать legacy или advanced интеграцией.
Библиотека `rx-effects` deprecated и больше не развивается активно, поэтому для
большинства команд этот путь становится менее актуальным.

## Практический ориентир

- начинать с [React](./react.ru.md), если речь идёт о wiring UI-компонентов
- использовать [Dependency Injection](./dependency-injection.ru.md), когда
  инфраструктурные сервисы должны резолвиться из container
- воспринимать Rx-интеграции как advanced или ecosystem-specific сценарий
- воспринимать `rx-effects` как legacy-oriented путь, если только не нужно
  поддерживать существующий код
