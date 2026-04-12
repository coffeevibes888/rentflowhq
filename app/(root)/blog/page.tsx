import { getPublishedBlogPosts } from '@/lib/actions/blog.actions';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

// Cache blog list for 5 minutes
export const revalidate = 300;

type BlogListPost = Awaited<ReturnType<typeof getPublishedBlogPosts>>[number] & {
  reactions?: { type: string }[];
  comments?: { id: string }[];
  tags?: string[];
  author?: {
    name?: string | null;
    image?: string | null;
  } | null;
};

const BlogPage = async () => {
  const posts = await getPublishedBlogPosts();

  return (
    <main className="w-full min-h-screen py-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Blog</h1>
          <p className="text-gray-300 text-sm md:text-base">
            Stories, inspiration, and behind-the-scenes from Rocken My Vibe.
          </p>
        </header>

        <section className="space-y-6">
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm">No posts yet. Check back soon.</p>
          )}

          <div className="flex flex-col gap-4">
            {posts.map((rawPost) => {
              const post = rawPost as BlogListPost;
              const created = formatDateTime(post.createdAt);
              const likeCount = Array.isArray(post.reactions)
                ? post.reactions.filter((r) => r.type === 'like').length
                : 0;
              const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
              return (
                <article
                  key={post.id}
                  className="w-full bg-white/10 border border-white/10 rounded-xl p-5 md:p-6 shadow-lg hover:bg-white/15 transition-colors">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6">
                      {/* Left: Cover image */}
                      <div className="md:w-40 flex-shrink-0 flex items-center justify-center">
                        {post.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-32 md:h-28 rounded-lg object-cover border border-white/15" 
                          />
                        ) : (
                          <div className="w-full h-32 md:h-28 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-[11px] text-gray-400">
                            No cover image
                          </div>
                        )}
                      </div>

                      {/* Middle: Title + tagline/excerpt */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-xs text-gray-400">
                          <span>
                            {created.dateOnly} {created.timeOnly}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <span className="inline-flex flex-wrap gap-1">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase tracking-wide"
                                >
                                  {tag}
                                </span>
                              ))}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-red-400 text-base md:text-lg">
                            <span>♥</span>
                            <span className="text-sm md:text-base text-red-200">{likeCount}</span>
                          </span>
                          <span className="flex items-center gap-1 text-gray-200 text-sm md:text-base">
                            <span className="font-medium">Comments</span>
                            <span>{commentCount}</span>
                          </span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-semibold text-white">
                          {post.title}
                        </h2>

                        {post.excerpt && (
                          <p className="text-sm md:text-base text-gray-200 line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}

                        <p className="mt-1 text-xs md:text-sm text-violet-300 underline">
                          Read more
                        </p>
                      </div>

                      {/* Right: Avatar + name */}
                      <div className="md:w-32 flex-shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 text-xs text-gray-300">
                        {post.author?.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.author.image}
                            alt={post.author?.name || 'Author avatar'}
                            className="w-12 h-12 rounded-full object-cover border border-white/20"
                          />
                        )}
                        <div className="text-right space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">Author</p>
                          <p className="text-sm font-semibold text-white">
                            {post.author?.name || 'Rocken My Vibe'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default BlogPage;
