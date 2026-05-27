import type { LayoutItem } from '../types';

export interface GridRange {
  start: number;
  span: number;
}

export function parseGridValue(value: string): GridRange {
  const parts = value.split('/').map((p) => p.trim());
  const start = parseInt(parts[0]) || 1;

  if (parts[1]?.startsWith('span')) {
    const span = parseInt(parts[1].replace('span', '').trim()) || 1;
    return { start, span };
  } else if (parts[1]) {
    const end = parseInt(parts[1]) || start + 1;
    return { start, span: Math.max(1, end - start) };
  }

  return { start, span: 1 };
}

export function formatGridValue(range: GridRange): string {
  return `${range.start} / span ${range.span}`;
}

export function getItemRanges(item: LayoutItem): { col: GridRange; row: GridRange } {
  return {
    col: parseGridValue(item.gridColumn),
    row: parseGridValue(item.gridRow),
  };
}

/**
 * Find the next free slot in the grid for an item of given span.
 * Returns { col, row } where the item should be placed (1-indexed).
 */
export function findNextSlot(
  items: LayoutItem[],
  columns: number,
  span = 4,
  rowSpan = 1
): { col: number; row: number } {
  const occupied = new Set<string>();
  let maxRow = 0;

  for (const item of items) {
    const { col, row } = getItemRanges(item);
    // Skip rows that use 'auto' — they get placed by the browser
    if (Number.isNaN(row.start)) continue;
    for (let r = row.start; r < row.start + row.span; r++) {
      for (let c = col.start; c < col.start + col.span; c++) {
        occupied.add(`${r}-${c}`);
      }
      if (r > maxRow) maxRow = r;
    }
  }

  const effectiveSpan = Math.min(span, columns);

  for (let row = 1; row <= maxRow + 1; row++) {
    for (let col = 1; col <= columns - effectiveSpan + 1; col++) {
      let fits = true;
      for (let r = row; r < row + rowSpan && fits; r++) {
        for (let c = col; c < col + effectiveSpan; c++) {
          if (occupied.has(`${r}-${c}`)) {
            fits = false;
            break;
          }
        }
      }
      if (fits) return { col, row };
    }
  }

  return { col: 1, row: maxRow + 1 };
}

/**
 * Ensure an item has an explicit numeric gridRow. If row.start is NaN (e.g. 'auto'),
 * place the item at the next free row.
 */
export function ensureExplicitRow(
  item: LayoutItem,
  items: LayoutItem[],
  columns: number
): LayoutItem {
  const { col, row } = getItemRanges(item);
  const rowStartNum = parseInt(item.gridRow.split('/')[0].trim());
  if (!Number.isNaN(rowStartNum)) return item;

  const slot = findNextSlot(items, columns, col.span, row.span);
  return {
    ...item,
    gridColumn: formatGridValue({ start: col.start, span: col.span }),
    gridRow: formatGridValue({ start: slot.row, span: row.span }),
  };
}
