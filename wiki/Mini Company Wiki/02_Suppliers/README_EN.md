# Suppliers Department - Complete Dashboard Wiki

> **Department Focus:** Sourcing & Procurement Management
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

The Suppliers Department provides comprehensive analytics for managing vendor relationships, monitoring performance, assessing risks, and optimizing procurement costs. It enables data-driven supplier selection and strategic partnership management.

### Business Questions Answered

- Which suppliers deliver on time?
- What is our spend distribution by supplier?
- Which suppliers have quality issues?
- What are our supply chain risks?
- Which suppliers should be strategic partners?

---

## Dashboard Index

| # | Dashboard Name | Purpose | Key Charts |
|---|----------------|---------|------------|
| 1 | Supplier Overview | Supplier base & spend metrics | Bar, Pie |
| 2 | Supplier Delivery | On-time delivery analysis | Bar, Scatter |
| 3 | Supplier Cost | Cost variance & optimization | Bar, Line |
| 4 | Quality & Compliance | Defect rates & audit scores | Bar, Radar |
| 5 | Lead Time & Responsiveness | Order responsiveness metrics | Bar, Line |
| 6 | Risk & Dependency | Supply chain risk assessment | Scatter, Bubble |
| 7 | Strategic Value & Growth | Partnership & innovation | Bar, Radar |

---

## Master Data Tables

### Table 1: SUPPLIERS (Primary)

The main supplier master table.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **supplier_id** | String | Yes | Unique supplier identifier | Supplier ID, Vendor ID, Vendor Number, Supplier Code, Party ID, Account Number, Creditor ID, Merchant ID, Seller ID |
| **supplier_name** | String | Yes | Supplier company name | Name, Vendor Name, Company Name, Business Name, Legal Name, Trading Name, Entity Name |
| **contact_name** | String | No | Primary contact person | Contact, Contact Person, Representative, Account Manager, Sales Rep, Key Contact |
| **email** | String | Yes | Primary email | Email, E-mail, Contact Email, Business Email |
| **phone** | String | No | Phone number | Phone, Telephone, Tel, Contact Number, Mobile, Business Phone |
| **category** | String | Yes | Supplier category | Category, Type, Classification, Supplier Type, Business Category, Commodity, Product Group |
| **status** | Enum | Yes | Supplier status | Status, State, Standing, Relationship Status, Vendor Status |
| **tier** | Enum | Yes | Partnership tier | Tier, Level, Partner Level, Strategic Level, Classification, Rank |
| **country** | String | No | Supplier country | Country, Location, Region, Nation, Territory, Origin |
| **city** | String | No | Supplier city | City, Location, Town, Address City |
| **address** | String | No | Full address | Address, Street Address, Location, Business Address, Physical Address |
| **tax_id** | String | No | Tax identification | Tax ID, VAT Number, GST Number, Tax Number, Registration Number, EIN, TIN |
| **payment_terms** | String | No | Payment terms | Payment Terms, Terms, Credit Terms, Net Days, Payment Conditions |
| **currency** | String | No | Default currency | Currency, Currency Code, Trading Currency, Invoice Currency |
| **onboarding_date** | Date | Yes | Date added as supplier | Start Date, Registration Date, Onboarding Date, Qualification Date, First Order Date |
| **last_order_date** | Date | No | Date of last order | Last Order, Last Purchase, Last Transaction, Recent Order Date |

**Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| active | Currently active supplier | Active, Approved, Live, Current, Enabled, Qualified |
| probation | Under review/probation | Probation, Review, Trial, Evaluation, Conditional |
| inactive | Temporarily inactive | Inactive, Suspended, Paused, On Hold, Dormant |
| blocked | Blocked/blacklisted | Blocked, Blacklisted, Disqualified, Terminated, Banned |
| new | Newly onboarded | New, Pending, Onboarding, Prospective |

**Tier Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| strategic | Top strategic partners | Strategic, Platinum, Tier 1, Key, Critical, Premium |
| preferred | Preferred suppliers | Preferred, Gold, Tier 2, Approved, Selected |
| standard | Standard suppliers | Standard, Silver, Tier 3, Regular, General |
| transactional | One-off suppliers | Transactional, Bronze, Tier 4, Spot, Casual |

---

### Table 2: SUPPLIER_ORDERS

