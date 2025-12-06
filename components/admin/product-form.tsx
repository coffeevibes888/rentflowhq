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
  const [, setSizes] = useState<{ id: string; name: string; slug: string }[]>([]);

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
        {/* -------------------- Property Name & Slug -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'name'> }) => (
              <FormItem className="w-full">
                <FormLabel>Property name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Skyview Apartments" {...field} />
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
                    <Input placeholder="auto-generated from property name" {...field} />
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

        {/* -------------------- Layout & Address -------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'bedrooms'> }) => (
              <FormItem className="w-full">
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'bathrooms'> }) => (
              <FormItem className="w-full">
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sizeSqFt"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'sizeSqFt'> }) => (
              <FormItem className="w-full">
                <FormLabel>Square feet</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 850" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'streetAddress'> }) => (
              <FormItem className="w-full md:col-span-2">
                <FormLabel>Street address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 123 Main St, City, State" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitNumber"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'unitNumber'> }) => (
              <FormItem className="w-full">
                <FormLabel>Unit / Apt</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Apt 4B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Type, Neighborhood & Branding -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="category"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'category'> }) => (
              <FormItem className="w-full">
                <FormLabel>Property type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Apartment, House, Office" {...field} />
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
                <FormLabel>Neighborhood / Area</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Downtown, Riverside District" {...field} />
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
                <FormLabel>Ownership / Branding</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Skyline Properties" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Monthly Rent & Availability -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="price"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'price'> }) => (
              <FormItem className="w-full">
                <FormLabel>Starting monthly rent</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1650" {...field} />
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
                <FormLabel>Available units</FormLabel>
                <FormControl>
                  <Input placeholder="Number of available units" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Property Photos -------------------- */}
        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem className="w-full">
              <FormLabel>Property photos</FormLabel>
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
                            alt="property image"
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
                          placeholder="Label (e.g. Exterior, Lobby, Floorplan)"
                          value={imageColors[index] || ''}
                          onChange={(e) => {
                            const next = [...imageColors];
                            next[index] = e.target.value;
                            form.setValue('imageColors', next);
                          }}
                          className="w-40"
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

        {/* -------------------- Description -------------------- */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'description'> }) => (
            <FormItem className="w-full">
              <FormLabel>Property description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the property, amenities, nearby points of interest, and any leasing details."
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
            {form.formState.isSubmitting ? 'Saving Property...' : `${type} Property`}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
