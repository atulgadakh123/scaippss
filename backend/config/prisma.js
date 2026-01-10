// prisma.js (ESM version)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Export it as *named* and *default* for flexibility
export { prisma };
export default prisma;
