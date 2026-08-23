import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Report, ReportStatus } from "../types/report.types";

interface ReportContextType {
  reports: Report[];
  createReport: (report: Omit<Report, "id" | "createdAt" | "status">) => void;
  assignReport: (reportId: string, staffId: string, staffName: string) => void;
  resolveReport: (reportId: string, note: string) => void;
  cannotResolveReport: (reportId: string, note: string) => void;
  getReportsByStatus: (status: ReportStatus) => Report[];
  getReportsByAssignedUser: (userId: string) => Report[];
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const initialReports: Report[] = [];

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem("lenEm_reports");
    return saved ? JSON.parse(saved) : initialReports;
  });

  useEffect(() => {
    localStorage.setItem("lenEm_reports", JSON.stringify(reports));
  }, [reports]);

  const createReport = (reportData: Omit<Report, "id" | "createdAt" | "status">) => {
    const newReport: Report = {
      ...reportData,
      id: `RPT-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const assignReport = (reportId: string, staffId: string, staffName: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, assignedToId: staffId, assignedToName: staffName, status: "assigned", updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const resolveReport = (reportId: string, note: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: "resolved", resolutionNote: note, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const cannotResolveReport = (reportId: string, note: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: "cannot_resolve", resolutionNote: note, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const getReportsByStatus = (status: ReportStatus) => {
    return reports.filter((r) => r.status === status);
  };

  const getReportsByAssignedUser = (userId: string) => {
    return reports.filter((r) => r.assignedToId === userId);
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        createReport,
        assignReport,
        resolveReport,
        cannotResolveReport,
        getReportsByStatus,
        getReportsByAssignedUser,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportProvider");
  }
  return context;
}