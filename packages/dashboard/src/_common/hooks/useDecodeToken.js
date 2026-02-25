import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'next/navigation';
import useFireToast from './fireToast';

const useDecodeToken = () => {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [decodeError, setDecodeError] = useState('');
  const toast = useFireToast();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;

    try {
      // Decode the token
      const decoded = jwtDecode(token);
      if (!decoded.userId) {
        throw new Error('Invalid token');
      }
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        throw new Error('Token expired');
      }
      setUserId(decoded.userId);
    } catch (error) {
      toast.error('Invalid token', 'please make sure you are using the correct link');
      setDecodeError('Invalid token, please make sure you are using the correct link');
      console.error('Invalid token', error);
    }
  }, [searchParams, toast]);

  return { decodeError, userId };
};

export default useDecodeToken;
