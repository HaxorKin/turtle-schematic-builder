import { Action } from '../components/action';
import { AstarNode } from '../components/astar-node';

// Extract the sequence of actions from the goal node
export function getActionSequenceFromGoalNode(goalNode: AstarNode): Action[] {
  const sequence: Action[] = [];
  let currentNode: AstarNode | undefined = goalNode;

  while (currentNode) {
    if (currentNode.action) sequence.push(currentNode.action);
    currentNode = currentNode.parent;
  }

  return sequence.reverse();
}
