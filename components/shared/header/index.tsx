import Image from "next/image";
import Link from "next/link";
import Menu from "./menu";
// import CategoryDrawer from './category-drawer';
import { getCategoryTree } from '@/lib/actions/product.actions';
import { prisma } from '@/db/prisma';
import { headers } from 'next/headers';

/**
 * Get landlord from path-based routing (x-landlord-slug header set by middleware)
 * For path-based "subdomains" like /love-your-god/...
 */
async function getLandlordForRequest() {
  const headersList = await headers();
  
  // Get landlord slug from middleware header (path-based routing)
  const landlordSlug = headersList.get('x-landlord-slug');
  
  if (!landlordSlug) return null;

  const landlord = await prisma.landlord.findUnique({ where: { subdomain: landlordSlug } });
  return landlord;
}

const Header = async () => {
  const categories = await getCategoryTree();
  const landlord = await getLandlordForRequest();
  const displayName = landlord?.name || 'Property Management';

  return ( 
    <header className="w-full bg-transparent border-b border-white/10 text-slate-50">
      {/* Mobile header: hamburger left, logo centered, menu (three dots) right */}
      <div className="wrapper flex items-center justify-between md:hidden">
        {/* <div className="flex items-center">
          <CategoryDrawer />
        </div> */}

        <Link href='/' className="flex items-center justify-center">
          <div className="relative w-28 h-16">
            <Image
              src={landlord?.logoUrl || '/images/logo.svg'}
              fill
              className="object-contain"
              alt={`${displayName} Logo`}
              priority={true}
            />
          </div>
        </Link>

        <div className="flex items-center">
          <Menu />
        </div>
      </div>

      {/* Desktop / tablet header */}
      <div className="wrapper hidden md:flex items-center justify-between">
        <div className="flex items-center">
          <Link href='/' className="flex items-center">
            {/* <CategoryDrawer /> */}
            <div className="relative w-36 h-36">
              <Image 
                src={landlord?.logoUrl || '/images/logo.svg'}
                fill
                className="object-contain"
                alt={`${displayName} Logo`}
                priority={true}
              />
            </div>
            <span className='hidden lg:block font-bold text-2xl ml-3 text-slate-50'>
              {displayName}
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-center text-slate-200/90 text-sm font-medium">
          <Link href='/' className="m-2.5 px-1 hover:text-violet-200/80 hover:underline transition-colors">Home</Link>
          <Link href='/search?category=all' className="m-2.5 px-1 hover:text-violet-200/80 hover:underline transition-colors">Listings</Link>
          <Link href='/about' className="m-2.5 px-1 hover:text-violet-200/80 hover:underline transition-colors">About</Link>
          <Link href='/contact' className="m-2.5 px-1 hover:text-violet-200/80 hover:underline transition-colors">Contact</Link>

        
          <div className="relative m-2.5 group">
            {/* <button className="hover:text-black hover:underline">Products</button> */}
            {categories.length > 0 && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:flex bg-slate-900/95 backdrop-blur-2xl border border-white/10 text-slate-50 rounded-md shadow-lg z-50 min-w-[520px]">
                <div className="w-52 border-r border-white/10 py-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.category}
                      href={`/search?category=${encodeURIComponent(cat.category)}`}
                      className="flex items-center justify-between px-4 py-1.5 text-sm hover:bg-slate-900/60 transition-colors text-slate-200/90"
                    >
                      <span>{cat.category}</span>
                      <span className="text-xs text-slate-400/80">{cat.count}</span>
                    </Link>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 p-4 max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    cat.subCategories.length > 0 && (
                      <div key={cat.category} className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-slate-400/80">{cat.category}</p>
                        <div className="flex flex-col space-y-0.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={`${cat.category}-${sub}`}
                              href={`/search?category=${encodeURIComponent(cat.category)}&subCategory=${encodeURIComponent(sub)}`}
                              className="text-sm text-slate-200/90 hover:text-violet-200/80 hover:underline transition-colors">
                              {sub}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Menu />
      </div>
    </header> 
  );
}
 
export default Header;
