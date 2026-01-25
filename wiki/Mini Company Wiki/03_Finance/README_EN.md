# Finance Department - Complete Dashboard Wiki

> **Department Focus:** Expense Management & Financial Control
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

The Finance Department provides comprehensive analytics for managing expenses, controlling costs, tracking budgets, and optimizing financial performance. It enables data-driven decision making for expense approvals and financial planning.

### Business Questions Answered

- What are our major expense categories?
- Are we within budget?
- Which departments are overspending?
- What are the expense trends?
- How can we optimize our spending?

---

## Dashboard Index

| # | Dashboard Name | Purpose | Key Charts |
|---|----------------|---------|------------|
| 1 | Expenses Overview | Total expense metrics | Bar, Pie |
| 2 | Category Analysis | Expense breakdown by category | Bar, Pie |
| 3 | Fixed vs Variable | Cost structure analysis | Bar, Pie |
| 4 | Trends & Anomalies | Pattern detection | Line, Bar |
| 5 | Approval Flow | Expense approval tracking | Funnel, Bar |
| 6 | Department Accountability | Department spending | Bar, Radar |
| 7 | Forecast Optimization | Budget planning | Line, Bar |

---

## Master Data Tables

### Table 1: EXPENSES (Primary)

The main expense transaction table.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **expense_id** | String | Yes | Unique expense identifier | Expense ID, Transaction ID, Voucher Number, Entry ID, Record ID, Document Number, Claim ID |
| **expense_date** | Date | Yes | Date of expense | Date, Transaction Date, Posting Date, Entry Date, Voucher Date, Claim Date |
| **amount** | Decimal | Yes | Expense amount | Amount, Value, Sum, Total, Cost, Expenditure, Spend |
| **currency** | String | Yes | Currency code | Currency, Currency Code, Money Type, Denomination |
| **category** | String | Yes | Expense category | Category, Type, Classification, Expense Type, Account, Cost Type, Nature |
| **subcategory** | String | No | Expense subcategory | Subcategory, Sub-type, Detail Category, Secondary Category |
| **description** | String | No | Expense description | Description, Details, Narrative, Notes, Remarks, Purpose, Memo |
| **department** | String | Yes | Requesting department | Department, Dept, Cost Center, Business Unit, Division, Section |
| **employee_id** | String | Yes | Requester ID | Employee ID, Staff ID, User ID, Requester, Claimant, Submitter |
| **employee_name** | String | No | Requester name | Name, Employee Name, Full Name, Requester Name |
| **vendor** | String | No | Vendor/payee | Vendor, Supplier, Payee, Merchant, Seller, Provider |
| **payment_method** | String | No | How paid | Payment Method, Payment Type, Tender, Pay Mode, Settlement Method |
| **receipt** | Boolean | No | Receipt attached | Receipt, Attachment, Document, Proof, Evidence, Voucher |
| **status** | Enum | Yes | Approval status | Status, State, Approval Status, Workflow Status |
| **type** | Enum | Yes | Fixed or variable | Type, Cost Type, Expense Nature, Cost Classification |
| **project** | String | No | Project reference | Project, Project Code, Job, Work Order, Cost Object |
| **budget_code** | String | No | Budget line item | Budget Code, Budget Line, GL Account, Account Code, Cost Element |

**Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| pending | Awaiting approval | Pending, Submitted, Awaiting, Open, New, Draft |
| approved | Approved for payment | Approved, Authorized, Accepted, Confirmed |
| paid | Payment completed | Paid, Settled, Processed, Completed, Closed |
| rejected | Rejected | Rejected, Declined, Denied, Returned, Cancelled |
| on_hold | Temporarily held | On Hold, Held, Suspended, Pending Info, Query |

**Type Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| fixed | Fixed/recurring costs | Fixed, Recurring, Regular, Committed, Overhead, Indirect |
| variable | Variable/discretionary | Variable, Discretionary, Optional, Direct, Ad-hoc |
| capital | Capital expenditure | Capital, CapEx, Asset, Investment, Long-term |

