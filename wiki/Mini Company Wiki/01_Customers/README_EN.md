# Customers Department - Complete Dashboard Wiki

> **Department Focus:** Customer Intelligence & Analytics
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

The Customers Department provides comprehensive analytics for understanding, segmenting, and optimizing customer relationships. It tracks the entire customer lifecycle from acquisition to churn prediction.

### Business Questions Answered

- Who are our most valuable customers?
- Which customers are at risk of churning?
- What are the common behavior patterns?
- How satisfied are our customers?
- What is the customer lifetime value?

---

## Dashboard Index

| # | Dashboard Name | Purpose | Key Charts |
|---|----------------|---------|------------|
| 1 | Customer Overview | Total customer base metrics | Bar, Pie |
| 2 | Segmentation & Value | Customer tier analysis | Bar, Scatter |
| 3 | Behavior Patterns | Purchase behavior tracking | Bar, Line |
| 4 | Retention & Churn | Churn analysis & prevention | Bar, Funnel |
| 5 | Journey Touchpoints | Customer interaction mapping | Bar, Pie |
| 6 | Satisfaction Feedback | NPS & satisfaction scores | Bar, Radar |
| 7 | Forecast Lifetime Risk | CLV prediction | Scatter, Line |

---

## Master Data Tables

### Table 1: CUSTOMERS (Primary)

The main customer master table.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **customer_id** | String | Yes | Unique customer identifier | Customer ID, Client ID, Account ID, Customer Number, Client Number, Customer Code, Account Number, Party ID, Contact ID |
| **customer_name** | String | Yes | Customer full name | Name, Full Name, Client Name, Account Name, Party Name, Contact Name, Business Name, Company Name |
| **email** | String | Yes | Primary email address | Email Address, E-mail, Contact Email, Primary Email, Electronic Mail |
| **phone** | String | No | Phone number | Phone Number, Telephone, Mobile, Cell, Contact Number, Tel, Mobile Number |
| **segment** | Enum | Yes | Customer segment | Customer Segment, Tier, Category, Classification, Customer Type, Customer Class, Group, Customer Group |
| **status** | Enum | Yes | Account status | Account Status, Customer Status, State, Active Status, Relationship Status |
| **registration_date** | Date | Yes | Account creation date | Created Date, Sign Up Date, Join Date, Onboarding Date, Start Date, Account Created, First Purchase Date |
| **last_activity_date** | Date | No | Last interaction date | Last Active, Last Login, Last Purchase, Last Transaction, Last Contact, Recent Activity |
| **country** | String | No | Customer country | Country, Location, Region, Territory, Geography, Nation |
| **city** | String | No | Customer city | City, Town, Municipality, Urban Area, Location |
| **industry** | String | No | Business industry | Industry, Sector, Business Type, Vertical, Market Segment |
| **company_size** | String | No | Company size category | Company Size, Employee Count, Organization Size, Business Size, Headcount Range |
| **source** | String | No | Acquisition source | Acquisition Source, Lead Source, Channel, How Found, Origin, Referral Source |

**Segment Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| vip | Top-tier customers | VIP, Premium, Platinum, Gold, Elite, Key Account, Strategic |
| loyal | Repeat customers | Loyal, Regular, Returning, Repeat, Established, Core |
| standard | Normal customers | Standard, Regular, Normal, Average, Base, General |
| new | Recently acquired | New, Recent, Fresh, Newcomer, Onboarding, Prospect |
| at_risk | Churn risk customers | At Risk, Risk, Churning, Declining, Inactive, Dormant, Lapsed |

**Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| active | Active customer | Active, Live, Current, Open, Engaged |
| inactive | Dormant customer | Inactive, Dormant, Sleeping, Paused, Suspended |
| churned | Lost customer | Churned, Lost, Cancelled, Terminated, Closed, Departed |

---

### Table 2: CUSTOMER_TRANSACTIONS

Customer purchase and transaction history.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **transaction_id** | String | Yes | Unique transaction ID | Transaction ID, Order ID, Invoice ID, Receipt ID, Purchase ID, Sale ID, Reference Number |
| **customer_id** | String | Yes | Reference to customer | Customer ID, Client ID, Account ID, Buyer ID |
| **transaction_date** | DateTime | Yes | Transaction timestamp | Date, Order Date, Purchase Date, Sale Date, Invoice Date, Transaction Time |
| **amount** | Decimal | Yes | Transaction value | Amount, Value, Total, Sum, Revenue, Sales Amount, Order Value, Invoice Amount, Gross Amount |
| **currency** | String | Yes | Currency code | Currency, Currency Code, Money Type, Denomination |
| **product_category** | String | No | Product category | Category, Product Type, Item Category, Department, Product Group, Classification |
| **quantity** | Integer | No | Items purchased | Quantity, Qty, Count, Units, Number of Items, Pieces |
| **discount** | Decimal | No | Discount applied | Discount, Discount Amount, Reduction, Rebate, Price Reduction, Markdown |
| **payment_method** | String | No | Payment type | Payment Method, Payment Type, Tender Type, Payment Mode, How Paid |
| **channel** | String | No | Sales channel | Channel, Sales Channel, Source, Platform, Touchpoint, Medium |

