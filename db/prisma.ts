import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { decryptField, encryptField } from '@/lib/encrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString });

const prismaBase = new PrismaClient({ adapter });

export const prisma = prismaBase
  .$extends({
    query: {
      message: {
        async create({ args, query }) {
          if (args.data && typeof (args.data as any).content === 'string') {
            (args.data as any).content = await encryptField(
              (args.data as any).content as string
            );
          }
          const result = await query(args);
          if (result && typeof (result as any).content === 'string') {
            (result as any).content = await decryptField(
              (result as any).content as string
            );
          }
          return result;
        },
        async createMany({ args, query }) {
          if (Array.isArray((args as any).data)) {
            for (const item of (args as any).data) {
              if (item && typeof item.content === 'string') {
                item.content = await encryptField(item.content);
              }
            }
          } else if ((args as any).data && typeof (args as any).data.content === 'string') {
            (args as any).data.content = await encryptField(
              (args as any).data.content as string
            );
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data && typeof (args.data as any).content === 'string') {
            (args.data as any).content = await encryptField(
              (args.data as any).content as string
            );
          }
          const result = await query(args);
          if (result && typeof (result as any).content === 'string') {
            (result as any).content = await decryptField(
              (result as any).content as string
            );
          }
          return result;
        },
        async updateMany({ args, query }) {
          if (Array.isArray((args as any).data)) {
            for (const item of (args as any).data) {
              if (item && typeof item.content === 'string') {
                item.content = await encryptField(item.content);
              }
            }
          } else if ((args as any).data && typeof (args as any).data.content === 'string') {
            (args as any).data.content = await encryptField(
              (args as any).data.content as string
            );
          }
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && typeof (result as any).content === 'string') {
            (result as any).content = await decryptField(
              (result as any).content as string
            );
          }
          return result;
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          if (result && typeof (result as any).content === 'string') {
            (result as any).content = await decryptField(
              (result as any).content as string
            );
          }
          return result;
        },
        async findMany({ args, query }) {
          const result = await query(args);
          if (Array.isArray(result)) {
            for (const m of result as any[]) {
              if (m && typeof m.content === 'string') {
                m.content = await decryptField(m.content);
              }
            }
          }
          return result;
        },
      },
    },
  })
  .$extends({
    result: {
      product: {
        price: {
          compute(product) {
            return product.price.toString();
          },
        },
        rating: {
          compute(product) {
            return product.rating.toString();
          },
        },
      },
      cart: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart) {
            return cart.itemsPrice.toString();
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart) {
            return cart.shippingPrice.toString();
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart) {
            return cart.taxPrice.toString();
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart) {
            return cart.totalPrice.toString();
          },
        },
      },
      order: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(order) {
            return order.itemsPrice.toString();
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(order) {
            return order.shippingPrice.toString();
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(order) {
            return order.taxPrice.toString();
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(order) {
            return order.totalPrice.toString();
          },
        },
      },
      orderItem: {
        price: {
          compute(orderItem) {
            return orderItem.price.toString();
          },
        },
      },
    },
  });