---

### Table 2: EXPENSE_CATEGORIES

Category master for expenses.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **category_id** | String | Yes | Unique category ID | Category ID, Code, Category Code, Account Code |
| **category_name** | String | Yes | Category display name | Name, Category Name, Title, Label, Description |
| **parent_category** | String | No | Parent category | Parent, Parent Category, Master Category, Group |
| **type** | Enum | Yes | Fixed or variable | Type, Category Type, Nature, Classification |
| **budget_limit** | Decimal | No | Monthly budget limit | Limit, Budget, Cap, Threshold, Maximum |
| **gl_account** | String | No | General ledger account | GL Account, Account Number, Ledger Code, Chart of Account |
| **active** | Boolean | Yes | Is category active | Active, Enabled, Live, Status |

**Common Categories:**
| Category | Type | Alternative Keywords |
|----------|------|---------------------|
| Salaries | Fixed | Salaries, Wages, Payroll, Compensation, Staff Costs, Personnel |
| Rent | Fixed | Rent, Lease, Premises, Facility Cost, Office Rent |
| Utilities | Fixed | Utilities, Bills, Electricity, Water, Gas, Power |
| Travel | Variable | Travel, Business Travel, Transport, Trips, Transportation |
| Marketing | Variable | Marketing, Advertising, Promotion, Campaigns, Ads |
| Office Supplies | Variable | Office Supplies, Stationery, Consumables, Supplies |
| IT & Software | Variable | IT, Software, Technology, Subscriptions, Licenses, SaaS |
| Professional Services | Variable | Professional Services, Consulting, Legal, Audit, Advisory |
| Entertainment | Variable | Entertainment, Hospitality, Meals, Client Entertainment |
| Equipment | Capital | Equipment, Machinery, Assets, Hardware, Tools |

---

### Table 3: EXPENSE_BUDGETS

Budget allocations and tracking.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **budget_id** | String | Yes | Unique budget ID | Budget ID, Budget Code, Allocation ID |
| **period** | String | Yes | Budget period (YYYY-MM or YYYY) | Period, Month, Year, Fiscal Period, Financial Year |
| **department** | String | Yes | Department | Department, Cost Center, Business Unit |
| **category** | String | No | Category (if category budget) | Category, Expense Type, Account |
| **budget_amount** | Decimal | Yes | Budgeted amount | Budget, Allocation, Planned, Target, Limit |
| **actual_amount** | Decimal | No | Actual spent | Actual, Spent, Expenditure, Real |
| **variance** | Decimal | No | Variance (Actual - Budget) | Variance, Difference, Over/Under, Deviation |
| **variance_pct** | Decimal | No | Variance percentage | Variance %, Deviation %, Over/Under % |
| **forecast** | Decimal | No | Forecasted total | Forecast, Projected, Estimated, Outlook |
| **status** | Enum | No | Budget status | Status, Health, Condition |

**Budget Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| on_track | Within budget | On Track, Green, Normal, OK, Within |
| warning | Near limit (80-100%) | Warning, Yellow, Caution, Alert, Watch |
| over_budget | Exceeded budget | Over Budget, Red, Exceeded, Over, Critical |

---

### Table 4: EXPENSE_APPROVALS

Approval workflow tracking.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **approval_id** | String | Yes | Unique approval ID | Approval ID, Workflow ID, Task ID |
| **expense_id** | String | Yes | Reference to expense | Expense ID, Claim ID, Reference |
| **approver_id** | String | Yes | Approver ID | Approver, Reviewer, Authorizer, Manager ID |
| **approver_name** | String | No | Approver name | Name, Approver Name, Manager Name |
| **approval_level** | Integer | Yes | Approval level (1, 2, 3...) | Level, Step, Stage, Tier, Sequence |
| **submission_date** | DateTime | Yes | When submitted for approval | Submitted, Submission Date, Request Date |
| **approval_date** | DateTime | No | When approved/rejected | Approval Date, Action Date, Decision Date |
| **status** | Enum | Yes | Approval status | Status, Decision, Outcome, Result |
| **comments** | Text | No | Approver comments | Comments, Notes, Remarks, Feedback, Reason |
| **amount** | Decimal | Yes | Amount being approved | Amount, Value |

