'use client';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { productDefaultValues } from '@/lib/constants';
import { insertProductSchema, updateProductSchema } from '@/lib/validators';
import { Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ControllerRenderProps, SubmitHandler, useForm } from 'react-hook-form';
import slugify from 'slugify';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { createProduct, updateProduct } from '@/lib/actions/product.actions';
import { UploadButton } from '@/lib/uploadthing';
import { Card, CardContent } from '../ui/card';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import { z } from 'zod';

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: 'Create' | 'Update';
  product?: Product;
  productId?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertProductSchema>>({
    resolver:
      type === 'Update'
        ? zodResolver(updateProductSchema)
        : zodResolver(insertProductSchema),
    defaultValues:
      product && type === 'Update' ? product : productDefaultValues,
  });

  const onSubmit: SubmitHandler<z.infer<typeof insertProductSchema>> = async (
    values
  ) => {
    let res;
    if (type === 'Create') {
      res = await createProduct(values);
    } else if (productId) {
      res = await updateProduct({ ...values, id: productId });
    }

    if (!res?.success) {
      toast({
        variant: 'destructive',
        description: res?.message || 'Something went wrong',
      });
    } else {
      toast({ description: res.message });
      router.push('/admin/products');
    }
  };

  const images = (form.watch('images') as string[]) || [];
  const imageColors = (form.watch('imageColors') as string[]) || [];
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const isFeatured = form.watch('isFeatured');
  const banner = form.watch('banner');
  const [sizes, setSizes] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sizes');
        if (res.ok) setSizes(await res.json());
      } catch (err) {
        console.error('Error fetching sizes:', err);
      }
    })();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* -------------------- Name & Slug -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'name'> }) => (
              <FormItem className="w-full">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'slug'> }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="Enter slug" {...field} />
                    <Button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2"
                      onClick={() =>
                        form.setValue(
                          'slug',
                          slugify(form.getValues('name'), { lower: true })
                        )
                      }
                    >
                      Generate
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Category, Sub Category & Brand -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="category"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'category'> }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Enter category" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subCategory"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'subCategory'> }) => (
              <FormItem className="w-full">
                <FormLabel>Sub Category</FormLabel>
                <FormControl>
                  <Input placeholder="Enter sub category (e.g. T-shirt, Hoodie, Hat)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'brand'> }) => (
              <FormItem className="w-full">
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="Enter brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Price, Stock & Sale -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="price"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'price'> }) => (
              <FormItem className="w-full">
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'stock'> }) => (
              <FormItem className="w-full">
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input placeholder="Enter stock" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Images Upload with Color Labels -------------------- */}
        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem className="w-full">
              <FormLabel>Images & Colors</FormLabel>
              <Card>
                <CardContent className="space-y-4 mt-2 min-h-48">
                  <div className="flex flex-wrap gap-4">
                    {images.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="flex flex-col items-start space-y-2 cursor-move"
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={() => {
                          if (dragIndex === null || dragIndex === index) return;
                          const nextImages = [...images];
                          const [movedImage] = nextImages.splice(dragIndex, 1);
                          nextImages.splice(index, 0, movedImage);

                          const nextColors = [...imageColors];
                          const [movedColor] = nextColors.splice(dragIndex, 1);
                          nextColors.splice(index, 0, movedColor);

                          form.setValue('images', nextImages);
                          form.setValue('imageColors', nextColors);
                          setDragIndex(null);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <Image
                            src={image}
                            alt="product image"
                            className="w-20 h-20 object-cover object-center rounded-sm"
                            width={100}
                            height={100}
                          />
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              const nextImages = images.filter((_, i) => i !== index);
                              const nextColors = imageColors.filter((_, i) => i !== index);
                              form.setValue('images', nextImages);
                              form.setValue('imageColors', nextColors);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <Input
                          placeholder="Color for this image (e.g. Black, Red, Navy)"
                          value={imageColors[index] || ''}
                          onChange={(e) => {
                            const next = [...imageColors];
                            next[index] = e.target.value;
                            form.setValue('imageColors', next);
                          }}
                          className="w-20"
                        />
                      </div>
                    ))}
                  </div>
                  <FormControl>
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res: { url: string }[]) => {
                        const url = res[0]?.url;
                        if (!url) return;
                        form.setValue('images', [...images, url]);
                        form.setValue('imageColors', [...imageColors, '']);
                      }}
                      onUploadError={(error: Error) => {
                        toast({
                          variant: 'destructive',
                          description: `ERROR! ${error.message}`,
                        });
                      }}
                    />
                  </FormControl>
                </CardContent>
              </Card>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* -------------------- Available Sizes -------------------- */}
        <div className="mb-4">
          <FormLabel>Available Sizes</FormLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {sizes.map((s) => {
              const checked =
                (form.getValues('sizeIds') || []).includes(s.id);
              return (
                <label
                  key={s.id}
                  className="inline-flex items-center space-x-1 text-xs px-2 py-1 border rounded-md"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={checked}
                    onChange={(e) => {
                      const current = form.getValues('sizeIds') || [];
                      form.setValue(
                        'sizeIds',
                        e.target.checked
                          ? [...current, s.id]
                          : current.filter((id: string) => id !== s.id)
                      );
                    }}
                  />
                  <span>{s.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* -------------------- Sale -------------------- */}
        <div className="mb-4">
          <FormLabel>Sale</FormLabel>
          <div className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={form.watch('onSale')}
              onCheckedChange={(v) => form.setValue('onSale', Boolean(v))}
            />
            <span>On Sale</span>
          </div>
          {form.watch('onSale') && (
            <div className="mt-2 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  placeholder="10"
                  value={form.watch('salePercent') ?? ''}
                  onChange={(e) =>
                    form.setValue(
                      'salePercent',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-20"
                />
                <span>% off</span>
              </div>
              <Input
                type="datetime-local"
                value={form.watch('saleUntil') ?? ''}
                onChange={(e) => form.setValue('saleUntil', e.target.value || null)}
                className="text-xs"
              />
            </div>
          )}
        </div>

        {/* -------------------- Featured Product -------------------- */}
        <div className="mb-4">
          <FormLabel>Featured Product</FormLabel>
          <Card>
            <CardContent className="space-y-2 mt-2">
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'isFeatured'> }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Is Featured?</FormLabel>
                  </FormItem>
                )}
              />
              {isFeatured && banner && (
                <Image
                  src={banner}
                  alt="banner image"
                  className="w-full object-cover object-center rounded-sm"
                  width={1920}
                  height={680}
                />
              )}
              {isFeatured && !banner && (
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res: { url: string }[]) => {
                    form.setValue('banner', res[0].url);
                  }}
                  onUploadError={(error: Error) => {
                    toast({
                      variant: 'destructive',
                      description: `ERROR! ${error.message}`,
                    });
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* -------------------- Description -------------------- */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'description'> }) => (
            <FormItem className="w-full">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter product description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* -------------------- Submit Button -------------------- */}
        <div>
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? 'Submitting...' : `${type} Product`}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
