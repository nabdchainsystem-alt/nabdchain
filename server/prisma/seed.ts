import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const dbPath = path.join(__dirname, '../db.json');
    console.log('Reading data from:', dbPath);

    if (!fs.existsSync(dbPath)) {
        console.error('db.json not found!');
        return;
    }

    const rawData = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(rawData);

    // 0. Master User
    console.log('Seeding Master User...');
    const masterId = "user_master_local_admin";

    // Check if user exists (upgraded to include workspaceId support)
    await prisma.user.upsert({
        where: { email: 'master@nabd.com' },
        update: {
            workspaceId: 'w1' // Enforce Main Workspace connection
        },
        create: {
            id: masterId,
            email: 'master@nabd.com',
            name: 'Master Admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Master+Admin&background=0D8ABC&color=fff',
            workspaceId: 'w1', // Set default workspace
            workspace: {
                connectOrCreate: {
                    where: { id: 'w1' },
                    create: {
                        id: 'w1',
                        name: 'Main Workspace',
                        ownerId: masterId,
                        icon: 'Briefcase',
                        color: 'from-orange-400 to-red-500'
                    }
                }
            }
        }
    });

    // 0.1 NabdChain Developer
    console.log('Seeding Developer User...');
    const devId = "user_developer_admin";
    await prisma.user.upsert({
        where: { email: 'master@nabdchain.com' },
        update: {
            workspaceId: 'w1' // Enforce Main Workspace connection
        },
        create: {
            id: devId,
            email: 'master@nabdchain.com',
            name: 'Developer Admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Developer+Admin&background=000&color=fff',
            workspaceId: 'w1', // Set default workspace
            workspace: {
                connect: { id: 'w1' } // Join existing main workspace
            }
        }
    });

    // 0.2 Google Simulated User
    console.log('Seeding Google User...');
    const googleId = "user_google_simulated";
    await prisma.user.upsert({
        where: { email: 'user@gmail.com' },
        update: {
            workspaceId: 'w1'
        },
        create: {
            id: googleId,
            email: 'user@gmail.com',
            name: 'Google User',
            avatarUrl: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
            workspaceId: 'w1',
            workspace: {
                connect: { id: 'w1' }
            }
        }
    });

    // 0.3 Sam Master User
    console.log('Seeding Sam Master User...');
    const samId = "user_sam_master";
    await prisma.user.upsert({
        where: { email: 'sam@nabdchain.com' },
        update: {
            workspaceId: 'w1'
        },
        create: {
            id: samId,
            email: 'sam@nabdchain.com',
            name: 'Sam',
            avatarUrl: 'https://ui-avatars.com/api/?name=Sam&background=6366F1&color=fff',
            workspaceId: 'w1',
            workspace: {
                connect: { id: 'w1' }
            }
        }
    });

    // 1. Procurement Requests
    if (data.procurementRequests) {
        console.log(`Seeding ${data.procurementRequests.length} Procurement Requests...`);
        for (const req of data.procurementRequests) {

            // Create Request
            await prisma.procurementRequest.create({
                data: {
                    userId: masterId,
                    id: req.id,
                    name: req.name,
                    date: req.date,
                    department: req.department,
                    warehouse: req.warehouse,
                    relatedTo: req.relatedTo,
                    status: req.status,
                    priority: req.priority,
                    isUrgent: req.isUrgent,
                    approvalStatus: req.approvalStatus,
                    rfqSent: req.rfqSent,
                    items: {
                        create: req.items.map((item: any) => ({
                            // Generate a UUID if the item id is "1" or too short to avoid collisions if reused
                            // But better to keep existing IDs if they are unique per table. 
                            // JSON server often reuses '1' for nested items. 
                            // Since our schema uses UUID default for items, we can just omit ID OR use the one provided if unique.
                            // Given nested items in json-server might reuse ID '1', let's generate new IDs for safety or prefix them.
                            // Actually, let's just let Prisma generate UUIDs for items to be safe.
                            itemCode: item.itemCode,
                            description: item.description,
                            quantity: Number(item.quantity),
                            dueDate: item.dueDate,
                            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
                        }))
                    }
                }
            });
        }
    }

    // 2. RFQs
    if (data.rfqs) {
        console.log(`Seeding ${data.rfqs.length} RFQs...`);
        for (const rfq of data.rfqs) {
            // Check if request exists to connect
            const requestExists = rfq.requestId ? await prisma.procurementRequest.findUnique({ where: { id: rfq.requestId } }) : false;

            await prisma.rFQ.create({
                data: {
                    userId: masterId,
                    id: rfq.id,
                    requestId: requestExists ? rfq.requestId : null, // Connect if valid
                    date: rfq.date,
                    department: rfq.department,
                    warehouse: rfq.warehouse,
                    supplier: rfq.supplier,
                    value: Number(rfq.value),
                    dueDate: rfq.dueDate,
                    status: rfq.status,
                    createdDate: rfq.createdDate,
                    relatedTo: rfq.relatedTo,
                    sentToOrder: rfq.sentToOrder,
                    orderId: rfq.orderId,
                    unitPrice: rfq.unitPrice,
                    quantity: rfq.quantity,
                    vatAmount: rfq.vatAmount,
                    totalExVat: rfq.totalExVat,
                    items: {
                        create: (rfq.items || []).map((item: any) => ({
                            itemCode: item.itemCode,
                            description: item.description,
                            quantity: Number(item.quantity),
                            dueDate: item.dueDate,
                            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
                        }))
                    }
                }
            });
        }
    }

    // 3. Orders
    if (data.orders) {
        console.log(`Seeding ${data.orders.length} Orders...`);
        for (const ord of data.orders) {
            // Check linkage
            const rfqExists = ord.rfqId ? await prisma.rFQ.findUnique({ where: { id: ord.rfqId } }) : false;

            await prisma.order.create({
                data: {
                    userId: masterId,
                    id: ord.id,
                    rfqId: rfqExists ? ord.rfqId : null,
                    requestId: null, // Basic linkage
                    supplier: ord.supplier,
                    department: ord.department,
                    warehouse: ord.warehouse,
                    date: ord.date,
                    dueDate: ord.dueDate,
                    totalValue: Number(ord.totalValue),
                    priority: ord.priority,
                    status: ord.status,
                    approvals: ord.approvals,
                    relatedTo: ord.relatedTo,
                    items: {
                        create: (ord.items || []).map((item: any) => ({
                            itemCode: item.itemCode,
                            description: item.description,
                            quantity: Number(item.quantity),
                            dueDate: item.dueDate,
                            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
                        }))
                    }
                }
            });
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
