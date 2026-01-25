# Sales Department - Complete Dashboard Wiki

> **Department Focus:** Sales Operations & Pipeline Management
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

The Sales Department provides comprehensive analytics for tracking sales performance, managing the sales pipeline, analyzing revenue, and forecasting future sales. It enables data-driven decision making for sales strategy and team performance optimization.

### Business Questions Answered

- What is our total revenue?
- Which products are selling best?
- How is each salesperson performing?
- What is our sales pipeline value?
- What are the sales trends?

---

## Dashboard Index

| # | Dashboard Name | Purpose | Key Charts |
|---|----------------|---------|------------|
| 1 | Sales Insights | Key metrics with time views | Bar, Heatmap |
| 2 | Sales Performance | Rep performance tracking | Bar, Scatter |
| 3 | Sales Analysis | Product/region breakdown | Bar, Pie |
| 4 | Sales Forecast | Revenue prediction | Line, Bar |
| 5 | Sales Funnel | Pipeline visualization | Funnel, Bar |
| 6 | Sales Segmentation | Customer segment analysis | Bar, Pie |
| 7 | Sales Promotions | Campaign effectiveness | Bar, Line |

---

## Master Data Tables

### Table 1: SALES_ORDERS (Primary)

The main sales order table.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **order_id** | String | Yes | Unique order identifier | Order ID, Sales Order, SO Number, Invoice Number, Transaction ID, Receipt Number, Order Number |
| **order_date** | DateTime | Yes | Order timestamp | Date, Order Date, Sale Date, Transaction Date, Invoice Date |
| **customer_id** | String | Yes | Customer reference | Customer, Client, Account, Customer ID, Buyer |
| **customer_name** | String | No | Customer name | Customer Name, Client Name, Account Name, Buyer Name |
| **total_amount** | Decimal | Yes | Order total | Amount, Total, Value, Sum, Revenue, Sale Amount, Invoice Total |
| **currency** | String | Yes | Currency code | Currency, Currency Code |
| **status** | Enum | Yes | Order status | Status, State, Order Status |
| **salesperson_id** | String | Yes | Sales rep ID | Salesperson, Rep, Agent, Sales Rep, Account Executive, Sales ID |
| **salesperson_name** | String | No | Sales rep name | Rep Name, Salesperson Name, Agent Name |
| **region** | String | No | Sales region | Region, Territory, Area, Zone, Market, Geography |
| **channel** | String | No | Sales channel | Channel, Source, Platform, Medium, Sales Channel |
| **payment_method** | String | No | Payment type | Payment, Payment Method, Pay Mode, Tender, Settlement |
| **payment_status** | Enum | No | Payment status | Payment Status, Paid, Payment State |
| **shipping_address** | String | No | Delivery address | Shipping, Address, Delivery Address, Ship To |
| **discount** | Decimal | No | Discount applied | Discount, Reduction, Markdown, Rebate |
| **tax** | Decimal | No | Tax amount | Tax, VAT, GST, Sales Tax |
| **profit** | Decimal | No | Order profit | Profit, Margin, Net, Gain |
| **cost** | Decimal | No | Order cost | Cost, COGS, Cost of Goods |
| **notes** | Text | No | Order notes | Notes, Comments, Remarks |

**Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| pending | Order placed, pending | Pending, New, Open, Awaiting |
| confirmed | Order confirmed | Confirmed, Accepted, Acknowledged |
| processing | Being processed | Processing, In Progress, Preparing |
| shipped | Order shipped | Shipped, Dispatched, In Transit, Sent |
| delivered | Order delivered | Delivered, Complete, Received, Closed |
| cancelled | Order cancelled | Cancelled, Voided, Rejected |
| returned | Order returned | Returned, Refunded, RMA |

**Payment Status Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| unpaid | Unpaid, Outstanding, Due, Pending |
| partial | Partial, Part Paid, Deposit |
| paid | Paid, Settled, Complete, Cleared |
| refunded | Refunded, Reversed, Credited |

