import { flexRender } from '@tanstack/react-table';

const SurveysCard = ({ row }) => {
  const cells = row.getVisibleCells();
  const patientCell = cells.find(cell => cell.column.id === 'name');
  const dateCell = cells.find(cell => cell.column.id === 'date');
  const timeCell = cells.find(cell => cell.column.id === 'time');
  const ratingCell = cells.find(cell => cell.column.id === 'rating');
  const actionCell = cells.find(cell => cell.column.id === 'survey');

  return (
    <div className="relative px-1 py-5 bg-white rounded-md">
      <div className="flex items-center justify-between gap-1 pb-5">
        <div>{flexRender(ratingCell.column.columnDef.cell, ratingCell.getContext())}</div>
        <div>{flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}</div>
      </div>
      <div className="flex items-center justify-between gap-1">
        <div className="text-center shadow-sm border border-[#E8E8E8] rounded-lg p-2 flex-1 flex flex-col items-center text-body">
          <h3 className="text-primary pb-2">Client</h3>
          <p className="text-body text-center text-secondary-light">
            {flexRender(patientCell.column.columnDef.cell, patientCell.getContext())}
          </p>
        </div>
        <div className="text-center shadow-sm border border-[#E8E8E8] rounded-lg p-2 flex-1 text-body">
          <h3 className="text-primary pb-2">Date</h3>
          <p className="text-body text-secondary-light">
            {flexRender(dateCell.column.columnDef.cell, dateCell.getContext())}
          </p>
        </div>
        <div className="text-center shadow-sm border border-[#E8E8E8] rounded-lg p-2 flex-1 text-body flex flex-col items-center">
          <h3 className="text-primary pb-2">Time</h3>
          <p className="text-body text-center text-secondary-light">
            {flexRender(timeCell.column.columnDef.cell, timeCell.getContext())}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveysCard;
