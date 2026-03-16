A)Role: Act as an expert Full-Stack Developer specializing in React, Vite, and modern cloud infrastructure.

B)Task: Create a web application dedicated exclusively to tracking and managing existing Purchase Orders (POs). Assume that the POs are created in a different application and synced to this one. Do not build PO creation features. The application frontend must be in French

C)Tech Stack Requirements:
Frontend: React + Vite
Styling: Tailwind CSS (for a clean, modern dashboard UI)
Charts/Analytics: Recharts (or similar React charting library)
Database & Backend: Supabase (Use the free tier. Utilize its PostgreSQL database and real-time subscription features).
Deployment: Vercel (Configure the project so it is ready to be deployed to Vercel's free tier).

D)Core Functionalities to Implement:
1. Real-Time Visibility and Status Monitoring
End-to-End Lifecycle Tracking: Build a main dashboard component that provides a shared, real-time Kanban or timeline view of the entire PO lifecycle (e.g., "In Fulfillment", "In Transit", "Received", "Invoiced", "Paid"). Use Supabase real-time subscriptions so updates appear instantly.
Comprehensive Audit Trails: Create a component within the PO detail view that displays a trackable, chronological log of all actions, status changes, and transactions related to that specific PO to ensure accountability.

2. Receiving and Reconciliation
Partial and Full Receipt Tracking: Build a receiving interface for a specific PO that allows users to log incoming items. It must support partial receipts (e.g., marking 50 out of 100 items as received) and display a visual progress bar showing exactly what has arrived and what is still pending.

3. Exception Management and Alerts
Real-Time Alerts: Implement a notification system (using toast notifications and an alert center in the UI) that automatically flags and displays warnings for policy violations, missed confirmations, or delivery delays.

4. Supplier Collaboration
Delivery and Lead Time Tracking: Create a "Vendor/Supplier" view that aggregates data for each supplier. Display their average lead times, current delivery statuses for active POs, and a calculated "performance scorecard" (e.g., percentage of on-time deliveries).

5. Analytics and System Integrations
Custom KPI Dashboards: Build an analytics page using Recharts that features robust reporting. Include charts and metrics tracking:
Average PO cycle times.
Compliance metrics (e.g., percentage of POs with exceptions).
Spend analytics broken down by vendor, employee, or transaction type.

E)Deliverables: Please provide the project structure, the necessary terminal commands to initialize the Vite project and install dependencies, the Supabase database schema (SQL) needed to support these specific features, and the core React component code for the Dashboards, PO detail view, and Receiving interface.