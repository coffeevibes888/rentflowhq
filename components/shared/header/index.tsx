import Image from "next/image";
import Link from "next/link";
import Menu from "./menu";
import AdminMobileDrawer from '@/components/admin/admin-mobile-drawer';
import { getCategoryTree } from '@/lib/actions/product.actions';
import { prisma } from '@/db/prisma';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { ChevronDown } from 'lucide-react';

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
  const displayName = landlord?.name || 'Property Flow HQ';
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

      <div className="wrapper hidden md:flex items-center h-16 overflow-visible">
        {/* Logo - fixed width */}
        <div className="w-32 flex-shrink-0">
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

        {/* Centered Nav Links */}
        <div className="flex-1 flex items-center justify-center gap-1 text-sm font-medium">
          <Link href='/' className="px-2.5 py-1.5 text-black hover:underline">Home</Link>
          <Link href='/listings' className="px-2.5 py-1.5 text-black hover:underline">Listings</Link>
          {/* <Link href='/contractors' className="px-2.5 py-1.5 text-black hover:underline">Contractors</Link> */}

          {/* Resources Dropdown */}
          <div className="relative group">
            <button className="px-2.5 py-1.5 text-black hover:underline flex items-center gap-1">
              Resources
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50 min-w-[200px]">
              <div className="py-2 bg-white border rounded-md shadow-lg">
                <Link href='/faq' className="block px-4 py-2 text-sm text-black hover:bg-gray-100">
                  FAQs
                </Link>
                <Link href='/docs/api' className="block px-4 py-2 text-sm text-black hover:bg-gray-100">
                  API & Webhooks
                </Link>
                <Link href='/affiliate-program' className="block px-4 py-2 text-sm text-black hover:bg-gray-100">
                  Affiliate Program
                </Link>
                <div className="border-t my-1"></div>
                <Link href='/about' className="block px-4 py-2 text-sm text-black hover:bg-gray-100">
                  About Us
                </Link>
                <Link href='/contact' className="block px-4 py-2 text-sm text-black hover:bg-gray-100">
                  Contact
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group">
            {categories.length > 0 && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:flex border rounded-md shadow-lg z-50 min-w-[520px] bg-white">
                <div className="w-52 border-r py-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.category}
                      href={`/search?category=${encodeURIComponent(cat.category)}`}
                      className="flex items-center justify-between px-4 py-1.5 text-sm"
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
                        <p className="text-xs font-semibold uppercase">{cat.category}</p>
                        <div className="flex flex-col space-y-0.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={`${cat.category}-${sub}`}
                              href={`/search?category=${encodeURIComponent(cat.category)}&subCategory=${encodeURIComponent(sub)}`}
                              className="text-sm hover:underline">
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

        {/* Menu - fixed width to balance logo */}
        <div className="w-32 flex-shrink-0 flex justify-end">
          <Menu />
        </div>
      </div>
    </header> 
  );
}
 
export default Header;
