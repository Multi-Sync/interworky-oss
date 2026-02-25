/**
 * Country coordinates (centroids) for map pin placement
 * Maps ISO 2-letter country codes to [longitude, latitude]
 * Used for placing pin markers on the world map visualization
 */

export const countryCoordinates = {
  // North America
  US: [-95.7129, 37.0902], // United States
  CA: [-106.3468, 56.1304], // Canada
  MX: [-102.5528, 23.6345], // Mexico

  // Central America & Caribbean
  GT: [-90.2308, 15.7835], // Guatemala
  BZ: [-88.4977, 17.1899], // Belize
  SV: [-88.8965, 13.7942], // El Salvador
  HN: [-86.2419, 15.2], // Honduras
  NI: [-85.2072, 12.8654], // Nicaragua
  CR: [-83.7534, 9.7489], // Costa Rica
  PA: [-80.7821, 8.538], // Panama
  CU: [-77.7812, 21.5218], // Cuba
  JM: [-77.2975, 18.1096], // Jamaica
  HT: [-72.2852, 18.9712], // Haiti
  DO: [-70.1627, 18.7357], // Dominican Republic
  PR: [-66.5901, 18.2208], // Puerto Rico
  TT: [-61.2225, 10.6918], // Trinidad and Tobago

  // South America
  CO: [-74.2973, 4.5709], // Colombia
  VE: [-66.5897, 6.4238], // Venezuela
  GY: [-58.9302, 4.8604], // Guyana
  SR: [-56.0278, 3.9193], // Suriname
  EC: [-78.1834, -1.8312], // Ecuador
  PE: [-75.0152, -9.19], // Peru
  BR: [-51.9253, -14.235], // Brazil
  BO: [-63.5887, -16.2902], // Bolivia
  PY: [-58.4438, -23.4425], // Paraguay
  CL: [-71.543, -35.6751], // Chile
  AR: [-63.6167, -38.4161], // Argentina
  UY: [-55.7658, -32.5228], // Uruguay

  // Europe
  GB: [-3.436, 55.3781], // United Kingdom
  IE: [-8.2439, 53.4129], // Ireland
  IS: [-19.0208, 64.9631], // Iceland
  NO: [8.4689, 60.472], // Norway
  SE: [18.6435, 60.1282], // Sweden
  FI: [25.7482, 61.9241], // Finland
  DK: [9.5018, 56.2639], // Denmark
  EE: [25.0136, 58.5953], // Estonia
  LV: [24.6032, 56.8796], // Latvia
  LT: [23.8813, 55.1694], // Lithuania
  PL: [19.1451, 51.9194], // Poland
  DE: [10.4515, 51.1657], // Germany
  NL: [5.2913, 52.1326], // Netherlands
  BE: [4.4699, 50.5039], // Belgium
  LU: [6.1296, 49.8153], // Luxembourg
  FR: [2.2137, 46.2276], // France
  CH: [8.2275, 46.8182], // Switzerland
  AT: [14.5501, 47.5162], // Austria
  CZ: [15.473, 49.8175], // Czechia
  SK: [19.699, 48.669], // Slovakia
  HU: [19.5033, 47.1625], // Hungary
  SI: [14.9955, 46.1512], // Slovenia
  HR: [15.2, 45.1], // Croatia
  BA: [17.6791, 43.9159], // Bosnia and Herzegovina
  RS: [21.0059, 44.0165], // Serbia
  ME: [19.3744, 42.7087], // Montenegro
  XK: [20.9021, 42.6026], // Kosovo
  AL: [20.1683, 41.1533], // Albania
  MK: [21.7453, 41.6086], // North Macedonia
  GR: [21.8243, 39.0742], // Greece
  BG: [25.4858, 42.7339], // Bulgaria
  RO: [24.9668, 45.9432], // Romania
  MD: [28.3699, 47.4116], // Moldova
  UA: [31.1656, 48.3794], // Ukraine
  BY: [27.9534, 53.7098], // Belarus
  IT: [12.5674, 41.8719], // Italy
  ES: [-3.7492, 40.4637], // Spain
  PT: [-8.2245, 39.3999], // Portugal

  // Eastern Europe & Russia
  RU: [105.3188, 61.524], // Russia

  // Middle East
  TR: [35.2433, 38.9637], // Turkey
  CY: [33.4299, 35.1264], // Cyprus
  SY: [38.9968, 34.8021], // Syria
  LB: [35.8623, 33.8547], // Lebanon
  IL: [34.8516, 31.0461], // Israel
  PS: [35.2332, 31.9522], // Palestine
  JO: [36.2384, 30.5852], // Jordan
  IQ: [43.6793, 33.2232], // Iraq
  KW: [47.4818, 29.3117], // Kuwait
  SA: [45.0792, 23.8859], // Saudi Arabia
  YE: [48.5164, 15.5527], // Yemen
  OM: [55.9233, 21.4735], // Oman
  AE: [53.8478, 23.4241], // United Arab Emirates
  QA: [51.1839, 25.3548], // Qatar
  BH: [50.5577, 26.0667], // Bahrain
  IR: [53.688, 32.4279], // Iran

  // Africa - North
  MA: [-7.0926, 31.7917], // Morocco
  DZ: [1.6596, 28.0339], // Algeria
  TN: [9.5375, 33.8869], // Tunisia
  LY: [17.2283, 26.3351], // Libya
  EG: [30.8025, 26.8206], // Egypt

  // Africa - West
  MR: [-10.9408, 21.0079], // Mauritania
  ML: [-3.9962, 17.5707], // Mali
  SN: [-14.4524, 14.4974], // Senegal
  GM: [-15.3101, 13.4432], // Gambia
  GW: [-15.1804, 11.8037], // Guinea-Bissau
  GN: [-9.6966, 9.9456], // Guinea
  SL: [-11.7799, 8.4606], // Sierra Leone
  LR: [-9.4295, 6.4281], // Liberia
  CI: [-5.5471, 7.54], // Côte d'Ivoire
  BF: [-1.5616, 12.2383], // Burkina Faso
  GH: [-1.0232, 7.9465], // Ghana
  TG: [0.8248, 8.6195], // Togo
  BJ: [2.3158, 9.3077], // Benin
  NE: [8.0817, 17.6078], // Niger
  NG: [8.6753, 9.082], // Nigeria

  // Africa - Central
  CM: [12.3547, 7.3697], // Cameroon
  CF: [20.9394, 6.6111], // Central African Republic
  TD: [18.7322, 15.4542], // Chad
  SS: [31.307, 6.877], // South Sudan
  GQ: [10.2679, 1.6508], // Equatorial Guinea
  GA: [11.6094, -0.8037], // Gabon
  CG: [15.8277, -0.228], // Republic of the Congo
  CD: [21.7587, -4.0383], // Democratic Republic of the Congo

  // Africa - East
  SD: [30.2176, 12.8628], // Sudan
  ER: [39.7823, 15.1794], // Eritrea
  ET: [40.4897, 9.145], // Ethiopia
  DJ: [42.5903, 11.8251], // Djibouti
  SO: [46.1996, 5.1521], // Somalia
  KE: [37.9062, -0.0236], // Kenya
  UG: [32.2903, 1.3733], // Uganda
  RW: [29.8739, -1.9403], // Rwanda
  BI: [29.9189, -3.3731], // Burundi
  TZ: [34.8888, -6.369], // Tanzania

  // Africa - Southern
  AO: [17.8739, -11.2027], // Angola
  ZM: [27.8493, -13.1339], // Zambia
  MW: [34.3015, -13.2543], // Malawi
  MZ: [35.5296, -18.6657], // Mozambique
  ZW: [29.1549, -19.0154], // Zimbabwe
  BW: [24.6849, -22.3285], // Botswana
  NA: [18.4904, -22.9576], // Namibia
  ZA: [22.9375, -30.5595], // South Africa
  LS: [28.2336, -29.61], // Lesotho
  SZ: [31.4659, -26.5225], // Eswatini
  MG: [46.8691, -18.7669], // Madagascar

  // Asia - Central
  KZ: [66.9237, 48.0196], // Kazakhstan
  UZ: [64.5853, 41.3775], // Uzbekistan
  TM: [59.5563, 38.9697], // Turkmenistan
  KG: [74.7661, 41.2044], // Kyrgyzstan
  TJ: [71.2761, 38.861], // Tajikistan
  AF: [67.71, 33.9391], // Afghanistan

  // Asia - South
  PK: [69.3451, 30.3753], // Pakistan
  IN: [78.9629, 20.5937], // India
  NP: [84.124, 28.3949], // Nepal
  BT: [90.4336, 27.5142], // Bhutan
  BD: [90.3563, 23.685], // Bangladesh
  LK: [80.7718, 7.8731], // Sri Lanka
  MV: [73.2207, 3.2028], // Maldives

  // Asia - Southeast
  MM: [95.956, 21.9162], // Myanmar
  TH: [100.9925, 15.87], // Thailand
  LA: [102.4955, 19.8563], // Laos
  VN: [108.2772, 14.0583], // Vietnam
  KH: [104.991, 12.5657], // Cambodia
  MY: [101.9758, 4.2105], // Malaysia
  SG: [103.8198, 1.3521], // Singapore
  BN: [114.7277, 4.5353], // Brunei
  ID: [113.9213, -0.7893], // Indonesia
  TL: [125.7275, -8.8742], // Timor-Leste
  PH: [121.774, 12.8797], // Philippines

  // Asia - East
  CN: [104.1954, 35.8617], // China
  MN: [103.8467, 46.8625], // Mongolia
  KP: [127.5101, 40.3399], // North Korea
  KR: [127.7669, 35.9078], // South Korea
  JP: [138.2529, 36.2048], // Japan
  TW: [120.9605, 23.6978], // Taiwan

  // Oceania
  AU: [133.7751, -25.2744], // Australia
  NZ: [174.886, -40.9006], // New Zealand
  PG: [143.9555, -6.315], // Papua New Guinea
  FJ: [179.4144, -17.7134], // Fiji
  NC: [165.618, -20.9043], // New Caledonia
  SB: [160.1562, -9.6457], // Solomon Islands
  VU: [166.9592, -15.3767], // Vanuatu
  WS: [-172.1046, -13.759], // Samoa
  TO: [-175.1982, -21.1789], // Tonga
};

