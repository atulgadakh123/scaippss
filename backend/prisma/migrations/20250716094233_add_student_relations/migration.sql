/*
  Warnings:

  - The primary key for the `posts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `author_id` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `author_type` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `media_urls` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `shares` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `posts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "enum_users_profileVisibility" AS ENUM ('public', 'connections', 'private');

-- CreateEnum
CREATE TYPE "enum_users_role" AS ENUM ('student', 'alumni', 'college', 'industry', 'startup');

-- CreateEnum
CREATE TYPE "enum_users_stage" AS ENUM ('idea', 'prototype', 'mvp', 'growth', 'scale');

-- AlterTable
ALTER TABLE "colleges" ALTER COLUMN "lastLogin" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "industries" ALTER COLUMN "lastLogin" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "loginCount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "posts" DROP CONSTRAINT "posts_pkey",
DROP COLUMN "author_id",
DROP COLUMN "author_type",
DROP COLUMN "comments",
DROP COLUMN "id",
DROP COLUMN "isActive",
DROP COLUMN "likes",
DROP COLUMN "media_urls",
DROP COLUMN "shares",
DROP COLUMN "title",
DROP COLUMN "updated_at",
ADD COLUMN     "alumni_id" INTEGER,
ADD COLUMN     "college_id" INTEGER,
ADD COLUMN     "industry_id" INTEGER,
ADD COLUMN     "post_id" SERIAL NOT NULL,
ADD COLUMN     "startup_id" INTEGER,
ADD COLUMN     "student_id" INTEGER,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id");

-- AlterTable
ALTER TABLE "startups" ALTER COLUMN "lastLogin" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "loginCount" DROP NOT NULL;

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "description" TEXT,
    "skills" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "achievements" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "customFields" JSONB DEFAULT '[]',
    "isCurrentJob" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "technologies" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "url" VARCHAR(255),
    "githubUrl" VARCHAR(255),
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "isOngoing" BOOLEAN DEFAULT false,
    "customFields" JSONB DEFAULT '[]',
    "images" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "completionDate" TIMESTAMPTZ(6),
    "duration" VARCHAR(255),
    "skills" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "url" VARCHAR(255),
    "certificateUrl" VARCHAR(255),
    "grade" VARCHAR(255),
    "customFields" JSONB DEFAULT '[]',
    "isCompleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "issuer" VARCHAR(255) NOT NULL,
    "issueDate" TIMESTAMPTZ(6) NOT NULL,
    "expiryDate" TIMESTAMPTZ(6),
    "credentialId" VARCHAR(255),
    "url" VARCHAR(255),
    "pdfFile" VARCHAR(255),
    "skills" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "customFields" JSONB DEFAULT '[]',
    "isVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequelizeMeta" (
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_campuses" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "student_count" VARCHAR(50),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "dean" VARCHAR(100),
    "image_url" VARCHAR(255),
    "contact_number" VARCHAR(20),
    "email" VARCHAR(100),
    "custom_fields" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_history" (
    "id" SERIAL NOT NULL,
    "migration_name" VARCHAR(255) NOT NULL,
    "executed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ping_networks" (
    "id" SERIAL NOT NULL,
    "sender_profile_id" INTEGER NOT NULL,
    "sender_profile_type" TEXT NOT NULL,
    "receiver_profile_id" INTEGER NOT NULL,
    "receiver_profile_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ping_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "comment_id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "media_url" TEXT,
    "student_id" INTEGER,
    "college_id" INTEGER,
    "industry_id" INTEGER,
    "alumni_id" INTEGER,
    "startup_id" INTEGER,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "media_id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "media_type" VARCHAR(10),
    "media_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "cloudinary_public_id" VARCHAR(255),

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "post_polls" (
    "poll_id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "option_text" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_polls_pkey" PRIMARY KEY ("poll_id")
);

-- CreateTable
CREATE TABLE "post_reactions" (
    "reaction_id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "reaction_type" VARCHAR(10),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "student_id" INTEGER,
    "college_id" INTEGER,
    "industry_id" INTEGER,
    "alumni_id" INTEGER,
    "startup_id" INTEGER,

    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("reaction_id")
);

-- CreateTable
CREATE TABLE "post_shares" (
    "share_id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "shared_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "shared_by_student_id" INTEGER,
    "shared_by_college_id" INTEGER,
    "shared_by_industry_id" INTEGER,
    "shared_by_alumni_id" INTEGER,
    "shared_by_startup_id" INTEGER,

    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("share_id")
);

-- CreateTable
CREATE TABLE "post_tags" (
    "tag_id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "tag_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "student_about" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "summary" TEXT,

    CONSTRAINT "student_about_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_certifications" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "certificate_name" VARCHAR(150),
    "issuing_organization" VARCHAR(150),
    "issue_date" DATE,
    "expiry_date" DATE,
    "credential_id" VARCHAR(100),
    "credential_url" TEXT,

    CONSTRAINT "student_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_courses" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "course_name" VARCHAR(150),
    "provider" VARCHAR(150),
    "completion_date" DATE,

    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_education" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "institution" VARCHAR(200),
    "degree" VARCHAR(100),
    "field_of_study" VARCHAR(100),
    "start_year" INTEGER,
    "end_year" INTEGER,
    "grade" VARCHAR(20),

    CONSTRAINT "student_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_experience" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "title" VARCHAR(150),
    "company" VARCHAR(150),
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "location" VARCHAR(100),
    "employment_type" VARCHAR(50) DEFAULT 'Full-time',
    "currently_working" BOOLEAN DEFAULT false,

    CONSTRAINT "student_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_projects" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "technologies" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "project_link" TEXT,

    CONSTRAINT "student_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_recommendations" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "recommender_name" VARCHAR(100),
    "relationship" VARCHAR(100),
    "message" TEXT,

    CONSTRAINT "student_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "skill_name" VARCHAR(100),
    "proficiency" VARCHAR(50),

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students_additional_information" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "headline" VARCHAR(255),
    "location" VARCHAR(150),
    "college_name" VARCHAR(200),
    "contact_no" VARCHAR(15),
    "username" VARCHAR(15),
    "other_field" VARCHAR(100),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_additional_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "role" "enum_users_role" NOT NULL DEFAULT 'student',
    "fullName" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "avatar" VARCHAR(255),
    "bio" TEXT,
    "location" VARCHAR(255),
    "phone" VARCHAR(255),
    "website" VARCHAR(255),
    "linkedinUrl" VARCHAR(255),
    "twitterUrl" VARCHAR(255),
    "collegeName" VARCHAR(255),
    "course" VARCHAR(255),
    "year" INTEGER,
    "graduationYear" INTEGER,
    "cgpa" DECIMAL(3,2),
    "skills" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "deanName" VARCHAR(255),
    "establishedYear" INTEGER,
    "accreditation" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "departments" VARCHAR(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "studentCount" INTEGER,
    "facultyCount" INTEGER,
    "companyName" VARCHAR(255),
    "company_name" VARCHAR(255),
    "industry_type" VARCHAR(255),
    "company_size" VARCHAR(255),
    "designation" VARCHAR(255),
    "sector" VARCHAR(255),
    "contactPerson" VARCHAR(255),
    "employeeCount" INTEGER,
    "headquarters" VARCHAR(255),
    "companyDescription" TEXT,
    "startupName" VARCHAR(255),
    "startup_name" VARCHAR(255),
    "startup_stage" VARCHAR(255),
    "funding_status" VARCHAR(255),
    "team_size" VARCHAR(255),
    "domain" VARCHAR(255),
    "founderName" VARCHAR(255),
    "foundedYear" INTEGER,
    "stage" "enum_users_stage",
    "fundingStatus" VARCHAR(255),
    "teamSize" INTEGER,
    "startupDescription" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "isEmailVerified" BOOLEAN DEFAULT false,
    "emailVerificationToken" VARCHAR(255),
    "emailVerificationExpires" TIMESTAMPTZ(6),
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMPTZ(6),
    "lastLogin" TIMESTAMPTZ(6),
    "loginCount" INTEGER DEFAULT 0,
    "google_id" VARCHAR(255),
    "microsoftId" VARCHAR(255),
    "emailNotifications" BOOLEAN DEFAULT true,
    "pushNotifications" BOOLEAN DEFAULT true,
    "profileVisibility" "enum_users_profileVisibility" DEFAULT 'public',
    "customFields" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "migration_history_migration_name_key" ON "migration_history"("migration_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_created_at" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_full_name" ON "users"("fullName");

-- CreateIndex
CREATE INDEX "users_role" ON "users"("role");

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_polls" ADD CONSTRAINT "post_polls_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_shared_by_alumni_id_fkey" FOREIGN KEY ("shared_by_alumni_id") REFERENCES "alumni"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_about" ADD CONSTRAINT "student_about_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_certifications" ADD CONSTRAINT "student_certifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_education" ADD CONSTRAINT "student_education_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_experience" ADD CONSTRAINT "student_experience_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_projects" ADD CONSTRAINT "student_projects_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_recommendations" ADD CONSTRAINT "student_recommendations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
