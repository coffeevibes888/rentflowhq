"use server";

import { z } from "zod";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { formatError } from "@/lib/utils";
import { insertBlogPostSchema, updateBlogPostSchema } from "@/lib/validators";

export async function createBlogPost(data: z.infer<typeof insertBlogPostSchema>) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "superAdmin") {
      throw new Error("Only admins can create blog posts");
    }
    const parsed = insertBlogPostSchema.parse({
      ...data,
      authorId: session.user.id,
    });

    const post = await prisma.blogPost.create({
      data: parsed,
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return { success: true, message: "Blog post created", post };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "superAdmin") {
      throw new Error("Only admins can delete blog posts");
    }

    const post = await prisma.blogPost.delete({ where: { id } });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return { success: true, message: "Blog post deleted" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateBlogPost(data: z.infer<typeof updateBlogPostSchema>) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "superAdmin") {
      throw new Error("Only admins can update blog posts");
    }

    const parsed = updateBlogPostSchema.parse(data);

    const post = await prisma.blogPost.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        contentHtml: parsed.contentHtml,
        coverImage: parsed.coverImage,
        mediaUrls: parsed.mediaUrls,
        tags: parsed.tags,
        isPublished: parsed.isPublished,
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return { success: true, message: "Blog post updated", post };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getPublishedBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: { name: true, image: true },
      },
      reactions: {
        select: { type: true },
      },
      comments: {
        select: { id: true },
      },
    },
  });

  return posts;
}

export async function toggleBlogLike(postId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in to like a post");
    }

    const userId = session.user.id as string;

    const existing = await prisma.blogReaction.findFirst({
      where: { postId, userId, type: "like" },
    });

    if (existing) {
      await prisma.blogReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.blogReaction.create({
        data: { postId, userId, type: "like" },
      });
    }

    const count = await prisma.blogReaction.count({
      where: { postId, type: "like" },
    });

    revalidatePath(`/blog/${postId}`);

    return { success: true, count, liked: !existing };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function addBlogComment(postId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in to comment");
    }

    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error("Comment cannot be empty");
    }

    await prisma.blogComment.create({
      data: {
        postId,
        userId: session.user.id as string,
        content: trimmed,
      },
    });

    revalidatePath(`/blog/${postId}`);

    return { success: true, message: "Comment added" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: { name: true, image: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
      reactions: true,
    },
  });

  return post;
}

export async function getAllBlogPostsForAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin" && session?.user?.role !== "superAdmin") {
    throw new Error("Only admins can view all posts");
  }

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true, email: true },
      },
    },
  });

  return posts;
}
