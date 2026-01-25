# Purchases Department - Complete Dashboard Wiki

> **Department Focus:** Purchase Orders & Requisitions
> **Total Dashboards:** 7
> **Total KPIs:** 28+

---

## Table of Contents

1. [Department Overview](#department-overview)
2. [Dashboard Index](#dashboard-index)
3. [Master Data Tables](#master-data-tables)
4. [Dashboard Details](#dashboard-details)
5. [KPI Definitions](#kpi-definitions)
6. [Chart Types](#chart-types)

---

## Department Overview

The Purchases Department provides comprehensive analytics for managing procurement operations, purchase orders, supplier performance, and cost control. It enables strategic sourcing decisions and optimizes the procurement process from requisition to delivery.

### Business Questions Answered

- What is our total procurement spend?
- Which suppliers are we buying most from?
- Are orders being delivered on time?
- What is our purchase order pipeline?
- Where can we reduce procurement costs?

---

## Dashboard Index

| # | Dashboard Name | Purpose | Key Charts |
|---|----------------|---------|------------|
| 1 | Purchase Overview | Total spend & order metrics | Bar, Pie |
| 2 | Supplier Performance | Vendor performance tracking | Bar, Scatter |
| 3 | Purchase Behavior | Buying patterns analysis | Bar, Line |
| 4 | Cost Control | Cost analysis & optimization | Bar, Line |
| 5 | Purchase Funnel | Requisition to delivery | Funnel, Bar |
| 6 | Dependency Risk | Supply concentration risk | Scatter, Pie |
| 7 | Forecast Planning | Demand planning | Line, Bar |

---

## Master Data Tables

### Table 1: PURCHASE_ORDERS (Primary)

The main purchase order table.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **po_id** | String | Yes | Unique PO identifier | PO Number, Purchase Order ID, Order ID, Order Number, PO No, Procurement ID, Requisition Number |
| **po_date** | Date | Yes | Order creation date | Date, Order Date, Creation Date, Issue Date, PO Date |
| **supplier_id** | String | Yes | Supplier reference | Supplier, Vendor, Vendor ID, Supplier ID, Seller |
| **supplier_name** | String | No | Supplier name | Supplier Name, Vendor Name, Company |
| **total_amount** | Decimal | Yes | Order total value | Amount, Value, Total, PO Value, Order Value, Sum |
| **currency** | String | Yes | Currency code | Currency, Currency Code |
| **status** | Enum | Yes | Order status | Status, State, Order Status, PO Status |
| **expected_delivery** | Date | Yes | Expected delivery date | Delivery Date, Due Date, Expected Date, ETA, Target Date |
| **actual_delivery** | Date | No | Actual delivery date | Received Date, Actual Date, GRN Date, Delivery Date |
| **department** | String | Yes | Requesting department | Department, Cost Center, Business Unit, Requester Dept |
| **buyer_id** | String | Yes | Buyer/purchaser | Buyer, Purchaser, Agent, Procurement Officer, Creator |
| **buyer_name** | String | No | Buyer name | Buyer Name, Purchaser Name |
| **category** | String | Yes | Purchase category | Category, Commodity, Product Category, Spend Category |
| **priority** | Enum | No | Order priority | Priority, Urgency, Importance |
| **payment_terms** | String | No | Payment terms | Terms, Payment Terms, Net Days, Credit Terms |
| **shipping_method** | String | No | Shipping method | Shipping, Freight, Delivery Method, Transport |
| **notes** | Text | No | Order notes | Notes, Comments, Remarks, Description |
| **approved_by** | String | No | Approver | Approver, Authorized By, Manager |
| **approval_date** | Date | No | Approval date | Approval Date, Authorized Date |

**Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| draft | Draft order | Draft, New, Pending, Unsent |
| pending_approval | Awaiting approval | Pending Approval, Review, Awaiting, Submitted |
| approved | Approved | Approved, Authorized, Confirmed |
| sent | Sent to supplier | Sent, Issued, Released, Dispatched |
| acknowledged | Supplier confirmed | Acknowledged, Confirmed, Accepted |
| in_transit | Shipped | In Transit, Shipped, On Way, En Route |
| partial | Partially received | Partial, Part Received, Incomplete |
| received | Fully received | Received, Complete, Delivered, Closed |
| cancelled | Cancelled | Cancelled, Voided, Rejected |

**Priority Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| low | Low, Normal, Standard |
| medium | Medium, Regular, Moderate |
| high | High, Important, Priority |
| urgent | Urgent, Critical, Rush, Emergency |

---

### Table 2: PURCHASE_ORDER_LINES

Line items in purchase orders.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **line_id** | String | Yes | Unique line ID | Line ID, Item ID, Detail ID, Row ID |
| **po_id** | String | Yes | Reference to PO | PO Number, Order ID, PO ID |
| **item_id** | String | Yes | Item/product ID | Item, SKU, Product, Part Number, Material |
| **item_name** | String | Yes | Item description | Description, Item Name, Product Name |
| **quantity** | Integer | Yes | Ordered quantity | Quantity, Qty, Amount, Units, Order Qty |
| **unit_price** | Decimal | Yes | Price per unit | Price, Unit Price, Cost, Rate |
| **line_total** | Decimal | Yes | Line total | Total, Amount, Line Amount, Extended Price |
| **unit** | String | Yes | Unit of measure | Unit, UOM, Measure |
| **received_qty** | Integer | No | Quantity received | Received, Delivered Qty, GRN Qty |
| **status** | Enum | No | Line status | Status, State |
| **delivery_date** | Date | No | Line delivery date | Delivery, Expected Date |

---

### Table 3: PURCHASE_METRICS (Aggregated)

Pre-calculated purchase metrics.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **period** | String | Yes | Time period | Period, Month, Year-Month |
| **supplier_id** | String | No | Supplier (null for total) | Supplier, Vendor |
| **category** | String | No | Category (null for total) | Category, Commodity |
| **department** | String | No | Department (null for total) | Department, Cost Center |
| **total_spend** | Decimal | Yes | Total spend | Spend, Amount, Value, Expenditure |
| **order_count** | Integer | Yes | Number of POs | Orders, PO Count, Transactions |
| **line_count** | Integer | No | Number of line items | Lines, Items, Line Count |
| **avg_order_value** | Decimal | No | Average PO value | AOV, Average, Mean Order |
| **on_time_delivery** | Decimal | No | OTD percentage | OTD, On-Time, Delivery Performance |
| **supplier_count** | Integer | No | Active suppliers | Suppliers, Vendors, Active Vendors |
| **lead_time_avg** | Integer | No | Average lead time | Lead Time, Days, Cycle Time |
| **cost_savings** | Decimal | No | Savings achieved | Savings, Cost Reduction, Avoidance |
| **mom_change** | Decimal | No | Month-over-month | MoM, Monthly Change |
| **yoy_change** | Decimal | No | Year-over-year | YoY, Annual Change |

---

### Table 4: PURCHASE_REQUISITIONS

Internal purchase requests.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **req_id** | String | Yes | Unique requisition ID | Requisition ID, PR Number, Request ID, Req Number |
| **req_date** | Date | Yes | Request date | Date, Request Date, Created Date |
| **requester_id** | String | Yes | Requester ID | Requester, Requestor, User ID, Employee |
| **requester_name** | String | No | Requester name | Name, Requester Name |
| **department** | String | Yes | Department | Department, Cost Center, Business Unit |
| **description** | String | Yes | Request description | Description, Details, Purpose, Justification |
| **estimated_value** | Decimal | No | Estimated cost | Value, Estimate, Budget, Amount |
| **urgency** | Enum | No | Request urgency | Urgency, Priority, Importance |
| **status** | Enum | Yes | Requisition status | Status, State |
| **po_id** | String | No | Linked PO (if converted) | PO, Order, Purchase Order |
| **approved_by** | String | No | Approver | Approver, Manager, Authorized By |
| **approval_date** | Date | No | Approval date | Approved Date |
| **rejection_reason** | String | No | If rejected, reason | Reason, Rejection, Comments |

**Requisition Status Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| draft | Draft, New, Incomplete |
| submitted | Submitted, Pending, Awaiting |
| approved | Approved, Authorized, Accepted |
| rejected | Rejected, Declined, Denied |
| converted | Converted, PO Created, Ordered |
| cancelled | Cancelled, Withdrawn, Voided |

---

### Table 5: PURCHASE_RECEIPTS

Goods receipt records.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **receipt_id** | String | Yes | Unique receipt ID | Receipt ID, GRN Number, Receiving ID, Inbound ID |
| **receipt_date** | Date | Yes | Receipt date | Date, Received Date, GRN Date, Arrival Date |
| **po_id** | String | Yes | Related PO | PO Number, Order ID, Purchase Order |
| **supplier_id** | String | Yes | Supplier | Supplier, Vendor |
| **warehouse_id** | String | Yes | Receiving warehouse | Warehouse, Location, Site, Facility |
| **total_quantity** | Integer | Yes | Total units received | Quantity, Units, Received Qty |
| **total_value** | Decimal | Yes | Receipt value | Value, Amount, Total |
| **status** | Enum | Yes | Receipt status | Status, State |
| **received_by** | String | No | Receiver | Receiver, Operator, Handler |
| **quality_status** | Enum | No | QC result | Quality, QC, Inspection Result |
| **variance** | Decimal | No | Qty variance | Variance, Difference, Discrepancy |
| **carrier** | String | No | Shipping carrier | Carrier, Freight, Shipper |
| **tracking** | String | No | Tracking number | Tracking, AWB, BOL, Waybill |

---

### Table 6: SPEND_ANALYSIS

Detailed spend breakdown.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **spend_id** | String | Yes | Unique ID | ID, Record ID |
| **period** | String | Yes | Period (YYYY-MM) | Period, Month |
| **supplier_id** | String | Yes | Supplier | Supplier, Vendor |
| **category** | String | Yes | Spend category | Category, Commodity, Type |
| **subcategory** | String | No | Subcategory | Subcategory, Sub-type |
| **department** | String | No | Department | Department, Cost Center |
| **spend_amount** | Decimal | Yes | Amount spent | Spend, Amount, Value |
| **budget_amount** | Decimal | No | Budgeted amount | Budget, Planned, Allocated |
| **variance** | Decimal | No | Budget variance | Variance, Difference, Over/Under |
| **contract_id** | String | No | Contract reference | Contract, Agreement, Framework |
| **savings** | Decimal | No | Savings achieved | Savings, Reduction, Avoidance |

---

## Dashboard Details

### Dashboard 1: Purchase Overview

**Purpose:** High-level view of all procurement activity and spend.

**KPI Cards (Top Row):**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Spend (YTD) | SUM(total_amount) YTD | Controlled |
| Total Orders | COUNT(po_id) | N/A |
| Active Suppliers | COUNT(DISTINCT supplier_id) | Optimized |
| Avg Order Value | SUM(total_amount) / COUNT(po_id) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Spend by Supplier | PURCHASE_ORDERS | supplier_name | SUM(total_amount) |
| Bar Chart - Spend by Category | PURCHASE_ORDERS | category | SUM(total_amount) |
| Pie Chart - Order Status | PURCHASE_ORDERS | status | COUNT |
| Line Chart - Monthly Spend | PURCHASE_METRICS | period | total_spend |

**Required Table Columns:**
- PURCHASE_ORDERS: po_id, supplier_id, supplier_name, total_amount, category, status, po_date

---

### Dashboard 2: Supplier Performance

**Purpose:** Track and compare supplier performance metrics.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| On-Time Delivery | AVG(on_time_delivery) | Up (>95%) |
| Avg Lead Time | AVG(lead_time_avg) | Down |
| Top Supplier Spend | MAX(SUM by supplier) | N/A |
| Quality Rate | Pass inspections / Total | Up (>99%) |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - OTD by Supplier | PURCHASE_METRICS | supplier_name | on_time_delivery |
| Bar Chart - Spend by Supplier | SPEND_ANALYSIS | supplier_id | spend_amount |
| Scatter Plot - Spend vs OTD | PURCHASE_METRICS | total_spend | on_time_delivery |
| Line Chart - Lead Time Trend | PURCHASE_METRICS | period | lead_time_avg |

**Required Table Columns:**
- PURCHASE_METRICS: supplier_id, on_time_delivery, lead_time_avg, total_spend
- PURCHASE_RECEIPTS: quality_status

---

### Dashboard 3: Purchase Behavior

**Purpose:** Analyze purchasing patterns and trends.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Orders This Month | COUNT(po_id) this month | N/A |
| MoM Change | (This - Last) / Last * 100 | Stable |
| Avg Items per Order | AVG(line_count) | N/A |
| Repeat Purchase Rate | Repeat orders / Total | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Orders by Day of Week | PURCHASE_ORDERS | day_of_week | COUNT |
| Line Chart - Monthly Order Trend | PURCHASE_ORDERS | month | COUNT |
| Pie Chart - Category Distribution | PURCHASE_ORDERS | category | SUM(total_amount) |
| Bar Chart - By Department | PURCHASE_ORDERS | department | SUM(total_amount) |

**Required Table Columns:**
- PURCHASE_ORDERS: po_id, po_date, category, department, total_amount
- PURCHASE_ORDER_LINES: line_id, po_id

---

### Dashboard 4: Cost Control

**Purpose:** Monitor and optimize procurement costs.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Budget Variance | SUM(actual - budget) | Near Zero |
| Cost Savings | SUM(savings) | Up |
| Spend vs Budget | Actual / Budget * 100 | <100% |
| Price Variance | Actual vs Expected price | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Budget vs Actual | SPEND_ANALYSIS | category | budget, actual |
| Line Chart - Spend Trend | PURCHASE_METRICS | period | total_spend |
| Bar Chart - Savings by Category | SPEND_ANALYSIS | category | savings |
| Pie Chart - Spend Distribution | SPEND_ANALYSIS | category | spend_amount |

**Required Table Columns:**
- SPEND_ANALYSIS: category, spend_amount, budget_amount, variance, savings
- PURCHASE_METRICS: period, total_spend

---

### Dashboard 5: Purchase Funnel

**Purpose:** Track the procurement pipeline from requisition to delivery.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Pending Requisitions | COUNT(status = 'submitted') | Action |
| Pending Approval | COUNT(status = 'pending_approval') | Down |
| In Transit | COUNT(status = 'in_transit') | N/A |
| Cycle Time | AVG(delivered_date - req_date) | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Funnel Chart - Order Pipeline | PURCHASE_ORDERS | status | COUNT |
| Bar Chart - Stage Duration | PURCHASE_ORDERS | stage | AVG(days) |
| Pie Chart - Status Distribution | PURCHASE_ORDERS | status | COUNT |
| Bar Chart - Pending by Approver | PURCHASE_ORDERS | approver | COUNT(pending) |

**Required Table Columns:**
- PURCHASE_REQUISITIONS: req_id, status, req_date, approval_date
- PURCHASE_ORDERS: po_id, status, po_date, actual_delivery

---

### Dashboard 6: Dependency Risk

**Purpose:** Analyze supply concentration and risk.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Top Supplier Share | MAX(supplier spend) / Total | Down (<30%) |
| Single Source Items | Items with 1 supplier | Down |
| Supplier Count | COUNT(DISTINCT suppliers) | Up (diversity) |
| Geographic Concentration | Spend by country | Diversified |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Scatter Plot - Spend vs Orders | PURCHASE_METRICS | order_count | total_spend |
| Pie Chart - Supplier Concentration | SPEND_ANALYSIS | supplier_id | spend_amount |
| Bar Chart - Top 10 Suppliers | SPEND_ANALYSIS | supplier_id | spend_amount |
| Pie Chart - Category Concentration | SPEND_ANALYSIS | category | spend_amount |

**Required Table Columns:**
- SPEND_ANALYSIS: supplier_id, category, spend_amount
- PURCHASE_METRICS: supplier_id, total_spend, order_count

---

### Dashboard 7: Forecast Planning

**Purpose:** Plan future procurement based on demand.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Projected Spend | Next period forecast | On Target |
| Pending Orders Value | SUM(pending orders) | N/A |
| Contracts Expiring | Contracts ending soon | Action |
| Forecast Accuracy | Actual vs Forecast | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Line Chart - Spend Forecast | PURCHASE_METRICS | period | actual, forecast |
| Bar Chart - Category Forecast | SPEND_ANALYSIS | category | forecast |
| Line Chart - Historical vs Projected | PURCHASE_METRICS | period | trend |
| Bar Chart - Upcoming Renewals | SPEND_ANALYSIS | contract | value |

**Required Table Columns:**
- PURCHASE_METRICS: period, total_spend, forecast
- SPEND_ANALYSIS: contract_id, spend_amount

---

## KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Total Spend | Procurement Expenditure | SUM(all PO values) | Currency |
| OTD | On-Time Delivery | On-time deliveries / Total | Percentage |
| Lead Time | Order-to-Delivery | Delivery date - Order date | Days |
| AOV | Average Order Value | Total spend / Order count | Currency |
| Cycle Time | Req-to-Delivery | Delivered - Requisition date | Days |
| Savings | Cost Reduction | Budget - Actual (if positive) | Currency |
| Fill Rate | Order Fulfillment | Orders fulfilled / Orders placed | Percentage |
| Concentration | Supplier Dependency | Top supplier / Total spend | Percentage |

---

## Chart Types

| Chart | When to Use | Example in Dashboard |
|-------|-------------|---------------------|
| Bar Chart | Comparing suppliers/categories | Spend by Supplier |
| Line Chart | Trends over time | Monthly Spend Trend |
| Pie Chart | Distribution | Status Distribution |
| Funnel Chart | Pipeline stages | Order Pipeline |
| Scatter Plot | Correlation | Spend vs Orders |

---

[Back to Main Wiki](../README_EN.md) | [Previous: Inventory](../04_Inventory/README_EN.md) | [Next: Sales](../06_Sales/README_EN.md)
