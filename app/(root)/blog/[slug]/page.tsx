import { notFound } from 'next/navigation';
import { getBlogPostBySlug, toggleBlogLike, addBlogComment } from '@/lib/actions/blog.actions';
import { formatDateTime } from '@/lib/utils';
import { auth } from '@/auth';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlogPostPage = async (props: any) => {
  const { params } = props as { params: Promise<{ slug: string }> };
  const { slug } = await params;

  const [session, post] = await Promise.all([
    auth(),
    getBlogPostBySlug(slug),
  ]);

  if (!post || !post.isPublished) {
    notFound();
  }

  const created = formatDateTime(post.createdAt);
  const isAdmin = session?.user?.role === 'admin';
  const userId = session?.user?.id as string | undefined;
  const likeCount = post.reactions.filter((r) => r.type === 'like').length;
  const userLiked = !!userId && post.reactions.some((r) => r.type === 'like' && r.userId === userId);

  return (
    <main className="w-full min-h-screen py-8">
      <div className="container mx-auto max-w-3xl">
        <div className="space-y-8">
          <div className="space-y-6">

            <header className="space-y-3">
              <p className="text-xs md:text-sm text-gray-400 flex items-center gap-2">
                {post.author?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author.image}
                    alt={post.author.name || 'Author avatar'}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                )}
                <span>
                  {created.dateOnly} · {created.timeOnly}{' '}
                  {post.author?.name && <span>· By {post.author.name}</span>}
                </span>
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{post.title}</h1>
              {post.excerpt && (
                <p className="text-sm md:text-base text-gray-200">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between gap-3 text-xs md:text-sm text-gray-300">
                <form action={async () => {
                  'use server';
                  await toggleBlogLike(post.id);
                }}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs md:text-sm hover:bg-white/10"
                  >
                    <span>{userLiked ? '♥ Liked' : '♡ Like'}</span>
                    <span className="text-gray-300">{likeCount}</span>
                  </button>
                </form>

                {isAdmin && (
                  <div className="flex items-center gap-3 text-[11px] md:text-xs">
                    <Link
                      href={`/admin/blog/create?edit=${post.slug}`}
                      className="underline text-violet-300"
                    >
                      Edit post
                    </Link>
                    <form
                      action={async () => {
                        'use server';
                        // soft redirect by deleting then letting user navigate away
                        await import('@/lib/actions/blog.actions').then((m) => m.deleteBlogPost(post.id));
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-300 hover:text-red-200 underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </header>

            <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-200 prose-a:text-violet-300">
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </article>

            <section className="mt-8 space-y-4">

              <h2 className="text-lg font-semibold text-white">Comments</h2>

              {post.comments.length === 0 && (
                <p className="text-xs text-gray-400">No comments yet. Be the first to share a thought.</p>
              )}

              <div className="space-y-3">
                {post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 flex items-start gap-2 text-xs md:text-sm"
                  >
                    {comment.user.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.user.image}
                        alt={comment.user.name || 'User'}
                        className="w-7 h-7 rounded-full object-cover border border-white/20 mt-0.5"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium text-gray-100">
                        {comment.user.name || 'User'}
                      </p>
                      <p className="text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {session ? (
                <form
                  action={async (formData: FormData) => {
                    'use server';
                    const content = String(formData.get('content') || '');
                    await addBlogComment(post.id, content);
                  }}
                  className="mt-4 space-y-2"
                >
                  <textarea
                    name="content"
                    rows={3}
                    className="w-full rounded-md border border-white/15 bg-slate-950/70 px-3 py-2 text-xs md:text-sm text-white outline-none focus:border-violet-400"
                    placeholder="Share your thoughts..."
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-violet-500 px-3 py-1.5 text-xs md:text-sm text-white hover:bg-violet-400"
                  >
                    Post comment
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-xs text-gray-400">
                  Please <Link href="/auth/signin" className="underline text-violet-300">sign in</Link> to like or comment.
                </p>
              )}
            </section>

            {post.coverImage && (
              <div className="mt-8 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-[250px] h-[250px] object-cover rounded-xl"
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
};

export default BlogPostPage;