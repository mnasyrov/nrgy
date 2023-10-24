export function dump(message: string, value?: any): void {
  const clone =
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));

  if (clone === undefined) {
    console.log(`!!! ${message}`);
  } else {
    console.log(`!!! ${message}`, clone);
  }
}
