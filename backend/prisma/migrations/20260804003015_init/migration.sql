-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ATTENDANT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_DECLARADO');

-- CreateEnum
CREATE TYPE "RaceColor" AS ENUM ('BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL');

-- CreateEnum
CREATE TYPE "HousingStatus" AS ENUM ('OWN', 'RENTED', 'RISK_AREA', 'UNHOUSED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ENCAMINHAMENTO', 'ORIENTACAO', 'CADASTRO_VAGA', 'ATUALIZACAO_CADASTRAL', 'EMISSAO_DOCUMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATTENDANT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizens" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "full_name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "race_color" "RaceColor" NOT NULL,
    "marital_status" "MaritalStatus" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address_street" TEXT,
    "address_number" TEXT,
    "neighborhood" TEXT,
    "zip_code" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_profiles" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "nis" TEXT,
    "per_capita_income" DECIMAL(10,2),
    "housing_status" "HousingStatus",
    "family_members_count" INTEGER,
    "receives_bolsa_familia" BOOLEAN NOT NULL DEFAULT false,
    "receives_bpc" BOOLEAN NOT NULL DEFAULT false,
    "is_pcd" BOOLEAN NOT NULL DEFAULT false,
    "pcd_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "education_level" TEXT,
    "courses" JSONB,
    "experiences" JSONB,
    "target_areas" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "citizen_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");

-- CreateIndex
CREATE INDEX "citizens_full_name_idx" ON "citizens"("full_name");

-- CreateIndex
CREATE INDEX "citizens_neighborhood_idx" ON "citizens"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_citizen_id_key" ON "social_profiles"("citizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_nis_key" ON "social_profiles"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_citizen_id_key" ON "professional_profiles"("citizen_id");

-- CreateIndex
CREATE INDEX "attendances_citizen_id_idx" ON "attendances"("citizen_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
