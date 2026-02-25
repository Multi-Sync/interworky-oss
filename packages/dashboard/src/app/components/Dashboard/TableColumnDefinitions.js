import FullSurvey from './surveys/FullSurvey';
import PatientInfo from './appointments/PatientInfo';
import Rating from './surveys/Rating';
import Time from './appointments/Time';
import { createColumnHelper } from '@tanstack/react-table';
import { formatDateWithDay } from '@/_common/utils/utils';
import ViewChat from './patients/ViewChat';
import ct from 'countries-and-timezones';
import Image from 'next/image';

const getCountryInfo = timezone => {
  const country = ct.getCountryForTimezone(timezone);
  const flag = country ? `https://flagcdn.com/96x72/${country.id.toLowerCase()}.webp` : null;
  return { country, flag };
};

const CountryFlag = ({ flag }) => {
  if (!flag) return null;
  return <Image src={flag} width={24} height={20} alt="Country flag" className="w-5 h-3" />;
};

export const getColumnsDefinition = (type, mutate, openAppointmentId, setOpenAppointmentId) => {
  const columnHelper = createColumnHelper();

  switch (type) {
    case 'appointments':
      return [
        columnHelper.accessor('patient', {
          header: 'Name',
          cell: info => {
            const patient = info.getValue();
            const firstName = patient.first_name || 'Anonymous';
            const lastName = patient.last_name || 'Anonymous';

            return (
              <div className="flex relative gap-2 items-center">
                {firstName} {lastName}
                <PatientInfo
                  patient={patient}
                  isOpen={openAppointmentId === info.row.original.id}
                  onToggle={() =>
                    setOpenAppointmentId(prevId => (prevId === info.row.original.id ? null : info.row.original.id))
                  }
                />
              </div>
            );
          },
          sortingFn: (rowA, rowB, columnId) => {
            const patientA = rowA.getValue(columnId);
            const patientB = rowB.getValue(columnId);

            // First compare by first name
            const firstNameCompare = patientA.first_name
              ?.toLowerCase()
              .localeCompare(patientB.first_name?.toLowerCase());
            if (firstNameCompare !== 0) return firstNameCompare;

            // If first names are equal, compare by last name
            const lastNameCompare = patientA.last_name?.toLowerCase().localeCompare(patientB.last_name?.toLowerCase());
            if (lastNameCompare !== 0) return lastNameCompare;

            // Use ID as final tiebreaker
            return patientA.id - patientB.id;
          },
        }),
        columnHelper.accessor('date', {
          header: 'Date',
          cell: info => <div> {formatDateWithDay(info.getValue())}</div>,
          sortingFn: (rowA, rowB, columnId) => {
            const dateA = new Date(rowA.getValue(columnId));
            const dateB = new Date(rowB.getValue(columnId));
            return dateA.getTime() - dateB.getTime();
          },
        }),
        columnHelper.accessor('date', {
          id: 'time',
          header: 'Time',
          cell: info => {
            return <Time date={info.getValue()} status={info.row.original.status} />;
          },
          sortingFn: (rowA, rowB, columnId) => {
            const timeA = new Date(rowA.getValue(columnId));
            const timeB = new Date(rowB.getValue(columnId));
            return timeA.getTime() - timeB.getTime();
          },
        }),
      ];
    case 'patients':
      return [
        columnHelper.accessor(row => `${row.first_name || 'Anonymous'} ${row.last_name || 'Anonymous'}`, {
          id: 'full_name',
          header: 'Name',
          cell: info => {
            const { first_name, last_name, timezone } = info.row.original;

            // Check if both names are anonymous, null, undefined, or empty
            const isAnonymous =
              (!first_name || first_name === 'anonymous' || first_name === 'Anonymous') &&
              (!last_name || last_name === 'anonymous' || last_name === 'Anonymous');

            if (isAnonymous) {
              const { flag } = getCountryInfo(timezone);

              return (
                <div className="flex gap-2 items-center">
                  <CountryFlag flag={flag} />
                  <span>Anonymous</span>
                </div>
              );
            }

            // Handle cases where only one name is missing
            const displayName = `${first_name || 'Anonymous'} ${last_name || 'Anonymous'}`;
            return <span>{displayName}</span>;
          },
          sortingFn: (rowA, rowB, columnId) => {
            const patientA = rowA.getValue(columnId);
            const patientB = rowB.getValue(columnId);

            // First compare by first name
            const firstNameCompare = patientA.first_name
              ?.toLowerCase()
              .localeCompare(patientB.first_name?.toLowerCase());
            if (firstNameCompare !== 0) return firstNameCompare;

            // If first names are equal, compare by last name
            const lastNameCompare = patientA.last_name?.toLowerCase().localeCompare(patientB.last_name?.toLowerCase());
            if (lastNameCompare !== 0) return lastNameCompare;

            // Use ID as final tiebreaker
            return patientA.id - patientB.id;
          },
        }),
        columnHelper.accessor('email', {
          header: 'Email',
          cell: info => {
            const email = info.getValue();

            // Handle null, undefined, or empty email
            if (!email || email === 'null' || email === 'undefined') {
              return 'Anonymous';
            }

            const interworkyEmailPattern = /^[a-z]{2}-[a-z0-9]+@interworky\.com$/i;
            return interworkyEmailPattern.test(email) ? 'N/A' : email;
          },
        }),
        columnHelper.accessor('id', {
          id: 'patient_id',
          header: 'Client ID',
          cell: info => {
            const patientId = info.getValue();
            return (
              <span className="text-xs text-gray-600 dark:text-gray-500 font-mono">
                {patientId ? patientId.substring(0, 8) + '...' : 'N/A'}
              </span>
            );
          },
        }),
        columnHelper.accessor(row => row, {
          id: 'conversation',
          header: '',
          cell: info => {
            let chatTitle = '';
            const { flag } = getCountryInfo(info.row.original.timezone);
            const { first_name, last_name, email } = info.row.original;

            // Check if patient has a real name (not anonymous, null, undefined, or empty)
            const hasRealName =
              first_name &&
              first_name !== 'anonymous' &&
              first_name !== 'Anonymous' &&
              last_name &&
              last_name !== 'anonymous' &&
              last_name !== 'Anonymous';

            if (hasRealName) {
              chatTitle = ` ${first_name} ${last_name}`;
            } else if (email && email !== 'null' && email !== 'undefined') {
              chatTitle = ` ${email}`;
            } else {
              chatTitle = ' Anonymous';
            }

            return (
              info.row.original.conversations?.length > 0 && (
                <div className="w-fit">
                  <ViewChat conversations={info.row.original.conversations} chatTitle={chatTitle} flag={flag} />
                </div>
              )
            );
          },
          enableSorting: false,
        }),
      ];
    case 'clients':
      return [
        columnHelper.accessor(row => `${row.first_name || 'Anonymous'} ${row.last_name || 'Anonymous'}`, {
          id: 'full_name',
          header: 'Name',
          cell: info => {
            const { first_name, last_name, timezone } = info.row.original;

            // Check if both names are anonymous, null, undefined, or empty
            const isAnonymous =
              (!first_name || first_name === 'anonymous' || first_name === 'Anonymous') &&
              (!last_name || last_name === 'anonymous' || last_name === 'Anonymous');

            if (isAnonymous) {
              const { flag } = getCountryInfo(timezone);

              return (
                <div className="flex gap-2 items-center">
                  <CountryFlag flag={flag} />
                  <span>Anonymous</span>
                </div>
              );
            }

            // Handle cases where only one name is missing
            const displayName = `${first_name || 'Anonymous'} ${last_name || 'Anonymous'}`;
            return <span>{displayName}</span>;
          },
          sortingFn: (rowA, rowB, columnId) => {
            const clientA = rowA.getValue(columnId);
            const clientB = rowB.getValue(columnId);

            // First compare by first name
            const firstNameCompare = clientA.first_name?.toLowerCase().localeCompare(clientB.first_name?.toLowerCase());
            if (firstNameCompare !== 0) return firstNameCompare;

            // If first names are equal, compare by last name
            const lastNameCompare = clientA.last_name?.toLowerCase().localeCompare(clientB.last_name?.toLowerCase());
            if (lastNameCompare !== 0) return lastNameCompare;

            // Use ID as final tiebreaker
            return clientA.id - clientB.id;
          },
        }),
        columnHelper.accessor('email', {
          header: 'Email',
          cell: info => {
            const email = info.getValue();

            // Handle null, undefined, or empty email
            if (!email || email === 'null' || email === 'undefined') {
              return 'Anonymous';
            }

            const interworkyEmailPattern = /^[a-z]{2}-[a-z0-9]+@interworky\.com$/i;
            return interworkyEmailPattern.test(email) ? 'N/A' : email;
          },
        }),
        columnHelper.accessor('totalMessages', {
          header: 'Messages',
          cell: info => {
            const count = info.getValue();
            const isActive = count > 0;

            return (
              <div className="flex items-center gap-2" title={`${count || 0} messages`}>
                <div
                  className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-300'}`}
                ></div>
                <span
                  className={`text-sm font-medium ${isActive ? 'text-green-700 dark:text-green-600' : 'text-gray-700 dark:text-gray-500'}`}
                >
                  {count || 0}
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor('lastConversationDate', {
          header: 'Last Activity',
          cell: info => {
            const date = info.getValue();
            if (!date) return 'N/A';

            const formattedDate = new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return <span className="text-sm text-gray-700 dark:text-gray-600">{formattedDate}</span>;
          },
        }),
        columnHelper.accessor(row => row, {
          id: 'conversation',
          header: '',
          cell: info => {
            let chatTitle = '';
            const { flag } = getCountryInfo(info.row.original.timezone);
            const { first_name, last_name, email } = info.row.original;

            // Check if client has a real name (not anonymous, null, undefined, or empty)
            const hasRealName =
              first_name &&
              first_name !== 'anonymous' &&
              first_name !== 'Anonymous' &&
              last_name &&
              last_name !== 'anonymous' &&
              last_name !== 'Anonymous';

            if (hasRealName) {
              chatTitle = ` ${first_name} ${last_name}`;
            } else if (email && email !== 'null' && email !== 'undefined') {
              chatTitle = ` ${email}`;
            } else {
              chatTitle = ' Anonymous';
            }

            return (
              info.row.original.conversations?.length > 0 && (
                <div className="w-fit">
                  <ViewChat conversations={info.row.original.conversations} chatTitle={chatTitle} flag={flag} />
                </div>
              )
            );
          },
          enableSorting: false,
        }),
      ];
    case 'postVisitations':
      return [
        columnHelper.accessor('patient', {
          id: 'name',
          header: 'Name',
          cell: info => {
            const patient = info.getValue();
            const firstName = patient.first_name || 'Anonymous';
            const lastName = patient.last_name || 'Anonymous';

            return (
              <div className="flex relative gap-2 items-center">
                {firstName} {lastName}
                <PatientInfo
                  patient={patient}
                  isOpen={openAppointmentId === info.row.original.id}
                  onToggle={() =>
                    setOpenAppointmentId(prevId => (prevId === info.row.original.id ? null : info.row.original.id))
                  }
                />
              </div>
            );
          },
        }),
        columnHelper.accessor('date', {
          id: 'date',
          header: 'Date',
          cell: info => {
            return <div>{formatDateWithDay(info.row.original.appointment.date)}</div>;
          },
          sortingFn: (rowA, rowB, columnId) => {
            const dateA = new Date(rowA.original.appointment.date);
            const dateB = new Date(rowB.original.appointment.date);
            return dateA.getTime() - dateB.getTime();
          },
        }),
        columnHelper.accessor('date', {
          id: 'time',
          header: 'Time',
          cell: info => {
            return <Time date={info.row.original.appointment.date} />;
          },
          sortingFn: (rowA, rowB, columnId) => {
            const timeA = new Date(rowA.original.appointment.date);
            const timeB = new Date(rowB.original.appointment.date);
            return timeA.getTime() - timeB.getTime();
          },
        }),
        columnHelper.accessor('rating', {
          id: 'rating',
          header: 'Rating',
          cell: info => <Rating rating={info.getValue()} />,
          sortingFn: (rowA, rowB) => {
            return rowA.original.rating - rowB.original.rating;
          },
        }),
        columnHelper.accessor('', {
          id: 'survey',
          header: '',
          cell: info => <FullSurvey survey={info.row.original} />,
          enableSorting: false,
        }),
      ];

    default:
      return [
        columnHelper.accessor('defaultColumn', {
          header: 'Default Column',
          cell: info => info.getValue(),
        }),
      ];
  }
};
