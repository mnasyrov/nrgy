# Form with Multiple Fields and Batch

## Task

Build a small form with several fields and ensure observers only see consistent
state transitions.

## Solution

Keep form state inside a view model, derive validation with `compute()`, and
use `batch()` when several fields must be updated as one logical step.

## Code

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

## What to Watch Out For

- a form is usually better modeled as a view model than as scattered UI state
- each field may stay independent, but some updates still belong to one
  transition
- `compute()` should only derive values, not write them
- `batch()` matters when intermediate states would be misleading

## Common Mistakes

- updating related fields one by one when observers expect a single transition
- performing validation side effects inside `compute()`
- storing too much form workflow directly in UI components
