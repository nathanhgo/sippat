-- DropIndex
DROP INDEX "social_profiles_nis_key";

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "technician_contact" TEXT,
ADD COLUMN     "technician_name" TEXT,
ADD COLUMN     "technician_workplace" TEXT;

-- AlterTable
ALTER TABLE "citizens" DROP COLUMN "address_number",
DROP COLUMN "address_street",
DROP COLUMN "email",
DROP COLUMN "marital_status",
DROP COLUMN "race_color",
DROP COLUMN "rg",
DROP COLUMN "zip_code";

-- AlterTable
ALTER TABLE "professional_profiles" ADD COLUMN     "priority_group" TEXT;

-- AlterTable
ALTER TABLE "social_profiles" DROP COLUMN "family_members_count",
DROP COLUMN "housing_status",
DROP COLUMN "nis",
DROP COLUMN "pcd_description",
DROP COLUMN "per_capita_income",
DROP COLUMN "receives_bolsa_familia",
DROP COLUMN "receives_bpc",
ADD COLUMN     "disability_cid" TEXT,
ADD COLUMN     "social_programs" TEXT;

-- DropEnum
DROP TYPE "HousingStatus";

-- DropEnum
DROP TYPE "MaritalStatus";

-- DropEnum
DROP TYPE "RaceColor";
