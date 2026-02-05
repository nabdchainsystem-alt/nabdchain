-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "aiCreditsBalance" INTEGER NOT NULL DEFAULT 100,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "boardId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "dueDate" TEXT,
    "unitPrice" DOUBLE PRECISION,

    CONSTRAINT "RequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "date" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "warehouse" TEXT,
    "supplier" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdDate" TEXT NOT NULL,
    "relatedTo" TEXT,
    "sentToOrder" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "vatAmount" DOUBLE PRECISION,
    "totalExVat" DOUBLE PRECISION,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQItem" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "dueDate" TEXT,
    "unitPrice" DOUBLE PRECISION,

    CONSTRAINT "RFQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rfqId" TEXT,
    "requestId" TEXT,
    "supplier" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "warehouse" TEXT,
    "date" TEXT NOT NULL,
    "dueDate" TEXT,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "approvals" TEXT,
    "relatedTo" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "dueDate" TEXT,
    "unitPrice" DOUBLE PRECISION,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "availableViews" TEXT,
    "pinnedViews" TEXT,
    "columns" TEXT,
    "defaultView" TEXT,
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "type" TEXT NOT NULL DEFAULT 'project',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "columnId" TEXT,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocPage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "boardId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" TEXT,
    "icon" TEXT,
    "coverImage" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'table',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Row" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "Row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColumnStore" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "columns" TEXT NOT NULL,

    CONSTRAINT "ColumnStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamConnection" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "sourceBoardId" TEXT NOT NULL,
    "sourceRowId" TEXT NOT NULL,
    "sourceTaskData" TEXT NOT NULL,
    "assignedFromUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "copiedBoardId" TEXT,
    "copiedRowId" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtitle" TEXT,
    "content" TEXT,
    "metadata" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "folderId" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkTask" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "boardId" TEXT,
    "boardName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalkTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkReminder" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalkReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalkFile" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "taskId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalkFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPagePermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "UserPagePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalSchema" TEXT NOT NULL,
    "mappedSchema" TEXT NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "promptType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GTDItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "clientId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GTDItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "mentions" TEXT,
    "attachments" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "boardId" TEXT,
    "boardName" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorAvatar" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailMentions" BOOLEAN NOT NULL DEFAULT true,
    "emailAssignments" BOOLEAN NOT NULL DEFAULT true,
    "emailComments" BOOLEAN NOT NULL DEFAULT true,
    "emailDueDates" BOOLEAN NOT NULL DEFAULT true,
    "emailStatusChanges" BOOLEAN NOT NULL DEFAULT false,
    "emailDigest" TEXT NOT NULL DEFAULT 'none',
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushMentions" BOOLEAN NOT NULL DEFAULT true,
    "pushAssignments" BOOLEAN NOT NULL DEFAULT true,
    "pushComments" BOOLEAN NOT NULL DEFAULT true,
    "pushDueDates" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '08:00',
    "quietHoursTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "taskId" TEXT,
    "rowId" TEXT,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" DOUBLE PRECISION,
    "tags" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT,
    "createdById" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "sku" TEXT NOT NULL,
    "partNumber" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "itemType" TEXT NOT NULL DEFAULT 'part',
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "priceUnit" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "maxOrderQty" INTEGER,
    "leadTimeDays" INTEGER,
    "manufacturer" TEXT,
    "brand" TEXT,
    "origin" TEXT,
    "specifications" TEXT,
    "compatibility" TEXT,
    "packaging" TEXT,
    "images" TEXT,
    "documents" TEXT,
    "avgResponseTime" INTEGER,
    "totalQuotes" INTEGER NOT NULL DEFAULT 0,
    "successfulOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceRFQ" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specifications" TEXT,
    "requestedPrice" DOUBLE PRECISION,
    "quotedPrice" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "requestedLeadTime" INTEGER,
    "quotedLeadTime" INTEGER,
    "finalLeadTime" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "negotiationRound" INTEGER NOT NULL DEFAULT 0,
    "maxNegotiationRounds" INTEGER NOT NULL DEFAULT 3,
    "score" INTEGER DEFAULT 0,
    "urgencyScore" INTEGER DEFAULT 0,
    "quantityScore" INTEGER DEFAULT 0,
    "buyerScore" INTEGER DEFAULT 0,
    "marginScore" INTEGER DEFAULT 0,
    "priorityTier" TEXT DEFAULT 'medium',
    "suggestedPrice" DOUBLE PRECISION,
    "suggestedLeadTime" INTEGER,
    "pricingConfidence" INTEGER DEFAULT 0,
    "buyerTotalOrders" INTEGER NOT NULL DEFAULT 0,
    "buyerTotalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buyerAvgOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buyerLastOrderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isTestItem" BOOLEAN NOT NULL DEFAULT false,
    "triggeredMarketplacePublish" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarketplaceRFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceRFQMessage" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentAr" TEXT,
    "attachments" TEXT,
    "offeredPrice" DOUBLE PRECISION,
    "offeredLeadTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceRFQMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceRFQEvent" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceRFQEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRFQ" (
    "id" TEXT NOT NULL,
    "itemId" TEXT,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "message" TEXT,
    "deliveryLocation" TEXT,
    "deliveryCity" TEXT,
    "deliveryCountry" TEXT NOT NULL DEFAULT 'SA',
    "requiredDeliveryDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "source" TEXT NOT NULL DEFAULT 'item',
    "quotedPrice" DOUBLE PRECISION,
    "quotedLeadTime" INTEGER,
    "responseMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'new',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemRFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "partNumber" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT,
    "brand" TEXT,
    "weight" TEXT,
    "weightUnit" TEXT NOT NULL DEFAULT 'kg',
    "dimensions" TEXT,
    "material" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemSku" TEXT NOT NULL,
    "itemImage" TEXT,
    "rfqId" TEXT,
    "rfqNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'not_started',
    "source" TEXT NOT NULL DEFAULT 'direct_buy',
    "shippingAddress" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "estimatedDelivery" TEXT,
    "buyerNotes" TEXT,
    "sellerNotes" TEXT,
    "internalNotes" TEXT,
    "buyerName" TEXT,
    "buyerEmail" TEXT,
    "buyerCompany" TEXT,
    "healthStatus" TEXT NOT NULL DEFAULT 'on_track',
    "healthScore" INTEGER DEFAULT 100,
    "healthLastChecked" TIMESTAMP(3),
    "hasException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionType" TEXT,
    "exceptionSeverity" TEXT,
    "exceptionMessage" TEXT,
    "exceptionCreatedAt" TIMESTAMP(3),
    "exceptionResolvedAt" TIMESTAMP(3),
    "confirmationDeadline" TIMESTAMP(3),
    "shippingDeadline" TIMESTAMP(3),
    "deliveryDeadline" TIMESTAMP(3),
    "daysToConfirm" INTEGER,
    "daysToShip" INTEGER,
    "daysToDeliver" INTEGER,
    "historicalAvgPrice" DOUBLE PRECISION,
    "priceVariance" DOUBLE PRECISION,
    "priceTrend" TEXT,
    "supplierOnTimeRate" DOUBLE PRECISION,
    "supplierQualityScore" DOUBLE PRECISION,
    "supplierTotalOrders" INTEGER,
    "buyerUrgencyScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOrderAudit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorId" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceOrderAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerPriceHistory" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "itemSku" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "orderId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerSupplierMetrics" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onTimeDeliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDeliveryDays" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION,
    "lastOrderDate" TIMESTAMP(3),
    "firstOrderDate" TIMESTAMP(3),
    "avgOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerSupplierMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerPurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerPurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BuyerPurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerSupplier" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerInventory" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerExpense" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "purchaseOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "companyVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerCompany" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "vatDocumentUrl" TEXT,
    "companyType" TEXT,
    "dateOfEstablishment" TIMESTAMP(3),
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerAddress" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'SA',
    "city" TEXT NOT NULL,
    "district" TEXT,
    "street" TEXT,
    "buildingNumber" TEXT,
    "postalCode" TEXT,
    "additionalInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerBank" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "ibanMasked" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "bankCountry" TEXT NOT NULL DEFAULT 'SA',
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerContact" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsapp" TEXT,
    "supportContactName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerDocument" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerAuditLog" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerInvoice" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerCompany" TEXT,
    "lineItems" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "termsAndConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "adjustmentQty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCostTag" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "costType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor" TEXT,
    "invoiceRef" TEXT,
    "notes" TEXT,
    "quantityAffected" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemCostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerBuyerProfile" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "rating" INTEGER,
    "paymentRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerBuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderHealthRules" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "confirmationSlaHours" INTEGER NOT NULL DEFAULT 24,
    "shippingSlaDays" INTEGER NOT NULL DEFAULT 3,
    "deliverySlaDays" INTEGER NOT NULL DEFAULT 7,
    "atRiskThreshold" INTEGER NOT NULL DEFAULT 70,
    "delayedThreshold" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderHealthRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQScoringConfig" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "urgencyWeight" INTEGER NOT NULL DEFAULT 25,
    "quantityWeight" INTEGER NOT NULL DEFAULT 25,
    "buyerWeight" INTEGER NOT NULL DEFAULT 25,
    "marginWeight" INTEGER NOT NULL DEFAULT 25,
    "criticalScoreMin" INTEGER NOT NULL DEFAULT 80,
    "highScoreMin" INTEGER NOT NULL DEFAULT 60,
    "mediumScoreMin" INTEGER NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerIntelligenceProfile" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "segment" TEXT NOT NULL DEFAULT 'smb',
    "avgOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgOrderFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceElasticity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "qualityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "loyaltyIndex" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "explorationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "urgencyProfile" TEXT NOT NULL DEFAULT 'standard',
    "negotiationStyle" TEXT NOT NULL DEFAULT 'flexible',
    "paymentReliability" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "disputeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryAffinities" TEXT NOT NULL DEFAULT '{}',
    "preferredPriceMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preferredPriceMax" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "lastComputed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerIntelligenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerIntelligenceProfile" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'new',
    "onTimeDeliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 24,
    "quoteAcceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "capacityUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "maxWeeklyOrders" INTEGER NOT NULL DEFAULT 50,
    "repeatCustomerRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customerSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "disputeResolution" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "orderGrowthTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inventoryTurnover" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "listingFreshness" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "categoryStrengths" TEXT NOT NULL DEFAULT '{}',
    "priceCompetitiveness" TEXT NOT NULL DEFAULT '{}',
    "lastComputed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerIntelligenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "decay" DOUBLE PRECISION NOT NULL,
    "context" TEXT NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipTrust" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTransaction" TIMESTAMP(3),
    "repeatRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgNegotiationRounds" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "disputeCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceFairnessSnapshot" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "marketMedian" DOUBLE PRECISION NOT NULL,
    "marketP10" DOUBLE PRECISION NOT NULL,
    "marketP25" DOUBLE PRECISION NOT NULL,
    "marketP75" DOUBLE PRECISION NOT NULL,
    "marketP90" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceFairnessSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingWeightsConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "textRelevanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "filterMatchWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "affinityScoreWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "trustBoostWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "fairnessBoostWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "conversionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "marginWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "retentionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.07,
    "freshnessWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "activityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "testStartDate" TIMESTAMP(3),
    "testEndDate" TIMESTAMP(3),
    "trafficPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgConversionRate" DOUBLE PRECISION,
    "avgOrderValue" DOUBLE PRECISION,
    "avgRetentionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchingWeightsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustFeatureGate" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevels" TEXT NOT NULL,
    "overrideRules" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustFeatureGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_workspaceId_idx" ON "User"("workspaceId");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_workspaceId_idx" ON "Activity"("workspaceId");

