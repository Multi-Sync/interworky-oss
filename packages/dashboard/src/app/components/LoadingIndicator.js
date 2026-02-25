'use client';
import TopBarProgress from 'react-topbar-progress-indicator';

TopBarProgress.config({
  barColors: {
    0: '#058A7C',
    '1.0': '#058A7C',
  },
  shadowBlur: 5,
});

const LoadingIndicator = () => <TopBarProgress />;

export default LoadingIndicator;