**Channel Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| direct | Direct, In-Person, Face-to-Face, Field |
| online | Online, Web, E-commerce, Digital, Website |
| phone | Phone, Telephone, Call, Telesales |
| retail | Retail, Store, Shop, POS, Walk-in |
| wholesale | Wholesale, B2B, Trade, Distribution |
| partner | Partner, Reseller, Channel Partner, Affiliate |

---

### Table 2: SALES_ORDER_LINES

Line items in sales orders.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **line_id** | String | Yes | Unique line ID | Line ID, Item ID, Detail ID, Row ID |
| **order_id** | String | Yes | Reference to order | Order ID, SO Number, Invoice |
| **product_id** | String | Yes | Product/item ID | Product, SKU, Item, Part Number, Article |
| **product_name** | String | Yes | Product name | Name, Description, Product Name, Item Name |
| **quantity** | Integer | Yes | Quantity sold | Quantity, Qty, Units, Count, Amount |
| **unit_price** | Decimal | Yes | Price per unit | Price, Unit Price, Rate, Selling Price |
| **line_total** | Decimal | Yes | Line total | Total, Amount, Extended, Line Amount |
| **discount** | Decimal | No | Line discount | Discount, Reduction, Markdown |
| **cost** | Decimal | No | Line cost | Cost, Unit Cost, COGS |
| **profit** | Decimal | No | Line profit | Profit, Margin, Gain |
| **category** | String | No | Product category | Category, Type, Product Category |

---

### Table 3: SALES_METRICS (Aggregated)

Pre-calculated sales metrics.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **period** | String | Yes | Time period | Period, Month, Year-Month, Date |
| **granularity** | Enum | Yes | Time granularity | Granularity, Level, Time Type |
| **region** | String | No | Region (null for total) | Region, Territory |
| **salesperson_id** | String | No | Rep (null for total) | Salesperson, Rep |
| **product_id** | String | No | Product (null for total) | Product, SKU |
| **category** | String | No | Category (null for total) | Category, Product Category |
| **total_revenue** | Decimal | Yes | Total revenue | Revenue, Sales, Amount, Turnover |
| **total_orders** | Integer | Yes | Order count | Orders, Transactions, Count |
| **total_quantity** | Integer | Yes | Units sold | Quantity, Units, Volume |
| **total_profit** | Decimal | No | Total profit | Profit, Margin, Net Income |
| **avg_order_value** | Decimal | No | Average order | AOV, Average, Mean Order |
| **conversion_rate** | Decimal | No | Conversion % | Conversion, Close Rate, Win Rate |
| **return_rate** | Decimal | No | Return % | Returns, Return Rate, Refund Rate |
| **unique_customers** | Integer | No | Customer count | Customers, Buyers, Clients |
| **new_customers** | Integer | No | New customers | New, First-time, Acquired |
| **mom_change** | Decimal | No | MoM change | MoM, Monthly, Month Change |
| **yoy_change** | Decimal | No | YoY change | YoY, Annual, Year Change |

**Granularity Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| hourly | Hourly, Hour, By Hour, Per Hour |
| daily | Daily, Day, By Day, Per Day |
| weekly | Weekly, Week, By Week, Per Week |
| monthly | Monthly, Month, By Month, Per Month |
| quarterly | Quarterly, Quarter, Q1-Q4, Per Quarter |
| yearly | Yearly, Year, Annual, Per Year |

---

### Table 4: SALES_PIPELINE

