"use client";

import { FixedSizeList as List } from 'react-window';

export default function VirtualizedPortfolioTable({ rows, renderRow, rowHeight = 56, height = 600 }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const Item = ({ index, style }) => renderRow(rows[index], index, style);

  return (
    <List
      height={height}
      itemCount={rows.length}
      itemSize={rowHeight}
      width="100%"
    >
      {Item}
    </List>
  );
}


