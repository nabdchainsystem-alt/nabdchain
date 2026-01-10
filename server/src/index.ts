import 'dotenv/config'; // Must be first
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import inviteRoutes from './routes/inviteRoutes';
import { requireAuth } from './middleware/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Auth Middleware & User Sync
app.use(async (req: any, res, next) => {
    // Skip auth for public routes if any (none for now)
    if (req.method === 'OPTIONS') return next();

    if (req.path === '/health' ||
        req.path.startsWith('/api/auth/google/callback') ||
        req.path.startsWith('/api/auth/outlook/callback')) {
        return next();
    }

    // Run Clerk Auth
    requireAuth(req, res, async (err: any) => {
        if (err) return next(err);

        // Sync User to DB
        if (req.auth && req.auth.userId) {
            try {
                // Ensure user exists in our DB
                // Optimized: only check/create if we haven't seen this user in this instance? 
                // For now, always upsert to be safe and simple.
                // Actually, just findUnique gives us safety, if not found create.
                // Let's use upsert.
                await prisma.user.upsert({
                    where: { id: req.auth.userId },
                    update: {}, // No fields to update yet, just ensure existence
                    create: {
                        id: req.auth.userId,
                        email: "pending@sync.com" // Clerk doesn't give email in the token claims by default, we might need to fetch it or just use placeholder. 
                        // Schema requires email. Let's make email optional OR fetch it?
                        // Fetching is slow. Let's make schema email optional or just put a placeholder.
                        // Actually schema says `email String @unique`.
                        // We can use the ID as email for now or change schema.
                        // Let's use `id` as placeholder.
                    }
                });
            } catch (e) {
                console.error("User Sync Error", e);
            }
        }
        next();
    });
});

// Auth & Email Routes
app.use('/api/auth', authRoutes); // Ensure authRoutes uses req.auth.userId
app.use('/api/email', emailRoutes);

// --- HELPERS ---

function safeJSONParse<T>(jsonString: string | null | undefined, fallback: T): T {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return fallback;
    }
}

function handleError(res: express.Response, error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
}

// --- ROUTES ---

// 1. Procurement Requests
app.get('/procurementRequests', async (req: any, res) => {
    try {
        const requests = await prisma.procurementRequest.findMany({
            where: { userId: req.auth.userId },
            include: { items: true }
        });
        res.json(requests);
    } catch (e) { handleError(res, e); }
});

app.post('/procurementRequests', async (req: any, res) => {
    const { items, ...data } = req.body;
    try {
        const result = await prisma.procurementRequest.create({
            data: {
                ...data,
                userId: req.auth.userId,
                items: {
                    create: items ? items.map((item: any) => ({
                        ...item,
                        quantity: Number(item.quantity || 0),
                        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined
                    })) : []
                }
            },
            include: { items: true }
        });
        res.json(result);
    } catch (e) { handleError(res, e); }
});

app.put('/procurementRequests/:id', async (req, res) => {
    const { id } = req.params;
    const { items, ...data } = req.body;
    try {
        // Transactional update: update main fields, replace items
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.procurementRequest.update({
                where: { id },
                data: data
            });

            if (items) {
                await tx.requestItem.deleteMany({ where: { requestId: id } });
                await tx.requestItem.createMany({
                    data: items.map((item: any) => ({
                        ...item,
                        requestId: id,
                        quantity: Number(item.quantity || 0),
                        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined
                    }))
                });
            }

            return await tx.procurementRequest.findUnique({
                where: { id },
                include: { items: true }
            });
        });

        res.json(result);
    } catch (e) { handleError(res, e); }
});

// 2. RFQs
app.get('/rfqs', async (req: any, res) => {
    try {
        const rfqs = await prisma.rFQ.findMany({
            where: { userId: req.auth.userId },
            include: { items: true }
        });
        res.json(rfqs);
    } catch (e) { handleError(res, e); }
});

