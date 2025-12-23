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
import { useSubscriptionContext } from '@/components/subscription/subscription-provider';
import { SubscriptionTier } from '@/lib/config/subscription-tiers';

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
  const { showUpgradeModal } = useSubscriptionContext();

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
    let res: any;
    if (type === 'Create') {
      res = await createProduct(values);
    } else if (productId) {
      res = await updateProduct({ ...values, id: productId });
    }

    if (!res?.success) {
      // Check if this is a subscription limit error
      if (res?.subscriptionError) {
        showUpgradeModal({
          currentTier: res.currentTier as SubscriptionTier,
          currentUnitCount: res.currentUnitCount,
          unitLimit: res.unitLimit,
          reason: 'unit_limit',
        });
        return;
      }
      
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
                <FormLabel className="text-slate-200">Property name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Skyview Apartments"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Slug</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="auto-generated from property name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      {...field}
                      value={field.value ?? ''}
                    />
                    <Button
                      type="button"
                      className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1 mt-2"
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
                <FormLabel className="text-slate-200">Bedrooms</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 2"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Bathrooms</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 1.5"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Square feet</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 850"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Street address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 123 Main St, City, State"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Unit / Apt</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Apt 4B"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Property type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Apartment, House, Office"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Neighborhood / Area</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Downtown, Riverside District"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Ownership / Branding</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Skyline Properties"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Starting monthly rent</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 1650"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel className="text-slate-200">Available units</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Number of available units"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* -------------------- Fees (Cleaning & Pet Deposit) -------------------- */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField
            control={form.control}
            name="cleaningFee"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'cleaningFee'> }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-200">Cleaning fee (one-time)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 150 (optional)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <p className="text-xs text-slate-400 mt-1">One-time cleaning fee charged at move-in</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="petDepositAnnual"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'petDepositAnnual'> }) => (
              <FormItem className="w-full">
                <FormLabel className="text-slate-200">Annual pet deposit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 300 (optional)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <p className="text-xs text-slate-400 mt-1">Auto-applied to first month if tenant has pets</p>
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
              <FormLabel className="text-slate-200">Property photos</FormLabel>
              <Card className="bg-white/5 border-white/10">
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
                            className="text-xs text-red-400 hover:underline"
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
                          className="w-40 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
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
              <FormLabel className="text-slate-200">Property description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the property, amenities, nearby points of interest, and any leasing details."
                  className="resize-none bg-white/10 border-white/20 text-white placeholder:text-slate-400 min-h-[120px]"
                  {...field}
                  value={field.value ?? ''}
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
            className="w-full bg-violet-600 hover:bg-violet-500 text-white"
          >
            {form.formState.isSubmitting ? 'Saving Property...' : `${type} Property`}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
