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
  metadata?: Record<string, unknown>;
}

interface AdminContextType {
  users: AdminUser[];
  activities: Activity[];
  createUser: (user: Omit<AdminUser, "id" | "createdAt">) => void;
  updateUser: (id: string, user: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
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

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem("lenEm_users");
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("lenEm_activities");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("lenEm_users", JSON.stringify(users));
  }, [users]);

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
        activities,
        createUser,
        updateUser,
        deleteUser,
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
