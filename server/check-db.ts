
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    console.log('Checking Database State...');

    const user = await prisma.user.findUnique({
        where: { id: 'user_developer_admin' },
        include: { workspace: true }
    });
    console.log('Developer Admin:', user);

    const workspace = await prisma.workspace.findUnique({
        where: { id: 'w1' },
        include: { users: true }
    });
    console.log('Workspace w1:', workspace);
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
