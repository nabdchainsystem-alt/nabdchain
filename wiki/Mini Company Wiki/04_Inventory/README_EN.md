# Inventory Department - Complete Dashboard Wiki

> **Department Focus:** Stock & Warehouse Management
> **Total Dashboards:** 8
> **Total KPIs:** 32+

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

The Inventory Department provides comprehensive analytics for managing stock levels, warehouse operations, inventory aging, and replenishment planning. It enables optimal stock control and minimizes carrying costs while ensuring product availability.

### Business Questions Answered

- What is our current stock value?
- Which items need reordering?
- What is our dead stock value?
- How accurate is our inventory?
- Which warehouses are performing best?

---

## Dashboard Index

| # | Dashboard Name | Purpose | Key Charts |
|---|----------------|---------|------------|
| 1 | Inventory Insights | Quick overview | KPI Cards, Sparklines |
| 2 | Inventory Overview | Stock levels & distribution | Bar, Pie |
| 3 | Stock Movement | In/Out flow analysis | Bar, Line |
| 4 | Inventory Aging | Dead stock & aging | Bar, Pie |
| 5 | Stock Accuracy | Shrinkage & accuracy | Bar, Gauge |
| 6 | Reorder Planning | Reorder points & planning | Bar, Scatter |
| 7 | Warehouse Performance | Efficiency metrics | Bar, Radar |
| 8 | Inventory Forecast | Demand prediction | Line, Bar |

---

## Master Data Tables

### Table 1: INVENTORY_ITEMS (Primary)

The main inventory master table.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **item_id** | String | Yes | Unique item identifier | Item ID, SKU, Stock Code, Part Number, Product ID, Article Number, Material Number, Catalog Number, Item Code |
| **item_name** | String | Yes | Item name/description | Name, Description, Item Name, Product Name, Title, Part Name, Material Description |
| **category** | String | Yes | Item category | Category, Product Category, Type, Classification, Group, Family, Class |
| **subcategory** | String | No | Item subcategory | Subcategory, Sub-type, Sub-class, Secondary Category |
| **unit** | String | Yes | Unit of measure | Unit, UOM, Unit of Measure, Measure, Quantity Unit, Stock Unit |
| **cost_price** | Decimal | Yes | Cost per unit | Cost, Unit Cost, Purchase Price, Standard Cost, Landed Cost, Avg Cost |
| **selling_price** | Decimal | No | Selling price per unit | Price, Sell Price, List Price, Sale Price, Retail Price |
| **quantity_on_hand** | Integer | Yes | Current stock quantity | Quantity, QOH, Stock, On Hand, Available, Current Stock, Balance |
| **reorder_point** | Integer | Yes | Minimum stock level | Reorder Point, ROP, Min Stock, Minimum, Safety Stock, Trigger Point |
| **reorder_quantity** | Integer | Yes | Order quantity | Reorder Qty, Order Quantity, EOQ, Lot Size, Order Size |
| **max_stock** | Integer | No | Maximum stock level | Max Stock, Maximum, Upper Limit, Cap |
| **lead_time_days** | Integer | Yes | Supplier lead time | Lead Time, Delivery Days, Replenishment Time, Order-to-Delivery |
| **warehouse_id** | String | Yes | Primary warehouse | Warehouse, Location, Store, Site, Facility, Storage Location |
| **bin_location** | String | No | Bin/shelf location | Bin, Location, Shelf, Slot, Position, Rack, Bay |
| **status** | Enum | Yes | Item status | Status, State, Availability, Stock Status |
| **supplier_id** | String | No | Primary supplier | Supplier, Vendor, Source, Provider |
| **barcode** | String | No | Barcode/UPC | Barcode, UPC, EAN, GTIN, Product Code, Scan Code |
| **weight** | Decimal | No | Item weight | Weight, Mass, Net Weight, Gross Weight |
| **dimensions** | String | No | L x W x H | Dimensions, Size, Measurements, LxWxH |
| **last_received_date** | Date | No | Last receipt date | Last Received, Last Receipt, Last Stock In |
| **last_sold_date** | Date | No | Last sale date | Last Sold, Last Sale, Last Stock Out |

**Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| in_stock | Available inventory | In Stock, Available, On Hand, Stocked |
| low_stock | Below reorder point | Low Stock, Low, Below Minimum, Reorder |
| out_of_stock | Zero inventory | Out of Stock, OOS, Zero, Stockout, Depleted |
| overstock | Above max level | Overstock, Excess, Surplus, Over Maximum |
| discontinued | No longer active | Discontinued, Obsolete, EOL, Inactive |
| on_order | Ordered, awaiting | On Order, Incoming, Expected, In Transit |

**Unit of Measure Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| each | Each, EA, Piece, Pc, Unit, Item |
| box | Box, Bx, Case, Carton, Pack |
| kg | Kilogram, KG, Kilo |
| lb | Pound, LB, Lbs |
| liter | Liter, L, Litre |
| meter | Meter, M, Metre |
| pallet | Pallet, PLT, Skid |
| roll | Roll, RL |
| set | Set, Kit, Bundle |

---

### Table 2: INVENTORY_MOVEMENTS

Stock movement transactions.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **movement_id** | String | Yes | Unique movement ID | Movement ID, Transaction ID, Stock Transaction, Entry ID |
| **item_id** | String | Yes | Reference to item | Item ID, SKU, Product ID |
| **movement_date** | DateTime | Yes | Transaction timestamp | Date, Transaction Date, Movement Date, Posting Date |
| **movement_type** | Enum | Yes | Type of movement | Type, Transaction Type, Movement Type, Activity |
| **quantity** | Integer | Yes | Quantity moved | Quantity, Qty, Amount, Units, Count |
| **direction** | Enum | Yes | In or Out | Direction, Flow, Type, In/Out |
| **reference** | String | No | Reference document | Reference, Document, Order ID, PO Number, SO Number |
| **warehouse_from** | String | No | Source warehouse | From, Source, Origin, From Location |
| **warehouse_to** | String | No | Destination warehouse | To, Destination, Target, To Location |
| **cost** | Decimal | No | Transaction cost | Cost, Value, Amount, Unit Cost |
| **reason** | String | No | Movement reason | Reason, Cause, Purpose, Notes |
| **user_id** | String | No | Who processed | User, Operator, Handler, Processed By |

**Movement Type Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| receipt | Stock received | Receipt, Receiving, GRN, Goods In, Purchase, Inbound |
| issue | Stock issued/sold | Issue, Shipment, Sale, Dispatch, Goods Out, Outbound |
| transfer | Warehouse transfer | Transfer, Move, Relocate, Inter-warehouse |
| adjustment | Inventory adjustment | Adjustment, Correction, Write-off, Variance |
| return | Customer return | Return, RMA, Refund, Credit |
| scrap | Scrapped/damaged | Scrap, Damage, Waste, Disposal, Write-down |

---

### Table 3: INVENTORY_METRICS (Aggregated)

Pre-calculated inventory metrics.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **period** | String | Yes | Time period | Period, Month, Year-Month |
| **warehouse_id** | String | No | Warehouse (null for total) | Warehouse, Location |
| **category** | String | No | Category (null for total) | Category, Product Group |
| **total_stock_value** | Decimal | Yes | Total inventory value | Stock Value, Inventory Value, Value, Asset Value |
| **total_sku_count** | Integer | Yes | Number of SKUs | SKU Count, Item Count, Products |
| **in_stock_rate** | Decimal | Yes | % items in stock | In Stock Rate, Availability, Fill Rate |
| **out_of_stock_count** | Integer | Yes | OOS item count | OOS Count, Stockouts, Zero Stock |
| **low_stock_count** | Integer | Yes | Low stock items | Low Stock, Below ROP, Alerts |
| **overstock_count** | Integer | No | Overstock items | Overstock, Excess, Surplus |
| **turnover_rate** | Decimal | Yes | Inventory turnover | Turnover, Turn Rate, Stock Turn, ITO |
| **days_on_hand** | Decimal | Yes | Average days in stock | DOH, Days Inventory, Inventory Days, DIO |
| **dead_stock_value** | Decimal | No | No-movement stock value | Dead Stock, Obsolete, Non-Moving |
| **shrinkage_rate** | Decimal | No | Inventory shrinkage % | Shrinkage, Loss, Variance Rate |
| **accuracy_rate** | Decimal | No | Inventory accuracy % | Accuracy, IRA, Inventory Accuracy |

