import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ReportsPage } from "./pages/ReportsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "customers", Component: CustomersPage },
      { path: "appointments", Component: AppointmentsPage },
      { path: "services", Component: ServicesPage },
      { path: "reports", Component: ReportsPage },
    ],
  },
]);
