'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Maximize2 } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { getCountryCoordinates, calculatePinSize, getPinColor } from '@/utils/countryCoordinates';
import InfoTooltip from './InfoTooltip';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

/**
 * Visitor Countries Map Visualization
 * Shows visitor countries on an interactive world map with pin markers
 */
export default function VisitorCountriesMap({ countries, isLoading, onExpand, isCompact = false, height = null }) {
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calculate max visitors for pin sizing
  const maxVisitors = countries && countries.length > 0 ? Math.max(...countries.map(c => c.visitors)) : 0;

  const handleMarkerHover = (country, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setTooltipContent(country);
  };

  const handleMarkerLeave = () => {
    setTooltipContent(null);
  };

  // Handle touch events for mobile
  const handleMarkerTouch = (country, event) => {
    event.preventDefault();
    if (tooltipContent?.country_code === country.country_code) {
      setTooltipContent(null);
    } else {
      const touch = event.touches[0];
      setTooltipPosition({
        x: touch.clientX,
        y: touch.clientY - 10,
      });
      setTooltipContent(country);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-40 mb-4"></div>
          <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded h-64"></div>
        </div>
      </motion.div>
    );
  }

  if (!countries || countries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Map</h3>
        </div>
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-400">No location data available</p>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
            Location tracking will begin with new visitors
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <GlassCard>
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Map</h3>
          <InfoTooltip
            title="Traffic Map"
            description="Visualize where your visitors are located worldwide. Pin sizes show visitor volume, colors indicate engagement levels per country."
            marketingValue="Identify untapped markets and prioritize geographic expansion. High traffic from specific regions signals strong product-market fit there. Target international SEO and localized content for high-engagement countries. Adjust messaging for different cultural contexts."
            onExpand={onExpand}
          />
          <span className="ml-auto">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
              {countries.length} {countries.length === 1 ? 'country' : 'countries'}
            </span>
          </span>
        </div>

        {/* Map Container */}
        <div
          className="relative w-full bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-[#050814] dark:to-[#0a0e27] rounded-lg overflow-hidden"
          style={height ? { height } : { flex: 1 }}
        >
          <ComposableMap
            projectionConfig={{
              scale: 147,
              rotation: [-11, 0, 0],
            }}
            height={500}
          >
            <ZoomableGroup zoom={1} minZoom={1} maxZoom={8} center={[0, 0]}>
              {/* World Map */}
              <Geographies geography="/maps/world-110m.json">
                {({ geographies }) =>
                  geographies.map(geo => {
                    const isDarkMode = document.documentElement.classList.contains('dark');
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isDarkMode ? '#1f2937' : '#93c5fd'}
                        stroke={isDarkMode ? '#374151' : '#60a5fa'}
                        strokeWidth={0.5}
                        style={{
                          default: {
                            outline: 'none',
                          },
                          hover: {
                            fill: isDarkMode ? '#374151' : '#60a5fa',
                            outline: 'none',
                          },
                          pressed: {
                            fill: isDarkMode ? '#4b5563' : '#3b82f6',
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Pin Markers */}
              {countries.map(country => {
                const coordinates = getCountryCoordinates(country.country_code);
                if (!coordinates) return null;

                const pinSize = calculatePinSize(country.visitors, maxVisitors);
                const pinColor = getPinColor(country.avg_engagement_score || 0);
                const isDarkMode = document.documentElement.classList.contains('dark');

                return (
                  <Marker key={country.country_code} coordinates={coordinates}>
                    <g
                      onMouseEnter={e => handleMarkerHover(country, e)}
                      onMouseLeave={handleMarkerLeave}
                      onTouchStart={e => handleMarkerTouch(country, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Outer glow */}
                      <circle
                        r={pinSize + 4}
                        fill={pinColor}
                        fillOpacity={isDarkMode ? 0.2 : 0.3}
                        className="animate-pulse"
                      />
                      {/* Pin circle */}
                      <circle
                        r={pinSize}
                        fill={pinColor}
                        stroke={isDarkMode ? '#ffffff' : '#1e293b'}
                        strokeWidth={2}
                        className="transition-all duration-200 hover:scale-110"
                      />
                      {/* Inner dot */}
                      <circle r={pinSize / 3} fill={isDarkMode ? '#ffffff' : '#1e293b'} fillOpacity={0.8} />
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-900/90 border border-gray-300 dark:border-cyan-500/30 rounded-lg p-3 backdrop-blur-md">
            <div className="text-xs text-gray-900 dark:text-white font-semibold mb-2">Engagement</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">High (70+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Medium (40-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Low (&lt;40)</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-300 dark:border-cyan-500/20">
              <div className="text-xs text-gray-600 dark:text-gray-400">Pin size = visitor count</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-900/90 border border-gray-300 dark:border-cyan-500/30 rounded-lg px-3 py-2 backdrop-blur-md">
            <div className="text-xs text-gray-700 dark:text-gray-300">
              <span className="hidden md:inline">Hover over pins • Scroll to zoom • Drag to pan</span>
              <span className="md:hidden">Tap pins for details • Pinch to zoom</span>
            </div>
          </div>
        </div>

        {/* Stats Summary - Only show in expanded view */}
        {!isCompact && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-r from-cyan-100 dark:from-cyan-500/10 to-transparent border border-cyan-300 dark:border-cyan-500/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Visitors</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {countries.reduce((sum, c) => sum + c.visitors, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-100 dark:from-cyan-500/10 to-transparent border border-cyan-300 dark:border-cyan-500/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Countries</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{countries.length}</div>
            </div>
            <div className="bg-gradient-to-r from-cyan-100 dark:from-cyan-500/10 to-transparent border border-cyan-300 dark:border-cyan-500/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Top Country</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {countries[0]?.country || 'N/A'}
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-100 dark:from-cyan-500/10 to-transparent border border-cyan-300 dark:border-cyan-500/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Avg Engagement</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {(countries.reduce((sum, c) => sum + (c.avg_engagement_score || 0), 0) / countries.length).toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {/* Expand Button - Only show in compact view */}
        {isCompact && onExpand && (
          <button
            onClick={onExpand}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 hover:bg-cyan-200 dark:hover:bg-cyan-500/30 border border-cyan-400/50 dark:border-cyan-500/30 hover:border-cyan-500 dark:hover:border-cyan-500/50 text-cyan-600 dark:text-cyan-400 transition-all group"
            title="Expand view"
          >
            <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </GlassCard>

      {/* Tooltip Portal */}
      {tooltipContent && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 dark:bg-gray-900/95 border border-cyan-400/50 dark:border-cyan-500/50 rounded-lg p-4 shadow-2xl backdrop-blur-md min-w-[200px]"
          >
            {/* Country Name */}
            <div className="text-gray-900 dark:text-white font-semibold mb-2 text-sm">{tooltipContent.country}</div>

            {/* Stats */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Visitors:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {tooltipContent.visitors.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                  {tooltipContent.percentage.toFixed(1)}%
                </span>
              </div>
              {tooltipContent.avg_engagement_score > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Engagement:</span>
                  <span
                    className="font-medium"
                    style={{
                      color: getPinColor(tooltipContent.avg_engagement_score),
                    }}
                  >
                    {tooltipContent.avg_engagement_score.toFixed(0)}/100
                  </span>
                </div>
              )}
              {tooltipContent.new_visitors > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">New Visitors:</span>
                  <span className="text-white font-medium">{tooltipContent.new_visitors.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div
              className="absolute left-1/2 bottom-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900/95"
              style={{ transform: 'translate(-50%, 100%)' }}
            ></div>
          </motion.div>
        </div>
      )}
    </>
  );
}
