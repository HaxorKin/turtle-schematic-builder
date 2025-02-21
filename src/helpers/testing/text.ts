const segmenter = new Intl.Segmenter();
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), ({ segment }) => segment);
}
