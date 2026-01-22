/**
 * Department-specific system prompt templates for AI context injection.
 * These are appended to the base system prompt based on the user's department.
 */

const DEPARTMENT_PROMPTS: Record<string, string> = {
    HR: `Focus on:
- Employee retention metrics and turnover analysis
- Recruitment pipeline efficiency
- Training completion rates and skill gap analysis
- Employee satisfaction and engagement scores
- Headcount trends and workforce planning
- Compliance and policy adherence metrics`,

    Finance: `Focus on:
- Cost analysis and budget variance reporting
- ROI calculations and investment performance
- Cash flow projections and liquidity metrics
- Expense categorization and spend analysis
- Financial compliance and audit readiness
- Revenue recognition and profitability trends`,

    Operations: `Focus on:
- Process efficiency and throughput metrics
- Supply chain performance and lead times
- Quality control and defect rates
- Capacity utilization and resource allocation
- Operational bottleneck identification
- SLA compliance and delivery performance`,

    Sales: `Focus on:
- Pipeline health and conversion rates
- Revenue trends and target achievement
- Customer acquisition cost (CAC) analysis
- Sales cycle duration and velocity
- Territory and rep performance comparison
- Forecast accuracy and deal progression`,

    Marketing: `Focus on:
- Campaign performance and attribution
- Lead generation and MQL/SQL metrics
- Brand awareness and engagement rates
- Channel effectiveness comparison
- Content performance analytics
- Customer journey touchpoint analysis`,

    IT: `Focus on:
- System uptime and reliability metrics
- Incident response and resolution times
- Security vulnerability tracking
- Infrastructure capacity and performance
- Project delivery and sprint velocity
- Technology adoption and usage analytics`,

    Procurement: `Focus on:
- Supplier performance and delivery reliability
- Cost savings and negotiation effectiveness
- Purchase order cycle times
- Inventory turnover and stock levels
- Contract compliance and spend under management
- Vendor risk assessment metrics`,

    CustomerService: `Focus on:
- Customer satisfaction (CSAT/NPS) scores
- First response and resolution times
- Ticket volume trends and backlog
- Agent productivity and efficiency
- Escalation rates and patterns
- Self-service adoption metrics`,

    Legal: `Focus on:
- Contract review turnaround times
- Litigation status and risk exposure
- Compliance audit results
- Policy update and distribution tracking
- Intellectual property portfolio status
- Regulatory deadline management`,

    Executive: `Focus on:
- Cross-departmental KPI dashboards
- Strategic initiative progress
- Risk heat maps and mitigation status
- Market position and competitive analysis
- Long-term trend analysis and forecasting
- Organizational health metrics`,
};

/**
 * Gets the department-specific prompt for system instruction injection
 */
export function getDepartmentPrompt(department: string): string | null {
    // Normalize department name (handle variations)
    const normalizedDept = department
        .replace(/[-_\s]/g, '')
        .toLowerCase();

    // Map common variations to standard keys
    const departmentMap: Record<string, string> = {
        hr: 'HR',
        humanresources: 'HR',
        finance: 'Finance',
        accounting: 'Finance',
        operations: 'Operations',
        ops: 'Operations',
        sales: 'Sales',
        marketing: 'Marketing',
        it: 'IT',
        technology: 'IT',
        engineering: 'IT',
        procurement: 'Procurement',
        purchasing: 'Procurement',
        supply: 'Procurement',
        customerservice: 'CustomerService',
        support: 'CustomerService',
        customersuccess: 'CustomerService',
        legal: 'Legal',
        compliance: 'Legal',
        executive: 'Executive',
        management: 'Executive',
        leadership: 'Executive',
    };

    const standardDept = departmentMap[normalizedDept];
    return standardDept ? DEPARTMENT_PROMPTS[standardDept] : null;
}

/**
 * Gets all available department keys
 */
export function getAvailableDepartments(): string[] {
    return Object.keys(DEPARTMENT_PROMPTS);
}
