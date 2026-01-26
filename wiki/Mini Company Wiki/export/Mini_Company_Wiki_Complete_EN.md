# Mini Company Wiki - Complete Documentation

> **Version:** 1.0 | **Last Updated:** January 2025
> **Total Departments:** 6 | **Total Dashboards:** 43 | **Total KPIs:** 172+

---

# TABLE OF CONTENTS

1. [Global Column Keywords Reference](#global-column-keywords-reference)
2. [Customers Department](#1-customers-department)
3. [Suppliers Department](#2-suppliers-department)
4. [Finance Department](#3-finance-department)
5. [Inventory Department](#4-inventory-department)
6. [Purchases Department](#5-purchases-department)
7. [Sales Department](#6-sales-department)

---

# GLOBAL COLUMN KEYWORDS REFERENCE

Use this reference when importing data from other systems. Find your column name and map it to the standard name.

## Identity Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **ID** | Identifier, Record Number, Unique ID, Primary Key, Reference Number, Code, Key |
| **Name** | Title, Label, Description, Display Name, Full Name |
| **Code** | Short Code, Abbreviation, Symbol, Reference Code |
| **SKU** | Stock Keeping Unit, Item Number, Product Code, Part Number, Article Number, Material Number, Barcode, UPC, EAN |

## Date & Time Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Date** | Transaction Date, Record Date, Entry Date, Posting Date |
| **Created Date** | Creation Date, Date Added, Date Entered, Registration Date |
| **Updated Date** | Modified Date, Last Changed, Revision Date |
| **Due Date** | Expected Date, Target Date, Deadline, Promised Date |

## Status Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Status** | State, Condition, Stage, Phase, Situation |
| **Active/Inactive** | Enabled/Disabled, Live/Dead, On/Off, Open/Closed |
| **Priority** | Urgency, Importance, Level, Rank, Severity |

## Financial Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Amount** | Value, Sum, Total, Price, Cost, Worth |
| **Currency** | Currency Type, Currency Code, Money Type |
| **Revenue** | Sales, Income, Earnings, Turnover, Gross Sales |
| **Profit** | Net Income, Margin, Gain, Net Earnings |
| **Expense** | Cost, Expenditure, Spending, Outflow |

## Quantity Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Quantity** | Count, Amount, Number, Units, Volume, Qty |
| **Rate** | Ratio, Percentage, Proportion, Share |
| **Score** | Rating, Points, Rank, Level, Grade |

---

# 1. CUSTOMERS DEPARTMENT

> **Focus:** Customer Intelligence & Analytics
> **Dashboards:** 7 | **KPIs:** 28+

## 1.1 Dashboard Index

| # | Dashboard | Purpose |
|---|-----------|---------|
| 1 | Customer Overview | Total customer base metrics |
| 2 | Segmentation & Value | Customer tier analysis |
| 3 | Behavior Patterns | Purchase behavior tracking |
| 4 | Retention & Churn | Churn analysis & prevention |
| 5 | Journey Touchpoints | Customer interaction mapping |
| 6 | Satisfaction Feedback | NPS & satisfaction scores |
| 7 | Forecast Lifetime Risk | CLV prediction |

## 1.2 Data Tables

### Table: CUSTOMERS (Master)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| customer_id | Text | Yes | Unique customer ID | Customer Number, Client ID, Account Number, Customer Code, Client Number, Party ID, Contact ID |
| customer_name | Text | Yes | Full customer name | Name, Full Name, Client Name, Account Name, Company Name, Organization Name |
| email | Text | Yes | Primary email | Email Address, E-mail, Contact Email, Mail |
| phone | Text | No | Phone number | Phone Number, Telephone, Mobile, Cell, Contact Number |
| segment | Enum | Yes | Customer segment | Customer Segment, Tier, Classification, Customer Type, Grade, Group, Category |
| status | Enum | Yes | Account status | Account Status, Customer Status, State, Activity Status |
| registration_date | Date | Yes | Account creation date | Created Date, Sign Up Date, Join Date, Start Date, First Purchase Date |
| last_activity_date | Date | No | Last interaction date | Last Active, Last Login, Last Purchase, Last Transaction |
| country | Text | No | Customer country | Country, Location, Region, Territory, Geography |
| city | Text | No | Customer city | City, Town, Location |
| industry | Text | No | Business sector | Industry, Sector, Business Type, Vertical |
| company_size | Text | No | Organization size | Company Size, Employee Count, Organization Size |
| source | Text | No | Acquisition source | Acquisition Source, Lead Source, Channel, Origin, Referral |

**Segment Values:** vip, loyal, standard, new, at_risk
**Status Values:** active, inactive, churned

### Table: CUSTOMER_TRANSACTIONS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| transaction_id | Text | Yes | Unique transaction ID | Transaction Number, Order Number, Invoice Number, Receipt Number, Sale Number |
| customer_id | Text | Yes | Customer reference | Customer Number, Client ID, Account Number |
| transaction_date | DateTime | Yes | Transaction time | Date, Order Date, Purchase Date, Sale Date, Invoice Date |
| amount | Decimal | Yes | Transaction value | Amount, Value, Total, Sum, Revenue, Sales Amount, Order Value |
| currency | Text | Yes | Currency code | Currency, Currency Code, Money Type |
| product_category | Text | No | Product category | Category, Product Type, Item Category, Department |
| quantity | Integer | No | Items purchased | Quantity, Count, Units, Number of Items |
| discount | Decimal | No | Discount applied | Discount, Discount Amount, Reduction, Rebate |
| payment_method | Text | No | Payment type | Payment Method, Payment Type, Pay Method |
| channel | Text | No | Sales channel | Channel, Sales Channel, Source, Platform, Touchpoint |

### Table: CUSTOMER_METRICS (Aggregated)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| customer_id | Text | Yes | Customer reference | Customer Number, Client ID |
| lifetime_value | Decimal | Yes | Customer lifetime value | CLV, LTV, Lifetime Value, Customer Value, Total Revenue |
| total_revenue | Decimal | Yes | Total revenue generated | Revenue, Total Sales, Cumulative Revenue, Total Spend |
| total_orders | Integer | Yes | Total order count | Orders, Order Count, Purchase Count, Transaction Count |
| average_order_value | Decimal | Yes | Average order value | AOV, Average Order, Average Purchase, Average Basket |
| purchase_frequency | Decimal | Yes | Purchases per period | Frequency, Purchase Rate, Order Frequency |
| days_since_last_purchase | Integer | Yes | Recency in days | Recency, Days Inactive, Days Since Last Buy |
| engagement_score | Decimal | Yes | Engagement level (0-100) | Engagement, Activity Score, Interaction Score |
| satisfaction_score | Decimal | No | Satisfaction rating | CSAT, Satisfaction, Customer Satisfaction, Happiness Score |
| nps_score | Integer | No | Net Promoter Score | NPS, Net Promoter, Promoter Score, Recommendation Score |
| churn_risk | Decimal | Yes | Churn probability (0-100) | Churn Risk, Risk Score, Attrition Risk, Leave Probability |
| health_score | Decimal | No | Overall health (0-100) | Health, Customer Health, Account Health |

### Table: CUSTOMER_INTERACTIONS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| interaction_id | Text | Yes | Unique interaction ID | Interaction Number, Activity ID, Event ID, Touchpoint ID |
| customer_id | Text | Yes | Customer reference | Customer Number, Client ID |
| interaction_date | DateTime | Yes | Interaction time | Date, Activity Date, Event Date, Contact Date |
| interaction_type | Enum | Yes | Type of interaction | Type, Channel, Medium, Touchpoint, Contact Type |
| channel | Text | Yes | Interaction channel | Channel, Medium, Platform, Source |
| direction | Enum | No | Inbound or outbound | Direction, Flow, Initiated By |
| subject | Text | No | Interaction subject | Subject, Title, Reason, Purpose |
| sentiment | Enum | No | Sentiment analysis | Sentiment, Mood, Tone, Feeling |
| resolution | Boolean | No | Was issue resolved | Resolved, Completed, Closed |
| agent_id | Text | No | Support agent ID | Agent, Representative, Handler |
| duration_minutes | Integer | No | Interaction length | Duration, Time Spent, Length, Minutes |

**Interaction Types:** email, call, chat, visit, purchase, support, feedback, social

### Table: CUSTOMER_FEEDBACK

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| feedback_id | Text | Yes | Unique feedback ID | Feedback Number, Survey ID, Response ID, Review ID |
| customer_id | Text | Yes | Customer reference | Customer Number, Client ID |
| feedback_date | Date | Yes | Feedback submission date | Date, Submit Date, Response Date |
| feedback_type | Enum | Yes | Type of feedback | Type, Category, Feedback Category |
| rating | Integer | Yes | Numeric rating (1-5 or 1-10) | Rating, Score, Stars, Grade, Points |
| nps_response | Integer | No | NPS response (0-10) | NPS, NPS Score, Promoter Score |
| comment | LongText | No | Free-text feedback | Comment, Note, Remarks, Feedback Text, Review |
| category | Text | No | Feedback category | Category, Topic, Area, Aspect |
| sentiment | Enum | No | Detected sentiment | Sentiment, Tone, Mood |
| product_id | Text | No | Related product | Product, Item, SKU |
| resolved | Boolean | No | Was issue addressed | Resolved, Addressed, Closed |

## 1.3 KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| CLV | Customer Lifetime Value | Total revenue from customer | Currency |
| NPS | Net Promoter Score | (Promoters% - Detractors%) x 100 | -100 to 100 |
| CSAT | Customer Satisfaction Score | Avg(Rating) / Max(Rating) x 100 | Percentage |
| AOV | Average Order Value | Total Revenue / Order Count | Currency |
| Churn Rate | Customer Attrition Rate | Churned / Starting Customers | Percentage |
| Retention Rate | Customer Retention | 1 - Churn Rate | Percentage |

---

# 2. SUPPLIERS DEPARTMENT

> **Focus:** Sourcing & Procurement Management
> **Dashboards:** 7 | **KPIs:** 28+

## 2.1 Dashboard Index

| # | Dashboard | Purpose |
|---|-----------|---------|
| 1 | Supplier Overview | Supplier base & spend distribution |
| 2 | Supplier Delivery | On-time delivery analysis |
| 3 | Supplier Cost | Cost variance & optimization |
| 4 | Quality & Compliance | Defect rates & audit scores |
| 5 | Lead Time & Responsiveness | Order responsiveness metrics |
| 6 | Risk & Dependency | Supply chain risk assessment |
| 7 | Strategic Value & Growth | Partnership & innovation |

## 2.2 Data Tables

### Table: SUPPLIERS (Master)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| supplier_id | Text | Yes | Unique supplier ID | Supplier Number, Vendor ID, Vendor Number, Supplier Code, Creditor ID, Merchant Number |
| supplier_name | Text | Yes | Supplier company name | Name, Vendor Name, Company Name, Business Name, Legal Name |
| contact_name | Text | No | Primary contact | Contact, Contact Person, Representative, Account Manager |
| email | Text | Yes | Primary email | Email, E-mail, Contact Email |
| phone | Text | No | Phone number | Phone, Telephone, Contact Number |
| category | Text | Yes | Supplier category | Category, Type, Classification, Supplier Type, Commodity |
| status | Enum | Yes | Supplier status | Status, State, Standing, Relationship Status |
| tier | Enum | Yes | Partnership level | Tier, Level, Partner Level, Strategic Level, Rank |
| country | Text | No | Supplier country | Country, Location, Region, Origin |
| city | Text | No | Supplier city | City, Location, Town |
| address | Text | No | Full address | Address, Street Address, Location |
| tax_id | Text | No | Tax identification | Tax ID, VAT Number, Registration Number |
| payment_terms | Text | No | Payment terms | Payment Terms, Terms, Credit Terms, Net Days |
| currency | Text | No | Default currency | Currency, Currency Code |
| onboarding_date | Date | Yes | Date added as supplier | Start Date, Registration Date, Qualification Date |
| last_order_date | Date | No | Last order date | Last Order, Last Purchase, Last Transaction |

**Status Values:** active, probation, inactive, blocked, new
**Tier Values:** strategic, preferred, standard, transactional

### Table: SUPPLIER_ORDERS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| order_id | Text | Yes | Unique order ID | Order Number, PO Number, Purchase Order, Requisition Number |
| supplier_id | Text | Yes | Supplier reference | Supplier Number, Vendor ID |
| order_date | Date | Yes | Order placement date | Order Date, PO Date, Purchase Date, Issue Date |
| expected_delivery | Date | Yes | Expected delivery date | Expected Date, Due Date, Promised Date, Target Date, ETA |
| actual_delivery | Date | No | Actual delivery date | Delivery Date, Receipt Date, Actual Date, Arrival Date |
| order_value | Decimal | Yes | Total order value | Value, Amount, Order Amount, PO Value, Total |
| currency | Text | Yes | Currency code | Currency, Currency Code |
| line_count | Integer | No | Number of line items | Lines, Items, Line Count |
| status | Enum | Yes | Order status | Status, State, Order Status |
| category | Text | No | Order category | Category, Type, Procurement Category |
| buyer_id | Text | No | Procurement officer | Buyer, Purchaser, Officer, Creator |
| priority | Enum | No | Order priority | Priority, Urgency, Importance |

**Order Status:** pending, confirmed, in_transit, delivered, partial, cancelled

### Table: SUPPLIER_METRICS (Aggregated)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| supplier_id | Text | Yes | Supplier reference | Supplier Number, Vendor ID |
| total_spend_ytd | Decimal | Yes | Year-to-date spend | YTD Spend, Annual Spend, Total Spend, Spend Amount |
| order_count_ytd | Integer | Yes | Year-to-date orders | Order Count, PO Count, Transaction Count |
| on_time_delivery_rate | Decimal | Yes | On-time delivery % | OTD, On-Time Rate, Delivery Performance, OTIF Rate |
| average_lead_time | Integer | Yes | Average delivery days | Lead Time, Delivery Days, Cycle Time, Transit Time |
| quality_score | Decimal | Yes | Quality rating (0-100) | Quality, Quality Rating, Quality Index, QC Score |
| defect_rate | Decimal | Yes | Defective items % | Defect Rate, Rejection Rate, Failure Rate, NCR Rate |
| compliance_score | Decimal | Yes | Compliance rating (0-100) | Compliance, Compliance Rating, Audit Score |
| responsiveness_score | Decimal | No | Response time rating | Responsiveness, Response Rate, Communication Score |
| overall_rating | Decimal | Yes | Overall score (0-5) | Rating, Score, Supplier Rating, Vendor Rating |
| risk_level | Enum | Yes | Risk classification | Risk, Risk Level, Risk Score, Risk Category |
| spend_variance | Decimal | No | Budget vs actual | Variance, Cost Variance, Budget Variance |
| return_rate | Decimal | No | Returned items % | Returns, Return Rate, RMA Rate |

**Risk Levels:** low, medium, high, critical

### Table: SUPPLIER_QUALITY

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| inspection_id | Text | Yes | Unique inspection ID | Inspection Number, QC Number, Audit Number |
| supplier_id | Text | Yes | Supplier reference | Supplier Number, Vendor ID |
| order_id | Text | No | Related order | Order Number, PO Number |
| inspection_date | Date | Yes | Inspection date | Date, QC Date, Audit Date |
| inspection_type | Enum | Yes | Type of inspection | Type, Inspection Type, Audit Type |
| total_inspected | Integer | Yes | Items inspected | Inspected, Sample Size, Quantity Checked |
| defects_found | Integer | Yes | Defective items | Defects, Rejected, Failed, Non-Conforming |
| defect_rate | Decimal | Yes | Defect percentage | Defect Rate, Rejection Rate, PPM |
| severity | Enum | No | Defect severity | Severity, Criticality, Impact Level |
| root_cause | Text | No | Root cause of defect | Cause, Root Cause, Reason |
| corrective_action | Text | No | Action taken | Action, CAPA, Corrective Action |
| inspector_id | Text | No | QC inspector | Inspector, Auditor, QC Officer |
| pass_fail | Boolean | Yes | Pass/fail result | Result, Passed, Status |

### Table: SUPPLIER_DELIVERIES

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| delivery_id | Text | Yes | Unique delivery ID | Delivery Number, Shipment ID, Receipt Number, GRN Number |
| order_id | Text | Yes | Related order | Order Number, PO Number |
| supplier_id | Text | Yes | Supplier reference | Supplier Number, Vendor ID |
| expected_date | Date | Yes | Expected delivery | Due Date, Promised Date, Expected, ETA |
| actual_date | Date | Yes | Actual delivery | Delivery Date, Receipt Date, Arrival Date |
| variance_days | Integer | Yes | Days early/late | Variance, Delay, Days Late, Days Early |
| on_time | Boolean | Yes | Was delivery on time | On Time, OTD, Punctual |
| quantity_ordered | Integer | Yes | Quantity ordered | Ordered, Order Qty, Expected Qty |
| quantity_received | Integer | Yes | Quantity received | Received, Delivered Qty, Actual Qty |
| quantity_variance | Integer | Yes | Quantity difference | Variance, Difference, Short/Over |
| complete | Boolean | Yes | Full delivery | Complete, Full, OTIF |
| carrier | Text | No | Shipping carrier | Carrier, Shipper, Logistics, Transporter |
| tracking_number | Text | No | Tracking number | Tracking, AWB, BOL, Reference |

### Table: SUPPLIER_SPEND

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| spend_id | Text | Yes | Unique record ID | ID, Record Number |
| supplier_id | Text | Yes | Supplier reference | Supplier Number, Vendor ID |
| period | Text | Yes | Time period (YYYY-MM) | Period, Month, Year-Month |
| category | Text | Yes | Spend category | Category, Commodity, Classification |
| spend_amount | Decimal | Yes | Amount spent | Spend, Amount, Value, Cost |
| budget_amount | Decimal | No | Budgeted amount | Budget, Planned, Allocated |
| variance | Decimal | No | Budget variance | Variance, Difference, Over/Under |
| order_count | Integer | Yes | Number of orders | Orders, PO Count |
| currency | Text | Yes | Currency code | Currency, Currency Code |
| department | Text | No | Requesting department | Department, Cost Center |
| project | Text | No | Project reference | Project, Project Code, Work Order |

## 2.3 KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| OTD | On-Time Delivery | On-time Deliveries / Total Deliveries | Percentage |
| OTIF | On-Time In-Full | On-time AND Complete / Total | Percentage |
| Lead Time | Order to Delivery | Delivery Date - Order Date | Days |
| Defect Rate | Defect Percentage | Defects / Items Inspected | Percentage |
| Quality Score | Quality Index | Weighted quality metrics | 0-100 |
| Compliance Score | Compliance Rating | Audit pass rate | 0-100 |

---

# 3. FINANCE DEPARTMENT

> **Focus:** Expense Management & Financial Control
> **Dashboards:** 7 | **KPIs:** 28+

## 3.1 Dashboard Index

| # | Dashboard | Purpose |
|---|-----------|---------|
| 1 | Expenses Overview | Total expense metrics |
| 2 | Category Analysis | Expense breakdown by category |
| 3 | Fixed vs Variable | Cost structure analysis |
| 4 | Trends & Anomalies | Pattern detection |
| 5 | Approval Flow | Expense approval tracking |
| 6 | Department Accountability | Department spending |
| 7 | Forecast Optimization | Budget planning |

## 3.2 Data Tables

### Table: EXPENSES (Master)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| expense_id | Text | Yes | Unique expense ID | Expense Number, Transaction ID, Voucher Number, Entry Number, Document Number, Claim Number |
| expense_date | Date | Yes | Expense date | Date, Transaction Date, Posting Date, Entry Date, Voucher Date |
| amount | Decimal | Yes | Expense amount | Amount, Value, Sum, Total, Cost, Expenditure |
| currency | Text | Yes | Currency code | Currency, Currency Code |
| category | Text | Yes | Expense category | Category, Type, Classification, Expense Type, Account, Cost Type |
| subcategory | Text | No | Expense subcategory | Subcategory, Sub-type, Detail Category |
| description | Text | No | Expense description | Description, Details, Narrative, Notes, Purpose, Memo |
| department | Text | Yes | Requesting department | Department, Cost Center, Business Unit, Division |
| employee_id | Text | Yes | Requester ID | Employee ID, User ID, Requester, Claimant, Submitter |
| employee_name | Text | No | Requester name | Name, Employee Name, Requester Name |
| vendor | Text | No | Vendor/payee | Vendor, Supplier, Payee, Merchant, Provider |
| payment_method | Text | No | Payment type | Payment Method, Pay Type, Payment Mode |
| receipt | Boolean | No | Receipt attached | Receipt, Attachment, Document, Proof |
| status | Enum | Yes | Approval status | Status, State, Approval Status, Workflow Status |
| type | Enum | Yes | Fixed or variable | Type, Cost Type, Expense Nature, Classification |
| project | Text | No | Project reference | Project, Project Code, Work Order, Cost Object |
| budget_code | Text | No | Budget line item | Budget Code, Budget Line, GL Account, Account Code |

**Status Values:** pending, approved, paid, rejected, on_hold
**Type Values:** fixed, variable, capital

### Table: EXPENSE_CATEGORIES

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| category_id | Text | Yes | Unique category ID | Category Number, Code, Category Code |
| category_name | Text | Yes | Category display name | Name, Category Name, Title, Label |
| parent_category | Text | No | Parent category | Parent, Parent Category, Main Category |
| type | Enum | Yes | Fixed or variable | Type, Category Type, Nature |
| budget_limit | Decimal | No | Monthly budget limit | Limit, Budget, Cap, Maximum |
| gl_account | Text | No | General ledger account | GL Account, Account Number, Ledger Code |
| active | Boolean | Yes | Is category active | Active, Enabled, Live |

**Common Categories:** Salaries, Rent, Utilities, Travel, Marketing, Office Supplies, IT & Software, Professional Services, Entertainment, Equipment

### Table: EXPENSE_BUDGETS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| budget_id | Text | Yes | Unique budget ID | Budget Number, Budget Code, Allocation Number |
| period | Text | Yes | Budget period | Period, Month, Year, Fiscal Period |
| department | Text | Yes | Department | Department, Cost Center, Business Unit |
| category | Text | No | Category (if category budget) | Category, Expense Type |
| budget_amount | Decimal | Yes | Budgeted amount | Budget, Allocation, Planned, Target |
| actual_amount | Decimal | No | Actual spent | Actual, Spent, Expenditure |
| variance | Decimal | No | Variance (Actual - Budget) | Variance, Difference, Over/Under |
| variance_pct | Decimal | No | Variance percentage | Variance %, Deviation %, Over/Under % |
| forecast | Decimal | No | Forecasted total | Forecast, Projected, Estimated |
| status | Enum | No | Budget status | Status, Health, State |

**Budget Status:** on_track, warning, over_budget

### Table: EXPENSE_APPROVALS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| approval_id | Text | Yes | Unique approval ID | Approval Number, Workflow Number, Task Number |
| expense_id | Text | Yes | Expense reference | Expense Number, Claim Number |
| approver_id | Text | Yes | Approver ID | Approver, Reviewer, Authorizer, Manager ID |
| approver_name | Text | No | Approver name | Name, Approver Name, Manager Name |
| approval_level | Integer | Yes | Approval level (1, 2, 3...) | Level, Step, Stage, Tier |
| submission_date | DateTime | Yes | When submitted for approval | Submitted, Submission Date, Request Date |
| approval_date | DateTime | No | When approved/rejected | Approval Date, Action Date, Decision Date |
| status | Enum | Yes | Approval status | Status, Decision, Outcome |
| comments | LongText | No | Approver comments | Comments, Notes, Remarks, Reason |
| amount | Decimal | Yes | Amount for approval | Amount, Value |

**Approval Status:** pending, approved, rejected, escalated

### Table: EXPENSE_METRICS (Aggregated)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| period | Text | Yes | Time period | Period, Month, Year-Month |
| department | Text | No | Department (null for total) | Department, Cost Center |
| category | Text | No | Category (null for total) | Category, Expense Type |
| total_expenses | Decimal | Yes | Total expenses | Total, Sum, Expenditure |
| expense_count | Integer | Yes | Transaction count | Count, Transactions, Entries |
| avg_expense | Decimal | No | Average expense | Average, Mean |
| budget_amount | Decimal | No | Budget for period | Budget, Allocation |
| variance | Decimal | No | Budget variance | Variance, Difference |
| fixed_expenses | Decimal | No | Total fixed expenses | Fixed, Overhead |
| variable_expenses | Decimal | No | Total variable expenses | Variable, Discretionary |
| pending_approvals | Integer | No | Pending approval count | Pending, Awaiting |
| mom_change | Decimal | No | Month-over-month change | MoM, Monthly Change |
| yoy_change | Decimal | No | Year-over-year change | YoY, Annual Change |

## 3.3 KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Total Expenses | Total Expenditure | SUM(all expenses) | Currency |
| Fixed Ratio | Fixed Cost Ratio | Fixed / Total x 100 | Percentage |
| Variable Ratio | Variable Cost Ratio | Variable / Total x 100 | Percentage |
| Budget Variance | Budget Deviation | Actual - Budget | Currency |
| Variance % | Variance Percentage | (Actual - Budget) / Budget x 100 | Percentage |
| MoM Change | Month-over-Month | (Current - Previous) / Previous | Percentage |

---

# 4. INVENTORY DEPARTMENT

> **Focus:** Inventory & Warehouse Management
> **Dashboards:** 8 | **KPIs:** 32+

## 4.1 Dashboard Index

| # | Dashboard | Purpose |
|---|-----------|---------|
| 1 | Inventory Insights | Quick overview dashboard |
| 2 | Inventory Overview | Stock levels & distribution |
| 3 | Stock Movement | In/out flow analysis |
| 4 | Inventory Aging | Dead stock & aging |
| 5 | Stock Accuracy | Shrinkage & accuracy |
| 6 | Reorder Planning | Reorder points & planning |
| 7 | Warehouse Performance | Efficiency metrics |
| 8 | Inventory Forecast | Demand forecasting |

## 4.2 Data Tables

### Table: INVENTORY_ITEMS (Master)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| item_id | Text | Yes | Unique item ID | Item Number, SKU, Stock Code, Part Number, Product Number, Article Number, Material Number, Catalog Number, Barcode |
| item_name | Text | Yes | Item name/description | Name, Description, Item Name, Product Name, Title, Part Name |
| category | Text | Yes | Item category | Category, Product Category, Type, Classification, Group, Family |
| subcategory | Text | No | Item subcategory | Subcategory, Sub-type |
| unit | Text | Yes | Unit of measure | Unit, UOM, Measure, Unit of Quantity |
| cost_price | Decimal | Yes | Cost per unit | Cost, Unit Cost, Purchase Price, Standard Cost, Landed Cost |
| selling_price | Decimal | No | Selling price per unit | Price, Sell Price, List Price, Retail Price |
| quantity_on_hand | Integer | Yes | Current stock quantity | Quantity, QOH, Stock, On Hand, Available, Current Stock |
| reorder_point | Integer | Yes | Minimum stock level | Reorder Point, ROP, Min Level, Safety Stock, Alert Point |
| reorder_quantity | Integer | Yes | Order quantity | Reorder Qty, Order Quantity, EOQ, Lot Size |
| max_stock | Integer | No | Maximum stock level | Max Level, Maximum, Upper Limit, Ceiling |
| lead_time_days | Integer | Yes | Supplier lead time | Lead Time, Delivery Days, Replenishment Time |
| warehouse_id | Text | Yes | Primary warehouse | Warehouse, Location, Store, Site, Facility |
| bin_location | Text | No | Shelf/bin location | Bin, Location, Shelf, Slot, Position, Rack |
| status | Enum | Yes | Item status | Status, State, Availability |
| supplier_id | Text | No | Primary supplier | Supplier, Vendor, Source |
| barcode | Text | No | Barcode/UPC | Barcode, UPC, EAN, GTIN, Scan Code |
| weight | Decimal | No | Item weight | Weight, Mass, Net Weight |
| dimensions | Text | No | Dimensions | Dimensions, Size, Measurements, LxWxH |
| last_received_date | Date | No | Last receipt date | Last Received, Last Receipt, Last Stock In |
| last_sold_date | Date | No | Last sale date | Last Sold, Last Stock Out |

**Status Values:** in_stock, low_stock, out_of_stock, overstock, discontinued, on_order
**Unit Values:** each, box, kg, lb, liter, meter, pallet, roll, set

### Table: INVENTORY_MOVEMENTS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| movement_id | Text | Yes | Unique movement ID | Movement Number, Transaction ID, Stock Transaction |
| item_id | Text | Yes | Item reference | Item Number, SKU, Product Number |
| movement_date | DateTime | Yes | Transaction time | Date, Transaction Date, Movement Date, Posting Date |
| movement_type | Enum | Yes | Type of movement | Type, Transaction Type, Movement Type |
| quantity | Integer | Yes | Quantity moved | Quantity, Count, Units |
| direction | Enum | Yes | In or out | Direction, Flow, Type |
| reference | Text | No | Reference document | Reference, Document, Order Number, PO Number, SO Number |
| warehouse_from | Text | No | Source warehouse | From, Source, Origin |
| warehouse_to | Text | No | Destination warehouse | To, Destination, Target |
| cost | Decimal | No | Transaction cost | Cost, Value, Amount |
| reason | Text | No | Movement reason | Reason, Purpose, Notes |
| user_id | Text | No | Who processed | User, Operator, Processed By |

**Movement Types:** receipt, issue, transfer, adjustment, return, scrap
**Direction:** in, out

### Table: INVENTORY_METRICS (Aggregated)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| period | Text | Yes | Time period | Period, Month, Year-Month |
| warehouse_id | Text | No | Warehouse (null for total) | Warehouse, Location |
| category | Text | No | Category (null for total) | Category, Product Group |
| total_stock_value | Decimal | Yes | Total inventory value | Stock Value, Inventory Value, Value |
| total_sku_count | Integer | Yes | Number of items | SKU Count, Item Count, Products |
| in_stock_rate | Decimal | Yes | Items in stock % | In Stock Rate, Availability, Fill Rate |
| out_of_stock_count | Integer | Yes | OOS item count | OOS Count, Stockouts |
| low_stock_count | Integer | Yes | Low stock items | Low Stock, Below ROP |
| overstock_count | Integer | No | Overstock items | Overstock, Excess |
| turnover_rate | Decimal | Yes | Inventory turnover | Turnover, Turn Rate, ITO |
| days_on_hand | Decimal | Yes | Average days in stock | DOH, Days of Inventory, DIO |
| dead_stock_value | Decimal | No | Non-moving stock value | Dead Stock, Obsolete |
| shrinkage_rate | Decimal | No | Inventory loss % | Shrinkage, Loss, Variance Rate |
| accuracy_rate | Decimal | No | Inventory accuracy % | Accuracy, IRA |

### Table: INVENTORY_AGING

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| item_id | Text | Yes | Item reference | Item Number, SKU |
| warehouse_id | Text | Yes | Warehouse location | Warehouse, Location |
| quantity | Integer | Yes | Current quantity | Quantity, Stock |
| age_days | Integer | Yes | Days since receipt | Age, Days, Days Held |
| age_bucket | Enum | Yes | Age category | Bucket, Range, Band |
| value | Decimal | Yes | Inventory value | Value, Amount |
| last_movement_date | Date | Yes | Last activity date | Last Movement, Last Activity |
| last_sale_date | Date | No | Last sale date | Last Sale |
| risk_level | Enum | No | Obsolescence risk | Risk, Risk Level |

**Age Buckets:** 0-30, 31-60, 61-90, 91-180, 181-365, 365+

### Table: WAREHOUSES

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| warehouse_id | Text | Yes | Unique warehouse ID | Warehouse Number, Location ID, Site ID |
| warehouse_name | Text | Yes | Warehouse name | Name, Location Name, Site Name |
| warehouse_type | Enum | Yes | Warehouse type | Type, Category |
| address | Text | No | Physical address | Address, Location |
| city | Text | No | City | City, Town |
| country | Text | No | Country | Country, Region |
| capacity_units | Integer | No | Storage capacity | Capacity, Max Units |
| current_utilization | Decimal | No | Current utilization % | Utilization, Usage |
| manager | Text | No | Warehouse manager | Manager, Supervisor |
| status | Enum | Yes | Operational status | Status, State |
| cost_per_unit | Decimal | No | Storage cost per unit | Cost, Rate |

**Warehouse Types:** main, regional, retail, cold_storage, bonded, 3pl

### Table: STOCK_COUNTS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| count_id | Text | Yes | Unique count ID | Count Number, Audit Number, Cycle Count Number |
| count_date | Date | Yes | Count date | Date, Count Date, Audit Date |
| warehouse_id | Text | Yes | Warehouse counted | Warehouse, Location |
| item_id | Text | Yes | Item counted | Item Number, SKU |
| system_quantity | Integer | Yes | System quantity | System, Expected, Book Qty |
| physical_quantity | Integer | Yes | Physical count | Physical, Actual, Counted |
| variance | Integer | Yes | Quantity difference | Variance, Difference, Discrepancy |
| variance_value | Decimal | Yes | Value difference | Variance Value, Amount |
| reason | Text | No | Variance reason | Reason, Explanation |
| counted_by | Text | No | Who counted | Counter, Auditor |
| verified_by | Text | No | Who verified | Verifier, Supervisor |
| adjustment_made | Boolean | No | Was adjustment posted | Adjusted, Posted |

## 4.3 KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Stock Value | Inventory Value | SUM(Quantity x Cost) | Currency |
| Turnover | Inventory Turnover | COGS / Average Inventory | Ratio |
| DOH | Days on Hand | Average Inventory / Daily Usage | Days |
| In-Stock Rate | Availability Rate | In-Stock Items / Total Items | Percentage |
| Shrinkage | Inventory Loss | (Expected - Actual) / Expected | Percentage |
| IRA | Inventory Record Accuracy | Accurate Counts / Total | Percentage |

---

# 5. PURCHASES DEPARTMENT

> **Focus:** Purchase Orders & Requisitions
> **Dashboards:** 7 | **KPIs:** 28+

## 5.1 Dashboard Index

| # | Dashboard | Purpose |
|---|-----------|---------|
| 1 | Purchase Overview | Total spend & order metrics |
| 2 | Supplier Performance | Supplier performance tracking |
| 3 | Purchase Behavior | Purchasing pattern analysis |
| 4 | Cost Control | Cost analysis & optimization |
| 5 | Purchase Funnel | Requisition to delivery |
| 6 | Dependency Risk | Supply concentration risk |
| 7 | Forecast Planning | Demand planning |

## 5.2 Data Tables

### Table: PURCHASE_ORDERS (Master)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| po_id | Text | Yes | Unique PO ID | PO Number, Order Number, Purchase Order, Procurement Number |
| po_date | Date | Yes | Order creation date | Date, Order Date, Issue Date, PO Date |
| supplier_id | Text | Yes | Supplier reference | Supplier, Vendor, Vendor ID |
| supplier_name | Text | No | Supplier name | Supplier Name, Vendor Name |
| total_amount | Decimal | Yes | Total order value | Amount, Value, Total, PO Value, Order Value |
| currency | Text | Yes | Currency code | Currency, Currency Code |
| status | Enum | Yes | Order status | Status, State, Order Status |
| expected_delivery | Date | Yes | Expected delivery date | Delivery Date, Due Date, Expected Date, ETA |
| actual_delivery | Date | No | Actual delivery date | Receipt Date, Actual Date, GRN Date |
| department | Text | Yes | Requesting department | Department, Cost Center, Business Unit |
| buyer_id | Text | Yes | Buyer/procurement officer | Buyer, Purchaser, Officer, Creator |
| buyer_name | Text | No | Buyer name | Buyer Name |
| category | Text | Yes | Purchase category | Category, Commodity, Product Category |
| priority | Enum | No | Order priority | Priority, Urgency, Importance |
| payment_terms | Text | No | Payment terms | Terms, Payment Terms |
| shipping_method | Text | No | Shipping method | Shipping, Freight, Delivery Method |
| notes | LongText | No | Order notes | Notes, Comments, Remarks |
| approved_by | Text | No | Approver | Approver, Authorized By |
| approval_date | Date | No | Approval date | Approval Date |

**Status Values:** draft, pending_approval, approved, sent, acknowledged, in_transit, partial, received, cancelled
**Priority Values:** low, medium, high, urgent

### Table: PURCHASE_ORDER_LINES

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| line_id | Text | Yes | Unique line ID | Line Number, Item Number, Detail Number |
| po_id | Text | Yes | PO reference | PO Number, Order Number |
| item_id | Text | Yes | Item/product ID | Item, SKU, Product, Part Number |
| item_name | Text | Yes | Item description | Description, Item Name, Product Name |
| quantity | Integer | Yes | Quantity ordered | Quantity, Count, Units, Order Qty |
| unit_price | Decimal | Yes | Price per unit | Price, Unit Price, Cost, Rate |
| line_total | Decimal | Yes | Line total | Total, Amount, Line Amount |
| unit | Text | Yes | Unit of measure | Unit, UOM |
| received_qty | Integer | No | Quantity received | Received, Delivered Qty |
| status | Enum | No | Line status | Status, State |
| delivery_date | Date | No | Line delivery date | Delivery, Expected Date |

### Table: PURCHASE_METRICS (Aggregated)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| period | Text | Yes | Time period | Period, Month, Year-Month |
| supplier_id | Text | No | Supplier (null for total) | Supplier, Vendor |
| category | Text | No | Category (null for total) | Category, Commodity |
| department | Text | No | Department (null for total) | Department, Cost Center |
| total_spend | Decimal | Yes | Total spend | Spend, Amount, Value |
| order_count | Integer | Yes | Number of POs | Orders, PO Count |
| line_count | Integer | No | Number of line items | Lines, Items |
| avg_order_value | Decimal | No | Average PO value | AOV, Average |
| on_time_delivery | Decimal | No | On-time delivery % | OTD, On Time |
| supplier_count | Integer | No | Active suppliers | Suppliers, Vendors |
| lead_time_avg | Integer | No | Average lead time | Lead Time, Days |
| cost_savings | Decimal | No | Savings achieved | Savings, Cost Reduction |
| mom_change | Decimal | No | Month-over-month change | MoM, Monthly Change |
| yoy_change | Decimal | No | Year-over-year change | YoY, Annual Change |

### Table: PURCHASE_REQUISITIONS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| req_id | Text | Yes | Unique requisition ID | Requisition Number, PR Number, Request Number |
| req_date | Date | Yes | Request date | Date, Request Date |
| requester_id | Text | Yes | Requester ID | Requester, User ID, Employee |
| requester_name | Text | No | Requester name | Name, Requester Name |
| department | Text | Yes | Department | Department, Cost Center |
| description | Text | Yes | Request description | Description, Details, Purpose |
| estimated_value | Decimal | No | Estimated cost | Value, Estimate, Budget |
| urgency | Enum | No | Request urgency | Urgency, Priority |
| status | Enum | Yes | Requisition status | Status, State |
| po_id | Text | No | Linked PO (if converted) | PO, Order, Purchase Order |
| approved_by | Text | No | Approver | Approver, Manager |
| approval_date | Date | No | Approval date | Approval Date |
| rejection_reason | Text | No | Rejection reason if rejected | Reason, Rejection |

**Requisition Status:** draft, submitted, approved, rejected, converted, cancelled

### Table: PURCHASE_RECEIPTS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| receipt_id | Text | Yes | Unique receipt ID | Receipt Number, GRN Number, Receiving Number |
| receipt_date | Date | Yes | Receipt date | Date, Receiving Date, GRN Date |
| po_id | Text | Yes | Related PO | PO Number, Order Number |
| supplier_id | Text | Yes | Supplier | Supplier, Vendor |
| warehouse_id | Text | Yes | Receiving warehouse | Warehouse, Location, Site |
| total_quantity | Integer | Yes | Total units received | Quantity, Units |
| total_value | Decimal | Yes | Receipt value | Value, Amount |
| status | Enum | Yes | Receipt status | Status, State |
| received_by | Text | No | Receiver | Receiver, Operator |
| quality_status | Enum | No | QC result | Quality, QC, Inspection Result |
| variance | Decimal | No | Quantity variance | Variance, Difference |
| carrier | Text | No | Shipping carrier | Carrier, Shipper |
| tracking | Text | No | Tracking number | Tracking, AWB |

## 5.3 KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Total Spend | Procurement Expenditure | SUM(all PO values) | Currency |
| OTD | On-Time Delivery | On-time Deliveries / Total | Percentage |
| Lead Time | Order to Delivery | Delivery Date - Order Date | Days |
| AOV | Average Order Value | Total Spend / Order Count | Currency |
| Cycle Time | Requisition to Delivery | Delivery - Requisition Date | Days |
| Savings | Cost Reduction | Budget - Actual (if positive) | Currency |

---

# 6. SALES DEPARTMENT

> **Focus:** Sales Operations & Pipeline Management
> **Dashboards:** 7 | **KPIs:** 28+

## 6.1 Dashboard Index

| # | Dashboard | Purpose |
|---|-----------|---------|
| 1 | Sales Insights | Key metrics with time views |
| 2 | Sales Performance | Rep performance tracking |
| 3 | Sales Analysis | Product/region breakdown |
| 4 | Sales Forecast | Revenue forecasting |
| 5 | Sales Funnel | Pipeline visualization |
| 6 | Sales Segmentation | Customer segment analysis |
| 7 | Sales Promotions | Campaign effectiveness |

## 6.2 Data Tables

### Table: SALES_ORDERS (Master)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| order_id | Text | Yes | Unique order ID | Order Number, Sales Order, SO Number, Invoice Number, Transaction Number, Receipt Number |
| order_date | DateTime | Yes | Order time | Date, Order Date, Sale Date, Transaction Date, Invoice Date |
| customer_id | Text | Yes | Customer reference | Customer, Client, Account, Customer Number, Buyer |
| customer_name | Text | No | Customer name | Customer Name, Client Name, Account Name |
| total_amount | Decimal | Yes | Order total | Amount, Total, Value, Sum, Revenue, Sales Amount, Invoice Total |
| currency | Text | Yes | Currency code | Currency, Currency Code |
| status | Enum | Yes | Order status | Status, State, Order Status |
| salesperson_id | Text | Yes | Sales rep ID | Salesperson, Rep, Agent, Sales Rep, Account Manager |
| salesperson_name | Text | No | Sales rep name | Rep Name, Salesperson Name |
| region | Text | No | Sales region | Region, Territory, Area, Zone, Market, Geography |
| channel | Text | No | Sales channel | Channel, Source, Platform, Medium |
| payment_method | Text | No | Payment type | Payment, Payment Method, Pay Type |
| payment_status | Enum | No | Payment status | Payment Status, Paid, Pay State |
| shipping_address | Text | No | Delivery address | Shipping, Address, Delivery Address |
| discount | Decimal | No | Discount applied | Discount, Reduction, Rebate |
| tax | Decimal | No | Tax amount | Tax, VAT, Sales Tax |
| profit | Decimal | No | Order profit | Profit, Margin, Net, Gain |
| cost | Decimal | No | Order cost | Cost, COGS |
| notes | LongText | No | Order notes | Notes, Comments |

**Status Values:** pending, confirmed, processing, shipped, delivered, cancelled, returned
**Payment Status:** unpaid, partial, paid, refunded
**Channel Values:** direct, online, phone, retail, wholesale, partner

### Table: SALES_ORDER_LINES

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| line_id | Text | Yes | Unique line ID | Line Number, Item Number |
| order_id | Text | Yes | Order reference | Order Number, SO Number, Invoice |
| product_id | Text | Yes | Product/item ID | Product, SKU, Item, Part Number |
| product_name | Text | Yes | Product name | Name, Description, Product Name |
| quantity | Integer | Yes | Quantity sold | Quantity, Count, Units, Qty |
| unit_price | Decimal | Yes | Price per unit | Price, Unit Price, Rate, Sell Price |
| line_total | Decimal | Yes | Line total | Total, Amount, Extended, Line Amount |
| discount | Decimal | No | Line discount | Discount, Reduction |
| cost | Decimal | No | Line cost | Cost, Unit Cost, COGS |
| profit | Decimal | No | Line profit | Profit, Margin |
| category | Text | No | Product category | Category, Type, Product Category |

### Table: SALES_METRICS (Aggregated)

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| period | Text | Yes | Time period | Period, Month, Year-Month, Date |
| granularity | Enum | Yes | Time granularity | Granularity, Level, Time Type |
| region | Text | No | Region (null for total) | Region, Territory |
| salesperson_id | Text | No | Rep (null for total) | Salesperson, Rep |
| product_id | Text | No | Product (null for total) | Product, SKU |
| category | Text | No | Category (null for total) | Category, Product Category |
| total_revenue | Decimal | Yes | Total revenue | Revenue, Sales, Amount, Turnover |
| total_orders | Integer | Yes | Order count | Orders, Transactions, Count |
| total_quantity | Integer | Yes | Units sold | Quantity, Units, Volume |
| total_profit | Decimal | No | Total profit | Profit, Margin, Net Income |
| avg_order_value | Decimal | No | Average order | AOV, Average |
| conversion_rate | Decimal | No | Conversion % | Conversion, Close Rate, Win Rate |
| return_rate | Decimal | No | Return % | Returns, Return Rate, Refund Rate |
| unique_customers | Integer | No | Customer count | Customers, Buyers |
| new_customers | Integer | No | New customers | New, First-time, Acquired |
| mom_change | Decimal | No | Monthly change | MoM, Month Change |
| yoy_change | Decimal | No | Annual change | YoY, Year Change |

**Granularity Values:** hourly, daily, weekly, monthly, quarterly, yearly

### Table: SALES_PIPELINE

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| opportunity_id | Text | Yes | Unique opportunity ID | Opportunity Number, Deal ID, Lead Number |
| opportunity_name | Text | Yes | Opportunity name | Name, Deal Name, Opportunity, Title |
| customer_id | Text | Yes | Customer/prospect | Customer, Prospect, Lead, Account |
| customer_name | Text | No | Customer name | Customer Name, Company |
| value | Decimal | Yes | Opportunity value | Value, Amount, Deal Size, Expected Revenue |
| stage | Enum | Yes | Pipeline stage | Stage, Phase, Status, Step |
| probability | Decimal | Yes | Win probability % | Probability, Confidence, Win Rate |
| weighted_value | Decimal | No | Value x Probability | Weighted, Expected Value, Forecast |
| salesperson_id | Text | Yes | Owner/rep | Salesperson, Owner, Rep |
| created_date | Date | Yes | When created | Created, Open Date, Start Date |
| expected_close | Date | Yes | Expected close date | Close Date, Expected, Target Date |
| actual_close | Date | No | Actual close date | Close Date, Won Date |
| source | Text | No | Lead source | Source, Origin, Lead Source, Channel |
| product | Text | No | Product interest | Product, Interest, Solution |
| notes | LongText | No | Opportunity notes | Notes, Comments |

**Stage Values:** lead (10%), qualified (25%), proposal (50%), negotiation (75%), closed_won (100%), closed_lost (0%)

### Table: PRODUCTS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| product_id | Text | Yes | Unique product ID | Product Number, SKU, Item Number, Part Number |
| product_name | Text | Yes | Product name | Name, Title, Description |
| category | Text | Yes | Product category | Category, Type, Classification |
| subcategory | Text | No | Subcategory | Subcategory, Sub-type |
| unit_price | Decimal | Yes | Selling price | Price, Sell Price, List Price, Retail Price |
| cost_price | Decimal | Yes | Cost price | Cost, Unit Cost, COGS, Standard Cost |
| margin | Decimal | No | Profit margin % | Margin, Profit Margin |
| status | Enum | Yes | Product status | Status, State |
| stock_quantity | Integer | No | Available stock | Stock, Inventory, Available |

### Table: SALES_TARGETS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| target_id | Text | Yes | Unique target ID | Target Number, Quota Number |
| period | Text | Yes | Target period | Period, Month, Quarter, Year |
| salesperson_id | Text | No | Rep (null for team) | Salesperson, Rep |
| region | Text | No | Region (null for all) | Region, Territory |
| target_revenue | Decimal | Yes | Revenue target | Target, Quota, Goal, Budget |
| target_orders | Integer | No | Order target | Orders, Transaction Target |
| actual_revenue | Decimal | No | Actual revenue | Actual, Achieved, Revenue |
| actual_orders | Integer | No | Actual orders | Orders, Transactions |
| achievement | Decimal | No | Achievement % | Achievement, Attainment, Progress |
| variance | Decimal | No | Target variance | Variance, Gap, Difference |

### Table: PROMOTIONS

| Column | Type | Required | Description | Alternative Keywords |
|--------|------|----------|-------------|---------------------|
| promotion_id | Text | Yes | Unique promotion ID | Promotion Number, Campaign ID, Promo Number |
| promotion_name | Text | Yes | Promotion name | Name, Campaign Name, Title |
| start_date | Date | Yes | Start date | Start, From Date, Launch Date |
| end_date | Date | Yes | End date | End, To Date, Expiry Date |
| discount_type | Enum | Yes | Discount type | Type, Discount Type, Offer Type |
| discount_value | Decimal | Yes | Discount amount/% | Value, Discount, Amount, Percentage |
| products | Text | No | Eligible products | Products, Items, Applicable |
| min_purchase | Decimal | No | Minimum order value | Minimum, Min Purchase, Threshold |
| budget | Decimal | No | Campaign budget | Budget, Spend, Investment |
| actual_spend | Decimal | No | Actual spent | Spend, Cost, Actual |
| orders_generated | Integer | No | Orders from promotion | Orders, Conversions, Sales |
| revenue_generated | Decimal | No | Revenue from promotion | Revenue, Sales, Amount |
| roi | Decimal | No | Return on investment | ROI, Return, Effectiveness |
| status | Enum | Yes | Promotion status | Status, State |

## 6.3 KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Revenue | Total Sales | SUM(order totals) | Currency |
| AOV | Average Order Value | Revenue / Orders | Currency |
| Profit Margin | Gross Margin | Profit / Revenue x 100 | Percentage |
| Conversion Rate | Close Rate | Orders / Opportunities | Percentage |
| Win Rate | Success Rate | Won / (Won + Lost) | Percentage |
| Return Rate | Refund Rate | Returns / Orders | Percentage |
| Pipeline Value | Total Opportunities | SUM(opportunity values) | Currency |
| Weighted Pipeline | Expected Value | SUM(Value x Probability) | Currency |
| Target Achievement | Quota Attainment | Actual / Target x 100 | Percentage |
| ROI | Return on Investment | (Revenue - Cost) / Cost x 100 | Percentage |

---

# APPENDIX: CHART TYPES REFERENCE

| Chart Type | When to Use | Best For |
|------------|-------------|----------|
| **Bar Chart** | Comparing categories | Sales by product, spend by supplier |
| **Line Chart** | Showing trends | Monthly revenue, stock movement |
| **Pie/Donut** | Showing composition | Status distribution, category split |
| **Scatter Plot** | Showing correlation | Lead time vs OTD, price vs quantity |
| **Funnel Chart** | Showing pipeline | Sales funnel, approval flow |
| **Radar Chart** | Multi-axis comparison | Supplier scorecard, performance metrics |
| **Gauge Chart** | Single metric | Target achievement, accuracy rate |
| **Heatmap** | Pattern analysis | Sales by hour/day, activity patterns |

---

**END OF DOCUMENT**

*Generated for NABD Mini Company Feature - January 2025*
