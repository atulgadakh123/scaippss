-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100)
    "username" VARCHAR(100),
    "last_name" VARCHAR(100),
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "contact_no" VARCHAR(15),
    "college_name" VARCHAR(200),
    "interested_field" VARCHAR(50),
    "other_field" VARCHAR(100),
    "google_id" VARCHAR(255),
    "github_id" VARCHAR(255),
    "profile_picture" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(100),
    "established" INTEGER,
    "campusArea" DECIMAL(10,2),
    "nirfRank" INTEGER,
    "accreditation" VARCHAR(100),
    "totalStudents" INTEGER,
    "totalFaculty" INTEGER,
    "website" VARCHAR(255),
    "logoUrl" VARCHAR(255),
    "backgroundUrl" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "google_id" VARCHAR(255),
    "github_id" VARCHAR(255),
    "profile_picture" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "username" VARCHAR(100),
    "last_name" VARCHAR(100),
    "startup_name" VARCHAR(200),
    "startup_stage" VARCHAR(50),
    "funding_status" VARCHAR(100),
    "team_size" VARCHAR(50),
    "description" TEXT,
    "location" VARCHAR(100),
    "website" VARCHAR(255),
    "contact_no" VARCHAR(20),
    "logoUrl" VARCHAR(255),
    "backgroundUrl" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "google_id" VARCHAR(255),
    "profile_picture" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "username" VARCHAR(100),
    "last_name" VARCHAR(100),
    "company_name" VARCHAR(200),
    "industry_type" VARCHAR(100),
    "company_size" VARCHAR(50),
    "designation" VARCHAR(100),
    "description" TEXT,
    "location" VARCHAR(100),
    "website" VARCHAR(255),
    "contact_no" VARCHAR(20),
    "logoUrl" VARCHAR(255),
    "backgroundUrl" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "google_id" VARCHAR(255),
    "profile_picture" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_email_key" ON "colleges"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_google_id_key" ON "colleges"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_github_id_key" ON "colleges"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "startups_email_key" ON "startups"("email");

-- CreateIndex
CREATE UNIQUE INDEX "industries_email_key" ON "industries"("email");