---

### Table 3: CUSTOMER_METRICS (Aggregated)

Pre-calculated customer metrics for dashboards.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **customer_id** | String | Yes | Reference to customer | Customer ID, Client ID, Account ID |
| **lifetime_value** | Decimal | Yes | Customer lifetime value | CLV, LTV, Lifetime Value, Customer Value, Total Revenue, Lifetime Revenue, CLTV |
| **total_revenue** | Decimal | Yes | Total revenue generated | Revenue, Total Sales, Cumulative Revenue, Total Spend, Purchase Total |
| **total_orders** | Integer | Yes | Total order count | Orders, Order Count, Purchase Count, Transaction Count, Number of Orders |
| **average_order_value** | Decimal | Yes | Average order value | AOV, Avg Order, Average Purchase, Mean Order Value, Average Basket |
| **purchase_frequency** | Decimal | Yes | Purchases per period | Frequency, Purchase Rate, Buy Rate, Order Frequency, Visit Frequency |
| **days_since_last_purchase** | Integer | Yes | Recency in days | Recency, Days Inactive, Last Purchase Days, Dormancy Period |
| **engagement_score** | Decimal | Yes | Engagement level (0-100) | Engagement, Activity Score, Interaction Score, Activity Level |
| **satisfaction_score** | Decimal | No | Satisfaction rating (0-100) | CSAT, Satisfaction, Customer Satisfaction, Happy Score, Rating |
| **nps_score** | Integer | No | Net Promoter Score (-100 to 100) | NPS, Net Promoter, Promoter Score, Recommendation Score, Loyalty Score |
| **churn_risk** | Decimal | Yes | Churn probability (0-100) | Churn Risk, Risk Score, Attrition Risk, Churn Probability, Leave Risk |
| **health_score** | Decimal | No | Overall health (0-100) | Health, Customer Health, Account Health, Relationship Score |

---

### Table 4: CUSTOMER_INTERACTIONS

Customer touchpoint and interaction log.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **interaction_id** | String | Yes | Unique interaction ID | Interaction ID, Activity ID, Event ID, Touchpoint ID, Log ID |
| **customer_id** | String | Yes | Reference to customer | Customer ID, Client ID, Account ID |
| **interaction_date** | DateTime | Yes | Interaction timestamp | Date, Activity Date, Event Date, Contact Date, Timestamp |
| **interaction_type** | Enum | Yes | Type of interaction | Type, Channel, Medium, Touchpoint, Contact Type, Activity Type |
| **channel** | String | Yes | Interaction channel | Channel, Medium, Platform, Source, Communication Channel |
| **direction** | Enum | No | Inbound or outbound | Direction, Flow, Initiated By, Source Direction |
| **subject** | String | No | Interaction subject | Subject, Topic, Reason, Purpose, Title |
| **sentiment** | Enum | No | Sentiment analysis | Sentiment, Mood, Tone, Feeling, Emotion |
| **resolution** | Boolean | No | Was issue resolved | Resolved, Completed, Closed, Done, Finished |
| **agent_id** | String | No | Support agent ID | Agent, Rep, Representative, Handler, Employee ID |
| **duration_minutes** | Integer | No | Interaction duration | Duration, Time Spent, Length, Minutes, Call Time |

**Interaction Type Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| email | Email, E-mail, Message, Electronic Mail |
| call | Call, Phone, Telephone, Voice |
| chat | Chat, Live Chat, Instant Message, IM, Messenger |
| visit | Visit, In-Person, Store Visit, Office Visit, Meeting |
| purchase | Purchase, Buy, Order, Transaction |
| support | Support, Help, Ticket, Issue, Case |
| feedback | Feedback, Review, Survey, Rating, Comment |
| social | Social, Social Media, Tweet, Post, Comment |

---

### Table 5: CUSTOMER_FEEDBACK

