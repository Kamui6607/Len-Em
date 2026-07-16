export interface OrderReport {
  _id: string;
  orderId: string;
  reporterId: string;
  title: string;
  description: string;
  images: string[];
  status: "PENDING" | "DONE" | "CANCELLED";
  adminNote?: string;
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderReportDTO {
  orderId: string;
  title: string;
  description: string;
  images?: string[] | File[];
}

export interface OrderReportsResponse {
  reports: OrderReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}