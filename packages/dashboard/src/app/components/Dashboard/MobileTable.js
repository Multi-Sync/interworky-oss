import React from 'react';
import { v4 as uuidv4 } from 'uuid';

const MobileTable = ({ table, renderMobileCard }) => (
  <div className="min-h-screen pb-16 space-y-4">
    {table.getRowModel().rows.map(row => (
      <React.Fragment key={uuidv4()}>{renderMobileCard(row)}</React.Fragment>
    ))}
  </div>
);

export default MobileTable;
