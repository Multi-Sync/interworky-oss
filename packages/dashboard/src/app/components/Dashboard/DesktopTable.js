import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { v4 as uuidv4 } from 'uuid';

const DesktopTable = ({ table }) => (
  <table className="min-w-full bg-white/80 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-gray-300 dark:border-primary/20 rounded-xl overflow-hidden">
    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-primary/20 dark:to-primary/20 backdrop-blur-sm border-b border-gray-300 dark:border-primary/30 rounded-t-xl">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={uuidv4()}>
          {headerGroup.headers.map(header => (
            <th
              key={uuidv4()}
              scope="col"
              className="text-gray-900 dark:text-primary px-6 py-3 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-primary transition-colors"
              onClick={header.column.getToggleSortingHandler()}
            >
              <div className="flex items-center">
                <span className="text-base font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </span>
                {header.column.getCanSort() && (
                  <span className="ml-1 text-body">
                    {header.column.getIsSorted() === 'asc' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M19 16.25H5a.74.74 0 0 1-.69-.46a.75.75 0 0 1 .16-.79l7-7a.75.75 0 0 1 1.06 0l7 7a.75.75 0 0 1 .16.82a.74.74 0 0 1-.69.43m-12.19-1.5h10.38L12 9.56Z"
                        />
                      </svg>
                    ) : header.column.getIsSorted() === 'desc' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32">
                        <path
                          fill="currentColor"
                          d="m3.594 12l1.687 1.72l10 10l.72.686l.72-.687l10-10L28.405 12zm4.844 2h15.124L16 21.563L8.437 14z"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="5" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      ))}
    </thead>
    <tbody className="bg-transparent rounded-b-xl">
      {table.getRowModel().rows.map((row, index) => (
        <tr
          key={uuidv4()}
          className="border-t border-gray-200 dark:border-primary/10 hover:bg-gray-100 dark:hover:bg-primary/10 transition-all"
        >
          {row.getVisibleCells().map(cell => (
            <td
              key={uuidv4()}
              className="whitespace-nowrap px-6 py-4 text-body text-gray-800 dark:text-gray-200 font-medium rounded-lg"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default DesktopTable;
