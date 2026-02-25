'use client';

import { strapiUrl } from '@/_common/constants';
import FooterSection from '@/app/components/Landing/Footer';
import Navbar from '@/app/components/Landing/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { BeatLoader } from 'react-spinners';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BlogCard from '../components/Blog/BlogCard';
const fetcher = url => fetch(url).then(res => res.json());

export default function BlogIndex() {
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { data, error } = useSWR('/api/blog-posts', fetcher, {
    dedupingInterval: 86400000, // Cache data for 1 day (86400000 milliseconds)
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 86400000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    onSuccess: data => {
      setDisplayedPosts(
        data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(post => ({
            ...post,
            Categories: post.Categories.split(',').map(category => category.trim()),
          })),
      );
    },
  });

  if (error) throw new Error('Failed to load blog posts');

  if (!displayedPosts.length)
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <BeatLoader color="#058A7C" size={20} />
      </div>
    );

  const categories = Array.from(new Set(displayedPosts.flatMap(post => post.Categories)));

  const featuredPost = displayedPosts[0]; // First post is featured
  const topReads = displayedPosts.slice(1, 4); // Next 3 posts are top reads

  const handleSearchChange = e => {
    const searchQuery = e.target.value.toLowerCase();
    const filteredPosts = displayedPosts.filter(post => post?.Title?.toLowerCase().includes(searchQuery));
    setSearchResults(filteredPosts);
  };

  return (
    <div className="overflow-hidden relative bg-white">
      <Navbar />

      {/* Decorative shapes */}
      <div className="xl:block hidden absolute -right-32 top-[30%] w-[400px] h-[400px] z-10 pointer-events-none">
        <Image src="/shapes/green-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div className="xl:block hidden absolute -right-32 top-[28%] w-[600px] h-[600px] z-10 pointer-events-none">
        <Image src="/shapes/blured-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div className="xl:block hidden absolute right-28 top-[33%] z-20 w-16 h-16 pointer-events-none">
        <Image src="/shapes/gold-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/80 to-white z-0 pointer-events-none h-[50vh]"></div>

      {/* Blog header & search */}
      <div className="sm:px-10 md:px-12 lg:px-5 relative z-10 px-5 pt-8 pb-4 mx-auto max-w-7xl">
        <h1 className="mb-6 text-4xl font-bold text-gray-900">Blogs</h1>

        {/* Search bar */}
        <div className="relative mb-10 max-w-md">
          <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <div className="relative">
            <input
              type="search"
              className="block p-2.5 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-300"
              placeholder="Search by subject, title..."
              onChange={e => handleSearchChange(e)}
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg">
                <ul className="overflow-y-auto max-h-48">
                  {searchResults.map(post => (
                    <Link
                      href={`/blog/${post.Slug}`}
                      key={post.id}
                      className="hover:bg-gray-100 line-clamp-2 text-ellipsis h-fit p-2 text-black border-b border-gray-200 cursor-pointer"
                    >
                      {post.Title}
                    </Link>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Blog sections */}
        <div className="lg:flex-row flex flex-col gap-8">
          {/* The Latest section - featured post */}
          <div className="lg:w-3/5">
            <h2 className="mb-4 text-xl font-semibold text-black">The Latest</h2>
            <div className="overflow-hidden bg-white rounded-[14px] border p-4 border-[#D9D9D9] shadow-sm transition-shadow hover:shadow-md">
              <Link href={`/blog/${featuredPost.Slug}`}>
                <div className="relative w-full h-60">
                  <Image
                    src={`${strapiUrl}${featuredPost?.Thumbnail?.url}`}
                    alt={featuredPost?.Title || 'Featured Post'}
                    fill
                    style={{ objectFit: 'cover', borderRadius: '14px' }}
                  />
                </div>
              </Link>
              <div className="p-6">
                <Link href={`/blog/${featuredPost.Slug}`}>
                  <h3 className="hover:text-primary mb-2 text-xl font-bold text-black transition-colors">
                    {featuredPost.Title}
                  </h3>
                </Link>
                <div className="flex items-center mb-3 text-sm text-gray-500">
                  <span>
                    {new Date(featuredPost.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-primary">{featuredPost.ReadTime} minutes read</span>
                </div>
                {featuredPost.Excerpt && (
                  <section className="mb-6 line-clamp-3 text-[#1D1C1C99]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{featuredPost.Excerpt}</ReactMarkdown>
                  </section>
                )}
                <Link
                  href={`/blog/${featuredPost.Slug}`}
                  className="text-primary underline-offset-4 font-medium underline"
                >
                  Read more
                </Link>
              </div>
            </div>
          </div>
          {/* Top Reads section */}
          <div className="lg:w-2/5">
            <h2 className="mb-4 text-xl font-semibold text-black">Top Reads</h2>
            <div className="flex flex-col gap-4">
              {topReads.map(post => (
                <Link key={post.id} href={`/blog/${post.Slug}`}>
                  <div className="flex overflow-hidden bg-white rounded-[14px] border p-4 border-[#D9D9D9] shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative flex-shrink-0 w-24 h-24">
                      <Image
                        src={`${strapiUrl}${post.Thumbnail?.url}`}
                        alt={post.Title}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '14px' }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-black">{post.Title}</h3>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="text-primary">{post.ReadTime} minutes read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Browse by categories section */}
      <div className="sm:px-10 md:px-12 lg:px-5 px-5 mx-auto mt-16 mb-4 max-w-7xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Browse by categories</h2>
        <div className="flex overflow-x-auto flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-1.5 text-sm font-medium text-gray-800 bg-[#F5F5F5] rounded-full border border-[#D9D9D9] transition-colors hover:bg-[#F5F5F5] ${
              selectedCategory === '' ? 'bg-primary-light text-primary' : ''
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 text-sm font-medium text-gray-800 bg-[#F5F5F5] rounded-full border border-[#D9D9D9] transition-colors hover:bg-[#F5F5F5] ${
                selectedCategory === category ? 'bg-primary-light text-primary' : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      {/* Remaining posts section */}
      <div className="sm:px-10 md:px-12 lg:px-5 px-5 mx-auto mb-20 max-w-7xl">
        <div className="md:grid-cols-2 lg:grid-cols-3 grid gap-8">
          {displayedPosts.map((post, index) => {
            if (selectedCategory && !post.Categories.includes(selectedCategory)) return null;
            return (
              <BlogCard
                key={index}
                Title={post.Title}
                Excerpt={post.Excerpt}
                PublishedDate={post.Date || new Date().toISOString()}
                Categories={post.Categories || ['Blog']}
                ReadTime={post.ReadTime}
                ImageUrl={`${strapiUrl}${post.Thumbnail?.url}`}
                CTALink={`/blog/${post.Slug}`}
              />
            );
          })}
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