Customer satisfaction and feedback records.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **feedback_id** | String | Yes | Unique feedback ID | Feedback ID, Survey ID, Response ID, Review ID |
| **customer_id** | String | Yes | Reference to customer | Customer ID, Client ID, Respondent ID |
| **feedback_date** | Date | Yes | Feedback submission date | Date, Submission Date, Response Date, Survey Date |
| **feedback_type** | Enum | Yes | Type of feedback | Type, Category, Feedback Category, Survey Type |
| **rating** | Integer | Yes | Numeric rating (1-5 or 1-10) | Rating, Score, Stars, Grade, Points, Value |
| **nps_response** | Integer | No | NPS response (0-10) | NPS, NPS Score, Promoter Score, Recommendation Score |
| **comment** | Text | No | Free text feedback | Comment, Feedback, Notes, Remarks, Text, Response, Review |
| **category** | String | No | Feedback category | Category, Topic, Area, Subject, Aspect |
| **sentiment** | Enum | No | Detected sentiment | Sentiment, Tone, Mood, Feeling, Polarity |
| **product_id** | String | No | Related product | Product, Item, SKU, Product ID |
| **resolved** | Boolean | No | Issue addressed | Resolved, Handled, Addressed, Closed |

---

## Dashboard Details

### Dashboard 1: Customer Overview

**Purpose:** Provide high-level view of the entire customer base.

**KPI Cards (Top Row):**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Customers | COUNT(customers) | Up |
| Active Customers (90-day) | COUNT(last_activity > 90 days ago) | Up |
| New Customers (Month) | COUNT(registration_date in current month) | Up |
| Churned (12-month) | COUNT(status = 'churned' in 12 months) | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Segment Distribution | CUSTOMERS | segment | COUNT |
| Bar Chart - Registration Trend | CUSTOMERS | registration_date (monthly) | COUNT |
| Pie Chart - Status Distribution | CUSTOMERS | status | COUNT |
| Pie Chart - Source Distribution | CUSTOMERS | source | COUNT |

**Required Table Columns:**
- CUSTOMERS: customer_id, segment, status, registration_date, last_activity_date, source

---

### Dashboard 2: Segmentation & Value

**Purpose:** Analyze customer value by segment and tier.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| VIP Customers | COUNT(segment = 'vip') | Up |
| VIP Revenue Share | SUM(revenue WHERE segment = 'vip') / SUM(revenue) | Stable |
| Average CLV | AVG(lifetime_value) | Up |
| Top 20% Revenue Share | Revenue from top 20% / Total Revenue | Stable |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Revenue by Segment | CUSTOMER_METRICS | segment | SUM(lifetime_value) |
| Bar Chart - Customer Count by Segment | CUSTOMERS | segment | COUNT |
| Scatter Plot - Value vs Frequency | CUSTOMER_METRICS | purchase_frequency | lifetime_value (size = total_orders) |
| Pie Chart - Revenue Distribution | CUSTOMER_METRICS | segment | SUM(lifetime_value) |

**Required Table Columns:**
- CUSTOMERS: customer_id, segment
- CUSTOMER_METRICS: customer_id, lifetime_value, total_orders, purchase_frequency

---

### Dashboard 3: Behavior Patterns

**Purpose:** Understand purchasing behavior and patterns.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Avg Order Value | AVG(amount) from TRANSACTIONS | Up |
| Purchase Frequency | AVG(total_orders / account_age_months) | Up |
| Repeat Purchase Rate | COUNT(orders > 1) / COUNT(customers) | Up |
| Multi-Category Buyers | COUNT(distinct categories > 1) / COUNT(customers) | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Purchases by Day of Week | TRANSACTIONS | day_of_week | COUNT |
| Bar Chart - Purchases by Hour | TRANSACTIONS | hour | COUNT |
| Line Chart - Monthly Purchase Trend | TRANSACTIONS | month | COUNT |
| Pie Chart - Payment Method Distribution | TRANSACTIONS | payment_method | COUNT |
| Pie Chart - Channel Distribution | TRANSACTIONS | channel | COUNT |

**Required Table Columns:**
- CUSTOMER_TRANSACTIONS: transaction_id, customer_id, transaction_date, amount, payment_method, channel, product_category

---

### Dashboard 4: Retention & Churn

**Purpose:** Monitor retention rates and identify churn risks.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Retention Rate | (Customers end - New) / Customers start | Up |
| Churn Rate | Churned / Total Customers | Down |
| At-Risk Customers | COUNT(churn_risk > 70) | Down |
| Win-Back Rate | Reactivated / Churned | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Monthly Retention | CUSTOMERS | month | retention_rate |
| Bar Chart - Churn by Segment | CUSTOMERS | segment | COUNT(churned) |
| Funnel Chart - Customer Lifecycle | CUSTOMERS | stage | COUNT |
| Scatter Plot - Risk vs Value | CUSTOMER_METRICS | churn_risk | lifetime_value |