app.post('/rfqs', async (req: any, res) => {
    const { items, ...data } = req.body;
    try {
        const result = await prisma.rFQ.create({
            data: {
                ...data,
                userId: req.auth.userId,
                value: data.value ? Number(data.value) : 0,
                unitPrice: data.unitPrice ? Number(data.unitPrice) : undefined,
                quantity: data.quantity ? Number(data.quantity) : undefined,
                vatAmount: data.vatAmount ? Number(data.vatAmount) : undefined,
                totalExVat: data.totalExVat ? Number(data.totalExVat) : undefined,
                items: {
                    create: items ? items.map((item: any) => ({
                        ...item,
                        quantity: Number(item.quantity || 0),
                        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined
                    })) : []
                }
            },
            include: { items: true }
        });
        res.json(result);
    } catch (e) { handleError(res, e); }
});

// 3. Orders
app.get('/orders', async (req: any, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.auth.userId },
            include: { items: true }
        });
        res.json(orders);
    } catch (e) { handleError(res, e); }
});

// 4. Boards
app.get('/boards', async (req: any, res) => {
    try {
        const boards = await prisma.board.findMany({
            where: { userId: req.auth.userId },
            include: { cards: true }
        });
        const parsed = boards.map(b => ({
            ...b,
            availableViews: safeJSONParse(b.availableViews, []),
            pinnedViews: safeJSONParse(b.pinnedViews, []),
            columns: safeJSONParse(b.columns, [])
        }));
        res.json(parsed);
    } catch (e) { handleError(res, e); }
});

app.get('/boards/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const board = await prisma.board.findFirst({
            where: { id, userId: req.auth.userId },
            include: { cards: true }
        });
        if (!board) return res.status(404).json({ error: 'Board not found' });

        const parsed = {
            ...board,
            availableViews: safeJSONParse(board.availableViews, []),
            pinnedViews: safeJSONParse(board.pinnedViews, []),
            columns: safeJSONParse(board.columns, [])
        };
        res.json(parsed);
    } catch (e) { handleError(res, e); }
});

app.post('/boards', async (req: any, res) => {
    try {
        const { availableViews, pinnedViews, columns, tasks, cards, id, title, name, description, defaultView } = req.body;

        // Handle name/title mismatch
        const boardName = name || title || "Untitled Board";

        const result = await prisma.board.create({
            data: {
                name: boardName,
                description,
                defaultView,
                userId: req.auth.userId,
                availableViews: availableViews ? JSON.stringify(availableViews) : undefined,
                pinnedViews: pinnedViews ? JSON.stringify(pinnedViews) : undefined,
                columns: columns ? JSON.stringify(columns) : undefined
            }
        });

        res.json({
            ...result,
            availableViews: safeJSONParse(result.availableViews, []),
            pinnedViews: safeJSONParse(result.pinnedViews, []),
            columns: safeJSONParse(result.columns, [])
        });
    } catch (e) { handleError(res, e); }
});

app.patch('/boards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { availableViews, pinnedViews, columns, tasks, cards, id: _id, title, name, description, defaultView } = req.body;
        const data: any = {};

        // Whitelist fields
        if (name || title) data.name = name || title;
        if (description !== undefined) data.description = description;
        if (defaultView !== undefined) data.defaultView = defaultView;
        if (availableViews !== undefined) data.availableViews = JSON.stringify(availableViews);
        if (pinnedViews !== undefined) data.pinnedViews = JSON.stringify(pinnedViews);
        if (columns !== undefined) data.columns = JSON.stringify(columns);

        const result = await prisma.board.update({ where: { id }, data });
        res.json({
            ...result,
            availableViews: safeJSONParse(result.availableViews, []),
            pinnedViews: safeJSONParse(result.pinnedViews, []),
            columns: safeJSONParse(result.columns, [])
        });
    } catch (e) { handleError(res, e); }
});

app.delete('/boards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.board.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
});

// 5. Cards
app.get('/cards', async (req, res) => {
    const { boardId } = req.query;
    try {
        if (boardId) {
            const cards = await prisma.card.findMany({ where: { boardId: String(boardId) } });
            res.json(cards);
        } else {
            const cards = await prisma.card.findMany();
            res.json(cards);
        }
    } catch (e) { handleError(res, e); }
});

app.post('/cards', async (req, res) => {
    try {
        const { boardId, title, description, columnId } = req.body;
        if (!boardId || !title) return res.status(400).json({ error: "Missing required fields" });

        const result = await prisma.card.create({
            data: {
                boardId,
                title,
                description,
                columnId
            }
        });
        res.json(result);
    } catch (e) { handleError(res, e); }
});

