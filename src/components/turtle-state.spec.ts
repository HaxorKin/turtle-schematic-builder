import { TurtleState } from './turtle-state';
import { EAST, NORTH, SOUTH, Vector, WEST, vectorsEqual } from './vector';

describe('TurtleState', () => {
  describe('constructor', () => {
    it('should initialize with position and direction', () => {
      const position: Vector = [1, 2, 3];
      const direction = EAST;
      const state = new TurtleState(position, direction);

      expect(state.position).toEqual(position);
      expect(state.direction).toEqual(direction);
    });
  });

  describe('movement methods', () => {
    let initialState: TurtleState;

    beforeEach(() => {
      initialState = new TurtleState([0, 0, 0], EAST);
    });

    describe('forward', () => {
      it('should move in the direction faced', () => {
        const newState = initialState.forward();

        expect(vectorsEqual(newState.position, [1, 0, 0])).toBe(true);
        expect(vectorsEqual(newState.direction, EAST)).toBe(true);
      });

      it('should work with different directions', () => {
        const northState = new TurtleState([0, 0, 0], NORTH);
        const newState = northState.forward();

        expect(vectorsEqual(newState.position, [0, 0, -1])).toBe(true);
      });
    });

    describe('back', () => {
      it('should move opposite to the direction faced', () => {
        const newState = initialState.back();

        expect(vectorsEqual(newState.position, [-1, 0, 0])).toBe(true);
        expect(vectorsEqual(newState.direction, EAST)).toBe(true);
      });
    });

    describe('up', () => {
      it('should move up regardless of direction', () => {
        const newState = initialState.up();

        expect(vectorsEqual(newState.position, [0, 1, 0])).toBe(true);
        expect(vectorsEqual(newState.direction, EAST)).toBe(true);
      });
    });

    describe('down', () => {
      it('should move down regardless of direction', () => {
        const newState = initialState.down();

        expect(vectorsEqual(newState.position, [0, -1, 0])).toBe(true);
        expect(vectorsEqual(newState.direction, EAST)).toBe(true);
      });
    });
  });

  describe('turning methods', () => {
    let initialState: TurtleState;

    beforeEach(() => {
      initialState = new TurtleState([0, 0, 0], NORTH);
    });

    describe('turnLeft', () => {
      it('should rotate direction 90 degrees left', () => {
        const newState = initialState.turnLeft();

        expect(vectorsEqual(newState.direction, WEST)).toBe(true);
        expect(vectorsEqual(newState.position, [0, 0, 0])).toBe(true);
      });

      it('should perform full rotation after 4 left turns', () => {
        let state = initialState;

        state = state.turnLeft(); // WEST
        expect(vectorsEqual(state.direction, WEST)).toBe(true);

        state = state.turnLeft(); // SOUTH
        expect(vectorsEqual(state.direction, SOUTH)).toBe(true);

        state = state.turnLeft(); // EAST
        expect(vectorsEqual(state.direction, EAST)).toBe(true);

        state = state.turnLeft(); // NORTH
        expect(vectorsEqual(state.direction, NORTH)).toBe(true);
      });
    });

    describe('turnRight', () => {
      it('should rotate direction 90 degrees right', () => {
        const newState = initialState.turnRight();

        expect(vectorsEqual(newState.direction, EAST)).toBe(true);
        expect(vectorsEqual(newState.position, [0, 0, 0])).toBe(true);
      });

      it('should perform full rotation after 4 right turns', () => {
        let state = initialState;

        state = state.turnRight(); // EAST
        expect(vectorsEqual(state.direction, EAST)).toBe(true);

        state = state.turnRight(); // SOUTH
        expect(vectorsEqual(state.direction, SOUTH)).toBe(true);

        state = state.turnRight(); // WEST
        expect(vectorsEqual(state.direction, WEST)).toBe(true);

        state = state.turnRight(); // NORTH
        expect(vectorsEqual(state.direction, NORTH)).toBe(true);
      });
    });
  });

  describe('combined movements', () => {
    it('should handle complex movement sequences', () => {
      let state = new TurtleState([0, 0, 0], NORTH);

      state = state.forward().forward(); // Move 2 blocks north
      expect(vectorsEqual(state.position, [0, 0, -2])).toBe(true);

      state = state.turnRight(); // Face east
      expect(vectorsEqual(state.direction, EAST)).toBe(true);

      state = state.forward().up(); // Move 1 block east and 1 block up
      expect(vectorsEqual(state.position, [1, 1, -2])).toBe(true);

      state = state.turnLeft().turnLeft(); // Face west
      expect(vectorsEqual(state.direction, WEST)).toBe(true);

      state = state.back(); // Move 1 block east (opposite of west)
      expect(vectorsEqual(state.position, [2, 1, -2])).toBe(true);
    });
  });
});