Sales opportunities and pipeline.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **opportunity_id** | String | Yes | Unique opportunity ID | Opportunity ID, Opp ID, Deal ID, Lead ID, Prospect ID |
| **opportunity_name** | String | Yes | Opportunity name | Name, Deal Name, Opportunity, Title |
| **customer_id** | String | Yes | Customer/prospect | Customer, Prospect, Lead, Account |
| **customer_name** | String | No | Customer name | Customer Name, Company, Account Name |
| **value** | Decimal | Yes | Opportunity value | Value, Amount, Deal Size, Expected Revenue |
| **stage** | Enum | Yes | Pipeline stage | Stage, Phase, Status, Step |
| **probability** | Decimal | Yes | Win probability % | Probability, Likelihood, Confidence, Win Rate |
| **weighted_value** | Decimal | No | Value × Probability | Weighted, Expected Value, Forecast |
| **salesperson_id** | String | Yes | Owner/rep | Salesperson, Owner, Rep, Agent |
| **created_date** | Date | Yes | When created | Created, Open Date, Start Date |
| **expected_close** | Date | Yes | Expected close date | Close Date, Expected, Target Date |
| **actual_close** | Date | No | Actual close date | Closed Date, Won Date |
| **source** | String | No | Lead source | Source, Origin, Lead Source, Channel |
| **product** | String | No | Product interest | Product, Interest, Solution |
| **notes** | Text | No | Opportunity notes | Notes, Comments, Remarks |

**Stage Values:**
| Value | Probability | Alternative Keywords |
|-------|-------------|---------------------|
| lead | 10% | Lead, Prospect, New, Initial |
| qualified | 25% | Qualified, MQL, SQL, Contacted |
| proposal | 50% | Proposal, Quote, Presented, Demo |
| negotiation | 75% | Negotiation, Terms, Discussion, Review |
| closed_won | 100% | Won, Closed Won, Success, Booked |
| closed_lost | 0% | Lost, Closed Lost, Failed, Declined |

---

### Table 5: PRODUCTS

Product master for sales.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **product_id** | String | Yes | Unique product ID | Product ID, SKU, Item ID, Part Number, Article Number |
| **product_name** | String | Yes | Product name | Name, Title, Description, Product Name |
| **category** | String | Yes | Product category | Category, Type, Classification, Group, Family |
| **subcategory** | String | No | Subcategory | Subcategory, Sub-type |
| **unit_price** | Decimal | Yes | Selling price | Price, Sell Price, List Price, Retail Price |
| **cost_price** | Decimal | Yes | Cost price | Cost, Unit Cost, COGS, Standard Cost |
| **margin** | Decimal | No | Profit margin % | Margin, Profit Margin, Markup |
| **status** | Enum | Yes | Product status | Status, State, Active |
| **stock_quantity** | Integer | No | Available stock | Stock, Inventory, Available, On Hand |

---

### Table 6: SALES_TARGETS

Sales targets and quotas.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **target_id** | String | Yes | Unique target ID | Target ID, Quota ID, Goal ID |
| **period** | String | Yes | Target period | Period, Month, Quarter, Year |
| **salesperson_id** | String | No | Rep (null for team) | Salesperson, Rep, Owner |
| **region** | String | No | Region (null for all) | Region, Territory |
| **target_revenue** | Decimal | Yes | Revenue target | Target, Quota, Goal, Budget |
| **target_orders** | Integer | No | Order target | Orders, Transaction Target |
| **actual_revenue** | Decimal | No | Actual revenue | Actual, Achieved, Revenue |
| **actual_orders** | Integer | No | Actual orders | Orders, Transactions |
| **achievement** | Decimal | No | Achievement % | Achievement, Attainment, Progress |
| **variance** | Decimal | No | Target variance | Variance, Gap, Difference |

---

### Table 7: PROMOTIONS

Sales promotions and campaigns.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **promotion_id** | String | Yes | Unique promotion ID | Promotion ID, Campaign ID, Promo ID, Offer ID |
| **promotion_name** | String | Yes | Promotion name | Name, Campaign Name, Title, Description |
| **start_date** | Date | Yes | Start date | Start, Begin, From Date, Launch Date |
| **end_date** | Date | Yes | End date | End, Finish, To Date, Expiry |
| **discount_type** | Enum | Yes | Type of discount | Type, Discount Type, Promo Type |
| **discount_value** | Decimal | Yes | Discount amount/% | Value, Discount, Amount, Percentage |
| **products** | String | No | Eligible products | Products, Items, SKUs, Applicable |
| **min_purchase** | Decimal | No | Minimum order | Minimum, Min Purchase, Threshold |
| **budget** | Decimal | No | Campaign budget | Budget, Spend, Investment |
| **actual_spend** | Decimal | No | Actual spent | Spend, Cost, Actual |
| **orders_generated** | Integer | No | Orders from promo | Orders, Conversions, Sales |
| **revenue_generated** | Decimal | No | Revenue from promo | Revenue, Sales, Amount |
| **roi** | Decimal | No | Return on investment | ROI, Return, Effectiveness |
| **status** | Enum | Yes | Promotion status | Status, State, Active |

