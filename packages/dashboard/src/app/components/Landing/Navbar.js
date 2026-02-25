import ClientNavbar from './ClientNavbar';

// Create a server component that passes props to the client component
// This enables proper static site generation
const Navbar = ({ isDarkMode = false }) => {
  // Define navigation links
  const navLinks = [
    {
      href: 'https://discord.com/invite/d8eSgcWKjt',
      label: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <g fill="currentColor" fillOpacity="0">
            <circle cx="9" cy="12" r="1.5">
              <animate fill="freeze" attributeName="fillOpacity" begin="1.3s" dur="0.15s" values="0;1" />
            </circle>
            <circle cx="15" cy="12" r="1.5">
              <animate fill="freeze" attributeName="fillOpacity" begin="1.45s" dur="0.15s" values="0;1" />
            </circle>
          </g>
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
            <path
              strokeDasharray="32"
              strokeDashoffset="32"
              d="M12 6h2l1 -2c0 0 2.5 0.5 4 1.5c3.53 2.35 3 9.5 3 10.5c-1.33 2.17 -5.5 3.5 -5.5 3.5l-1 -2M12 6h-2l-0.97 -2c0 0 -2.5 0.5 -4 1.5c-3.53 2.35 -3 9.5 -3 10.5c1.33 2.17 5.5 3.5 5.5 3.5l1 -2"
            >
              <animate fill="freeze" attributeName="strokeDashoffset" dur="0.7s" values="32;0" />
            </path>
            <path strokeDasharray="16" strokeDashoffset="16" d="M5.5 16c5 2.5 8 2.5 13 0">
              <animate fill="freeze" attributeName="strokeDashoffset" begin="0.8s" dur="0.4s" values="16;0" />
            </path>
          </g>
        </svg>
      ),
      external: true,
    },
    { href: 'https://carla.interworky.com', label: 'Documentation', external: true },
    { href: '/login', label: 'Login' },
  ];

  const logoSrc = isDarkMode ? '/dark-logo.png' : '/finallogo.png';

  // Pass props to the client component
  return <ClientNavbar navLinks={navLinks} logoSrc={logoSrc} logoAlt="Interworky Logo" isDarkMode={isDarkMode} />;
};

export default Navbar;
