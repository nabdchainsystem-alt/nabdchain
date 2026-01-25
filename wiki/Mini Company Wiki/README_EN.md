# Mini Company Wiki - Complete Dashboard Documentation

> **Version:** 1.0
> **Last Updated:** January 2025
> **Purpose:** Comprehensive guide to all Mini Company dashboards, data tables, and metrics

---

## Table of Contents

| # | Department | Dashboards | Primary Focus |
|---|------------|------------|---------------|
| 1 | [Customers](./01_Customers/README_EN.md) | 7 | Customer Intelligence & Analytics |
| 2 | [Suppliers](./02_Suppliers/README_EN.md) | 7 | Sourcing & Procurement Management |
| 3 | [Finance](./03_Finance/README_EN.md) | 7 | Expense Management & Financial Control |
| 4 | [Inventory](./04_Inventory/README_EN.md) | 8 | Stock & Warehouse Management |
| 5 | [Purchases](./05_Purchases/README_EN.md) | 7 | Purchase Orders & Requisitions |
| 6 | [Sales](./06_Sales/README_EN.md) | 7 | Sales Operations & Pipeline |

**Total: 43 Dashboards | 172+ KPIs | 6 Departments**

---

## How to Use This Wiki

### Understanding the Structure

Each department wiki contains:

1. **Department Overview** - Purpose and scope
2. **Dashboard Index** - All dashboards with descriptions
3. **Data Tables** - Required columns with keyword alternatives
4. **KPI Definitions** - Metrics and calculations
5. **Chart Types** - Visualizations used

### Keyword Alternatives

Each table column includes **alternative names** used in different systems:

```
Example:
| Column | Alternatives |
|--------|-------------|
| SKU | Item Number, Product Code, Part Number, Article Number, Stock Code |
```

This helps when:
- Importing data from other systems
- Mapping fields between databases
- Understanding different naming conventions

---

## Quick Reference: Universal Column Keywords

### Identity Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **ID** | Identifier, Record ID, Unique ID, Primary Key, Reference Number, Code |
| **Name** | Title, Label, Description, Display Name, Full Name |
| **Code** | Short Code, Abbreviation, Symbol, Reference Code |
| **SKU** | Stock Keeping Unit, Item Number, Product Code, Part Number, Article Number, Barcode |

### Date & Time Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Date** | Transaction Date, Record Date, Entry Date, Posting Date |
| **Created Date** | Creation Date, Date Added, Insert Date, Registration Date |
| **Updated Date** | Modified Date, Last Changed, Edit Date, Revision Date |
| **Due Date** | Expected Date, Target Date, Deadline, Promised Date |

### Status Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Status** | State, Condition, Stage, Phase, Situation |
| **Active/Inactive** | Enabled/Disabled, Live/Dead, On/Off, Open/Closed |
| **Priority** | Urgency, Importance, Level, Rank, Severity |

### Financial Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Amount** | Value, Sum, Total, Price, Cost, Worth |
| **Currency** | Money Type, Denomination, Currency Code |
| **Revenue** | Sales, Income, Earnings, Turnover, Gross Sales |
| **Profit** | Net Income, Margin, Gain, Net Earnings |
| **Expense** | Cost, Expenditure, Spending, Outflow |

### Quantity Columns

| Standard Name | Alternative Keywords |
|--------------|---------------------|
| **Quantity** | Qty, Count, Amount, Number, Units, Volume |
| **Rate** | Ratio, Percentage, Proportion, Fraction |
| **Score** | Rating, Points, Grade, Level, Rank |

---

## Dashboard Categories

### Analytics Dashboards
- Customer Segmentation
- Behavior Patterns
- Trend Analysis
- Forecast & Predictions

### Performance Dashboards
- Supplier Performance
- Sales Performance
- Warehouse Performance
- Department Accountability

### Risk & Control Dashboards
- Churn & Retention
- Supplier Risk
- Dependency Risk
- Cost Control

### Strategic Dashboards
- Lifetime Value
- Strategic Value
- Growth Optimization
- Forecast Planning

---

## Chart Types Used

| Chart Type | Usage | Best For |
|------------|-------|----------|
| **Bar Chart** | Most common | Comparing categories |
| **Line Chart** | Trends | Time-series data |
| **Pie/Donut** | Distribution | Composition analysis |
| **Scatter Plot** | Correlation | Multi-variable analysis |
| **Radar Chart** | Multi-axis | Comparing multiple metrics |
| **Funnel Chart** | Pipeline | Conversion analysis |
| **Gauge Chart** | Single metric | Goal progress |
| **Heatmap** | Patterns | Time-based patterns |

---

## Data Import Guidelines

When preparing data for Mini Company dashboards:

1. **Clean Data** - Remove duplicates and null values
2. **Standardize Dates** - Use ISO format (YYYY-MM-DD)
3. **Match Keywords** - Use the alternative keywords table to map your fields
4. **Validate Numbers** - Ensure amounts are numeric
5. **Check Status Values** - Match expected status options

---

## Next Steps

1. Start with your primary department
2. Review the required tables
3. Prepare your data using the column mappings
4. Import and validate
5. Enable dashboards

---

**Navigate to Department:**

| [Customers](./01_Customers/README_EN.md) | [Suppliers](./02_Suppliers/README_EN.md) | [Finance](./03_Finance/README_EN.md) | [Inventory](./04_Inventory/README_EN.md) | [Purchases](./05_Purchases/README_EN.md) | [Sales](./06_Sales/README_EN.md) |
