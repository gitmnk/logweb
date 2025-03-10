import { describe, it, expect } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database', () => {
  it('should connect to the database', async () => {
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1+1 as result`;
    expect(result).toBeDefined();
    await prisma.$disconnect();
  });
}); 