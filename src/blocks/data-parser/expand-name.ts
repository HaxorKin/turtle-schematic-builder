import assert from 'assert';

const wood = [
  'oak',
  'spruce',
  'birch',
  'jungle',
  'acacia',
  'dark_oak',
  'mangrove',
  'cherry',
  'pale_oak',
] as const;
const hyphae = ['crimson', 'warped'] as const;
const coral = ['tube', 'brain', 'bubble', 'fire', 'horn'] as const;
const color = [
  'white',
  'light_gray',
  'gray',
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'cyan',
  'light_blue',
  'blue',
  'purple',
  'magenta',
  'pink',
] as const;

export function expandName(
  template: string,
  arrays: Record<string, readonly string[]> = {
    wood,
    hyphae,
    coral,
    color,
  },
): string[] {
  // If no placeholders, return as is
  if (!template.includes('{')) return [template];

  // Find the first placeholder
  const match = /\{([^{}]+)\}/.exec(template);
  if (!match) return [template];

  const [fullPlaceholder, placeholderContent] = match;
  assert(placeholderContent);

  const items = placeholderContent.split(',').map((item) => item.trim());

  // Collect all substitution values
  const substitutions = items.flatMap((item) => {
    // Check if the item is a quoted string
    if (item.startsWith("'") && item.endsWith("'")) {
      return item.slice(1, -1); // Remove quotes
    }
    // Check if the item is a reference to a known array
    const array = arrays[item];
    if (array) {
      return array;
    }

    throw new Error(
      `[Name expansion] Unknown array name: ${item}. Known arrays: ${Object.keys(arrays).join(', ')}`,
    );
  });

  // Apply each substitution and recursively expand the resulting templates
  const startIdx = match.index;
  const endIdx = startIdx + fullPlaceholder.length;
  const prefix = template.substring(0, startIdx);
  const suffix = template.substring(endIdx);

  return substitutions.flatMap((sub) => expandName(`${prefix}${sub}${suffix}`, arrays));
}
