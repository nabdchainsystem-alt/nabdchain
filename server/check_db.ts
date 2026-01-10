import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            workspace: true
        }
    });
    console.log('Users:', JSON.stringify(users, null, 2));

    const workspaces = await prisma.workspace.findMany();
    console.log('Workspaces:', JSON.stringify(workspaces, null, 2));
}

main().catch(console.error);
