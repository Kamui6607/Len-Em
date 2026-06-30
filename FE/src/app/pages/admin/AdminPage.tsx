import { Routes, Route } from "react-router";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminUsers } from "./AdminUsers";
import { ProductManagement } from "./ProductManagement";
import { AdminOrders } from "./AdminOrders";
import { AdminReports } from "./AdminReports";
import { Permissions } from "./Permissions";
import { Roles } from "./Roles";
import { RoleDetail } from "./RoleDetail";

export function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="payments" element={<AdminOrders />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="roles" element={<Roles />} />
        <Route path="roles/:roleId" element={<RoleDetail />} />
        <Route path="activity" element={<AdminDashboard />} />
      </Routes>
    </AdminLayout>
  );
}
