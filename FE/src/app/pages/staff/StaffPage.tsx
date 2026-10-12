// ============================================================
// StaffPage — routes /staff, /staff/orders, /staff/users, /staff/reports
// Staff làm 3 việc, theo đúng thứ tự trong menu:
//  1. Tổng quan  (/staff)          — việc đang chờ hôm nay
//  2. Đơn chờ xác nhận (/staff/orders) — xác nhận đơn PENDING
//  3. Báo cáo được giao (/staff/reports) — xử lý khiếu nại Admin giao
//  4. Người dùng (/staff/users)    — tra cứu, CHỈ XEM
// Trang Người dùng dùng chung màn hình Users của Admin (dữ liệu thật
// từ API). Màn hình đó tự ẩn mọi nút tạo/sửa/xoá khi người xem không
// phải Admin. Trước đây Staff xem danh sách user GIẢ lưu trong
// localStorage (AdminContext) và các nút sửa/xoá chỉ đổi bản cục bộ.
// ============================================================

import { ClipboardCheck, Flag, LayoutDashboard, Users as UsersIcon } from "lucide-react";
import { useLocation } from "react-router";
import type { NavItem } from "../../../shared/components/dashboard/Sidebar";
import { DashboardShell } from "../../../shared/components/dashboard/DashboardShell";
import { AdminUsers } from "../../../features/adminUsers/components/AdminUsers";
import { StaffOverview } from "./StaffOverview";
import { StaffPendingOrders } from "./StaffPendingOrders";
import { StaffReports } from "./StaffReports";
import "../../../styles/staff.css";

const staffNavItems: NavItem[] = [
  { path: "/staff", label: "Tổng quan", icon: LayoutDashboard },
  {
    label: "Công việc",
    icon: ClipboardCheck,
    children: [
      { path: "/staff/orders", label: "Đơn chờ xác nhận", icon: ClipboardCheck },
      { path: "/staff/reports", label: "Báo cáo được giao", icon: Flag },
    ],
  },
  {
    label: "Tra cứu",
    icon: UsersIcon,
    children: [{ path: "/staff/users", label: "Người dùng", icon: UsersIcon }],
  },
];

export function StaffPage() {
  const { pathname } = useLocation();

  let content;
  if (pathname.startsWith("/staff/reports")) {
    content = <StaffReports />;
  } else if (pathname.startsWith("/staff/users")) {
    content = <AdminUsers />;
  } else if (pathname.startsWith("/staff/orders")) {
    content = <StaffPendingOrders />;
  } else {
    content = <StaffOverview />;
  }

  return (
    <DashboardShell navItems={staffNavItems} title="Staff Panel">
      {content}
    </DashboardShell>
  );
}