Purchase orders to suppliers.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **order_id** | String | Yes | Unique order ID | Order ID, PO Number, Purchase Order, Order Number, PO ID, Requisition Number |
| **supplier_id** | String | Yes | Reference to supplier | Supplier ID, Vendor ID, Vendor Number |
| **order_date** | Date | Yes | Order placement date | Order Date, PO Date, Purchase Date, Issue Date, Created Date |
| **expected_delivery** | Date | Yes | Expected delivery date | Expected Date, Due Date, Promised Date, Target Date, ETA, Required Date |
| **actual_delivery** | Date | No | Actual delivery date | Delivery Date, Received Date, Actual Date, Arrival Date, GRN Date |
| **order_value** | Decimal | Yes | Total order value | Value, Amount, Order Amount, PO Value, Total, Cost |
| **currency** | String | Yes | Currency code | Currency, Currency Code |
| **line_count** | Integer | No | Number of line items | Lines, Items, Line Count, Item Count, SKU Count |
| **status** | Enum | Yes | Order status | Status, State, Order Status, PO Status |
| **category** | String | No | Order category | Category, Type, Procurement Category, Commodity |
| **buyer_id** | String | No | Purchasing agent | Buyer, Purchaser, Agent, Procurement Officer, Creator |
| **priority** | Enum | No | Order priority | Priority, Urgency, Importance |

**Order Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| pending | Awaiting confirmation | Pending, Submitted, Awaiting, Open, New |
| confirmed | Supplier confirmed | Confirmed, Acknowledged, Accepted, Approved |
| in_transit | Shipped/in transit | In Transit, Shipped, Dispatched, En Route, On Way |
| delivered | Received complete | Delivered, Received, Complete, Closed, GRN |
| partial | Partially delivered | Partial, Incomplete, Part Received |
| cancelled | Order cancelled | Cancelled, Voided, Rejected, Withdrawn |

---

### Table 3: SUPPLIER_METRICS (Aggregated)

Pre-calculated supplier performance metrics.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **supplier_id** | String | Yes | Reference to supplier | Supplier ID, Vendor ID |
| **total_spend_ytd** | Decimal | Yes | Year-to-date spend | YTD Spend, Annual Spend, Total Spend, Spend Amount, Purchase Value |
| **order_count_ytd** | Integer | Yes | Orders placed YTD | Order Count, PO Count, Number of Orders, Transaction Count |
| **on_time_delivery_rate** | Decimal | Yes | % delivered on time | OTD, On-Time Rate, Delivery Performance, OTIF Rate, Punctuality |
| **average_lead_time** | Integer | Yes | Average days to deliver | Lead Time, Delivery Days, Cycle Time, Transit Time, Order-to-Delivery |
| **quality_score** | Decimal | Yes | Quality rating (0-100) | Quality, Quality Rating, Quality Index, QC Score |
| **defect_rate** | Decimal | Yes | % defective items | Defect Rate, Rejection Rate, Failure Rate, Non-Conformance Rate, NCR Rate |
| **compliance_score** | Decimal | Yes | Compliance rating (0-100) | Compliance, Compliance Rating, Audit Score, Certification Score |
| **responsiveness_score** | Decimal | No | Response time rating (0-100) | Responsiveness, Response Rate, Communication Score |
| **overall_rating** | Decimal | Yes | Overall score (0-5) | Rating, Score, Supplier Rating, Vendor Rating, Performance Score |
| **risk_level** | Enum | Yes | Risk classification | Risk, Risk Level, Risk Score, Risk Category |
| **spend_variance** | Decimal | No | Budget vs actual | Variance, Cost Variance, Budget Variance, Over/Under |
| **return_rate** | Decimal | No | % items returned | Returns, Return Rate, RMA Rate, Reject Rate |

**Risk Level Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| low | Low risk supplier | Low, Green, Minimal, Stable |
| medium | Moderate risk | Medium, Yellow, Moderate, Watchlist |
| high | High risk supplier | High, Red, Critical, At Risk |
| critical | Critical risk | Critical, Severe, Extreme, Emergency |

---

### Table 4: SUPPLIER_QUALITY