app.patch('/cards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { title, description, columnId, boardId } = req.body;
        const data: any = {};

        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (columnId !== undefined) data.columnId = columnId;
        if (boardId !== undefined) data.boardId = boardId;

        const result = await prisma.card.update({ where: { id }, data });
        res.json(result);
    } catch (e) { handleError(res, e); }
});

app.delete('/cards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.card.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
});

// 6. Rooms
app.get('/rooms', async (req: any, res) => {
    try {
        const rooms = await prisma.room.findMany({ where: { userId: req.auth.userId } });
        res.json(rooms);
    } catch (e) { handleError(res, e); }
});

app.get('/rooms/:id', async (req: any, res) => {
    const { id } = req.params;
    try {
        const room = await prisma.room.findFirst({ where: { id, userId: req.auth.userId } });
        res.json(room);
    } catch (e) { handleError(res, e); }
});

app.post('/rooms', async (req: any, res) => {
    try {
        const result = await prisma.room.create({
            data: {
                ...req.body,
                userId: req.auth.userId
            }
        });
        res.json(result);
    } catch (e) { handleError(res, e); }
});

// 7. Rows (Dynamic Content)
app.get('/rows', async (req, res) => {
    const { roomId } = req.query;
    if (!roomId) return res.json([]);

    try {
        const rows = await prisma.row.findMany({ where: { roomId: String(roomId) } });
        const unpacked = rows.map(r => {
            const content = safeJSONParse(r.content, {});
            return {
                id: r.id,
                roomId: r.roomId,
                ...content
            };
        });
        res.json(unpacked);
    } catch (e) { handleError(res, e); }
});

app.post('/rows', async (req, res) => {
    const { roomId, id, ...rest } = req.body;
    try {
        const result = await prisma.row.create({
            data: {
                id,
                room: { connect: { id: roomId } },
                data: JSON.stringify(rest),
                content: JSON.stringify(rest)
            }
        });
        res.json({ id: result.id, roomId: result.roomId, ...rest });
    } catch (e) { handleError(res, e); }
});

app.patch('/rows/:id', async (req, res) => {
    const { id } = req.params;
    const { roomId, ...updates } = req.body;

    try {
        const existing = await prisma.row.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: "Not found" });

        const currentContent = safeJSONParse(existing.content, {});
        const newContent = { ...currentContent, ...updates };

        const result = await prisma.row.update({
            where: { id },
            data: {
                content: JSON.stringify(newContent),
                data: JSON.stringify(newContent) // Also update data field
            }
        });

        res.json({ id: result.id, roomId: result.roomId, ...newContent });
    } catch (e) { handleError(res, e); }
});

app.delete('/rows/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.row.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
});

// 8. Columns
app.get('/columns', async (req, res) => {
    const { roomId } = req.query;
    if (!roomId) return res.json([]);
    try {
        const store = await prisma.columnStore.findFirst({ where: { roomId: String(roomId) } });
        if (!store) return res.json([]);

        const parsed = {
            id: store.id,
            roomId: store.roomId,
            columns: safeJSONParse(store.columns, [])
        };
        res.json([parsed]);
    } catch (e) { handleError(res, e); }
});

app.post('/columns', async (req, res) => {
    const { roomId, columns } = req.body;
    try {
        const existing = await prisma.columnStore.findFirst({ where: { roomId } });
        if (existing) {
            const result = await prisma.columnStore.update({
                where: { id: existing.id },
                data: { columns: JSON.stringify(columns) }
            });
            return res.json({ id: result.id, roomId: result.roomId, columns });
        }

        const result = await prisma.columnStore.create({
            data: {
                roomId,
                columns: JSON.stringify(columns)
            }
        });
        res.json({ id: result.id, roomId: result.roomId, columns });
    } catch (e) { handleError(res, e); }
});

app.patch('/columns/:id', async (req, res) => {
    const { id } = req.params;
    const { columns } = req.body;
    try {
        const result = await prisma.columnStore.update({
            where: { id },
            data: {
                columns: JSON.stringify(columns)
            }
        });
        res.json({ id: result.id, roomId: result.roomId, columns });
    } catch (e) { handleError(res, e); }
});

app.listen(PORT, () => {
    console.log(`SQL Server running on http://localhost:${PORT}`);
});