**Approval Status Values:**
| Value | Description | Alternative Keywords |
|-------|-------------|---------------------|
| pending | Awaiting decision | Pending, Awaiting, In Queue, Open |
| approved | Approved | Approved, Accepted, Authorized, Passed |
| rejected | Rejected | Rejected, Declined, Denied, Failed |
| escalated | Escalated to higher | Escalated, Elevated, Forwarded |

---

### Table 5: EXPENSE_METRICS (Aggregated)

Pre-calculated expense metrics.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **period** | String | Yes | Time period | Period, Month, Year-Month |
| **department** | String | No | Department (null for total) | Department, Cost Center |
| **category** | String | No | Category (null for total) | Category, Expense Type |
| **total_expenses** | Decimal | Yes | Total expenses | Total, Sum, Expenditure, Spend |
| **expense_count** | Integer | Yes | Number of transactions | Count, Transactions, Entries |
| **avg_expense** | Decimal | No | Average expense | Average, Mean, Avg |
| **budget_amount** | Decimal | No | Budget for period | Budget, Allocation |
| **variance** | Decimal | No | Budget variance | Variance, Difference |
| **fixed_expenses** | Decimal | No | Total fixed expenses | Fixed, Overhead, Recurring |
| **variable_expenses** | Decimal | No | Total variable expenses | Variable, Discretionary |
| **pending_approvals** | Integer | No | Pending approval count | Pending, Awaiting, Queue |
| **mom_change** | Decimal | No | Month-over-month change | MoM, Monthly Change, Trend |
| **yoy_change** | Decimal | No | Year-over-year change | YoY, Yearly Change, Annual |

---

### Table 6: EXPENSE_ANOMALIES

Detected expense anomalies.

| Column | Data Type | Required | Description | Alternative Keywords |
|--------|-----------|----------|-------------|---------------------|
| **anomaly_id** | String | Yes | Unique anomaly ID | ID, Detection ID, Alert ID |
| **expense_id** | String | Yes | Related expense | Expense ID, Transaction ID |
| **anomaly_type** | Enum | Yes | Type of anomaly | Type, Anomaly Type, Issue Type |
| **severity** | Enum | Yes | Severity level | Severity, Risk Level, Priority |
| **description** | String | Yes | Anomaly description | Description, Issue, Problem |
| **expected_value** | Decimal | No | Expected value | Expected, Normal, Baseline |
| **actual_value** | Decimal | Yes | Actual value | Actual, Value, Amount |
| **deviation_pct** | Decimal | No | Deviation percentage | Deviation, Variance, Difference |
| **detected_date** | DateTime | Yes | When detected | Date, Detection Date |
| **status** | Enum | Yes | Resolution status | Status, State |
| **resolved_by** | String | No | Who resolved | Resolver, Handler |

**Anomaly Type Values:**
| Value | Alternative Keywords |
|-------|---------------------|
| duplicate | Duplicate, Copy, Repeat, Same |
| unusual_amount | Unusual Amount, Large, Spike, Outlier |
| policy_violation | Policy Violation, Rule Break, Non-Compliant |
| missing_receipt | Missing Receipt, No Document, Unattached |
| unusual_vendor | Unusual Vendor, New Vendor, Unknown |
| frequency_anomaly | Frequency, Pattern, Timing |

---

## Dashboard Details

### Dashboard 1: Expenses Overview

**Purpose:** High-level view of all expenses and spending metrics.

