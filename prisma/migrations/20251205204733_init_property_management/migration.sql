-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "images" TEXT[],
    "imageColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "numReviews" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "banner" TEXT,
    "printfulProductId" TEXT,
    "onSale" BOOLEAN NOT NULL DEFAULT false,
    "salePercent" DECIMAL(5,2),
    "saleUntil" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'NO_NAME',
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(6),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "shippingAddress" JSON,
    "billingAddress" JSON,
    "address" JSON,
    "paymentMethod" TEXT,
    "phoneNumber" TEXT,
    "phoneVerified" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerificationToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "sessionCartId" TEXT NOT NULL,
    "items" JSON[] DEFAULT ARRAY[]::JSON[],
    "itemsPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "shippingPrice" DECIMAL(12,2) NOT NULL,
    "taxPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "shippingAddress" JSON NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentResult" JSON,
    "itemsPrice" DECIMAL(12,2) NOT NULL,
    "shippingPrice" DECIMAL(12,2) NOT NULL,
    "taxPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(6),
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(6),
    "trackingNumber" TEXT,
    "trackingStatus" TEXT DEFAULT 'pending',
    "trackingEvents" JSON[] DEFAULT ARRAY[]::JSON[],
    "lastTrackingUpdate" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "variantId" UUID,
    "variantColor" TEXT,
    "variantSize" TEXT,

    CONSTRAINT "orderitems_orderId_productId_pk" PRIMARY KEY ("orderId","productId")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hex" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Size" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "sku" TEXT,
    "colorId" UUID,
    "sizeId" UUID,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "printfulExternalId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPaymentMethod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cardholderName" TEXT,
    "last4" TEXT NOT NULL,
    "expirationDate" TEXT,
    "brand" TEXT,
    "billingAddress" JSON,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodVerificationToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "paymentMethodId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethodVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(12,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(12,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPromo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "promoCodeId" UUID NOT NULL,

    CONSTRAINT "ProductPromo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "baseShippingCost" DECIMAL(10,2) NOT NULL,
    "freeShippingThreshold" DECIMAL(12,2) NOT NULL,
    "uspsIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taxRate" DECIMAL(5,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL DEFAULT 'contact',
    "subject" TEXT,
    "fromEmail" TEXT,
    "toEmail" TEXT,
    "createdByUserId" UUID,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "threadId" UUID NOT NULL,
    "senderUserId" UUID,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadParticipant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ThreadParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "friendId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "contentHtml" TEXT NOT NULL,
    "coverImage" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "authorId" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogReaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionCartId" TEXT NOT NULL,
    "userId" UUID,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportStatus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" JSON NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(3,1),
    "sizeSqFt" INTEGER,
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unitId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "startDate" TIMESTAMP(6) NOT NULL,
    "endDate" TIMESTAMP(6),
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "billingDayOfMonth" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentPayment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "leaseId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "dueDate" TIMESTAMP(6) NOT NULL,
    "paidAt" TIMESTAMP(6),
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "metadata" JSON,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unitId" UUID,
    "tenantId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(6),

    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalApplication" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unitId" UUID NOT NULL,
    "applicantId" UUID,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "moveInDate" TIMESTAMP(6),
    "monthlyIncome" DECIMAL(12,2),
    "employmentStatus" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PhoneVerificationToken_userId_idx" ON "PhoneVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "PhoneVerificationToken_phone_idx" ON "PhoneVerificationToken"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingNumber_key" ON "Order"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Color_slug_key" ON "Color"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Size_slug_key" ON "Size"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPaymentMethod_stripePaymentMethodId_key" ON "SavedPaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "SavedPaymentMethod_userId_idx" ON "SavedPaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "SavedPaymentMethod_stripePaymentMethodId_idx" ON "SavedPaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodVerificationToken_token_key" ON "PaymentMethodVerificationToken"("token");

-- CreateIndex
CREATE INDEX "PaymentMethodVerificationToken_userId_idx" ON "PaymentMethodVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "PaymentMethodVerificationToken_token_idx" ON "PaymentMethodVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPromo_productId_promoCodeId_key" ON "ProductPromo"("productId", "promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingSettings_id_key" ON "ShippingSettings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TaxSettings_id_key" ON "TaxSettings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadParticipant_threadId_userId_key" ON "ThreadParticipant"("threadId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_userId_friendId_key" ON "Friend"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogComment_postId_idx" ON "BlogComment"("postId");

-- CreateIndex
CREATE INDEX "BlogReaction_postId_idx" ON "BlogReaction"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogReaction_postId_userId_type_key" ON "BlogReaction"("postId", "userId", "type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionCartId_idx" ON "AnalyticsEvent"("sessionCartId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_idx" ON "AnalyticsEvent"("path");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPaymentMethod" ADD CONSTRAINT "SavedPaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodVerificationToken" ADD CONSTRAINT "PaymentMethodVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromo" ADD CONSTRAINT "ProductPromo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromo" ADD CONSTRAINT "ProductPromo_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApplication" ADD CONSTRAINT "RentalApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
