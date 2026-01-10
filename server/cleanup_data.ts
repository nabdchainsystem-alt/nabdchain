import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. Rename Workspace
    await prisma.workspace.updateMany({
        where: { name: "pending@sync.com's Team" },
        data: { name: "Main Workspace" }
    });
    console.log('Renamed workspace to "Main Workspace"');

    // 2. Cleanup duplicate "Max" boards
    // We'll find all boards named "Max" for the user and keep only one if they are empty
    const boards = await prisma.board.findMany({
        where: { name: "Max" }
    });

    if (boards.length > 1) {
        // Keep the first one, delete others
        const idsToDelete = boards.slice(1).map(b => b.id);
        await prisma.board.deleteMany({
            where: { id: { in: idsToDelete } }
        });
        console.log(`Deleted ${idsToDelete.length} duplicate "Max" boards`);
    }
}

main().catch(console.error);