---

### Table 4: INVENTORY_AGING

Stock aging analysis.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **item_id** | String | Yes | Reference to item | Item ID, SKU |
| **warehouse_id** | String | Yes | Warehouse location | Warehouse, Location |
| **quantity** | Integer | Yes | Current quantity | Quantity, Stock, On Hand |
| **age_days** | Integer | Yes | Days since receipt | Age, Days, Days Held, Stock Age |
| **age_bucket** | Enum | Yes | Age category | Bucket, Range, Category, Band |
| **value** | Decimal | Yes | Stock value | Value, Amount, Worth |
| **last_movement_date** | Date | Yes | Last activity date | Last Movement, Last Activity, Last Transaction |
| **last_sale_date** | Date | No | Last sale date | Last Sold, Last Sale |
| **risk_level** | Enum | No | Obsolescence risk | Risk, Risk Level, Priority |

**Age Bucket Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| 0-30 | Fresh stock (0-30 days) | Fresh, New, Current, 0-30 |
| 31-60 | Recent (31-60 days) | Recent, 31-60, 1-2 months |
| 61-90 | Aging (61-90 days) | Aging, 61-90, 2-3 months |
| 91-180 | Old (91-180 days) | Old, 91-180, 3-6 months |
| 181-365 | Very old (181-365 days) | Very Old, 181-365, 6-12 months |
| 365+ | Dead stock (>365 days) | Dead, Obsolete, 365+, Over 1 year |

---

### Table 5: WAREHOUSES

Warehouse master data.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **warehouse_id** | String | Yes | Unique warehouse ID | Warehouse ID, Location ID, Site ID, Facility ID |
| **warehouse_name** | String | Yes | Warehouse name | Name, Location Name, Site Name, Facility Name |
| **warehouse_type** | Enum | Yes | Type of warehouse | Type, Category, Facility Type |
| **address** | String | No | Physical address | Address, Location, Street |
| **city** | String | No | City | City, Town |
| **country** | String | No | Country | Country, Region, Nation |
| **capacity_units** | Integer | No | Storage capacity | Capacity, Max Units, Size |
| **current_utilization** | Decimal | No | Current usage % | Utilization, Usage, Fill Rate |
| **manager** | String | No | Warehouse manager | Manager, Supervisor, Contact |
| **status** | Enum | Yes | Operational status | Status, State, Active |
| **cost_per_unit** | Decimal | No | Storage cost per unit | Cost, Rate, Storage Cost |

**Warehouse Type Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| main | Main, Primary, Central, HQ, Headquarters |
| regional | Regional, Distribution, DC, Distribution Center |
| retail | Retail, Store, Shop, Outlet |
| cold_storage | Cold Storage, Refrigerated, Frozen, Cold Chain |
| bonded | Bonded, Customs, Free Zone, FTZ |
| 3pl | 3PL, Third Party, Outsourced, Logistics Partner |

---

### Table 6: STOCK_COUNTS

Physical inventory count records.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **count_id** | String | Yes | Unique count ID | Count ID, Audit ID, Cycle Count ID |
| **count_date** | Date | Yes | Count date | Date, Count Date, Audit Date |
| **warehouse_id** | String | Yes | Warehouse counted | Warehouse, Location |
| **item_id** | String | Yes | Item counted | Item ID, SKU |
| **system_quantity** | Integer | Yes | System quantity | System, Expected, Book Quantity |
| **physical_quantity** | Integer | Yes | Physical count | Physical, Actual, Counted, Real |
| **variance** | Integer | Yes | Quantity difference | Variance, Difference, Discrepancy |
| **variance_value** | Decimal | Yes | Value difference | Value Variance, Amount |
| **reason** | String | No | Variance reason | Reason, Cause, Explanation |
| **counted_by** | String | No | Who counted | Counter, Auditor, Operator |
| **verified_by** | String | No | Who verified | Verifier, Supervisor, Checker |
| **adjustment_made** | Boolean | No | Was adjustment posted | Adjusted, Posted, Corrected |

---

## Dashboard Details

