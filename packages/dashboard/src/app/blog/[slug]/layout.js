import { strapiUrl } from '@/_common/constants';

/**
 * Fetches post metadata from Strapi for SEO.
 */
async function getPostData(slug) {
  //pass token
  const token = process.env.STRAPI_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${process.env.STRAPI_URL}/api/blogs?filters\[Slug\][$eq]=${slug}&populate=*`, {
    method: 'GET',
    headers,
  });

  const json = await res.json();

  if (!json.data || json.data.length === 0) return null;
  return json.data[0];
}

/**
 * Generates dynamic metadata for each blog post.
 */
export async function generateMetadata({ params }) {
  const post = await getPostData(params.slug);
  if (!post) {
    return {
      title: 'Post Not Found | Interworky Blog',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${post.Title} | Interworky Blog`,
    description: post.Excerpt,
    alternates: {
      canonical: `https://www.interworky.com/blog/${params.slug}`,
    },
    openGraph: {
      title: post.Title,
      description: post.Excerpt,
      url: `https://www.interworky.com/blog/${params.slug}`,
      type: 'article',
      publishedTime: post.Date,
      images: [
        {
          url: `${strapiUrl}${post.Thumbnail?.url}`,
          width: 1200,
          height: 630,
          alt: post.Title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.Title,
      description: post.Excerpt,
      images: [
        {
          url: `${strapiUrl}${post.Thumbnail?.url}`,
          width: 1200,
          height: 630,
          alt: post.Title,
        },
      ],
    },
    keywords: post.Categories || '',
    authors: [{ name: 'Interworky' }],
    publisher: 'Interworky',
  };
}

/**
 * Layout wrapper for single blog post pages.
 */
export default async function BlogPostLayout({ children, params }) {
  const post = await getPostData(params.slug);

  return (
    <>
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.Title,
              description: post.Excerpt,
              url: `https://www.interworky.com/blog/${params.slug}`,
              datePublished: post.Date,
              author: { '@type': 'Organization', name: 'Interworky' },
              publisher: {
                '@type': 'Organization',
                name: 'Interworky',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://www.interworky.com/logo.png',
                },
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `https://www.interworky.com/blog/${params.slug}`,
              },
              image: post.Thumbnail?.url ? `${strapiUrl}${post.Thumbnail.url}` : undefined,
            }),
          }}
        />
      )}
      <main role="main" className="bg-white">
        {children}
      </main>
    </>
  );
}
