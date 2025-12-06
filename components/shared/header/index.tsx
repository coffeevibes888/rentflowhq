import Image from "next/image";
import Link from "next/link";
import Menu from "./menu";
import CategoryDrawer from './category-drawer';
import { getCategoryTree } from '@/lib/actions/product.actions';

const Header = async () => {
  const categories = await getCategoryTree();

  return ( 
    <header className="w-full bg-gradient-to-r from-sky-700 via-blue-500 to-cyan-500">
      {/* Mobile header: hamburger left, logo centered, menu (three dots) right */}
      <div className="wrapper flex items-center justify-between md:hidden">
        <div className="flex items-center">
          <CategoryDrawer />
        </div>

        <Link href='/' className="flex items-center justify-center">
          <div className="relative w-28 h-16">
            <Image
              src='/images/2.svg'
              fill
              className="object-contain"
              alt="Property Management Logo"
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
            <CategoryDrawer />
            <div className="relative w-36 h-36">
              <Image src='/images/logo.svg'
                fill
                className="object-contain"
                alt="Property Management Logo"
                priority={true}
              />
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-center text-slate-900 text-sm font-medium">
          <Link href='/' className="m-2.5 px-1 hover:text-slate-900 hover:underline">Home</Link>
          <Link href='/search?category=all' className="m-2.5 px-1 hover:text-slate-900 hover:underline">Listings</Link>
          <Link href='/about' className="m-2.5 px-1 hover:text-slate-900 hover:underline">About</Link>
          <Link href='/blog' className="m-2.5 px-1 hover:text-slate-900 hover:underline">Neighborhood & Tips</Link>
          <Link href='/contact' className="m-2.5 px-1 hover:text-slate-900 hover:underline">Contact</Link>

        
          <div className="relative m-2.5 group">
            {/* <button className="hover:text-black hover:underline">Products</button> */}
            {categories.length > 0 && (
              <div className="absolute left-0 top-full mt-1 hidden group-hover:flex bg-white text-black rounded-md shadow-lg z-50 min-w-[520px]">
                <div className="w-52 border-r border-gray-200 py-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.category}
                      href={`/search?category=${encodeURIComponent(cat.category)}`}
                      className="flex items-center justify-between px-4 py-1.5 text-sm hover:bg-gray-100"
                    >
                      <span>{cat.category}</span>
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </Link>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 p-4 max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    cat.subCategories.length > 0 && (
                      <div key={cat.category} className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-gray-500">{cat.category}</p>
                        <div className="flex flex-col space-y-0.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={`${cat.category}-${sub}`}
                              href={`/search?category=${encodeURIComponent(cat.category)}&subCategory=${encodeURIComponent(sub)}`}
                              className="text-sm text-gray-700 hover:text-black hover:underline">
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
