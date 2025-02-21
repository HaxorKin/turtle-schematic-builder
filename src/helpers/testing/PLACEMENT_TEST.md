# Placement Test Explanation

The palette:

```typescript
const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
};
```

The layout:

```
▶️🟧✖️
🟨✖️🟨
✖️🟨✖️
```

represents a turtle (`▶️`) facing the orange block (`🟧`) to its south, ready to place a block in that direction.

## Turtle Variants

- `🔼` The turtle is facing **north** and places a block **in front** of it.
- `🔽` The turtle is facing **south** and places a block **in front** of it.
- `▶️` The turtle is facing **east** and places a block **in front** of it.
- `◀️` The turtle is facing **west** and places a block **in front** of it.
- `⏫` The turtle is facing **north** and places a block **above** it.
- `⏬` The turtle is facing **south** and places a block **above** it.
- `⏩` The turtle is facing **east** and places a block **above** it.
- `⏪` The turtle is facing **west** and places a block **above** it.
- `⬆️` The turtle is facing **north** and places a block **below** it.
- `⬇️` The turtle is facing **south** and places a block **below** it.
- `➡️` The turtle is facing **east** and places a block **below** it.
- `⬅️` The turtle is facing **west** and places a block **below** it.

You can define multiple layers (bottom to top) by separating them with empty lines.
