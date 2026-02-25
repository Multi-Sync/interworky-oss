import BlogPostClient from '@/app/components/Blog/BlogPostClient';

export default function BlogPostPage({ params }) {
  // render a client component, passing slug
  return <BlogPostClient slug={params.slug} />;
}