**KPI Cards (Top Row):**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Total Expenses (YTD) | SUM(amount) YTD | Controlled |
| Monthly Expenses | SUM(amount) current month | Controlled |
| Daily Average | Monthly / Days in month | Stable |
| Expense Count | COUNT(expenses) | N/A |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Expenses by Category | EXPENSES | category | SUM(amount) |
| Bar Chart - Expenses by Department | EXPENSES | department | SUM(amount) |
| Pie Chart - Status Distribution | EXPENSES | status | COUNT |
| Line Chart - Monthly Trend | EXPENSE_METRICS | period | total_expenses |

**Required Table Columns:**
- EXPENSES: expense_id, expense_date, amount, category, department, status
- EXPENSE_METRICS: period, total_expenses

---

### Dashboard 2: Category Analysis

**Purpose:** Deep dive into expense categories and spending patterns.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Top Category | MAX(SUM(amount) by category) | N/A |
| Categories Active | COUNT(DISTINCT category) | Stable |
| Avg per Category | SUM(amount) / COUNT(category) | Controlled |
| Largest Single Expense | MAX(amount) | Controlled |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Top 10 Categories | EXPENSES | category | SUM(amount) |
| Pie Chart - Category Distribution | EXPENSES | category | SUM(amount) |
| Bar Chart - Subcategory Breakdown | EXPENSES | subcategory | SUM(amount) |
| Line Chart - Category Trends | EXPENSE_METRICS | period | amount by category |

**Required Table Columns:**
- EXPENSES: expense_id, category, subcategory, amount
- EXPENSE_CATEGORIES: category_id, category_name, type

---

### Dashboard 3: Fixed vs Variable

**Purpose:** Analyze cost structure and expense types.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Fixed Expenses | SUM(amount WHERE type = 'fixed') | Stable |
| Variable Expenses | SUM(amount WHERE type = 'variable') | Controlled |
| Fixed Ratio | Fixed / Total * 100 | Stable |
| Variable Ratio | Variable / Total * 100 | Optimized |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Fixed vs Variable | EXPENSE_METRICS | period | fixed, variable |
| Pie Chart - Type Distribution | EXPENSES | type | SUM(amount) |
| Bar Chart - Fixed by Category | EXPENSES | category (type=fixed) | SUM(amount) |
| Bar Chart - Variable by Category | EXPENSES | category (type=variable) | SUM(amount) |

**Required Table Columns:**
- EXPENSES: expense_id, amount, type, category
- EXPENSE_METRICS: fixed_expenses, variable_expenses

---

### Dashboard 4: Trends & Anomalies

**Purpose:** Identify spending patterns and detect anomalies.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| MoM Change | (This month - Last month) / Last month | Controlled |
| YoY Change | (This year - Last year) / Last year | Controlled |
| Anomalies Detected | COUNT(anomalies) | Down |
| High Severity | COUNT(severity = 'high') | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Line Chart - Monthly Trend | EXPENSE_METRICS | period | total_expenses |
| Line Chart - YoY Comparison | EXPENSE_METRICS | month | this year, last year |
| Bar Chart - Anomaly Types | EXPENSE_ANOMALIES | anomaly_type | COUNT |
| Scatter Plot - Expense Distribution | EXPENSES | date | amount |

**Required Table Columns:**
- EXPENSE_METRICS: period, total_expenses, mom_change, yoy_change
- EXPENSE_ANOMALIES: anomaly_id, anomaly_type, severity

---

### Dashboard 5: Approval Flow

**Purpose:** Track expense approval workflow and bottlenecks.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Pending Approvals | COUNT(status = 'pending') | Down |
| Avg Approval Time | AVG(approval_date - submission_date) | Down |
| Approval Rate | Approved / Total submissions | Up |
| Rejected Rate | Rejected / Total submissions | Down |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Funnel Chart - Approval Pipeline | EXPENSE_APPROVALS | stage | COUNT |
| Bar Chart - Pending by Approver | EXPENSE_APPROVALS | approver_name | COUNT(pending) |
| Pie Chart - Approval Status | EXPENSE_APPROVALS | status | COUNT |
| Bar Chart - Avg Approval Time by Level | EXPENSE_APPROVALS | approval_level | AVG(days) |

