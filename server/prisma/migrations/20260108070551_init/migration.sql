-- CreateTable
CREATE TABLE "ProcurementRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "warehouse" TEXT,
    "relatedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending',
    "rfqSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "dueDate" TEXT,
    "unitPrice" REAL,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProcurementRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT,
    "date" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "warehouse" TEXT,
    "supplier" TEXT NOT NULL,
    "value" REAL NOT NULL DEFAULT 0,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdDate" TEXT NOT NULL,
    "relatedTo" TEXT,
    "sentToOrder" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "unitPrice" REAL,
    "quantity" REAL,
    "vatAmount" REAL,
    "totalExVat" REAL,
    CONSTRAINT "RFQ_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProcurementRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RFQItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "dueDate" TEXT,
    "unitPrice" REAL,
    CONSTRAINT "RFQItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT,
    "requestId" TEXT,
    "supplier" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "warehouse" TEXT,
    "date" TEXT NOT NULL,
    "dueDate" TEXT,
    "totalValue" REAL NOT NULL,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "approvals" TEXT,
    "relatedTo" TEXT,
    CONSTRAINT "Order_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "dueDate" TEXT,
    "unitPrice" REAL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "columnId" TEXT,
    CONSTRAINT "Card_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
