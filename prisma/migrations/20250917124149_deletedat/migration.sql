-- AlterTable
ALTER TABLE "public"."Counter" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Queue" ADD COLUMN     "deletedAt" TIMESTAMP(3);
