'use client';

import React, { useMemo, useState } from 'react';
import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

import AppointmentCard from './appointments/AppointmentsCard';
import ClientCard from './patients/PatientsCard';
import DesktopTable from './DesktopTable';
import MobileTable from './MobileTable';
import PatientCard from './patients/PatientsCard';
import Skeleton from 'react-loading-skeleton';
import SurveysCard from './surveys/SurveysCard';
import { getColumnsDefinition } from './TableColumnDefinitions';
import { useMediaQuery } from 'react-responsive';

const getMobileCardRenderer = type => {
  switch (type) {
    case 'appointments':
      return AppointmentCard;
    case 'patients':
      return PatientCard;
    case 'clients':
      return ClientCard;
    case 'postVisitations':
      return SurveysCard;
    default:
      return function unsupported() {
        <div>Unsupported type</div>;
      };
  }
};

const Table = ({ type, data, mutate, isLoading, error }) => {
  const isMobile = useMediaQuery({ maxWidth: 1024 });
  const [openAppointmentId, setOpenAppointmentId] = useState(null);
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => getColumnsDefinition(type, mutate, openAppointmentId, setOpenAppointmentId),
    [type, mutate, openAppointmentId],
  );

  const table = useReactTable({
    data: data[type] || data.clients || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  if (isLoading) return <Skeleton count={6} height={60} className="my-1" />;
  if (error) return <p className="text-red-500">{error.message}</p>;

  return (
    <div className="w-full">
      {isMobile ? (
        <MobileTable
          table={table}
          renderMobileCard={row => {
            const CardComponent = getMobileCardRenderer(type);
            return <CardComponent row={row} />;
          }}
        />
      ) : (
        <DesktopTable table={table} />
      )}
    </div>
  );
};

export default Table;