### Dashboard 1: Inventory Insights

**Purpose:** Quick overview with key metrics and sparklines.

**KPI Cards (8 cards with sparklines):**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Stock Value | SUM(quantity * cost_price) | Optimized |
| Total SKUs | COUNT(DISTINCT item_id) | N/A |
| In-Stock Rate | In stock / Total items * 100 | Up (>95%) |
| Low Stock Alerts | COUNT(status = 'low_stock') | Down |
| Out of Stock | COUNT(status = 'out_of_stock') | Down |
| Turnover Rate | COGS / Avg Inventory | Up |
| Days on Hand | Avg Inventory / Daily Usage | Optimized |
| Accuracy Rate | Correct counts / Total counts | Up (>99%) |

---

### Dashboard 2: Inventory Overview

**Purpose:** Comprehensive view of stock levels and distribution.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Stock Value | SUM(quantity * cost_price) | Optimized |
| Total Units | SUM(quantity_on_hand) | N/A |
| SKU Count | COUNT(DISTINCT item_id) | N/A |
| Avg Value per SKU | Total Value / SKU Count | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Stock by Category | INVENTORY_ITEMS | category | SUM(value) |
| Bar Chart - Stock by Warehouse | INVENTORY_ITEMS | warehouse_id | SUM(value) |
| Pie Chart - Status Distribution | INVENTORY_ITEMS | status | COUNT |
| Pie Chart - Category Distribution | INVENTORY_ITEMS | category | SUM(value) |

**Required Table Columns:**
- INVENTORY_ITEMS: item_id, category, warehouse_id, quantity_on_hand, cost_price, status

---

### Dashboard 3: Stock Movement

**Purpose:** Analyze stock flow in and out.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Stock In (Month) | SUM(quantity WHERE direction = 'in') | N/A |
| Stock Out (Month) | SUM(quantity WHERE direction = 'out') | N/A |
| Net Change | In - Out | Balanced |
| Movement Count | COUNT(movements) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - In vs Out by Month | INVENTORY_MOVEMENTS | period | in, out |
| Line Chart - Movement Trend | INVENTORY_MOVEMENTS | date | quantity |
| Pie Chart - Movement Types | INVENTORY_MOVEMENTS | movement_type | COUNT |
| Bar Chart - By Category | INVENTORY_MOVEMENTS | category | quantity |

**Required Table Columns:**
- INVENTORY_MOVEMENTS: movement_id, item_id, movement_date, movement_type, quantity, direction

---

### Dashboard 4: Inventory Aging

**Purpose:** Identify aging and dead stock.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Dead Stock Value | SUM(value WHERE age > 365) | Down |
| Aging Stock (>90 days) | SUM(value WHERE age > 90) | Down |
| Avg Age (days) | AVG(age_days) | Down |
| At-Risk Items | COUNT(risk_level = 'high') | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Value by Age Bucket | INVENTORY_AGING | age_bucket | SUM(value) |
| Pie Chart - Age Distribution | INVENTORY_AGING | age_bucket | SUM(value) |
| Bar Chart - Dead Stock by Category | INVENTORY_AGING | category | SUM(value WHERE age > 365) |
| Scatter Plot - Age vs Value | INVENTORY_AGING | age_days | value |

**Required Table Columns:**
- INVENTORY_AGING: item_id, warehouse_id, quantity, age_days, age_bucket, value

---

### Dashboard 5: Stock Accuracy

**Purpose:** Track inventory accuracy and shrinkage.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Accuracy Rate | Accurate counts / Total counts | Up (>99%) |
| Shrinkage Rate | (Expected - Actual) / Expected | Down (<1%) |
| Variance Value | SUM(variance_value) | Down |
| Counts Performed | COUNT(stock_counts) | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Accuracy by Warehouse | STOCK_COUNTS | warehouse_id | accuracy_rate |
| Bar Chart - Variance by Category | STOCK_COUNTS | category | SUM(variance_value) |
| Gauge Chart - Overall Accuracy | INVENTORY_METRICS | - | accuracy_rate |
| Line Chart - Accuracy Trend | INVENTORY_METRICS | period | accuracy_rate |

