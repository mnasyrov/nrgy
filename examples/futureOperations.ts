import { effect } from '../src/core/effect';
import { signal } from '../src/core/signal';
import { futureOperation } from '../src/core/tools/futureOperation';

const fetchAppFile = signal<string>();

const fetchJson = futureOperation((url: string) =>
  fetch(url).then((response) => response.json()),
);

const { next: onFileLoaded } = effect(fetchAppFile, (fileName) =>
  fetchJson(`https://example.com/${fileName}`),
);

effect(onFileLoaded, (json) => {
  console.log(json);
});

fetchAppFile('myfile.json');
