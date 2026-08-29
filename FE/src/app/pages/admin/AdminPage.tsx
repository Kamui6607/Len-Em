import { Routes, Route } from "react-router";
import { AdminLayout } from "../../../shared/components/admin/AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminUsers } from "./AdminUsers";
import { ProductManagement } from "./ProductManagement";
import { ProductDetail } from "./ProductDetail";
import { AdminOrders } from "./AdminOrders";
import { AdminReports } from "./AdminReports";
import { AdminRefunds } from "./AdminRefunds";
import { Permissions } from "./Permissions";
import { Roles } from "./Roles";
import { RoleDetail } from "./RoleDetail";
import { AdminCourses } from "./AdminCourses";
import { CourseFormPage } from "./CourseFormPage";
import { AdminLessons } from "./AdminLessons";
import { LessonFormPage } from "./LessonFormPage";
import { AdminDIYPosts } from "./AdminDIYPosts";
import { DIYFormPage } from "./DIYFormPage";
import { AdminSupportDIYPosts } from "./AdminSupportDIYPosts";
import { AdminKits } from "./AdminKits";
import { AdminNotifications } from "./AdminNotifications";
import { AdminActivity } from "./AdminActivity";

export function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/:productId" element={<ProductDetail />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="refunds" element={<AdminRefunds />} />
        <Route path="diy-posts" element={<AdminDIYPosts />} />
        <Route path="diy-posts/new" element={<DIYFormPage />} />
        <Route path="support-diy" element={<AdminSupportDIYPosts />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="roles" element={<Roles />} />
        <Route path="roles/:roleId" element={<RoleDetail />} />
        <Route path="activity" element={<AdminActivity />} />
        {/* Course Management */}
        <Route path="courses" element={<AdminCourses />} />
        <Route path="courses/new" element={<CourseFormPage />} />
        <Route path="courses/:courseId" element={<CourseFormPage />} />
        {/* Lesson Management */}
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="lessons/new" element={<LessonFormPage />} />
        <Route path="lessons/:lessonId" element={<LessonFormPage />} />
        {/* Kit Management */}
        <Route path="kits" element={<AdminKits />} />
      </Routes>
    </AdminLayout>
  );
}
