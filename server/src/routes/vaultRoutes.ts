import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema for creating/updating vault items
const vaultItemSchema = z.object({
    title: z.string().min(1),
    type: z.enum(['folder', 'file', 'image', 'note', 'weblink', 'document']), // Aligning with frontend types
    subtitle: z.string().optional(),
    content: z.string().optional(),
    metadata: z.string().optional(),
    isFavorite: z.boolean().optional(),
    folderId: z.string().optional().nullable(),
    color: z.string().optional(),
});

// GET all items for the user
router.get('/', async (req, res) => {
    try {
        // In a real app we'd get userId from auth middleware
        // For now we'll use a hardcoded user or query param if available, or just fetch all 
        // Assuming single user/workspace context for this demo or userId passed in query
        const userId = (req.query.userId as string) || "user-1";

        const items = await prisma.vaultItem.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching vault items:', error);
        res.status(500).json({ error: 'Failed to fetch vault items' });
    }
});

// CREATE a new item
router.post('/', async (req, res) => {
    try {
        const userId = (req.body.userId as string) || "user-1";
        const data = vaultItemSchema.parse(req.body);

        const newItem = await prisma.vaultItem.create({
            data: {
                ...data,
                userId,
                // Make sure folderId is null if undefined or empty string
                folderId: data.folderId || null,
            },
        });
        res.json(newItem);
    } catch (error) {
        console.error('Error creating vault item:', error);
        res.status(400).json({ error: 'Invalid input' });
    }
});

// UPDATE an item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = vaultItemSchema.partial().parse(req.body);

        const updatedItem = await prisma.vaultItem.update({
            where: { id },
            data: {
                ...data,
                folderId: data.folderId === undefined ? undefined : (data.folderId || null),
            },
        });
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating vault item:', error);
        res.status(400).json({ error: 'Failed to update vault item' });
    }
});

// DELETE an item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Note: Prisma cascade delete will handle children if configured, 
        // but our schema has @relation("FolderItems", ... onDelete: Cascade)
        // so deleting a folder should delete its contents.

        await prisma.vaultItem.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting vault item:', error);
        res.status(500).json({ error: 'Failed to delete vault item' });
    }
});

export default router;
