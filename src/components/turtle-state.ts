import { addVectors, DOWN, subVectors, UP, Vector } from './vector';

export class TurtleState {
  constructor(
    public readonly position: Vector,
    public readonly direction: Vector,
  ) {}

  forward() {
    return new TurtleState(addVectors(this.position, this.direction), this.direction);
  }

  back() {
    return new TurtleState(subVectors(this.position, this.direction), this.direction);
  }

  up() {
    return new TurtleState(addVectors(this.position, UP), this.direction);
  }

  down() {
    return new TurtleState(addVectors(this.position, DOWN), this.direction);
  }

  turnLeft() {
    const [dx, dy, dz] = this.direction;
    return new TurtleState(this.position, [dz, dy, -dx]);
  }

  turnRight() {
    const [dx, dy, dz] = this.direction;
    return new TurtleState(this.position, [-dz, dy, dx]);
  }
}
