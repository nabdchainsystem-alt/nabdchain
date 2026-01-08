import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Procurement Requests
app.get('/procurementRequests', async (req, res) => {
    const requests = await prisma.procurementRequest.findMany({
        include: { items: true }
    });
    res.json(requests);
});

app.post('/procurementRequests', async (req, res) => {
    const { items, ...data } = req.body;
    try {
        const result = await prisma.procurementRequest.create({
            data: {
                ...data,
                items: {
                    create: items
                }
            },
            include: { items: true }
        });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

app.put('/procurementRequests/:id', async (req, res) => {
    const { id } = req.params;
    const { items, ...data } = req.body;
    // For simplicity, we update fields. Identifying changed items vs new items is complex, 
    // so we typically might delete all items and recreate them, or require item IDs.
    // For this prototype, let's just update the main fields.
    const result = await prisma.procurementRequest.update({
        where: { id },
        data: data
    });
    res.json(result);
});

// 2. RFQs
app.get('/rfqs', async (req, res) => {
    const rfqs = await prisma.rFQ.findMany({
        include: { items: true }
    });
    res.json(rfqs);
});

app.post('/rfqs', async (req, res) => {
    const { items, ...data } = req.body;
    try {
        const result = await prisma.rFQ.create({
            data: {
                ...data,
                items: {
                    create: items
                }
            },
            include: { items: true }
        });
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create RFQ" });
    }
});

// 3. Orders
app.get('/orders', async (req, res) => {
    const orders = await prisma.order.findMany({
        include: { items: true }
    });
    res.json(orders);
});

// 4. Boards
app.get('/boards', async (req, res) => {
    const boards = await prisma.board.findMany({ include: { cards: true } });
    res.json(boards);
});

app.post('/boards', async (req, res) => {
    try {
        const result = await prisma.board.create({ data: req.body });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.delete('/boards/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.board.delete({ where: { id } });
    res.json({ success: true });
});

// 5. Cards
app.get('/cards', async (req, res) => {
    const { boardId } = req.query;
    if (boardId) {
        const cards = await prisma.card.findMany({ where: { boardId: String(boardId) } });
        res.json(cards);
    } else {
        const cards = await prisma.card.findMany();
        res.json(cards);
    }
});

app.post('/cards', async (req, res) => {
    try {
        const result = await prisma.card.create({ data: req.body });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e }); }
});

app.patch('/cards/:id', async (req, res) => {
    const { id } = req.params;
    const result = await prisma.card.update({ where: { id }, data: req.body });
    res.json(result);
});

app.delete('/cards/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.card.delete({ where: { id } });
    res.json({ success: true });
});

// 6. Rooms
app.get('/rooms', async (req, res) => {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
});

app.get('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const room = await prisma.room.findUnique({ where: { id } });
    res.json(room);
});

app.post('/rooms', async (req, res) => {
    try {
        const result = await prisma.room.create({ data: req.body });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e }); }
});

// 7. Rows (Dynamic Content)
app.get('/rows', async (req, res) => {
    const { roomId } = req.query;
    if (!roomId) return res.json([]);

    const rows = await prisma.row.findMany({ where: { roomId: String(roomId) } });
    // Unpack content JSON
    const unpacked = rows.map(r => {
        const content = JSON.parse(r.content);
        return {
            id: r.id,
            roomId: r.roomId,
            ...content
        };
    });
    res.json(unpacked);
});

app.post('/rows', async (req, res) => {
    const { roomId, id, ...rest } = req.body;
    try {
        const result = await prisma.row.create({
            data: {
                id, // Use provided ID if any
                roomId,
                content: JSON.stringify(rest)
            }
        });
        res.json({ id: result.id, roomId: result.roomId, ...rest });
    } catch (e) { res.status(500).json({ error: e }); }
});

app.patch('/rows/:id', async (req, res) => {
    const { id } = req.params;
    const { roomId, ...updates } = req.body; // Don't allow changing roomId easily or ignore it

    // First get existing
    const existing = await prisma.row.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const currentContent = JSON.parse(existing.content);
    const newContent = { ...currentContent, ...updates };

    const result = await prisma.row.update({
        where: { id },
        data: {
            content: JSON.stringify(newContent)
        }
    });

    res.json({ id: result.id, roomId: result.roomId, ...newContent });
});

app.delete('/rows/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.row.delete({ where: { id } });
    res.json({ success: true });
});

// 8. Columns (Stored as JSON blob per room)
app.get('/columns', async (req, res) => {
    const { roomId } = req.query;
    if (!roomId) return res.json([]);
    const store = await prisma.columnStore.findFirst({ where: { roomId: String(roomId) } });
    if (!store) return res.json([]);

    // Frontend expects array of wrappers presumably? Or just the store?
    // roomService returns: "result.length > 0 ? result[0].columns : []"
    // So it expects an array of ColumnStore objects.
    // We should return an array containing our store.
    const parsed = {
        id: store.id,
        roomId: store.roomId,
        columns: JSON.parse(store.columns)
    };
    res.json([parsed]);
});

app.post('/columns', async (req, res) => {
    const { roomId, columns } = req.body;
    try {
        const result = await prisma.columnStore.create({
            data: {
                roomId,
                columns: JSON.stringify(columns)
            }
        });
        res.json({ id: result.id, roomId: result.roomId, columns });
    } catch (e) { res.status(500).json({ error: e }); }
});

app.patch('/columns/:id', async (req, res) => {
    const { id } = req.params;
    const { columns } = req.body;
    const result = await prisma.columnStore.update({
        where: { id },
        data: {
            columns: JSON.stringify(columns)
        }
    });
    res.json({ id: result.id, roomId: result.roomId, columns });
});


app.listen(PORT, () => {
    console.log(`SQL Server running on http://localhost:${PORT}`);
});

