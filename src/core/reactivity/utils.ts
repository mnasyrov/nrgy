type LabelNode = { id: number; label?: string };

/** @internal */
export function getNodeLabel(node: LabelNode): string {
  return node.label ?? `#${node.id}`;
}

/** @internal */
export function getSourceAtomNodeLabel(node: LabelNode): string {
  return `SourceAtom ${getNodeLabel(node)}`;
}
