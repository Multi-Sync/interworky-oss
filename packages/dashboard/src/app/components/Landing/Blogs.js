import BlogCard from '../Blog/BlogCard';
import GradientBorderButton from '../ui/GradientBorderButton';

export const postsData = [
  {
    id: 7,
    documentId: 'lb3r8brycj08ggroobcegphe',
    Title: 'End Knowledge Frustration with Interworky Enterprise Agent',
    Slug: 'interworky-nextjs-integration',
    PublishedDate: '2025-05-01T11:45:00.000Z',
    Categories: ['Blog'],
    ReadTime: '3',
    Excerpt: `Discover how Interworky Enterprise Agent unifies every knowledge source behind your firewall, delivers millisecond-fast, human-friendly answers, and ensures the right people see the right information securely and instantly.`,
    CTAText: 'Read more',
    ImageUrl:
      'https://interworky.com/_next/image?url=https%3A%2F%2Fblogmanager.interworky.com%2Fuploads%2FInterworky_Enterprise_Agent_fd94d0ba9e.png&w=3840&q=75',
    CTALink: '/blog/interworky-enterprise-agent',
  },
  {
    id: 8,
    documentId: 'ygx0a54p4o8vjasfhpfeuc49',
    Title: "7 Tasks You Shouldn't Be Doing Manually on Your Website",
    Slug: 'seven-tasks-website-ai',
    PublishedDate: '2025-04-27T13:00:00.000Z',
    Categories: ['Insights'],
    ReadTime: '3',
    Excerpt: `7 Tasks You Shouldn't Be Doing Manually on Your Website In 2025, there's no reason to be buried in website tasks that smart tools can handle for you. From collecting contact details to confirming appointments, manual work slows you down and costs you conversions. That's where **Interworky's AI Chatbot** comes in; it is always on, always helpful, and built to automate busy work.`,
    CTAText: 'Read more',
    ImageUrl: '/blogs/interworkyaitasks.webp',
    CTALink: '/blog/seven-tasks-website-ai',
  },
  {
    id: 27,
    documentId: 'yhj1fdkar88bt3rx9mu248kd',
    Title: '🗣️ Real-Time Language Detection: How Interworky Engages Global Audiences',
    Slug: 'real-time-language-detection',
    PublishedDate: '2025-05-11T04:30:00.000Z',
    Categories: ['Insights', 'Blogs'],
    ReadTime: '4',
    Excerpt: `Interworky engages global audiences through seamless integration and advanced multilingual capabilities. Its AI-powered real-time language detection allows businesses to communicate naturally and effectively with users from diverse linguistic backgrounds. By automatically identifying and responding in the user's preferred language without the need for manual selection, Interworky delivers a more inclusive, accessible, and personalized digital experience`,
    CTAText: 'Read more',
    ImageUrl: '/blogs/break-language-barriers-interworky.webp',
    CTALink: '/blog/real-time-language-detection',
  },
];

const BlogSection = () => {
  return (
    <section className="py-24 bg-black">
      <div className="px-5 mx-auto max-w-7xl sm:px-10 md:px-12 lg:px-5">
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-2 mb-4 text-sm font-medium rounded-full bg-gray-900 border text-white">
            Latest Resources
          </div>
          <h2 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-white sm:leading-5 mb-10 mt-5">
            Explore Latest Articles
          </h2>
          <p className="text-base lg:text-body max-w-2xl mx-auto text-gray-300">
            Stay up-to-date with the latest trends, tutorials, and insights on enhancing your website with AI-powered
            capabilities.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {postsData.map(post => (
            <BlogCard key={post.id} {...post} isLandingPage={true} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <GradientBorderButton href="/blog" showArrow={false}>
            View More
          </GradientBorderButton>
        </div>
      </div>
    </section>
  );
};