-- CreateIndex
CREATE INDEX "Activity_boardId_idx" ON "Activity"("boardId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_workspaceId_createdAt_idx" ON "Activity"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "ProcurementRequest_userId_idx" ON "ProcurementRequest"("userId");

-- CreateIndex
CREATE INDEX "ProcurementRequest_status_idx" ON "ProcurementRequest"("status");

-- CreateIndex
CREATE INDEX "RequestItem_requestId_idx" ON "RequestItem"("requestId");

-- CreateIndex
CREATE INDEX "RFQ_userId_idx" ON "RFQ"("userId");

-- CreateIndex
CREATE INDEX "RFQ_requestId_idx" ON "RFQ"("requestId");

-- CreateIndex
CREATE INDEX "RFQ_status_idx" ON "RFQ"("status");

-- CreateIndex
CREATE INDEX "RFQItem_rfqId_idx" ON "RFQItem"("rfqId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_rfqId_idx" ON "Order"("rfqId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Board_userId_idx" ON "Board"("userId");

-- CreateIndex
CREATE INDEX "Board_workspaceId_idx" ON "Board"("workspaceId");

-- CreateIndex
CREATE INDEX "Board_parentId_idx" ON "Board"("parentId");

-- CreateIndex
CREATE INDEX "Board_workspaceId_createdAt_idx" ON "Board"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Card_boardId_idx" ON "Card"("boardId");

-- CreateIndex
CREATE INDEX "DocPage_roomId_idx" ON "DocPage"("roomId");

-- CreateIndex
CREATE INDEX "DocPage_boardId_idx" ON "DocPage"("boardId");

-- CreateIndex
CREATE INDEX "DocPage_parentId_idx" ON "DocPage"("parentId");

-- CreateIndex
CREATE INDEX "Room_userId_idx" ON "Room"("userId");

-- CreateIndex
CREATE INDEX "Row_roomId_idx" ON "Row"("roomId");

-- CreateIndex
CREATE INDEX "ColumnStore_roomId_idx" ON "ColumnStore"("roomId");

-- CreateIndex
CREATE INDEX "EmailAccount_userId_idx" ON "EmailAccount"("userId");

-- CreateIndex
CREATE INDEX "EmailAccount_userId_provider_idx" ON "EmailAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_email_provider_key" ON "EmailAccount"("email", "provider");

-- CreateIndex
CREATE INDEX "TeamConnection_senderId_idx" ON "TeamConnection"("senderId");

-- CreateIndex
CREATE INDEX "TeamConnection_receiverId_idx" ON "TeamConnection"("receiverId");

-- CreateIndex
CREATE INDEX "TeamConnection_status_idx" ON "TeamConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamConnection_senderId_receiverId_key" ON "TeamConnection"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Assignment_assignedToUserId_idx" ON "Assignment"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Assignment_assignedToUserId_isViewed_idx" ON "Assignment"("assignedToUserId", "isViewed");

-- CreateIndex
CREATE INDEX "Assignment_createdAt_idx" ON "Assignment"("createdAt");

-- CreateIndex
CREATE INDEX "VaultItem_userId_idx" ON "VaultItem"("userId");

-- CreateIndex
CREATE INDEX "VaultItem_folderId_idx" ON "VaultItem"("folderId");

-- CreateIndex
CREATE INDEX "VaultItem_type_idx" ON "VaultItem"("type");

-- CreateIndex
CREATE INDEX "VaultItem_isDeleted_idx" ON "VaultItem"("isDeleted");

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "Conversation"("type");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "TalkTask_conversationId_idx" ON "TalkTask"("conversationId");

-- CreateIndex
CREATE INDEX "TalkTask_creatorId_idx" ON "TalkTask"("creatorId");

-- CreateIndex
CREATE INDEX "TalkReminder_conversationId_idx" ON "TalkReminder"("conversationId");

-- CreateIndex
CREATE INDEX "TalkReminder_creatorId_idx" ON "TalkReminder"("creatorId");

-- CreateIndex
CREATE INDEX "TalkFile_conversationId_idx" ON "TalkFile"("conversationId");

-- CreateIndex
CREATE INDEX "TalkFile_uploaderId_idx" ON "TalkFile"("uploaderId");

-- CreateIndex
CREATE INDEX "TalkFile_taskId_idx" ON "TalkFile"("taskId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "UserPagePermission_userId_idx" ON "UserPagePermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPagePermission_userId_pageKey_key" ON "UserPagePermission"("userId", "pageKey");

-- CreateIndex
CREATE INDEX "FileMapping_userId_idx" ON "FileMapping"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "GTDItem_userId_idx" ON "GTDItem"("userId");

-- CreateIndex
CREATE INDEX "GTDItem_userId_category_idx" ON "GTDItem"("userId", "category");

-- CreateIndex
CREATE INDEX "GTDItem_userId_isDeleted_idx" ON "GTDItem"("userId", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "GTDItem_userId_clientId_key" ON "GTDItem"("userId", "clientId");

-- CreateIndex
CREATE INDEX "QuickNote_userId_idx" ON "QuickNote"("userId");

-- CreateIndex
CREATE INDEX "QuickNote_userId_pinned_idx" ON "QuickNote"("userId", "pinned");

-- CreateIndex
CREATE UNIQUE INDEX "QuickNote_userId_clientId_key" ON "QuickNote"("userId", "clientId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction"("commentId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_emoji_key" ON "CommentReaction"("commentId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_boardId_idx" ON "TimeEntry"("boardId");

-- CreateIndex
CREATE INDEX "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_boardId_idx" ON "TimeEntry"("userId", "boardId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_startTime_idx" ON "TimeEntry"("userId", "startTime");

-- CreateIndex
CREATE INDEX "Template_workspaceId_idx" ON "Template"("workspaceId");

-- CreateIndex
CREATE INDEX "Template_createdById_idx" ON "Template"("createdById");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "Template_isPublic_idx" ON "Template"("isPublic");

-- CreateIndex
CREATE INDEX "Template_isPublic_category_idx" ON "Template"("isPublic", "category");

-- CreateIndex
CREATE INDEX "Item_userId_idx" ON "Item"("userId");

-- CreateIndex
CREATE INDEX "Item_userId_status_idx" ON "Item"("userId", "status");

-- CreateIndex
CREATE INDEX "Item_userId_visibility_idx" ON "Item"("userId", "visibility");

-- CreateIndex
CREATE INDEX "Item_status_visibility_idx" ON "Item"("status", "visibility");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "Item_sku_idx" ON "Item"("sku");

-- CreateIndex
CREATE INDEX "Item_itemType_idx" ON "Item"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "Item_userId_sku_key" ON "Item"("userId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceRFQ_rfqNumber_key" ON "MarketplaceRFQ"("rfqNumber");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_itemId_idx" ON "MarketplaceRFQ"("itemId");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_buyerId_idx" ON "MarketplaceRFQ"("buyerId");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_sellerId_idx" ON "MarketplaceRFQ"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_status_idx" ON "MarketplaceRFQ"("status");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_sellerId_status_idx" ON "MarketplaceRFQ"("sellerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_buyerId_status_idx" ON "MarketplaceRFQ"("buyerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_lastActionAt_idx" ON "MarketplaceRFQ"("lastActionAt");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_sellerId_priorityTier_idx" ON "MarketplaceRFQ"("sellerId", "priorityTier");

-- CreateIndex
CREATE INDEX "MarketplaceRFQ_sellerId_score_idx" ON "MarketplaceRFQ"("sellerId", "score");

-- CreateIndex
CREATE INDEX "MarketplaceRFQMessage_rfqId_idx" ON "MarketplaceRFQMessage"("rfqId");

-- CreateIndex
CREATE INDEX "MarketplaceRFQMessage_rfqId_createdAt_idx" ON "MarketplaceRFQMessage"("rfqId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceRFQEvent_rfqId_idx" ON "MarketplaceRFQEvent"("rfqId");

-- CreateIndex
CREATE INDEX "MarketplaceRFQEvent_eventType_idx" ON "MarketplaceRFQEvent"("eventType");

-- CreateIndex
CREATE INDEX "ItemRFQ_itemId_idx" ON "ItemRFQ"("itemId");

-- CreateIndex
CREATE INDEX "ItemRFQ_buyerId_idx" ON "ItemRFQ"("buyerId");

-- CreateIndex
CREATE INDEX "ItemRFQ_sellerId_idx" ON "ItemRFQ"("sellerId");

-- CreateIndex
CREATE INDEX "ItemRFQ_status_idx" ON "ItemRFQ"("status");

-- CreateIndex
CREATE INDEX "ItemRFQ_sellerId_status_idx" ON "ItemRFQ"("sellerId", "status");

-- CreateIndex
CREATE INDEX "ItemRFQ_source_idx" ON "ItemRFQ"("source");

-- CreateIndex
CREATE INDEX "ItemRFQ_priority_idx" ON "ItemRFQ"("priority");

-- CreateIndex
CREATE INDEX "PortalProduct_userId_idx" ON "PortalProduct"("userId");

-- CreateIndex
CREATE INDEX "PortalProduct_userId_status_idx" ON "PortalProduct"("userId", "status");

-- CreateIndex
CREATE INDEX "PortalProduct_sku_idx" ON "PortalProduct"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceOrder_orderNumber_key" ON "MarketplaceOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_buyerId_idx" ON "MarketplaceOrder"("buyerId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_sellerId_idx" ON "MarketplaceOrder"("sellerId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_sellerId_status_idx" ON "MarketplaceOrder"("sellerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_buyerId_status_idx" ON "MarketplaceOrder"("buyerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_status_idx" ON "MarketplaceOrder"("status");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_orderNumber_idx" ON "MarketplaceOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_itemId_idx" ON "MarketplaceOrder"("itemId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_rfqId_idx" ON "MarketplaceOrder"("rfqId");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_sellerId_healthStatus_idx" ON "MarketplaceOrder"("sellerId", "healthStatus");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_sellerId_hasException_idx" ON "MarketplaceOrder"("sellerId", "hasException");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_buyerId_itemSku_idx" ON "MarketplaceOrder"("buyerId", "itemSku");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_buyerId_createdAt_idx" ON "MarketplaceOrder"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_buyerId_sellerId_createdAt_idx" ON "MarketplaceOrder"("buyerId", "sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_buyerId_healthStatus_idx" ON "MarketplaceOrder"("buyerId", "healthStatus");

-- CreateIndex
CREATE INDEX "MarketplaceOrderAudit_orderId_idx" ON "MarketplaceOrderAudit"("orderId");

-- CreateIndex
CREATE INDEX "MarketplaceOrderAudit_orderId_createdAt_idx" ON "MarketplaceOrderAudit"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "BuyerPriceHistory_buyerId_itemSku_idx" ON "BuyerPriceHistory"("buyerId", "itemSku");

-- CreateIndex
CREATE INDEX "BuyerPriceHistory_buyerId_itemSku_orderDate_idx" ON "BuyerPriceHistory"("buyerId", "itemSku", "orderDate");

-- CreateIndex
CREATE INDEX "BuyerPriceHistory_buyerId_sellerId_idx" ON "BuyerPriceHistory"("buyerId", "sellerId");

-- CreateIndex
CREATE INDEX "BuyerSupplierMetrics_buyerId_idx" ON "BuyerSupplierMetrics"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerSupplierMetrics_buyerId_onTimeDeliveryRate_idx" ON "BuyerSupplierMetrics"("buyerId", "onTimeDeliveryRate");

-- CreateIndex
CREATE INDEX "BuyerSupplierMetrics_buyerId_totalSpend_idx" ON "BuyerSupplierMetrics"("buyerId", "totalSpend");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerSupplierMetrics_buyerId_sellerId_key" ON "BuyerSupplierMetrics"("buyerId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerPurchaseOrder_poNumber_key" ON "BuyerPurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "BuyerPurchaseOrder_buyerId_idx" ON "BuyerPurchaseOrder"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerPurchaseOrder_buyerId_status_idx" ON "BuyerPurchaseOrder"("buyerId", "status");

-- CreateIndex
CREATE INDEX "BuyerPurchaseOrder_supplierId_idx" ON "BuyerPurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "BuyerPurchaseOrder_orderDate_idx" ON "BuyerPurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "BuyerPurchaseOrderItem_purchaseOrderId_idx" ON "BuyerPurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "BuyerSupplier_buyerId_idx" ON "BuyerSupplier"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerSupplier_buyerId_name_key" ON "BuyerSupplier"("buyerId", "name");

-- CreateIndex
CREATE INDEX "BuyerInventory_buyerId_idx" ON "BuyerInventory"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerInventory_buyerId_status_idx" ON "BuyerInventory"("buyerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerInventory_buyerId_sku_key" ON "BuyerInventory"("buyerId", "sku");

-- CreateIndex
CREATE INDEX "BuyerExpense_buyerId_idx" ON "BuyerExpense"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerExpense_buyerId_category_idx" ON "BuyerExpense"("buyerId", "category");

-- CreateIndex
CREATE INDEX "BuyerExpense_buyerId_date_idx" ON "BuyerExpense"("buyerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_slug_key" ON "SellerProfile"("slug");

-- CreateIndex
CREATE INDEX "SellerProfile_userId_idx" ON "SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "SellerProfile_status_idx" ON "SellerProfile"("status");

-- CreateIndex
CREATE INDEX "SellerProfile_slug_idx" ON "SellerProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SellerCompany_sellerId_key" ON "SellerCompany"("sellerId");

-- CreateIndex
CREATE INDEX "SellerCompany_sellerId_idx" ON "SellerCompany"("sellerId");

-- CreateIndex
CREATE INDEX "SellerCompany_verificationStatus_idx" ON "SellerCompany"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SellerAddress_sellerId_key" ON "SellerAddress"("sellerId");

-- CreateIndex
CREATE INDEX "SellerAddress_sellerId_idx" ON "SellerAddress"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerBank_sellerId_key" ON "SellerBank"("sellerId");

-- CreateIndex
CREATE INDEX "SellerBank_sellerId_idx" ON "SellerBank"("sellerId");

-- CreateIndex
CREATE INDEX "SellerBank_verificationStatus_idx" ON "SellerBank"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SellerContact_sellerId_key" ON "SellerContact"("sellerId");

-- CreateIndex
CREATE INDEX "SellerContact_sellerId_idx" ON "SellerContact"("sellerId");

-- CreateIndex
CREATE INDEX "SellerDocument_sellerId_idx" ON "SellerDocument"("sellerId");

-- CreateIndex
CREATE INDEX "SellerDocument_documentType_idx" ON "SellerDocument"("documentType");

-- CreateIndex
CREATE INDEX "SellerDocument_verificationStatus_idx" ON "SellerDocument"("verificationStatus");

-- CreateIndex
CREATE INDEX "SellerAuditLog_sellerId_idx" ON "SellerAuditLog"("sellerId");

-- CreateIndex
CREATE INDEX "SellerAuditLog_userId_idx" ON "SellerAuditLog"("userId");

-- CreateIndex
CREATE INDEX "SellerAuditLog_createdAt_idx" ON "SellerAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SellerAuditLog_action_idx" ON "SellerAuditLog"("action");

-- CreateIndex
CREATE INDEX "SellerInvoice_sellerId_idx" ON "SellerInvoice"("sellerId");

-- CreateIndex
CREATE INDEX "SellerInvoice_sellerId_status_idx" ON "SellerInvoice"("sellerId", "status");

-- CreateIndex
CREATE INDEX "SellerInvoice_issueDate_idx" ON "SellerInvoice"("issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SellerInvoice_sellerId_invoiceNumber_key" ON "SellerInvoice"("sellerId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "StockAdjustment_sellerId_idx" ON "StockAdjustment"("sellerId");

-- CreateIndex
CREATE INDEX "StockAdjustment_itemId_idx" ON "StockAdjustment"("itemId");

-- CreateIndex
CREATE INDEX "StockAdjustment_sellerId_createdAt_idx" ON "StockAdjustment"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "StockAdjustment_reason_idx" ON "StockAdjustment"("reason");

-- CreateIndex
CREATE INDEX "ItemCostTag_sellerId_idx" ON "ItemCostTag"("sellerId");

-- CreateIndex
CREATE INDEX "ItemCostTag_itemId_idx" ON "ItemCostTag"("itemId");

-- CreateIndex
CREATE INDEX "ItemCostTag_sellerId_costType_idx" ON "ItemCostTag"("sellerId", "costType");

-- CreateIndex
CREATE INDEX "ItemCostTag_sellerId_date_idx" ON "ItemCostTag"("sellerId", "date");

-- CreateIndex
CREATE INDEX "SellerBuyerProfile_sellerId_idx" ON "SellerBuyerProfile"("sellerId");

-- CreateIndex
CREATE INDEX "SellerBuyerProfile_sellerId_name_idx" ON "SellerBuyerProfile"("sellerId", "name");

-- CreateIndex
CREATE INDEX "SellerBuyerProfile_sellerId_totalSpend_idx" ON "SellerBuyerProfile"("sellerId", "totalSpend");

-- CreateIndex
CREATE UNIQUE INDEX "SellerBuyerProfile_sellerId_buyerId_key" ON "SellerBuyerProfile"("sellerId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderHealthRules_sellerId_key" ON "OrderHealthRules"("sellerId");

-- CreateIndex
CREATE INDEX "OrderHealthRules_sellerId_idx" ON "OrderHealthRules"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQScoringConfig_sellerId_key" ON "RFQScoringConfig"("sellerId");

-- CreateIndex
CREATE INDEX "RFQScoringConfig_sellerId_idx" ON "RFQScoringConfig"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerIntelligenceProfile_buyerId_key" ON "BuyerIntelligenceProfile"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerIntelligenceProfile_buyerId_idx" ON "BuyerIntelligenceProfile"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerIntelligenceProfile_segment_idx" ON "BuyerIntelligenceProfile"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "SellerIntelligenceProfile_sellerId_key" ON "SellerIntelligenceProfile"("sellerId");

-- CreateIndex
CREATE INDEX "SellerIntelligenceProfile_sellerId_idx" ON "SellerIntelligenceProfile"("sellerId");

-- CreateIndex
CREATE INDEX "SellerIntelligenceProfile_tier_idx" ON "SellerIntelligenceProfile"("tier");

-- CreateIndex
CREATE INDEX "TrustEvent_userId_idx" ON "TrustEvent"("userId");

-- CreateIndex
CREATE INDEX "TrustEvent_userId_timestamp_idx" ON "TrustEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "TrustEvent_eventType_idx" ON "TrustEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScore_userId_key" ON "TrustScore"("userId");

-- CreateIndex
CREATE INDEX "TrustScore_userId_idx" ON "TrustScore"("userId");

-- CreateIndex
CREATE INDEX "TrustScore_level_idx" ON "TrustScore"("level");

-- CreateIndex
CREATE INDEX "RelationshipTrust_buyerId_idx" ON "RelationshipTrust"("buyerId");

-- CreateIndex
CREATE INDEX "RelationshipTrust_sellerId_idx" ON "RelationshipTrust"("sellerId");

-- CreateIndex
CREATE INDEX "RelationshipTrust_trustScore_idx" ON "RelationshipTrust"("trustScore");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipTrust_buyerId_sellerId_key" ON "RelationshipTrust"("buyerId", "sellerId");

-- CreateIndex
CREATE INDEX "PriceFairnessSnapshot_itemId_idx" ON "PriceFairnessSnapshot"("itemId");

-- CreateIndex
CREATE INDEX "PriceFairnessSnapshot_category_idx" ON "PriceFairnessSnapshot"("category");

-- CreateIndex
CREATE INDEX "PriceFairnessSnapshot_snapshotDate_idx" ON "PriceFairnessSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "PriceFairnessSnapshot_itemId_snapshotDate_idx" ON "PriceFairnessSnapshot"("itemId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingWeightsConfig_name_key" ON "MatchingWeightsConfig"("name");

-- CreateIndex
CREATE INDEX "MatchingWeightsConfig_isActive_idx" ON "MatchingWeightsConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TrustFeatureGate_featureKey_key" ON "TrustFeatureGate"("featureKey");

-- CreateIndex
CREATE INDEX "TrustFeatureGate_featureKey_idx" ON "TrustFeatureGate"("featureKey");

-- CreateIndex
CREATE INDEX "TrustFeatureGate_isActive_idx" ON "TrustFeatureGate"("isActive");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProcurementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProcurementRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQItem" ADD CONSTRAINT "RFQItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Row" ADD CONSTRAINT "Row_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnStore" ADD CONSTRAINT "ColumnStore_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assignedFromUserId_fkey" FOREIGN KEY ("assignedFromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "VaultItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultItem" ADD CONSTRAINT "VaultItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkTask" ADD CONSTRAINT "TalkTask_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkTask" ADD CONSTRAINT "TalkTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkReminder" ADD CONSTRAINT "TalkReminder_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkReminder" ADD CONSTRAINT "TalkReminder_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkFile" ADD CONSTRAINT "TalkFile_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkFile" ADD CONSTRAINT "TalkFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalkFile" ADD CONSTRAINT "TalkFile_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TalkTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPagePermission" ADD CONSTRAINT "UserPagePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileMapping" ADD CONSTRAINT "FileMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GTDItem" ADD CONSTRAINT "GTDItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickNote" ADD CONSTRAINT "QuickNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceRFQ" ADD CONSTRAINT "MarketplaceRFQ_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceRFQMessage" ADD CONSTRAINT "MarketplaceRFQMessage_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "MarketplaceRFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceRFQEvent" ADD CONSTRAINT "MarketplaceRFQEvent_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "MarketplaceRFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRFQ" ADD CONSTRAINT "ItemRFQ_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerPurchaseOrder" ADD CONSTRAINT "BuyerPurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "BuyerSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerPurchaseOrderItem" ADD CONSTRAINT "BuyerPurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "BuyerPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerCompany" ADD CONSTRAINT "SellerCompany_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerAddress" ADD CONSTRAINT "SellerAddress_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerBank" ADD CONSTRAINT "SellerBank_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerContact" ADD CONSTRAINT "SellerContact_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerDocument" ADD CONSTRAINT "SellerDocument_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
