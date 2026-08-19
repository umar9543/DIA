# Architectural Proposal: Data Retention & Dashboard Workflows

This document outlines the four architectural strategies our engineering team has thoroughly evaluated for managing client data within our DIA SaaS platform. 

The goal was to choose the architecture that best balances **Data Privacy (Zero Data Retention)**, **Scalability**, and **User Experience**. 

After evaluating all traditional models, we are officially **recommending Option 4 (Hybrid Aggregated ZDR)**.

---

## The Evaluated Architectures

### Option 1: Persistent Database Storage (Standard SaaS Model)
*This is how traditional platforms like PowerBI, Salesforce, and Tableau operate.*
*   **How it works:** The user uploads their Excel file once. The backend parses the Excel file and saves every single row of data permanently into our SQL Server database. 
*   **Pros:** Frictionless UX. The user uploads exactly once, and their dashboard is always ready and populated on any device.
*   **Cons:** **Rejected.** It breaks our Zero Data Retention (ZDR) mandate. We would be storing highly sensitive financial data in our cloud database, which introduces massive security and compliance liabilities, and increases server storage costs.

### Option 2: True ZDR - "Bring Your Own Data"
*   **How it works:** The user's dashboard layout (which columns map to which charts) is saved in the database, but the raw data is never saved. Every time the user logs in, their dashboard is "empty". They must drag-and-drop their latest Excel file into the browser, which processes the data locally to render the charts.
*   **Pros:** 100% ZDR. Ultimate data privacy. Zero server storage costs.
*   **Cons:** **Rejected.** Unacceptable user friction. The user must constantly re-upload the file every single time they want to view the dashboard.

### Option 3: Backend RAM Storage (The "Scorecard" Approach)
*This is how single-tenant custom applications are often built.*
*   **How it works:** The user uploads their Excel file. The backend holds the entire Excel file in its active Memory (RAM) without writing it to the hard drive. 
*   **Pros:** Technically ZDR (no data is written to disk).
*   **Cons:** **Rejected.** It is mathematically impossible to scale for a SaaS product. If 1,000 different clients log in and upload a 50MB Excel file, the Node.js server will attempt to hold 50GB of data in RAM simultaneously and instantly crash. Furthermore, every time we deploy a software update to the server, the RAM is wiped, forcing every single client to re-upload their data simultaneously.

---

## Our Recommended Choice

### Option 4: Hybrid Aggregated ZDR (The Preferred Solution)
*This architecture perfectly solves the conflict between Option 1 (Frictionless UX) and Option 2 (Strict ZDR).*

**How it works:**
1. **Raw Data Stays Local (Ultimate Privacy):** When a client uploads a sensitive financial Excel file (e.g., 50,000 rows of individual transactions), our backend extracts the column names but **rejects the actual row data**. Instead, the raw data is saved directly into the client's browser using `IndexedDB`. The raw, sensitive data literally never leaves their computer.
2. **Aggregated Data Goes to Cloud (Persistent Dashboards):** When the client configures a chart (e.g., "Show me Total Revenue by Month"), their local browser mathematically adds up the 50,000 rows and produces a tiny result: 12 anonymous data points representing the monthly totals. **We only save these 12 anonymous data points to our SQL Server.** 
3. **The Perfect User Experience:** When the client logs in tomorrow from their phone or a different computer, our SQL Server instantly sends them the 12 aggregated data points to draw their charts perfectly. They do not have to re-upload their Excel file.

### Executive Summary of Benefits
1. **True ZDR Compliance:** We never store sensitive, row-level transaction data on our servers. This dramatically reduces our legal and security liability.
2. **Instant Dashboard Loading:** Because the tiny, anonymous chart data is saved to SQL Server, dashboards load instantly on any device, entirely eliminating user friction.
3. **Infinite Scalability:** All the heavy mathematical lifting (grouping and aggregating millions of rows) is done by the client's computer, not our cloud servers. Our compute costs will remain near zero, even with thousands of active clients.

**Conclusion:** We strongly recommend proceeding immediately with the implementation of Option 4.