/**
 * Get coordinates for a country by its ISO 2-letter code
 * @param {string} countryCode - ISO 2-letter country code (e.g., "US", "GB", "FR")
 * @returns {[number, number]|null} - [longitude, latitude] or null if not found
 */
export const getCountryCoordinates = countryCode => {
  return countryCoordinates[countryCode] || null;
};

/**
 * Calculate pin size based on visitor count
 * @param {number} visitorCount - Number of visitors
 * @param {number} maxVisitors - Maximum visitors from all countries
 * @returns {number} - Pin radius in pixels
 */
export const calculatePinSize = (visitorCount, maxVisitors) => {
  const minSize = 6; // Minimum pin size
  const maxSize = 16; // Maximum pin size

  if (maxVisitors === 0) return minSize;

  const ratio = visitorCount / maxVisitors;
  return minSize + (maxSize - minSize) * ratio;
};

/**
 * Get color for pin based on engagement score
 * @param {number} engagementScore - Engagement score (0-100)
 * @returns {string} - Hex color code
 */
export const getPinColor = engagementScore => {
  // Low engagement: orange (#f59e0b)
  // Medium engagement: cyan (#06b6d4)
  // High engagement: green (#10b981)

  if (engagementScore >= 70) return '#10b981'; // green
  if (engagementScore >= 40) return '#06b6d4'; // cyan
  return '#f59e0b'; // orange
};