Quality inspection and compliance records.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **inspection_id** | String | Yes | Unique inspection ID | Inspection ID, QC ID, Audit ID, Check ID, Report ID |
| **supplier_id** | String | Yes | Reference to supplier | Supplier ID, Vendor ID |
| **order_id** | String | No | Related order | Order ID, PO Number, Reference |
| **inspection_date** | Date | Yes | Inspection date | Date, QC Date, Audit Date, Check Date |
| **inspection_type** | Enum | Yes | Type of inspection | Type, Inspection Type, Audit Type, Check Type |
| **total_inspected** | Integer | Yes | Items inspected | Inspected, Sample Size, Checked Quantity, Lot Size |
| **defects_found** | Integer | Yes | Defective items | Defects, Rejected, Failed, Non-Conforming, NCR |
| **defect_rate** | Decimal | Yes | Defect percentage | Defect Rate, Rejection Rate, Failure Rate, PPM |
| **severity** | Enum | No | Defect severity | Severity, Criticality, Impact Level |
| **root_cause** | String | No | Defect root cause | Cause, Root Cause, Reason, Issue, Problem |
| **corrective_action** | String | No | Action taken | Action, CAPA, Corrective Action, Resolution, Fix |
| **inspector_id** | String | No | QC inspector | Inspector, Auditor, QC Agent, Checker |
| **pass_fail** | Boolean | Yes | Pass/fail result | Result, Pass, Status, Outcome |

**Inspection Type Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| receiving | Receiving, Incoming, GRN, Receipt, Delivery |
| in_process | In-Process, WIP, Production, Manufacturing |
| final | Final, Outgoing, Finished, End |
| audit | Audit, Site, Supplier Audit, Assessment |

---

### Table 5: SUPPLIER_DELIVERIES

Delivery performance tracking.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **delivery_id** | String | Yes | Unique delivery ID | Delivery ID, Shipment ID, Receipt ID, GRN Number, ASN Number |
| **order_id** | String | Yes | Related order | Order ID, PO Number, Purchase Order |
| **supplier_id** | String | Yes | Reference to supplier | Supplier ID, Vendor ID |
| **expected_date** | Date | Yes | Expected delivery | Due Date, Promised Date, Expected, ETA, Target Date |
| **actual_date** | Date | Yes | Actual delivery | Delivery Date, Received Date, Arrival Date, Actual |
| **variance_days** | Integer | Yes | Days early/late | Variance, Delay, Days Late, Days Early, Difference |
| **on_time** | Boolean | Yes | Was delivery on time | On Time, OTD, Punctual, Timely |
| **quantity_ordered** | Integer | Yes | Ordered quantity | Ordered, Order Qty, Expected Qty, PO Quantity |
| **quantity_received** | Integer | Yes | Received quantity | Received, Delivered Qty, Actual Qty, Receipt Qty |
| **quantity_variance** | Integer | Yes | Quantity difference | Variance, Difference, Short/Over, Discrepancy |
| **complete** | Boolean | Yes | Full delivery | Complete, Full, OTIF, In Full |
| **carrier** | String | No | Shipping carrier | Carrier, Shipper, Logistics, Transporter, Freight |
| **tracking_number** | String | No | Tracking reference | Tracking, AWB, BOL, Waybill, Reference |

---

### Table 6: SUPPLIER_SPEND

Detailed spend analysis.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **spend_id** | String | Yes | Unique record ID | ID, Record ID, Transaction ID |
| **supplier_id** | String | Yes | Reference to supplier | Supplier ID, Vendor ID |
| **period** | String | Yes | Time period (YYYY-MM) | Period, Month, Year-Month, Fiscal Period |
| **category** | String | Yes | Spend category | Category, Commodity, Classification, Type, Procurement Category |
| **spend_amount** | Decimal | Yes | Amount spent | Spend, Amount, Value, Cost, Expenditure, Purchase Value |
| **budget_amount** | Decimal | No | Budgeted amount | Budget, Planned, Allocated, Estimated |
| **variance** | Decimal | No | Budget variance | Variance, Difference, Over/Under, Deviation |
| **order_count** | Integer | Yes | Number of orders | Orders, PO Count, Transactions |
| **currency** | String | Yes | Currency code | Currency, Currency Code |
| **department** | String | No | Requesting department | Department, Cost Center, Business Unit, Requester |
| **project** | String | No | Project reference | Project, Project Code, Job, Work Order |

---

## Dashboard Details

### Dashboard 1: Supplier Overview

