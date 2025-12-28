import Image from "next/image";
import Link from "next/link";
import Menu from "./menu";
import AdminMobileDrawer from '@/components/admin/admin-mobile-drawer';
import { getCategoryTree } from '@/lib/actions/product.actions';
import { prisma } from '@/db/prisma';
import { headers } from 'next/headers';
import { auth } from '@/auth';

async function getLandlordForRequest() {
  const headersList = await headers();
  const landlordSlug = headersList.get('x-landlord-slug');
  if (!landlordSlug) return null;
  const landlord = await prisma.landlord.findUnique({ where: { subdomain: landlordSlug } });
  return landlord;
}

const Header = async () => {
  const categories = await getCategoryTree();
  const landlord = await getLandlordForRequest();
  const displayName = landlord?.name || 'Rooms For Rent LV';
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return ( 
    <header className="w-full text-black font-semibold">
      <div className="wrapper flex items-center justify-between md:hidden h-16 relative overflow-visible">
        {isAuthenticated && (
          <div className="flex items-center">
            <AdminMobileDrawer />
          </div>
        )}

        <Link href='/' className="absolute left-1/2 transform -translate-x-1/2 top-0 h-full flex items-center justify-center mt-2">
          <div className="relative w-24 h-24">
            <Image
              src={landlord?.logoUrl || '/images/logo.svg'}
              fill
              className="object-contain scale-[2.8] origin-center mt-6"
              alt={`${displayName} Logo`}
              priority={true}
            />
          </div>
        </Link>

        <div className="flex items-center">
          <Menu />
        </div>
      </div>

      <div className="wrapper hidden md:flex items-center justify-between h-16 overflow-visible">
        <div className="flex items-center">
          <Link href='/' className="flex items-center">
            <div className="relative w-24 h-24">
              <Image
                src={landlord?.logoUrl || '/images/logo.svg'}
                fill
                className="object-contain scale-[2.8] origin-left mt-4"
                alt={`${displayName} Logo`}
                priority={true}
              />
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-center text-sm font-medium">
          <Link href='/' className="m-2.5 px-1 text-black hover:underline ">Home</Link>
          <Link href='/listings' className="m-2.5 px-1 text-black hover:underline">Listings</Link>
          <Link href='/blog' className="m-2.5 px-1 text-black hover:underline">Blog</Link>
          <Link href='/about' className="m-2.5 px-1 text-black hover:underline ">About</Link>
          <Link href='/contact' className="m-2.5 px-1 text-black hover:underline ">Contact</Link>

          <div className="relative m-2.5 group">
            {categories.length > 0 && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:flex border rounded-md shadow-lg z-50 min-w-[520px]">
                <div className="w-52 border-r  py-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.category}
                      href={`/search?category=${encodeURIComponent(cat.category)}`}
                      className="flex items-center justify-between px-4 py-1.5 text-sm "
                    >
                      <span>{cat.category}</span>
                      <span className="text-xs text-slate-400">{cat.count}</span>
                    </Link>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 p-4 max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    cat.subCategories.length > 0 && (
                      <div key={cat.category} className="space-y-1">
                        <p className="text-xs font-semibold uppercase ">{cat.category}</p>
                        <div className="flex flex-col space-y-0.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={`${cat.category}-${sub}`}
                              href={`/search?category=${encodeURIComponent(cat.category)}&subCategory=${encodeURIComponent(sub)}`}
                              className="text-sm hover:underline ">
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
