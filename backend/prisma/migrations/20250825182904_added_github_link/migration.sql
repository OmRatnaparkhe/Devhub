/*
  Warnings:

  - A unique constraint covering the columns `[githubLink]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `githubLink` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "githubLink" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_githubLink_key" ON "public"."User"("githubLink");
