import { appendToList } from '../internals/list';

import {
  BaseSourceNode,
  isComputedNode,
  ObserverNode,
  ObserverRef,
} from './types.internal';

type LabelNode = { id: number; label?: string };

/** @internal */
export function getNodeLabel(node: LabelNode): string {
  return node.label ?? `#${node.id}`;
}

/** @internal */
export function getSourceAtomNodeLabel(node: LabelNode): string {
  return `SourceAtom ${getNodeLabel(node)}`;
}

/** @internal */
export function getObserverRef(node: ObserverNode): ObserverRef {
  if (!node.ref) {
    node.ref = { node };
  }
  return node.ref;
}

/** @internal */
export function hasNoObservers(node: BaseSourceNode): boolean {
  return !node.computedRefs.head && !node.effectRefs.head;
}

/** @internal */
export function appendObserverToNode(
  node: BaseSourceNode,
  observer: ObserverNode,
): void {
  const observerList = isComputedNode(observer)
    ? node.computedRefs
    : node.effectRefs;
  appendToList(observerList, getObserverRef(observer));
}
