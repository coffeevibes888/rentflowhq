import ProductList from '@/components/shared/product/product-list';
import ProductCarousel from '@/components/shared/product/product-carousel';
import { getLatestProducts, getFeaturedProducts, getLatestProductsByCategory } from '@/lib/actions/product.actions';
import ViewAllProductsButton from '@/components/view-all-products-button';
import Hero from '@/components/hero/hero';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import type { Product } from '@/types';

type RawProduct = {
  subCategory?: unknown;
  salePercent?: unknown;
  saleUntil?: unknown;
  [key: string]: unknown;
};

const normalizeProducts = (products: RawProduct[]): Product[] =>
  products.map((product) => {
    const rawSaleUntil = product.saleUntil;
    const normalizedSaleUntil = rawSaleUntil
      ? new Date(rawSaleUntil as string | number | Date)
      : undefined;

    const rawSalePercent = product.salePercent;
    const normalizedSalePercent =
      rawSalePercent !== null && rawSalePercent !== undefined
        ? Number(rawSalePercent as number | string)
        : undefined;

    return {
      ...product,
      subCategory: (product.subCategory as string | null | undefined) ?? undefined,
      salePercent: normalizedSalePercent,
      saleUntil:
        normalizedSaleUntil && !Number.isNaN(normalizedSaleUntil.getTime())
          ? normalizedSaleUntil.toISOString()
          : undefined,
    } as Product;
  });

const Homepage = async () => {
  const latestProductsRaw = await getLatestProducts(12);
  const featuredProductsRaw = await getFeaturedProducts();

  // Property-themed sections: make sure your properties use these category names (e.g. "Apartments", "Houses", "Offices", "Studios")
  const apartmentsRaw = await getLatestProductsByCategory('Apartments', 20);
  const housesRaw = await getLatestProductsByCategory('Houses', 20);
  const officesRaw = await getLatestProductsByCategory('Offices', 20);
  const studiosRaw = await getLatestProductsByCategory('Studios', 20);

  const latestProducts = normalizeProducts(latestProductsRaw);
  const featuredProducts = normalizeProducts(featuredProductsRaw);
  const apartments = normalizeProducts(apartmentsRaw);
  const houses = normalizeProducts(housesRaw);
  const offices = normalizeProducts(officesRaw);
  const studios = normalizeProducts(studiosRaw);

  return (
    <>
      <Hero />

      {latestProducts.length > 0 && (
        <ProductList data={latestProducts} title='Newest Arrivals' />
      )}

      {featuredProducts.length > 0 && (
        <ProductCarousel data={featuredProducts} />
      )}

      {/* Property collections as entry points */}
      {apartments.length > 0 && (
        <ProductList data={apartments} title='Featured Apartments' />
      )}
      {houses.length > 0 && (
        <ProductList data={houses} title='Single-Family Homes' />
      )}

      {offices.length > 0 && (
        <ProductList data={offices} title='Office & Workspace' />
      )}

      {studios.length > 0 && (
        <ProductList data={studios} title='Studios & Micro-units' />
      )}

      <ViewAllProductsButton />

      {/* Trust & contact */}
      {/* <DealCountdown /> */}
      <CustomerReviews />
      <HomeContactCard />
    </>
  );
};

export default Homepage;