**Purpose:** High-level view of the entire supplier base and spend distribution.

**KPI Cards (Top Row):**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Suppliers | COUNT(suppliers WHERE status = 'active') | Optimal |
| Total Spend (YTD) | SUM(total_spend_ytd) | Controlled |
| Strategic Suppliers | COUNT(tier = 'strategic') | Optimal |
| Avg Supplier Rating | AVG(overall_rating) | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Spend by Supplier (Top 10) | SUPPLIER_METRICS | supplier_name | total_spend_ytd |
| Bar Chart - Supplier by Category | SUPPLIERS | category | COUNT |
| Pie Chart - Tier Distribution | SUPPLIERS | tier | COUNT |
| Pie Chart - Status Distribution | SUPPLIERS | status | COUNT |

**Required Table Columns:**
- SUPPLIERS: supplier_id, supplier_name, category, status, tier
- SUPPLIER_METRICS: supplier_id, total_spend_ytd, overall_rating

---

### Dashboard 2: Supplier Delivery

**Purpose:** Monitor on-time delivery performance across suppliers.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| On-Time Delivery Rate | AVG(on_time_delivery_rate) | Up (>95%) |
| Avg Lead Time (days) | AVG(average_lead_time) | Down |
| Late Deliveries (Month) | COUNT(on_time = false in month) | Down |
| Perfect Order Rate | COUNT(on_time AND complete) / COUNT(orders) | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - OTD by Supplier | SUPPLIER_METRICS | supplier_name | on_time_delivery_rate |
| Bar Chart - Lead Time by Category | SUPPLIER_METRICS | category | AVG(average_lead_time) |
| Scatter Plot - Lead Time vs OTD | SUPPLIER_METRICS | average_lead_time | on_time_delivery_rate |
| Line Chart - OTD Trend | SUPPLIER_DELIVERIES | month | AVG(on_time) |

**Required Table Columns:**
- SUPPLIER_DELIVERIES: delivery_id, supplier_id, expected_date, actual_date, variance_days, on_time, complete
- SUPPLIER_METRICS: supplier_id, on_time_delivery_rate, average_lead_time

---

### Dashboard 3: Supplier Cost

**Purpose:** Analyze cost variances and optimize procurement spending.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Spend (YTD) | SUM(spend_amount) | Controlled |
| Budget Variance | SUM(variance) | Near Zero |
| Cost Savings | Budget - Actual (if positive) | Up |
| Spend per Supplier | AVG(total_spend_ytd) | Optimized |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Budget vs Actual by Category | SUPPLIER_SPEND | category | budget, actual |
| Bar Chart - Spend Trend | SUPPLIER_SPEND | period | spend_amount |
| Line Chart - Cost Trend | SUPPLIER_SPEND | period | spend_amount |
| Pie Chart - Spend Distribution | SUPPLIER_SPEND | category | SUM(spend_amount) |

**Required Table Columns:**
- SUPPLIER_SPEND: spend_id, supplier_id, period, category, spend_amount, budget_amount, variance
- SUPPLIER_METRICS: supplier_id, total_spend_ytd, spend_variance

---

### Dashboard 4: Quality & Compliance

**Purpose:** Track quality scores, defect rates, and compliance status.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Avg Quality Score | AVG(quality_score) | Up (>90) |
| Defect Rate | AVG(defect_rate) | Down (<2%) |
| Compliance Score | AVG(compliance_score) | Up (>95) |
| Inspections Passed | COUNT(pass_fail = true) / COUNT(*) | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Quality by Supplier | SUPPLIER_METRICS | supplier_name | quality_score |
| Bar Chart - Defect Rate by Category | SUPPLIER_QUALITY | category | AVG(defect_rate) |
| Radar Chart - Multi-Metric Quality | SUPPLIER_METRICS | metric | score |
| Pie Chart - Pass/Fail Distribution | SUPPLIER_QUALITY | pass_fail | COUNT |

**Required Table Columns:**
- SUPPLIER_QUALITY: inspection_id, supplier_id, defect_rate, pass_fail, severity
- SUPPLIER_METRICS: supplier_id, quality_score, defect_rate, compliance_score

---

### Dashboard 5: Lead Time & Responsiveness

