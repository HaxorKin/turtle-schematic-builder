# Turtle Schematic Build Planner

Build Planner is an advanced automation tool that generates optimized build instructions for
ComputerCraft turtles in Minecraft. It analyzes NBT schematics and calculates the most efficient
sequence of movements and block placements using a modified A\* search algorithm.

## Features

- **NBT Schematic Parsing**: Imports and processes Minecraft NBT schematic files
- **Optimal Placement Order**: Uses a modified A\* algorithm with dynamic heuristic adjustment
- **Block Dependency Management**: Handles complex block dependencies and placement constraints
- **Resource Management**: Optimizes inventory usage with resupply planning
- **Liquid Handling**: Special handling for water, lava and other liquid blocks
- **Complex Structure Support**: Handles various Minecraft blocks including redstone components, stairs, torches, and decorative blocks
- **Automated Script Generation**: Outputs ready-to-use Lua scripts for CC:Tweaked turtles

## How It Works

The planner uses a sophisticated multi-stage process:

1. **Schematic Analysis**: Validates the given NBT schematic and optionally pads sides with air for better turtle movement
2. **Block Type Classification**: Categorizes blocks based on placement requirements (directional blocks, liquids, wall-attached blocks, etc.)
3. **Block Dependency Mapping**: Creates a dependency graph to ensure blocks are placed in a valid order
4. **Optional Slicing**: Splits large builds into manageable chunks to optimize pathfinding
5. **A\* Pathfinding with Heuristic Optimization**:
   - Uses a priority queue to explore the most promising paths first
   - Dynamically adjusts heuristic multipliers to balance exploration and exploitation
   - Tracks reachability to ensure the turtle never gets trapped
   - Tracks which sides a block can be placed from
6. **Script Generation**: Creates a low CPU usage Lua script with:
   - Movement instructions (forward, back, up, down, turn)
   - Block placement commands
   - Inventory management
   - Refueling logic
   - Error handling and recovery <sup>Unloading not supported at the moment

## Block Placement Intelligence

The planner understands complex Minecraft block placement rules including:

- Direction-dependent blocks (pistons, observers, dispensers)
- Wall-attached blocks (torches, levers, signs)
- Bottom-supported blocks (pressure plates, doors)
- Axis-aligned blocks (logs)
- Liquid handling (water, lava)
- Stair orientation and position
