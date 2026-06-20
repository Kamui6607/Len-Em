import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "user";
  createdAt: string;
  lastLogin?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  deliveryFee?: number;
  fulfillment?: string;
  address?: string;
  paymentMethod: string;
  paymentStatus: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface Activity {
  id: string;
  type:
    | "login"
    | "purchase"
    | "payment_confirmed"
    | "user_created"
    | "product_created"
    | "product_updated"
    | "product_deleted";
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface AdminContextType {
  users: AdminUser[];
  orders: Order[];
  activities: Activity[];
  createUser: (user: Omit<AdminUser, "id" | "createdAt">) => void;
  updateUser: (id: string, user: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
  createOrder: (order: Omit<Order, "id" | "createdAt">) => string;
  confirmPayment: (orderId: string, confirmedBy: string) => void;
  cancelOrder: (orderId: string) => void;
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const initialUsers: AdminUser[] = [
  {
    id: "1",
    name: "Quản Trị Viên",
    email: "admin@lenem.vn",
    phone: "0912345678",
    role: "admin",
    createdAt: "2026-05-01T08:00:00Z",
    lastLogin: "2026-06-10T09:30:00Z",
  },
  {
    id: "2",
    name: "Nhân Viên",
    email: "staff@lenem.vn",
    phone: "0987654321",
    role: "staff",
    createdAt: "2026-05-02T08:00:00Z",
    lastLogin: "2026-06-10T08:00:00Z",
  },
  {
    id: "3",
    name: "Nguyễn Thị Linh",
    email: "creator@lenem.vn",
    phone: "0909123456",
    role: "user",
    createdAt: "2026-05-03T10:00:00Z",
    lastLogin: "2026-06-09T14:20:00Z",
  },
  {
    id: "4",
    name: "User",
    email: "user@gmail.com",
    phone: "0703339186",
    role: "user",
    createdAt: "2026-05-04T11:00:00Z",
    lastLogin: "2026-06-08T16:45:00Z",
  },
  {
    id: "5",
    name: "Phạm Văn Minh",
    email: "minh@lenem.vn",
    phone: "0909315708",
    role: "user",
    createdAt: "2026-05-05T09:00:00Z",
    lastLogin: "2026-06-07T10:30:00Z",
  },
  {
    id: "6",
    name: "Lê Thị Thu",
    email: "thu@lenem.vn",
    phone: "0938123456",
    role: "user",
    createdAt: "2026-05-06T14:00:00Z",
    lastLogin: "2026-06-06T11:00:00Z",
  },
];

const initialOrders: Order[] = [
  {
    id: "ORD-2026-0001",
    userId: "4",
    userName: "Trần Thị Ngọc",
    userEmail: "user@gmail.com",
    items: [
      {
        productId: "yarn-cotton-blush",
        productName: "Len Cotton Mềm - Hồng Phấn",
        quantity: 2,
        price: 129000,
      },
      {
        productId: "tool-hooks-aluminum",
        productName: "Bộ Kim Móc Nhôm - Cơ Bản",
        quantity: 1,
        price: 249000,
      },
    ],
    total: 507000,
    deliveryFee: 25000,
    address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    paymentMethod: "Chuyển khoản",
    paymentStatus: "confirmed",
    createdAt: "2026-06-01T10:30:00Z",
    confirmedAt: "2026-06-01T14:20:00Z",
    confirmedBy: "Quản Trị Viên",
  },
  {
    id: "ORD-2026-0002",
    userId: "5",
    userName: "Phạm Văn Minh",
    userEmail: "minh@lenem.vn",
    items: [
      {
        productId: "yarn-merino-sage",
        productName: "Len Merino Chunky - Xanh Sage",
        quantity: 3,
        price: 189000,
      },
      {
        productId: "tool-hook-ergonomic",
        productName: "Kim Móc Ergonomic - Cao Cấp",
        quantity: 1,
        price: 149000,
      },
    ],
    total: 716000,
    deliveryFee: 30000,
    address: "45 Lê Lợi, Quận Hai Bà Trưng, Hà Nội",
    paymentMethod: "COD",
    paymentStatus: "pending",
    createdAt: "2026-06-05T15:45:00Z",
  },
  {
    id: "ORD-2026-0003",
    userId: "6",
    userName: "Lê Thị Thu",
    userEmail: "thu@lenem.vn",
    items: [
      {
        productId: "yarn-pastel-bundle",
        productName: "Bộ Len Pastel Cầu Vồng",
        quantity: 1,
        price: 349000,
      },
      {
        productId: "tool-hooks-bamboo",
        productName: "Bộ Kim Móc Tre - Cún Yêu",
        quantity: 1,
        price: 329000,
      },
      {
        productId: "tool-stitch-markers",
        productName: "Bộ Đánh Dấu Mũi & Phụ Kiện",
        quantity: 1,
        price: 89000,
      },
    ],
    total: 767000,
    deliveryFee: 20000,
    address: "78 Trần Phú, Quận Hải Châu, Đà Nẵng",
    paymentMethod: "Ví điện tử",
    paymentStatus: "confirmed",
    createdAt: "2026-06-03T09:15:00Z",
    confirmedAt: "2026-06-03T11:30:00Z",
    confirmedBy: "Nhân Viên",
  },
  {
    id: "ORD-2026-0004",
    userId: "4",
    userName: "Trần Thị Ngọc",
    userEmail: "user@gmail.com",
    items: [
      {
        productId: "kit-amigurumi-animals",
        productName: "Kit Thú Bông Amigurumi - Đáng Yêu",
        quantity: 1,
        price: 399000,
      },
    ],
    total: 399000,
    deliveryFee: 15000,
    address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    paymentMethod: "Chuyển khoản",
    paymentStatus: "confirmed",
    createdAt: "2026-06-02T16:20:00Z",
    confirmedAt: "2026-06-02T18:00:00Z",
    confirmedBy: "Quản Trị Viên",
  },
  {
    id: "ORD-2026-0005",
    userId: "5",
    userName: "Phạm Văn Minh",
    userEmail: "minh@lenem.vn",
    items: [
      {
        productId: "yarn-cotton-milk",
        productName: "Len Sữa Cotton - Mềm Mại",
        quantity: 4,
        price: 119000,
      },
      {
        productId: "tool-scissors-needles",
        productName: "Kéo Cắt Len & Kim Bay",
        quantity: 1,
        price: 69000,
      },
    ],
    total: 545000,
    deliveryFee: 25000,
    address: "45 Lê Lợi, Quận Hai Bà Trưng, Hà Nội",
    paymentMethod: "COD",
    paymentStatus: "cancelled",
    createdAt: "2026-05-28T11:00:00Z",
  },
  {
    id: "ORD-2026-0006",
    userId: "6",
    userName: "Lê Thị Thu",
    userEmail: "thu@lenem.vn",
    items: [
      {
        productId: "kit-beginner-tools",
        productName: "Combo Khởi Nghiệp Đan Móc",
        quantity: 1,
        price: 599000,
      },
      {
        productId: "tool-darning-needles",
        productName: "Kim May Len - Bộ 6 Cây",
        quantity: 2,
        price: 49000,
      },
    ],
    total: 697000,
    deliveryFee: 20000,
    address: "78 Trần Phú, Quận Hải Châu, Đà Nẵng",
    paymentMethod: "Ví điện tử",
    paymentStatus: "pending",
    createdAt: "2026-06-08T08:30:00Z",
  },
  {
    id: "ORD-2026-0007",
    userId: "3",
    userName: "Nguyễn Thị Linh",
    userEmail: "creator@lenem.vn",
    items: [
      {
        productId: "yarn-alpaca-silk",
        productName: "Len Alpaca Silk - Cao Cấp",
        quantity: 2,
        price: 229000,
      },
      {
        productId: "tool-hook-ergonomic",
        productName: "Kim Móc Ergonomic - Cao Cấp",
        quantity: 1,
        price: 149000,
      },
    ],
    total: 607000,
    deliveryFee: 25000,
    address: "200 Pasteur, Quận 3, TP. Hồ Chí Minh",
    paymentMethod: "Chuyển khoản",
    paymentStatus: "confirmed",
    createdAt: "2026-06-06T14:00:00Z",
    confirmedAt: "2026-06-06T16:30:00Z",
    confirmedBy: "Nhân Viên",
  },
  {
    id: "ORD-2026-0008",
    userId: "4",
    userName: "Trần Thị Ngọc",
    userEmail: "user@gmail.com",
    items: [
      {
        productId: "kit-scrunchie-set",
        productName: "Kit Nơ Tóc - Tự Chăm Sóc",
        quantity: 2,
        price: 229000,
      },
      {
        productId: "yarn-cotton-blush",
        productName: "Len Cotton Mềm - Hồng Phấn",
        quantity: 1,
        price: 129000,
      },
    ],
    total: 587000,
    deliveryFee: 15000,
    address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    paymentMethod: "COD",
    paymentStatus: "pending",
    createdAt: "2026-06-09T19:15:00Z",
  },
  {
    id: "ORD-2026-0009",
    userId: "5",
    userName: "Phạm Văn Minh",
    userEmail: "minh@lenem.vn",
    items: [
      {
        productId: "yarn-super-chunky",
        productName: "Len Cực To - Bự",
        quantity: 2,
        price: 249000,
      },
      {
        productId: "yarn-wool-acrylic",
        productName: "Len Pha Ấm - Đỏ Cam",
        quantity: 1,
        price: 159000,
      },
    ],
    total: 657000,
    deliveryFee: 30000,
    address: "45 Lê Lợi, Quận Hai Bà Trưng, Hà Nội",
    paymentMethod: "Chuyển khoản",
    paymentStatus: "confirmed",
    createdAt: "2026-06-04T10:00:00Z",
    confirmedAt: "2026-06-04T13:45:00Z",
    confirmedBy: "Quản Trị Viên",
  },
  {
    id: "ORD-2026-0010",
    userId: "6",
    userName: "Lê Thị Thu",
    userEmail: "thu@lenem.vn",
    items: [
      {
        productId: "kit-blanket-cozy",
        productName: "Kit Chăn Ấm - Khởi Đầu",
        quantity: 1,
        price: 499000,
      },
    ],
    total: 499000,
    deliveryFee: 25000,
    address: "78 Trần Phú, Quận Hải Châu, Đà Nẵng",
    paymentMethod: "Ví điện tử",
    paymentStatus: "cancelled",
    createdAt: "2026-05-25T08:00:00Z",
  },
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem("lenEm_users");
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("lenEm_orders");
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("lenEm_activities");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("lenEm_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("lenEm_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("lenEm_activities", JSON.stringify(activities));
  }, [activities]);

  const createUser = (user: Omit<AdminUser, "id" | "createdAt">) => {
    const newUser: AdminUser = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, updatedUser: Partial<AdminUser>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)),
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const createOrder = (order: Omit<Order, "id" | "createdAt">): string => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder.id;
  };

  const confirmPayment = (orderId: string, confirmedBy: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              paymentStatus: "confirmed",
              confirmedAt: new Date().toISOString(),
              confirmedBy,
            }
          : order,
      ),
    );
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: "cancelled" } : order,
      ),
    );
  };

  const logActivity = (activity: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 100));
  };

  return (
    <AdminContext.Provider
      value={{
        users,
        orders,
        activities,
        createUser,
        updateUser,
        deleteUser,
        createOrder,
        confirmPayment,
        cancelOrder,
        logActivity,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
