import ProductList from '@/components/shared/product/product-list';
import { getLatestProducts, getLatestProductsByCategory, getFeaturedProducts } from '@/lib/actions/product.actions';
import ProductCarousel from '@/components/shared/product/product-carousel';
import ViewAllProductsButton from '@/components/view-all-products-button';
import DealCountdown from '@/components/deal-countdown';
import Hero from '@/components/hero/hero';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  // Themed sections: make sure your products use these category names (e.g. "Faith", "Funny", "Deals", "Christmas")
  const faithBasedProducts = await getLatestProductsByCategory('Faith');
  const funnyProducts = await getLatestProductsByCategory('Funny');
  const dealsProducts = await getLatestProductsByCategory('Deals');
  const christmasProducts = await getLatestProductsByCategory('Christmas');

  return (
    <>
      <Hero />
      <ProductList data={latestProducts} title='Newest Arrivals' limit={4} />
      <ViewAllProductsButton />
      
      {featuredProducts.length > 0 && (
        <ProductCarousel data={featuredProducts} />
      )}

      {faithBasedProducts.length > 0 && (
        <ProductList data={faithBasedProducts} title='Faith Based' limit={4} />
      )}

      {funnyProducts.length > 0 && (
        <ProductList data={funnyProducts} title='Funny' limit={4} />
      )}

      {dealsProducts.length > 0 && (
        <ProductList data={dealsProducts} title="Deals" limit={4} />
      )}

      {christmasProducts.length > 0 && (
        <ProductList data={christmasProducts} title='Christmas' limit={4} />
      )}
      <DealCountdown />
      <CustomerReviews />
      <HomeContactCard />
    </>
  );
};

export default Homepage;
