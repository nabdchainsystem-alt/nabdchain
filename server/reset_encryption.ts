import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up potentially invalid EmailAccount records...');
    try {
        // We are deleting ALL email accounts because we cannot distinguish 
        // which ones are encrypted with the old key vs new key without trying to decrypt,
        // and trying to decrypt throws the error we are trying to avoid.
        // Since the key changed globally, it's safer to reset all connections.
        const { count } = await prisma.emailAccount.deleteMany();
        console.log(`✅ Successfully deleted ${count} EmailAccount records.`);
        console.log('   Please re-connect your email accounts in the app.');
    } catch (e) {
        console.error('❌ Error deleting records:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
