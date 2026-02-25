'use client';
import { strapiUrl } from '@/_common/constants';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import FooterSection from '@/app/components/Landing/Footer';
import Navbar from '@/app/components/Landing/Navbar';
import { Icon } from '@iconify-icon/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { BeatLoader } from 'react-spinners';
import remarkGfm from 'remark-gfm';
import useSWR from 'swr';
import BlogCard from './BlogCard';
import { postsData } from '../Landing/Blogs';
import Input from '../ui/Input';
import UserInfoModal from '../UserInfoModal';

const fetcher = url => fetch(url).then(res => res.json());

// Extract headings from markdown content
function extractHeadings(markdown) {
  if (!markdown) return [];

  // Match all h2 headings in markdown (## Heading)
  const headingRegex = /^## (.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[1].trim();
    // Create an ID from the heading text (lowercase, replace spaces with hyphens)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-'); // Replace spaces with hyphens

    headings.push({ text, id });
  }

  return headings;
}

// Table of Contents component
function TableOfContents({ headings, title, excerpt, url }) {
  if (!headings || headings.length === 0) return null;

  const scrollToHeading = id => {
    const element = document.getElementById(id);
    if (element) {
      // Smooth scroll to the element
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="hidden sticky top-24 p-4 my-8 rounded-[14px] w-fit h-fit lg:block bg-neutral-50">
      <h3 className="mb-3 text-lg font-semibold">Table of Contents</h3>
      <ul className="space-y-2">
        {headings.map(heading => (
          <li key={heading.id} className="break-words">
            <button onClick={() => scrollToHeading(heading.id)} className="text-primary hover:underline text-left">
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
      <h3 className="mt-8 text-lg font-semibold text-[#00000099]">Share</h3>
      <div className="flex gap-4 items-center pt-4">
        <Icon
          icon="fa-brands:facebook-f"
          width={20}
          height={20}
          className="cursor-pointer text-[#00000099] hover:text-[#000000]"
          onClick={() =>
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(excerpt)}`,
              '_blank',
            )
          }
        />
        <Icon
          icon="fa-brands:reddit"
          width={20}
          height={20}
          className="cursor-pointer text-[#00000099] hover:text-[#000000]"
          onClick={() =>
            window.open(
              `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
              '_blank',
            )
          }
        />
        <Icon
          icon="fa-brands:linkedin-in"
          width={20}
          height={20}
          className="cursor-pointer text-[#00000099] hover:text-[#000000]"
          onClick={() =>
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(excerpt)}`,
              '_blank',
            )
          }
        />
      </div>
    </div>
  );
}

// Component for social media share buttons
function ShareButton({ network, title, excerpt, url, icon, thumbnailUrl }) {
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(excerpt)}&picture=${encodeURIComponent(thumbnailUrl)}`,
    instagram: `#`, // Instagram doesn't support direct sharing via URLs
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(excerpt)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  };

  const handleShare = e => {
    e.preventDefault();

    if (network === 'instagram') {
      toast.info("Instagram doesn't support direct sharing. Save the image and share manually.");
      return;
    }

    const width = 600;
    const height = 400;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(shareUrls[network], `Share on ${network}`, `width=${width},height=${height},left=${left},top=${top}`);
  };

  // Map network names to colors
  const colors = {
    facebook: 'bg-[#3b5998] hover:bg-[#324b80]',
    instagram: 'bg-[#E1306C] hover:bg-[#c62b5f]',
    linkedin: 'bg-[#0077b5] hover:bg-[#006399]',
    reddit: 'bg-[#ff4500] hover:bg-[#e03d00]',
  };

  return (
    <button
      onClick={handleShare}
      aria-label={`Share on ${network}`}
      className={`${colors[network]} flex gap-2 items-center px-4 py-2 text-white rounded-md`}
    >
      <Icon icon={icon} />
      <span className="capitalize">{network}</span>
    </button>
  );
}

export default function BlogPostClient({ slug }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('blog');

  const { data, error } = useSWR(`/api/blog-posts/${slug}`, fetcher, {
    dedupingInterval: 86400000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 86400000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    onSuccess: data => {
      data.Categories = data.Categories.split(',').map(category => category.trim());
    },
  });

  const { handleNotification } = useNotification();

  if (error) return <div>Error loading post</div>;
  if (!data)
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <BeatLoader color="#058A7C" size={20} />
      </div>
    );

  const {
    Title: title,
    createdAt: date,
    Author: author,
    AuthorAvatar: authorAvatar,
    ReadTime: readTime,
    Categories: categories,
    Tags: tags,
    ImageUrl: imageUrl,
    Excerpt: excerpt,
    Body: body,
    RelatedPosts: relatedPosts,
    CTAText: ctaText,
    CTALink: ctaLink,
  } = data;

  return (
    <div className="overflow-hidden relative text-black bg-white">
      <Head>
        <title>{title} | Interworky Blog</title>
        <meta name="description" content={excerpt || 'Read the latest from Interworky blog'} />
        <link rel="canonical" href={`https://www.interworky.com/blog/${slug}`} />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.interworky.com/blog/${slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt || ''} />
        <meta property="og:image" content={`${strapiUrl}${data.Thumbnail?.url}`} />
        <meta property="og:image:secure_url" content={`${strapiUrl}${data.Thumbnail?.url}`} />
        <meta property="og:image:alt" content={title} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Interworky" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://www.interworky.com/blog/${slug}`} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={excerpt || ''} />
        <meta property="twitter:image" content={`${strapiUrl}${data.Thumbnail?.url}`} />
        <meta property="twitter:image:alt" content={title} />
      </Head>
      <Navbar />

      <div aria-hidden="true" className="xl:block hidden absolute -right-32 top-[30%] z-10 pointer-events-none">
        <Image src="/shapes/green-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div aria-hidden="true" className="xl:block hidden absolute -right-32 top-[28%] z-10 pointer-events-none">
        <Image src="/shapes/blured-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div aria-hidden="true" className="xl:block hidden absolute right-28 top-[33%] z-20 pointer-events-none">
        <Image src="/shapes/gold-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>

      <div className="sm:px-6 lg:px-8 flex flex-col gap-4 items-center px-4 my-14">
        <div className="flex gap-2 items-center">
          {categories.map((category, index) => (
            <span key={index} className="text-primary bg-primary-light px-2 py-1 text-sm font-medium rounded-3xl">
              {category}
            </span>
          ))}
        </div>
        <h1
          id="post-title"
          className=" text-2xl lg:text-4xl font-semibold font-inter text-center text-black leading-none md:text-5xl lg:text-[40px]"
        >
          {title}
        </h1>

        <div className="flex items-center mb-3 text-sm text-gray-500">
          <span>
            {new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="mx-2">|</span>
          <span className="text-primary">{readTime} minutes read</span>
        </div>
      </div>
      <div className="relative lg:w-[1100px] lg:min-h-[650px] w-full min-h-[200px] h-fit mx-auto">
        <Image src={`${strapiUrl}${data.Thumbnail?.url}`} alt={title} fill style={{ objectFit: 'cover' }} />
      </div>
      <main role="main " className="flex flex-row-reverse px-5 lg:px-0 max-w-[1100px] justify-between mx-auto py-10">
        {/* Table of Contents */}
        {body && (
          <TableOfContents
            headings={extractHeadings(body)}
            title={title}
            excerpt={excerpt}
            url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://interworky.com'}/blog/${slug}`}
          />
        )}

        <article aria-labelledby="post-title" className="w-fit prose pb-20">
          {excerpt && (
            <section className="post-excerpt prose mb-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{excerpt}</ReactMarkdown>
            </section>
          )}

          <section className="post-body prose mb-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="text-pretty"
              components={{
                // Add IDs to h2 elements for scroll targeting
                h2: ({ node, ...props }) => {
                  const id = props.children
                    .toString()
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');

                  return <h2 id={id} {...props} />;
                },
                // Fix pre element overflow on mobile
                pre: ({ node, ...props }) => (
                  <pre
                    {...props}
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowX: 'auto',
                      maxWidth: '100%',
                    }}
                  />
                ),
              }}
            >
              {body}
            </ReactMarkdown>
          </section>
        </article>
      </main>
      <div className="flex flex-col">
        {/* Related posts section */}
        <section className="lg:px-40 px-5 mb-12">
          <h2 className="mb-6 text-2xl font-bold">Related Blogs</h2>
          <div className="md:grid-cols-2 lg:grid-cols-3 grid gap-12">
            {postsData.map(post => (
              <BlogCard key={post.id} {...post} />
            ))}
          </div>
        </section>

        {ctaText && (
          <section
            role="region"
            aria-labelledby="cta-heading"
            className="py-8 mt-12 mb-12 text-center h-[380px] flex flex-col justify-center items-center gap-6"
            style={{ backgroundImage: 'url(/blog-pattern.png)', backgroundSize: 'contain' }}
          >
            <h2 className="font-bold text-white lg:text-[43px] text-[28px] ">{ctaText}</h2>
            <button
              onClick={() => {
                setModalSource('blog_cta');
                setIsModalOpen(true);
              }}
              className="text-primary inline-block px-6 py-3 font-semibold bg-white rounded-md transition-colors hover:opacity-90"
            >
              Get Started
            </button>
          </section>
        )}

        <section role="region" aria-labelledby="subscribe-heading" className="lg:px-40 post-subscribe px-5 mt-12">
          <h2 id="subscribe-heading" className="sr-only">
            Subscribe to Updates
          </h2>
          <form
            className="md:flex-row flex flex-col gap-4"
            onSubmit={e => {
              e.preventDefault();
              handleNotification(
                `New subscriber: ${e.target.email.value} - ${e.target.website.value}, Blog post: ${title}`,
              );
              toast.success('Subscribed successfully! 🎉');
              e.target.reset();
            }}
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="Your email"
              required
              className="sm:flex-1 p-3 w-full rounded-md border"
            />
            <label htmlFor="website" className="sr-only">
              Website URL (optional)
            </label>
            <Input
              id="website"
              type="url"
              name="website"
              placeholder="Your website (optional)"
              className="sm:flex-1 p-3 w-full rounded-md border"
            />
            <button
              aria-label="Subscribe to blog updates"
              type="submit"
              className="bg-primary sm:w-auto px-6 py-3 w-full text-white rounded-md"
            >
              Subscribe
            </button>
          </form>
        </section>

        {/* Social Media Sharing Section */}
        <section
          role="region"
          aria-labelledby="share-heading"
          className="lg:px-40 flex flex-col items-center px-5 mx-auto mt-12 mb-8"
        >
          <h2 id="share-heading" className="mx-auto mb-4 font-bold text-gray-800">
            Share This Post
          </h2>
          <div className="flex flex-wrap gap-3">
            <ShareButton
              network="facebook"
              title={title}
              excerpt={excerpt}
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://interworky.com'}/blog/${slug}`}
              icon="ri:facebook-fill"
              thumbnailUrl={`${strapiUrl}${data.Thumbnail?.url}`}
            />

            <ShareButton
              network="linkedin"
              title={title}
              excerpt={excerpt}
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://interworky.com'}/blog/${slug}`}
              icon="ri:linkedin-fill"
              thumbnailUrl={`${strapiUrl}${data.Thumbnail?.url}`}
            />
            <ShareButton
              network="reddit"
              title={title}
              excerpt={excerpt}
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://interworky.com'}/blog/${slug}`}
              icon="ri:reddit-fill"
              thumbnailUrl={`${strapiUrl}${data.Thumbnail?.url}`}
            />
          </div>
        </section>
      </div>
      <FooterSection />

      <UserInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType="demo"
        source={modalSource}
      />
    </div>
  );
}
