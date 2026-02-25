import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BlogCard = memo(
  ({ Title, Excerpt, CTALink, PublishedDate, Categories, ReadTime, ImageUrl, isLandingPage = false }) => {
    // Format date to display in the format "May 5, 2021"
    const formattedDate = new Date(PublishedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return (
      <div className="flex overflow-hidden flex-col p-6 h-full rounded-lg border backdrop-blur-sm transition-all duration-300 bg-white/5 border-white/10 group">
        <Link href={CTALink}>
          <div className="overflow-hidden relative w-full h-48 rounded-[14px]">
            <Image
              src={ImageUrl}
              alt={Title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-[14px]"
              loading="lazy"
              decoding="async"
              fetchPriority="auto"
            />
          </div>
        </Link>

        <div className="flex flex-col flex-grow pt-4">
          {/* Category Row */}
          <div className="flex gap-2 items-center mb-3">
            {Categories.map((category, index) => (
              <span key={index} className="px-5 py-1 text-sm font-medium rounded-3xl text-primary bg-[#058A7C]/30 ">
                {category}
              </span>
            ))}
          </div>

          {/* Title */}
          <Link href={CTALink}>
            <h3
              className={`mb-2 text-xl font-bold transition-colors line-clamp-2 group-hover:text-primary ${
                isLandingPage ? 'text-white' : 'text-secondary-light'
              }`}
            >
              {Title}
            </h3>
          </Link>

          {/* Date and Read Time */}
          <div className="flex items-center mb-3 text-sm text-gray-400">
            <span>{formattedDate}</span>
            <span className="mx-2">|</span>
            <span className="text-primary">{ReadTime} minutes read</span>
          </div>

          {/* Excerpt */}

          {Excerpt && (
            <section className="mb-4 text-gray-400 line-clamp-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{Excerpt}</ReactMarkdown>
            </section>
          )}
          {/* Read More Link */}
          <div className="mt-auto">
            <Link
              href={CTALink}
              className="inline-flex gap-1 items-center text-sm font-medium underline transition-all duration-300 text-primary hover:underline group-hover:gap-2"
            >
              Read more
            </Link>
          </div>
        </div>
      </div>
    );
  },
);

// Add display name for the memoized component
BlogCard.displayName = 'BlogCard';

export default BlogCard;