**Required Table Columns:**
- CUSTOMERS: customer_id, segment, status, registration_date
- CUSTOMER_METRICS: customer_id, churn_risk, lifetime_value, days_since_last_purchase

---

### Dashboard 5: Journey Touchpoints

**Purpose:** Map customer interactions across all channels.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Interactions | COUNT(interactions) | Up (quality) |
| Avg Interactions per Customer | COUNT(interactions) / COUNT(customers) | Optimal |
| Email Open Rate | Opened / Sent | Up |
| Support Resolution Rate | Resolved / Total Tickets | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Interactions by Channel | INTERACTIONS | channel | COUNT |
| Bar Chart - Interactions by Type | INTERACTIONS | interaction_type | COUNT |
| Pie Chart - Channel Distribution | INTERACTIONS | channel | COUNT |
| Line Chart - Interaction Trend | INTERACTIONS | date (monthly) | COUNT |

**Required Table Columns:**
- CUSTOMER_INTERACTIONS: interaction_id, customer_id, interaction_date, interaction_type, channel, resolution

---

### Dashboard 6: Satisfaction Feedback

**Purpose:** Track customer satisfaction and feedback.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| NPS Score | (Promoters - Detractors) / Total * 100 | Up |
| CSAT Score | Avg Satisfaction Rating | Up |
| Response Rate | Responses / Surveys Sent | Up |
| Positive Sentiment % | Positive / Total Feedback | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Rating Distribution | FEEDBACK | rating | COUNT |
| Radar Chart - Satisfaction by Category | FEEDBACK | category | AVG(rating) |
| Pie Chart - Sentiment Distribution | FEEDBACK | sentiment | COUNT |
| Line Chart - NPS Trend | FEEDBACK | date (monthly) | nps_score |

**Required Table Columns:**
- CUSTOMER_FEEDBACK: feedback_id, customer_id, rating, nps_response, sentiment, category, feedback_date
- CUSTOMER_METRICS: customer_id, nps_score, satisfaction_score

---

### Dashboard 7: Forecast Lifetime Risk

**Purpose:** Predict customer lifetime value and churn risk.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Predicted CLV (90-day) | ML Model Prediction | Up |
| High-Risk Customers | COUNT(churn_risk > 80) | Down |
| Revenue at Risk | SUM(CLV WHERE churn_risk > 70) | Down |
| Predicted Growth | Predicted vs Current Revenue | Up |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Scatter Plot - CLV vs Risk | CUSTOMER_METRICS | churn_risk | lifetime_value |
| Line Chart - CLV Forecast | CUSTOMER_METRICS | date | predicted_clv |
| Bar Chart - Risk Distribution | CUSTOMER_METRICS | risk_bucket | COUNT |
| Pie Chart - Value Concentration | CUSTOMER_METRICS | value_tier | SUM(lifetime_value) |

**Required Table Columns:**
- CUSTOMER_METRICS: customer_id, lifetime_value, churn_risk, engagement_score, health_score

---

## KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| CLV | Customer Lifetime Value | Total Revenue from Customer | Currency |
| NPS | Net Promoter Score | (Promoters% - Detractors%) * 100 | -100 to 100 |
| CSAT | Customer Satisfaction Score | Avg(Rating) / Max(Rating) * 100 | Percentage |
| AOV | Average Order Value | Total Revenue / Order Count | Currency |
| Churn Rate | Customer Attrition Rate | Churned / Starting Customers | Percentage |
| Retention Rate | Customer Retention | 1 - Churn Rate | Percentage |
| Purchase Frequency | Buying Frequency | Orders / Active Months | Number |
| Engagement Score | Activity Level | Weighted interactions score | 0-100 |

---

## Chart Types

| Chart | When to Use | Example in Dashboard |
|-------|-------------|---------------------|
| Bar Chart | Comparing categories | Segment Distribution |
| Line Chart | Showing trends | Monthly Trends |
| Pie Chart | Showing composition | Status Distribution |
| Scatter Plot | Correlation analysis | CLV vs Risk |
| Radar Chart | Multi-metric comparison | Satisfaction Categories |
| Funnel Chart | Stage progression | Customer Lifecycle |

---

[Back to Main Wiki](../README_EN.md) | [Next: Suppliers](../02_Suppliers/README_EN.md)
