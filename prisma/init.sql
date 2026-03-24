-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "companyNameZh" TEXT NOT NULL,
    "companyNameEn" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fax" TEXT,
    "email" TEXT NOT NULL,
    "addressZh" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "icpRecord" TEXT NOT NULL,
    "copyrightZh" TEXT NOT NULL,
    "copyrightEn" TEXT NOT NULL,
    "logoUrl" TEXT,
    "footerBuilderZh" TEXT,
    "footerBuilderEn" TEXT,
    "homeHeroTitleZh" TEXT,
    "homeHeroTitleEn" TEXT,
    "homeHeroSubtitleZh" TEXT,
    "homeHeroSubtitleEn" TEXT,
    "homeHeroImageUrl" TEXT,
    "homeProductSectionTitleZh" TEXT,
    "homeProductSectionTitleEn" TEXT,
    "homeProductSectionSubtitleZh" TEXT,
    "homeProductSectionSubtitleEn" TEXT,
    "homeSolutionSectionTitleZh" TEXT,
    "homeSolutionSectionTitleEn" TEXT,
    "homeSolutionSectionSubtitleZh" TEXT,
    "homeSolutionSectionSubtitleEn" TEXT,
    "homeProductImage1" TEXT,
    "homeProductImage2" TEXT,
    "homeProductImage3" TEXT,
    "homeProductImage4" TEXT,
    "homeSolutionImage1" TEXT,
    "homeSolutionImage2" TEXT,
    "homeSolutionImage3" TEXT,
    "homeAboutTitleZh" TEXT,
    "homeAboutTitleEn" TEXT,
    "homeAboutContentZh" TEXT,
    "homeAboutContentEn" TEXT,
    "homeContactTitleZh" TEXT,
    "homeContactTitleEn" TEXT,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Menu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuKey" TEXT NOT NULL,
    "labelZh" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryZh" TEXT,
    "summaryEn" TEXT,
    "contentZh" TEXT,
    "contentEn" TEXT,
    "blocks" JSONB,
    "publishStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "translationStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionZh" TEXT,
    "descriptionEn" TEXT,
    "iconUrl" TEXT,
    "tabIconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "summaryZh" TEXT,
    "summaryEn" TEXT,
    "bannerUrl" TEXT,
    "galleryImages" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionZh" TEXT,
    "descriptionEn" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductSectionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "titleZh" TEXT,
    "titleEn" TEXT,
    "descriptionZh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ProductSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Solution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryZh" TEXT,
    "summaryEn" TEXT,
    "coverUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SolutionPainPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solutionId" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionZh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SolutionPainPoint_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SolutionAdvantage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solutionId" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionZh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SolutionAdvantage_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SolutionArchitectureBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solutionId" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "imageUrl" TEXT,
    "descriptionZh" TEXT,
    "descriptionEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SolutionArchitectureBlock_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NewsPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryZh" TEXT,
    "summaryEn" TEXT,
    "contentZh" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "coverUrl" TEXT,
    "publishStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "translationStatus" TEXT NOT NULL DEFAULT 'REVIEWED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altZh" TEXT,
    "altEn" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SeoMeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Menu_menuKey_key" ON "Menu"("menuKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Page_pageKey_key" ON "Page"("pageKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Solution_slug_key" ON "Solution"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NewsPost_slug_key" ON "NewsPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SeoMeta_pageKey_locale_key" ON "SeoMeta"("pageKey", "locale");
