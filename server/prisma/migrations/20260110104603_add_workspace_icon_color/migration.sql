-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "color" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "icon" TEXT;

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preview" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "priority" TEXT,
    "dueDate" DATETIME,
    CONSTRAINT "Thread_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VaultItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtitle" TEXT,
    "content" TEXT,
    "metadata" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VaultItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VaultItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "VaultItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "availableViews" TEXT,
    "pinnedViews" TEXT,
    "columns" TEXT,
    "defaultView" TEXT,
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "type" TEXT NOT NULL DEFAULT 'project',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Board_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Board" ("availableViews", "columns", "createdAt", "defaultView", "description", "icon", "id", "name", "pinnedViews", "tasks", "updatedAt", "userId", "workspaceId") SELECT "availableViews", "columns", "createdAt", "defaultView", "description", "icon", "id", "name", "pinnedViews", "tasks", "updatedAt", "userId", "workspaceId" FROM "Board";
DROP TABLE "Board";
ALTER TABLE "new_Board" RENAME TO "Board";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
