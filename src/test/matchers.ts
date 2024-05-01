export function expectEffectContext() {
  return expect.objectContaining({ cleanup: expect.any(Function) });
}