---

## Dashboard Details

### Dashboard 1: Sales Insights

**Purpose:** Key metrics with hourly/daily/weekly/monthly/yearly views.

**KPI Cards (8 cards with sparklines):**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Sales | SUM(total_amount) | Up |
| Total Orders | COUNT(order_id) | Up |
| Avg Order Value | SUM(amount) / COUNT(orders) | Up |
| Total Profit | SUM(profit) | Up |
| Unique Customers | COUNT(DISTINCT customer_id) | Up |
| Return Rate | Returns / Total orders | Down |
| Conversion Rate | Orders / Opportunities | Up |
| Top Product | MAX(SUM by product) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Heatmap - Sales by Hour/Day | SALES_ORDERS | hour | day (intensity = sales) |
| Bar Chart - Top Products | SALES_ORDER_LINES | product_name | SUM(line_total) |
| Line Chart - Trend | SALES_METRICS | period | total_revenue |
| Pie Chart - By Channel | SALES_ORDERS | channel | SUM(total_amount) |

**Required Table Columns:**
- SALES_ORDERS: order_id, order_date, total_amount, profit, customer_id, channel
- SALES_METRICS: period, total_revenue

---

### Dashboard 2: Sales Performance

**Purpose:** Track individual and team sales performance.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Team Revenue | SUM(total_amount) | Up |
| Avg per Rep | Revenue / Rep count | Up |
| Target Achievement | Actual / Target * 100 | Up (>100%) |
| Top Performer | MAX(SUM by rep) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Revenue by Rep | SALES_ORDERS | salesperson_name | SUM(total_amount) |
| Bar Chart - Target vs Actual | SALES_TARGETS | salesperson_name | target, actual |
| Scatter Plot - Revenue vs Orders | SALES_METRICS | total_orders | total_revenue |
| Line Chart - Performance Trend | SALES_METRICS | period | revenue by rep |

**Required Table Columns:**
- SALES_ORDERS: salesperson_id, salesperson_name, total_amount
- SALES_TARGETS: salesperson_id, target_revenue, actual_revenue

---

### Dashboard 3: Sales Analysis

**Purpose:** Deep analysis by product, region, and customer.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Product Count | COUNT(DISTINCT product_id) | N/A |
| Top Region | MAX(SUM by region) | N/A |
| Category Leader | MAX(SUM by category) | N/A |
| Profit Margin | Total profit / Revenue | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Sales by Product | SALES_ORDER_LINES | product_name | SUM(line_total) |
| Bar Chart - Sales by Region | SALES_ORDERS | region | SUM(total_amount) |
| Pie Chart - Category Mix | SALES_ORDER_LINES | category | SUM(line_total) |
| Bar Chart - Top Customers | SALES_ORDERS | customer_name | SUM(total_amount) |

**Required Table Columns:**
- SALES_ORDERS: region, customer_id, customer_name, total_amount
- SALES_ORDER_LINES: product_id, product_name, category, line_total

---

### Dashboard 4: Sales Forecast

**Purpose:** Predict future revenue and trends.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Forecast (Next Month) | Predicted revenue | N/A |
| Pipeline Value | SUM(weighted_value) | Up |
| Win Rate | Won / (Won + Lost) | Up |
| Forecast Accuracy | Actual vs Forecast | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Line Chart - Revenue Forecast | SALES_METRICS | period | actual, forecast |
| Bar Chart - Pipeline by Stage | SALES_PIPELINE | stage | SUM(value) |
| Line Chart - Trend Projection | SALES_METRICS | period | trend |
| Bar Chart - Expected Closes | SALES_PIPELINE | expected_close | SUM(weighted_value) |

