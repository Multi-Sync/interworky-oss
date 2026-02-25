'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Code, Film, TrendingUp, Activity } from 'lucide-react';
import OptimizationIssuesModal from './OptimizationIssuesModal';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

export default function OptimizationOpportunities({ metricsData, isLoading }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCategoryClick = category => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <GlassCard key={i} variant="compact" accentColor="gray" className="animate-pulse">
            <div className="h-20"></div>
          </GlassCard>
        ))}
      </div>
    );
  }

  // Show empty state if no data
  if (!metricsData || !metricsData.resource_summary) {
    return (
      <GlassCard accentColor="gray" className="p-8 text-center">
        <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Optimization Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Resource optimization data will appear here once your website is analyzed.
        </p>
      </GlassCard>
    );
  }

  const resourceSummary = metricsData.resource_summary;
  const resourceIssues = metricsData.resource_issues || [];

  // Check if there are any optimization issues (already deduplicated by parent)
  const totalIssues = resourceSummary.total || 0;

  if (totalIssues === 0) {
    return (
      <GlassCard accentColor="gray" className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Great Job!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No optimization issues detected. Your website resources are well optimized.
        </p>
      </GlassCard>
    );
  }

  // Categorize issues by type
  const categorizeIssues = () => {
    const counts = {
      scripts: 0,
      stylesheets: 0,
      images: 0,
      other: 0,
    };

    resourceIssues.forEach(issue => {
      const type = issue.type;

      // Script-related issues
      if (type === 'large_script' || type === 'nextjs_server_components' || type === 'blocking_script') {
        counts.scripts++;
      }
      // Image-related issues
      else if (
        type === 'unused_image' ||
        type === 'missing_lazy_load' ||
        type === 'large_image' ||
        type === 'unoptimized_image'
      ) {
        counts.images++;
      }
      // Stylesheet-related issues
      else if (type === 'large_stylesheet' || type === 'blocking_css' || type === 'unused_css') {
        counts.stylesheets++;
      }
      // Other optimization issues (fonts, preloads, etc.)
      else {
        counts.other++;
      }
    });

    return counts;
  };

  const issueCounts = categorizeIssues();

  // Filter issues by category
  const getIssuesByCategory = categoryName => {
    return resourceIssues.filter(issue => {
      const type = issue.type;
      if (categoryName === 'Scripts') {
        return type === 'large_script' || type === 'nextjs_server_components' || type === 'blocking_script';
      } else if (categoryName === 'Images') {
        return (
          type === 'unused_image' ||
          type === 'missing_lazy_load' ||
          type === 'large_image' ||
          type === 'unoptimized_image'
        );
      } else if (categoryName === 'Stylesheets') {
        return type === 'large_stylesheet' || type === 'blocking_css' || type === 'unused_css';
      } else {
        // Other category
        return !(
          type === 'large_script' ||
          type === 'nextjs_server_components' ||
          type === 'blocking_script' ||
          type === 'unused_image' ||
          type === 'missing_lazy_load' ||
          type === 'large_image' ||
          type === 'unoptimized_image' ||
          type === 'large_stylesheet' ||
          type === 'blocking_css' ||
          type === 'unused_css'
        );
      }
    });
  };

  const categories = [
    {
      name: 'Scripts',
      count: issueCounts.scripts,
      icon: Code,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Stylesheets',
      count: issueCounts.stylesheets,
      icon: FileText,
      color: 'purple',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      name: 'Images',
      count: issueCounts.images,
      icon: Image,
      color: 'green',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      name: 'Other',
      count: issueCounts.other,
      icon: Film,
      color: 'orange',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const Icon = category.icon;
          const hasIssues = category.count > 0;

          return (
            <GlassCard
              key={category.name}
              variant="compact"
              accentColor="gray"
              animated
              delay={index * 0.1}
              hover={hasIssues}
              className={hasIssues ? 'cursor-pointer' : ''}
              onClick={() => hasIssues && handleCategoryClick(category.name)}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                </div>
                {category.count > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                    <TrendingUp className="w-3 h-3" />
                    {category.count}
                  </span>
                )}
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">{category.name}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{category.count}</span>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {category.count === 1 ? 'resource' : 'resources'}
                  </span>
                </div>
              </div>
              {category.count > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {category.count === 1 ? 'Needs optimization' : 'Need optimization'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Click to view details →</div>
                </div>
              ) : (
                <div className="text-xs text-green-600 dark:text-green-400">✓ Optimized</div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Optimization Issues Modal */}
      {selectedCategory && (
        <OptimizationIssuesModal
          isOpen={isModalOpen}
          onClose={closeModal}
          issues={getIssuesByCategory(selectedCategory)}
          category={selectedCategory}
          metricsData={metricsData}
        />
      )}
    </>
  );
}
