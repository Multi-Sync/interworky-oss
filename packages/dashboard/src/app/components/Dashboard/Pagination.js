const Pagination = ({ currentPage, totalPages, onPrevious, onNext, onPageChange }) => {
  const createPageNumbers = () => {
    const pageNumbers = [];

    // Add first page
    if (currentPage > 2) {
      pageNumbers.push(1);
      if (currentPage > 3) {
        pageNumbers.push('...');
      }
    }

    // Add middle pages (current, current-1, current+1)
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i > 0 && i <= totalPages) {
        pageNumbers.push(i);
      }
    }

    // Add last page
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="lg:justify-end md:justify-start lg:text-base md:text-base relative flex justify-center w-full mt-8 text-xs">
      {/** Displaying only on small screens */}
      <div className="md:hidden flex items-center justify-center w-full">
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className={`py-2 px-3 rounded text-body ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-primary/20 hover:text-primary transition-all'}`}
        >
          Previous
        </button>

        <span className="py-2 px-3 bg-gradient-to-r from-primary to-primary text-white rounded-md mx-2 shadow-lg shadow-primary/30">
          {currentPage}
        </span>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={`py-2 px-3 rounded text-body ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-primary/20 hover:text-primary transition-all'}`}
        >
          Next
        </button>
      </div>

      {/** Displaying full pagination on medium and large screens */}
      <div className="md:flex lg:text-base md:sm items-center hidden gap-2 text-xs">
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className={`py-2 px-3 rounded text-xs lg:text-base md:sm ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-primary/20 hover:text-primary transition-all'}`}
        >
          Previous
        </button>

        {createPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => number !== '...' && onPageChange(number)}
            disabled={number === '...'}
            className={`w-[31px] h-[31px] rounded text-xs lg:text-base md:sm ${currentPage === number ? 'bg-gradient-to-r from-primary to-primary text-white shadow-lg shadow-primary/30' : 'bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 text-gray-300 hover:bg-primary/20 hover:text-primary transition-all'}`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={`py-2 px-3 rounded text-xs lg:text-base md:sm ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-primary/20 hover:text-primary transition-all'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
