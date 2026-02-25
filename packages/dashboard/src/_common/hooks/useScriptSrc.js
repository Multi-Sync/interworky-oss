import { useEffect, useState } from 'react';

const useScriptSrc = () => {
  const [scriptSrc, setScriptSrc] = useState('');

  useEffect(() => {
    const checkEnvironment = () => {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        setScriptSrc('http://localhost:8080/bundle.js');
      } else if (hostname === 'staging.interworky.com') {
        setScriptSrc('https://storage.googleapis.com/multisync/interworky/staging/interworky.js');
      } else {
        setScriptSrc('https://storage.googleapis.com/multisync/interworky/production/interworky.js');
      }
    };
    checkEnvironment();
  }, []);

  return scriptSrc;
};

export default useScriptSrc;
