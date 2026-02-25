const getErrorMessage = error => {
  const errorMessage = error.response?.data?.message || error.message || 'Something went wrong, please try again later';
  return errorMessage;
};

export default getErrorMessage;