**Required Table Columns:**
- SALES_METRICS: period, total_revenue, forecast
- SALES_PIPELINE: stage, value, probability, weighted_value, expected_close

---

### Dashboard 5: Sales Funnel

**Purpose:** Visualize the sales pipeline stages.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Pipeline | SUM(value) | Up |
| Weighted Pipeline | SUM(weighted_value) | Up |
| Avg Deal Size | AVG(value) | Up |
| Stage Conversion | Next stage / Current stage | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Funnel Chart - Pipeline Stages | SALES_PIPELINE | stage | SUM(value) |
| Bar Chart - Value by Stage | SALES_PIPELINE | stage | SUM(value) |
| Pie Chart - Stage Distribution | SALES_PIPELINE | stage | COUNT |
| Bar Chart - Avg Deal by Stage | SALES_PIPELINE | stage | AVG(value) |

**Required Table Columns:**
- SALES_PIPELINE: opportunity_id, stage, value, probability, weighted_value

---

### Dashboard 6: Sales Segmentation

**Purpose:** Analyze sales by customer segment.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Segments | COUNT(DISTINCT segment) | N/A |
| Top Segment Revenue | MAX(SUM by segment) | N/A |
| New Customer % | New / Total customers | Balanced |
| Repeat Purchase Rate | Repeat orders / Total | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Revenue by Segment | SALES_ORDERS + CUSTOMERS | segment | SUM(total_amount) |
| Pie Chart - Segment Distribution | CUSTOMERS | segment | COUNT |
| Bar Chart - AOV by Segment | SALES_ORDERS | segment | AVG(total_amount) |
| Line Chart - Segment Trends | SALES_METRICS | period | revenue by segment |

**Required Table Columns:**
- SALES_ORDERS: customer_id, total_amount
- CUSTOMERS: customer_id, segment

---

### Dashboard 7: Sales Promotions

**Purpose:** Track campaign and promotion effectiveness.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Active Promotions | COUNT(status = 'active') | N/A |
| Promo Revenue | SUM(revenue_generated) | Up |
| Avg ROI | AVG(roi) | Up |
| Best Campaign | MAX(revenue_generated) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Revenue by Promo | PROMOTIONS | promotion_name | revenue_generated |
| Bar Chart - ROI by Campaign | PROMOTIONS | promotion_name | roi |
| Line Chart - Promo Impact | SALES_METRICS | period | with promo, without promo |
| Pie Chart - Promo Type Mix | PROMOTIONS | discount_type | COUNT |

**Required Table Columns:**
- PROMOTIONS: promotion_id, promotion_name, revenue_generated, roi, status
- SALES_ORDERS: order_id, promotion_id, total_amount

---

## KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Revenue | Total Sales | SUM(order totals) | Currency |
| AOV | Average Order Value | Revenue / Orders | Currency |
| Profit Margin | Gross Margin | Profit / Revenue * 100 | Percentage |
| Conversion Rate | Close Rate | Orders / Opportunities | Percentage |
| Win Rate | Success Rate | Won / (Won + Lost) | Percentage |
| Return Rate | Refund Rate | Returns / Orders | Percentage |
| Pipeline Value | Total Opportunities | SUM(opportunity values) | Currency |
| Weighted Pipeline | Expected Value | SUM(value × probability) | Currency |
| Target Achievement | Quota Attainment | Actual / Target * 100 | Percentage |
| ROI | Return on Investment | (Revenue - Cost) / Cost * 100 | Percentage |

---

## Chart Types

| Chart | When to Use | Example in Dashboard |
|-------|-------------|---------------------|
| Bar Chart | Comparing products/reps | Sales by Product |
| Line Chart | Trends over time | Revenue Trend |
| Pie Chart | Distribution | Channel Mix |
| Funnel Chart | Pipeline stages | Sales Funnel |
| Scatter Plot | Correlation | Revenue vs Orders |
| Heatmap | Pattern analysis | Sales by Hour/Day |

---

[Back to Main Wiki](../README_EN.md) | [Previous: Purchases](../05_Purchases/README_EN.md)