**Purpose:** Analyze supplier responsiveness and order fulfillment speed.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Avg Lead Time | AVG(average_lead_time) | Down |
| Response Time | AVG(responsiveness_score) | Up |
| Order Cycle Time | AVG(delivery_date - order_date) | Down |
| Quote Response Time | AVG(quote_response_days) | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Lead Time by Supplier | SUPPLIER_METRICS | supplier_name | average_lead_time |
| Line Chart - Lead Time Trend | SUPPLIER_DELIVERIES | month | AVG(variance_days) |
| Bar Chart - Response by Tier | SUPPLIER_METRICS | tier | AVG(responsiveness_score) |
| Scatter Plot - Lead Time vs Rating | SUPPLIER_METRICS | average_lead_time | overall_rating |

**Required Table Columns:**
- SUPPLIER_METRICS: supplier_id, average_lead_time, responsiveness_score
- SUPPLIER_DELIVERIES: supplier_id, expected_date, actual_date, variance_days

---

### Dashboard 6: Risk & Dependency

**Purpose:** Assess supply chain risks and concentration risks.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| High Risk Suppliers | COUNT(risk_level IN ('high', 'critical')) | Down |
| Single Source Items | COUNT(items with 1 supplier) | Down |
| Top Supplier Concentration | MAX(supplier_spend) / SUM(spend) | Down (<30%) |
| Geographic Risk | COUNT(DISTINCT countries) | Up (diversity) |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bubble Chart - Risk Matrix | SUPPLIER_METRICS | risk_level | total_spend_ytd (size = order_count) |
| Bar Chart - Spend Concentration | SUPPLIER_METRICS | supplier_name | % of total spend |
| Pie Chart - Risk Distribution | SUPPLIER_METRICS | risk_level | COUNT |
| Scatter Plot - Spend vs Risk | SUPPLIER_METRICS | risk_level | total_spend_ytd |

**Required Table Columns:**
- SUPPLIERS: supplier_id, country, category
- SUPPLIER_METRICS: supplier_id, risk_level, total_spend_ytd

---

### Dashboard 7: Strategic Value & Growth

**Purpose:** Identify and track strategic partnership opportunities.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Strategic Partners | COUNT(tier = 'strategic') | Optimal |
| Partnership Score | AVG(strategic value metrics) | Up |
| Innovation Index | Innovation project count | Up |
| Spend Growth | YoY spend change | Strategic |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Radar Chart - Strategic Scorecard | SUPPLIER_METRICS | metric | score |
| Bar Chart - Growth by Supplier | SUPPLIER_SPEND | supplier_name | YoY growth |
| Bar Chart - Innovation Projects | SUPPLIERS | supplier_name | project_count |
| Scatter Plot - Value vs Potential | SUPPLIER_METRICS | current_value | potential |

**Required Table Columns:**
- SUPPLIERS: supplier_id, tier, onboarding_date
- SUPPLIER_METRICS: supplier_id, overall_rating, quality_score, on_time_delivery_rate
- SUPPLIER_SPEND: supplier_id, period, spend_amount

---

## KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| OTD | On-Time Delivery | Deliveries on time / Total deliveries | Percentage |
| OTIF | On-Time In-Full | On-time AND complete / Total | Percentage |
| Lead Time | Order-to-Delivery | Delivery date - Order date | Days |
| Defect Rate | Defect Percentage | Defects / Items inspected | Percentage (or PPM) |
| Quality Score | Quality Index | Weighted quality metrics | 0-100 |
| Compliance Score | Compliance Rating | Audit pass rate | 0-100 |
| Spend Variance | Budget Deviation | (Actual - Budget) / Budget | Percentage |
| Risk Index | Risk Score | Weighted risk factors | Low/Medium/High/Critical |

---

## Chart Types

| Chart | When to Use | Example in Dashboard |
|-------|-------------|---------------------|
| Bar Chart | Comparing suppliers | Spend by Supplier |
| Line Chart | Trends over time | Lead Time Trend |
| Pie Chart | Distribution | Tier Distribution |
| Scatter Plot | Correlation | Lead Time vs OTD |
| Bubble Chart | Multi-dimensional | Risk Matrix |
| Radar Chart | Multi-metric | Strategic Scorecard |

---

[Back to Main Wiki](../README_EN.md) | [Previous: Customers](../01_Customers/README_EN.md) | [Next: Finance](../03_Finance/README_EN.md)
