/**
 * Service Layer Types
 * Shared interfaces for API service functions
 */

import { Board, Task, BoardColumn } from '../types';

// Re-export common types
export type { Board, Task, BoardColumn };

// ============ Board Service Types ============

export interface CreateBoardData {
    name: string;
    workspaceId?: string;
    description?: string;
    columns?: BoardColumn[];
    tasks?: Task[];
    defaultView?: string;
    availableViews?: string[];
    icon?: string;
    parentId?: string;
}

export interface UpdateBoardData {
    name?: string;
    description?: string;
    columns?: BoardColumn[];
    tasks?: Task[];
    isFavorite?: boolean;
    defaultView?: string;
    availableViews?: string[];
    icon?: string;
    pinnedViews?: string[];
    parentId?: string | null;
}

export interface Card {
    id: string;
    boardId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
    [key: string]: unknown;
}

export interface CreateCardData {
    boardId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
}

export interface UpdateCardData {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: string;
}

// ============ Room Service Types ============

export interface Room {
    id: string;
    name: string;
    boardId?: string;
    color?: string;
    isCollapsed?: boolean;
}

export interface CreateRoomData {
    name: string;
    boardId?: string;
    color?: string;
}

export interface Row {
    id: string;
    roomId: string;
    name?: string;
    [key: string]: unknown;
}

export interface CreateRowData {
    roomId: string;
    name?: string;
    [key: string]: unknown;
}

export interface UpdateRowData {
    name?: string;
    [key: string]: unknown;
}

export interface Column {
    id: string;
    label: string;
    type: string;
    width?: number;
    minWidth?: number;
    resizable?: boolean;
    pinned?: boolean;
    options?: { id: string; label: string; color: string }[];
}

// ============ Procurement Service Types ============

export type ProcurementStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
export type RFQStatus = 'Draft' | 'Sent' | 'Received' | 'Awarded' | 'Cancelled' | 'Sent to PO';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Received';

export interface ProcurementRequest {
    id: string;
    title: string;
    description?: string;
    requestedBy?: string;
    department?: string;
    status: ProcurementStatus;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    items?: ProcurementItem[];
    budget?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProcurementItem {
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    estimatedPrice?: number;
    specifications?: string;
}

export interface CreateProcurementRequestData {
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    requestedBy?: string;
    department?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
    items?: ProcurementItem[];
    budget?: number;
    date?: string;
    warehouse?: string;
    relatedTo?: string;
    status?: string;
    isUrgent?: boolean;
    approvalStatus?: string;
    rfqSent?: boolean;
}

export interface UpdateProcurementRequestData {
    title?: string;
    description?: string;
    status?: ProcurementStatus;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    items?: ProcurementItem[];
    budget?: number;
    approvalStatus?: string;
    isDeleted?: boolean;
    rfqSent?: boolean;
}

export interface RFQ {
    id: string;
    requestId?: string;
    title: string;
    description?: string;
    vendors?: string[];
    status: RFQStatus;
    dueDate?: string;
    items?: ProcurementItem[];
    responses?: RFQResponse[];
    createdAt?: string;
}

export interface RFQResponse {
    vendorId: string;
    vendorName: string;
    totalPrice: number;
    deliveryDate?: string;
    notes?: string;
}

export interface CreateRFQData {
    requestId?: string;
    title: string;
    description?: string;
    vendors?: string[];
    dueDate?: string;
    items?: ProcurementItem[];
}

export interface UpdateRFQData {
    title?: string;
    description?: string;
    status?: RFQStatus;
    vendors?: string[];
    dueDate?: string;
    items?: ProcurementItem[];
    responses?: RFQResponse[];
    isDeleted?: boolean;
    sentToOrder?: boolean;
    orderId?: string;
}

export interface Order {
    id: string;
    rfqId?: string;
    vendorId?: string;
    vendorName?: string;
    status: OrderStatus;
    items?: OrderItem[];
    totalAmount?: number;
    shippingAddress?: string;
    expectedDelivery?: string;
    actualDelivery?: string;
    trackingNumber?: string;
    createdAt?: string;
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface CreateOrderData {
    rfqId?: string;
    vendorId?: string;
    vendorName?: string;
    items?: OrderItem[];
    totalAmount?: number;
    shippingAddress?: string;
    expectedDelivery?: string;
}

export interface UpdateOrderData {
    status?: OrderStatus;
    items?: OrderItem[];
    totalAmount?: number;
    shippingAddress?: string;
    expectedDelivery?: string;
    actualDelivery?: string;
    trackingNumber?: string;
    isDeleted?: boolean;
    approvals?: string | Record<string, unknown>;
}
