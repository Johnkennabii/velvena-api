-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "last_signin_at" TIMESTAMP(3),
    "raw_user_meta_data" JSONB,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "avatar_url" TEXT,
    "city" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "postal_code" TEXT,
    "role_id" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "user_layout" JSONB,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DressType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "DressType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DressSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "DressSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DressCondition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "DressCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DressColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "DressColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dress" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "price_ht" DECIMAL(65,30) NOT NULL,
    "price_ttc" DECIMAL(65,30) NOT NULL,
    "images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "published_at" TIMESTAMP(3),
    "published_by" TEXT,
    "published_post" BOOLEAN NOT NULL DEFAULT false,
    "type_id" TEXT,
    "size_id" TEXT,
    "condition_id" TEXT,
    "color_id" TEXT,
    "price_per_day_ht" DECIMAL(65,30) NOT NULL,
    "price_per_day_ttc" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Dress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthday" TIMESTAMP(3),
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "postal_code" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContractType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ContractType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContractPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "num_dresses" INTEGER NOT NULL,
    "price_ht" DECIMAL(65,30) NOT NULL,
    "price_ttc" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ContractPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContractAddon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_ht" DECIMAL(65,30),
    "price_ttc" DECIMAL(65,30),
    "included" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ContractAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "account_ht" DECIMAL(65,30) NOT NULL,
    "account_ttc" DECIMAL(65,30) NOT NULL,
    "account_paid_ht" DECIMAL(65,30) NOT NULL,
    "account_paid_ttc" DECIMAL(65,30) NOT NULL,
    "caution_ht" DECIMAL(65,30) NOT NULL,
    "caution_ttc" DECIMAL(65,30) NOT NULL,
    "caution_paid_ht" DECIMAL(65,30) NOT NULL,
    "caution_paid_ttc" DECIMAL(65,30) NOT NULL,
    "total_price_ht" DECIMAL(65,30) NOT NULL,
    "total_price_ttc" DECIMAL(65,30) NOT NULL,
    "deposit_payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "contract_type_id" TEXT NOT NULL,
    "package_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContractAddonLink" (
    "contract_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,

    CONSTRAINT "ContractAddonLink_pkey" PRIMARY KEY ("contract_id","addon_id")
);

-- CreateTable
CREATE TABLE "public"."ContractDress" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "dress_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackageAddon" (
    "package_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,

    CONSTRAINT "PackageAddon_pkey" PRIMARY KEY ("package_id","addon_id")
);

-- CreateTable
CREATE TABLE "public"."ContractSignLink" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractSignLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "public"."Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DressType_name_key" ON "public"."DressType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DressSize_name_key" ON "public"."DressSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DressCondition_name_key" ON "public"."DressCondition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DressColor_name_key" ON "public"."DressColor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DressColor_hex_code_key" ON "public"."DressColor"("hex_code");

-- CreateIndex
CREATE UNIQUE INDEX "Dress_reference_key" ON "public"."Dress"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "public"."Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contract_number_key" ON "public"."Contract"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignLink_contract_id_key" ON "public"."ContractSignLink"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignLink_token_key" ON "public"."ContractSignLink"("token");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dress" ADD CONSTRAINT "Dress_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "public"."DressColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dress" ADD CONSTRAINT "Dress_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "public"."DressCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dress" ADD CONSTRAINT "Dress_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "public"."DressSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dress" ADD CONSTRAINT "Dress_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."DressType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "public"."ContractType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."ContractPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractAddonLink" ADD CONSTRAINT "ContractAddonLink_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."ContractAddon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractAddonLink" ADD CONSTRAINT "ContractAddonLink_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractDress" ADD CONSTRAINT "ContractDress_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractDress" ADD CONSTRAINT "ContractDress_dress_id_fkey" FOREIGN KEY ("dress_id") REFERENCES "public"."Dress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageAddon" ADD CONSTRAINT "PackageAddon_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."ContractAddon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageAddon" ADD CONSTRAINT "PackageAddon_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."ContractPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractSignLink" ADD CONSTRAINT "ContractSignLink_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContractSignLink" ADD CONSTRAINT "ContractSignLink_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