**Required Table Columns:**
- STOCK_COUNTS: count_id, warehouse_id, item_id, system_quantity, physical_quantity, variance
- INVENTORY_METRICS: accuracy_rate, shrinkage_rate

---

### Dashboard 6: Reorder Planning

**Purpose:** Optimize reorder points and planning.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Items Below ROP | COUNT(quantity < reorder_point) | Action |
| Pending Orders | COUNT(status = 'on_order') | N/A |
| Stockout Risk | Items at risk of OOS | Down |
| Overstock Items | COUNT(quantity > max_stock) | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Reorder Needed | INVENTORY_ITEMS | item_name | quantity vs ROP |
| Scatter Plot - Stock vs ROP | INVENTORY_ITEMS | reorder_point | quantity_on_hand |
| Bar Chart - By Lead Time | INVENTORY_ITEMS | lead_time_days | COUNT |
| Pie Chart - Stock Status | INVENTORY_ITEMS | status | COUNT |

**Required Table Columns:**
- INVENTORY_ITEMS: item_id, quantity_on_hand, reorder_point, reorder_quantity, lead_time_days, status

---

### Dashboard 7: Warehouse Performance

**Purpose:** Compare warehouse efficiency and utilization.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Warehouses | COUNT(warehouses) | N/A |
| Avg Utilization | AVG(current_utilization) | Optimized |
| Best Performer | MAX(performance_score) | N/A |
| Total Capacity | SUM(capacity_units) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Utilization by Warehouse | WAREHOUSES | warehouse_name | utilization |
| Bar Chart - Stock Value by Warehouse | INVENTORY_ITEMS | warehouse_id | SUM(value) |
| Radar Chart - Performance Metrics | WAREHOUSES | metric | score |
| Pie Chart - Type Distribution | WAREHOUSES | warehouse_type | COUNT |

**Required Table Columns:**
- WAREHOUSES: warehouse_id, warehouse_name, capacity_units, current_utilization
- INVENTORY_ITEMS: warehouse_id, quantity_on_hand, cost_price

---

### Dashboard 8: Inventory Forecast

**Purpose:** Demand prediction and stock planning.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Forecasted Demand | Predicted next period | N/A |
| Stock Coverage | Current / Avg Daily Usage | Optimized |
| Forecast Accuracy | Actual vs Predicted | Up |
| Projected Stockouts | Items expected to run out | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Line Chart - Demand Forecast | INVENTORY_METRICS | period | actual, forecast |
| Bar Chart - Coverage by Category | INVENTORY_ITEMS | category | days_coverage |
| Line Chart - Historical vs Predicted | INVENTORY_MOVEMENTS | period | quantity |
| Bar Chart - Top Movers | INVENTORY_MOVEMENTS | item_id | quantity |

**Required Table Columns:**
- INVENTORY_METRICS: period, forecast
- INVENTORY_MOVEMENTS: item_id, quantity, movement_date

---

## KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Stock Value | Inventory Value | SUM(Quantity × Cost) | Currency |
| Turnover Rate | Inventory Turnover | COGS / Avg Inventory | Ratio |
| DOH | Days on Hand | Avg Inventory / Daily Usage | Days |
| In-Stock Rate | Availability Rate | In Stock Items / Total Items | Percentage |
| Shrinkage | Inventory Loss | (Expected - Actual) / Expected | Percentage |
| IRA | Inventory Record Accuracy | Accurate Counts / Total | Percentage |
| Fill Rate | Order Fill Rate | Orders Filled / Orders Received | Percentage |
| Carrying Cost | Holding Cost | Storage + Insurance + Obsolescence | Currency |

---

## Chart Types

| Chart | When to Use | Example in Dashboard |
|-------|-------------|---------------------|
| Bar Chart | Category comparison | Stock by Category |
| Line Chart | Trends over time | Movement Trend |
| Pie Chart | Distribution | Status Distribution |
| Scatter Plot | Correlation | Stock vs ROP |
| Gauge Chart | Single metric | Overall Accuracy |
| Radar Chart | Multi-metric | Warehouse Performance |

---

[Back to Main Wiki](../README_EN.md) | [Previous: Finance](../03_Finance/README_EN.md) | [Next: Purchases](../05_Purchases/README_EN.md)