**Required Table Columns:**
- EXPENSE_APPROVALS: approval_id, expense_id, approver_id, status, submission_date, approval_date
- EXPENSES: expense_id, status

---

### Dashboard 6: Department Accountability

**Purpose:** Track spending by department and budget compliance.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Departments | COUNT(DISTINCT department) | N/A |
| Over Budget Count | COUNT(variance > 0) | Down |
| Top Spender | MAX(SUM(amount) by dept) | N/A |
| Avg per Department | SUM(amount) / COUNT(dept) | Stable |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Bar Chart - Spend by Department | EXPENSES | department | SUM(amount) |
| Bar Chart - Budget vs Actual | EXPENSE_BUDGETS | department | budget, actual |
| Radar Chart - Department Spending | EXPENSES | department | various metrics |
| Pie Chart - Department Distribution | EXPENSES | department | SUM(amount) |

**Required Table Columns:**
- EXPENSES: expense_id, department, amount
- EXPENSE_BUDGETS: department, budget_amount, actual_amount, variance

---

### Dashboard 7: Forecast Optimization

**Purpose:** Budget planning and expense optimization.

**KPI Cards:**

| KPI | Calculation | Target Trend |
|-----|-------------|--------------|
| Forecast (Year End) | Projected annual total | On Target |
| Projected Variance | Forecast - Budget | Minimal |
| Optimization Potential | Identified savings | Up |
| Budget Utilization | Actual / Budget | 90-100% |

**Charts:**

| Chart Type | Data Source | X-Axis | Y-Axis |
|------------|-------------|--------|--------|
| Line Chart - Actual vs Forecast | EXPENSE_METRICS | period | actual, forecast |
| Bar Chart - Budget Utilization | EXPENSE_BUDGETS | department | utilization % |
| Bar Chart - Optimization Areas | Analysis | category | potential savings |
| Line Chart - Projection | EXPENSE_METRICS | period | projected |

**Required Table Columns:**
- EXPENSE_METRICS: period, total_expenses, forecast
- EXPENSE_BUDGETS: department, budget_amount, actual_amount

---

## KPI Definitions

| KPI | Full Name | Formula | Unit |
|-----|-----------|---------|------|
| Total Expenses | Total Expenditure | SUM(all expenses) | Currency |
| Fixed Ratio | Fixed Cost Ratio | Fixed / Total * 100 | Percentage |
| Variable Ratio | Variable Cost Ratio | Variable / Total * 100 | Percentage |
| Budget Variance | Budget Deviation | Actual - Budget | Currency |
| Variance % | Variance Percentage | (Actual - Budget) / Budget * 100 | Percentage |
| MoM Change | Month-over-Month | (Current - Previous) / Previous | Percentage |
| YoY Change | Year-over-Year | (This year - Last year) / Last year | Percentage |
| Approval Rate | Approval Percentage | Approved / Submitted | Percentage |

---

## Chart Types

| Chart | When to Use | Example in Dashboard |
|-------|-------------|---------------------|
| Bar Chart | Category comparison | Expenses by Category |
| Line Chart | Trends over time | Monthly Trend |
| Pie Chart | Composition | Status Distribution |
| Funnel Chart | Process stages | Approval Pipeline |
| Radar Chart | Multi-metric | Department Spending |
| Scatter Plot | Distribution | Expense Distribution |

---

[Back to Main Wiki](../README_EN.md) | [Previous: Suppliers](../02_Suppliers/README_EN.md) | [Next: Inventory](../04_Inventory/README_EN.md)
