'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertBlogPostSchema } from '@/lib/validators';
import { createBlogPost } from '@/lib/actions/blog.actions';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from '@/lib/uploadthing';
import { Bold, Italic, Palette, SmilePlus, Type } from 'lucide-react';

const emojiList = ['😀','😁','😂','🤣','😊','😍','😎','🤩','🙏','🎉','🔥','❤️','💯'];

const blogDefaultValues: z.infer<typeof insertBlogPostSchema> = {
  title: '',
  slug: '',
  excerpt: '',
  contentHtml: '',
  coverImage: null,
  mediaUrls: [],
  tags: [],
  isPublished: true,
  authorId: null,
};

export default function BlogEditor() {
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const form = useForm<z.infer<typeof insertBlogPostSchema>>({
    resolver: zodResolver(insertBlogPostSchema),
    defaultValues: blogDefaultValues,
  });

  const mediaUrls = (form.watch('mediaUrls') as string[]) || [];

  useEffect(() => {
    const currentTags = (form.getValues('tags') as string[] | undefined) || [];
    setTagsInput(currentTags.join(', '));
  }, [form]);

  const handleToolbarClick = (command: string, value?: string) => {
    if (typeof document === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    document.execCommand(command, false, value ?? null);
    if (editorRef.current) {
      form.setValue('contentHtml', editorRef.current.innerHTML);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    handleToolbarClick('insertText', emoji);
  };

  const onSubmit = async (values: z.infer<typeof insertBlogPostSchema>) => {
    const res = await createBlogPost({
      ...values,
      contentHtml: editorRef.current?.innerHTML || values.contentHtml,
    });

    if (!res?.success) {
      toast({ variant: 'destructive', description: res?.message || 'Failed to create blog post' });
      return;
    }

    toast({ description: res.message });
    router.push('/blog');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter blog title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="url-friendly-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Short summary shown on the blog list"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Content</FormLabel>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-800 text-slate-200"
              onClick={() => handleToolbarClick('bold')}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-800 text-slate-200"
              onClick={() => handleToolbarClick('italic')}
            >
              <Italic className="w-4 h-4" />
            </button>
            <label className="flex items-center gap-1 p-1 rounded hover:bg-slate-800 cursor-pointer">
              <Palette className="w-4 h-4" />
              <input
                type="color"
                className="w-4 h-4 border-0 bg-transparent p-0 cursor-pointer"
                onChange={(e) => handleToolbarClick('foreColor', e.target.value)}
              />
            </label>
            <select
              className="h-7 rounded bg-slate-900 border border-slate-700 px-1 text-[11px] flex items-center"
              onChange={(e) => handleToolbarClick('fontSize', e.target.value)}
              defaultValue="3"
            >
              <option value="2">Small</option>
              <option value="3">Normal</option>
              <option value="4">Large</option>
              <option value="5">XL</option>
            </select>
            <button
              type="button"
              className="p-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-1"
              onClick={() => setShowEmojiPicker((v) => !v)}
            >
              <SmilePlus className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Emoji</span>
            </button>
          </div>

          {showEmojiPicker && (
            <div className="flex flex-wrap gap-1 p-2 mb-1 rounded-md bg-slate-900 border border-slate-700 text-lg">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="hover:bg-slate-800 rounded px-1"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div
            ref={editorRef}
            className="min-h-[200px] text-sm bg-slate-950/80 border border-slate-700 rounded-md px-3 py-2 overflow-y-auto focus:outline-none"
            contentEditable
            onInput={(e) => form.setValue('contentHtml', (e.target as HTMLDivElement).innerHTML)}
          />
          <FormMessage />
        </div>

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {field.value && (
                    <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={field.value}
                        alt="Cover preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <UploadButton
                    endpoint="blogMediaUploader"
                    onClientUploadComplete={(res) => {
                      const first = res[0]?.url;
                      if (first) {
                        field.onChange(first);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast({
                        variant: 'destructive',
                        description: `Upload failed: ${error.message}`,
                      });
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  placeholder="faith, funny, inspiration"
                  value={tagsInput}
                  onChange={(e) => {
                    const text = e.target.value;
                    setTagsInput(text);
                    const tags = text
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean);
                    field.onChange(tags);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Attachments (images, videos, files)</FormLabel>
          <FormControl>
            <UploadButton
              endpoint="blogMediaUploader"
              onClientUploadComplete={(res) => {
                const urls = res.map((r) => r.url).filter(Boolean);
                if (urls.length) {
                  form.setValue('mediaUrls', [...mediaUrls, ...urls]);
                }
              }}
              onUploadError={(error: Error) => {
                toast({ variant: 'destructive', description: `Upload failed: ${error.message}` });
              }}
            />
          </FormControl>
          {mediaUrls.length > 0 && (
            <ul className="mt-2 space-y-2 text-xs text-gray-300">
              {mediaUrls.map((url) => {
                const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(url);
                return (
                  <li key={url} className="flex items-center gap-2">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt="Attachment preview"
                        className="w-10 h-10 rounded object-cover border border-slate-700"
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[10px]">
                        FILE
                      </span>
                    )}
                    <span className="truncate max-w-xs">{url}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex items-center gap-1">
            <Type className="w-4 h-4" />
            Publish Post
          </Button>
        </div>
      </form>
    </Form>
  );
}
