import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Test Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// --- Boards API (Proof of Concept) ---

app.get('/api/boards', async (req, res) => {
    try {
        const boards = await prisma.board.findMany({
            include: {
                groups: {
                    include: {
                        tasks: true
                    }
                },
                columns: true
            }
        });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

app.post('/api/boards', async (req, res) => {
    try {
        const { name, description } = req.body;
        const board = await prisma.board.create({
            data: {
                name,
                description,
                availableViews: ['kanban', 'table'],
                defaultView: 'kanban'
            }
        });
        res.json(board);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create board' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
