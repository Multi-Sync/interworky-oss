import { Controller } from 'react-hook-form';
import Input from './ui/Input';

const SearchBar = ({ control, onSearchChange, placeholder }) => {
  return (
    <Controller
      name="search"
      control={control}
      render={({ field }) => (
        <div className="border rounded-md w-full lg:w-[408px] h-[42px] border-primary-forth-color flex items-center gap-3 pl-6 bg-white">
          <label htmlFor="search">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#BCBCBD"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-search"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </label>
          <Input
            {...field}
            id="search"
            className="focus:outline-none placeholder-tertiary text-secondary p-0 w-full rounded-md border-none"
            placeholder={placeholder || 'Search by name'}
            autoFocus
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      )}
    />
  );
};

export default SearchBar;
