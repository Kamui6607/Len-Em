import axiosClient from "../../../lib/axiosClient";
import type { CreateOrderReportDTO, OrderReport, OrderReportsResponse } from "../types/orderReport.types";

export const orderReportService = {
  // ─── Customer endpoints ───────────────────────────────────

  /** POST /order-reports — Customer creates a new report (must own the order) */
  create: (data: CreateOrderReportDTO) => {
    // Check if we have File objects - if so, use FormData
    const hasFiles = data.images && data.images.length > 0 && data.images.some(img => img instanceof File);
    
    if (hasFiles) {
      // Use multipart/form-data for file uploads
      const formData = new FormData();
      formData.append("orderId", data.orderId);
      formData.append("title", data.title);
      formData.append("description", data.description);
      
      data.images!.forEach((image) => {
        if (image instanceof File) {
          formData.append("images", image);
        }
      });
      
      return axiosClient.post<{ status: string; data: OrderReport }>("/order-reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      // Use JSON for reports without files or with base64 strings
      return axiosClient.post<{ status: string; data: OrderReport }>("/order-reports", {
        orderId: data.orderId,
        title: data.title,
        description: data.description,
        images: data.images || [],
      });
    }
  },

  /** GET /order-reports/my — Customer gets their own reports (paginated) */
  getMyReports: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<{ status: string; data: OrderReportsResponse }>("/order-reports/my", { params }),

  /** GET /order-reports/:id — Get report detail by ID */
  getById: (id: string) =>
    axiosClient.get<{ status: string; data: OrderReport }>(`/order-reports/${id}`),

  /** PUT /order-reports/:id — Customer updates their report (only when PENDING) */
  update: (id: string, data: Partial<CreateOrderReportDTO>) =>
    axiosClient.put<{ status: string; data: OrderReport }>(`/order-reports/${id}`, data),

  // ─── Admin / Staff endpoints ──────────────────────────────

  /** GET /order-reports — Admin/Staff get all reports (paginated, filterable) */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: string;
    assignedStaff?: string;
  }) => axiosClient.get<{ status: string; data: OrderReportsResponse }>("/order-reports", { params }),

  /** PATCH /order-reports/:id/status — Admin/Staff update status (DONE | CANCELLED) */
  updateStatus: (id: string, status: string, adminNote?: string) =>
    axiosClient.patch<{ status: string; data: OrderReport }>(
      `/order-reports/${id}/status`,
      { status, adminNote },
    ),

  /** PATCH /order-reports/:id/assign — Admin assigns a staff member */
  assignStaff: (id: string, assignedStaff: string) =>
    axiosClient.patch<{ status: string; data: OrderReport }>(
      `/order-reports/${id}/assign`,
      { assignedStaff },
    ),

  /** PATCH /order-reports/:id/note — Admin/Staff updates admin note */
  updateNote: (id: string, adminNote: string) =>
    axiosClient.patch<{ status: string; data: OrderReport }>(
      `/order-reports/${id}/note`,
      { adminNote },
    ),

  /** DELETE /order-reports/:id — Admin deletes a report (any status) */
  delete: (id: string) =>
    axiosClient.delete<{ status: string; message: string }>(`/order-reports/${id}`),
};