import { useState, useEffect } from "react";
import { useReports } from "../../../context/ReportContext";
import {
  userService,
  type UsersListResponse,
} from "../../../features/users/services/user.service";
import { toast } from "sonner";

type ApiUser = UsersListResponse["result"]["users"][0];

export function AdminReports() {
  const { assignReport } = useReports();
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<{
    userId: string;
    fullName: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    userService
      .getAllUsers({ page: 1, limit: 20 })
      .then(({ data }) => {
        setApiUsers(data.data.result.users || []);
      })
      .catch(() => {});
  }, []);

  const staffUsers = apiUsers.filter((u) => {
    const roleStr =
      typeof u.roleId === "object" ? u.roleId?.roleName : String(u.roleId);
    return roleStr === "Staff";
  });

  const handleAssign = (
    reportId: string,
    staffUserId: string,
    staffEmail: string,
  ) => {
    const staff = apiUsers.find((u) => u.userId === staffUserId);
    if (!staff) return;
    assignReport(reportId, staffEmail, staff.fullName);
    toast.success(`Report assigned to ${staff.fullName}`);
    setAssignModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Report Management</h1>
        <p className="text-muted-foreground">Review and assign user reports</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "assigned", "resolved", "cannot_resolve"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap capitalize transition-colors ${filterStatus === status ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border hover:bg-muted"}`}
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </button>
          ),
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Assign Report to Staff</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select a staff member to handle this report
              </p>
            </div>
            {staffUsers.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">
                No staff members available.
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {staffUsers.map((staff) => {
                  const isSelected = selectedStaff?.userId === staff.userId;
                  return (
                    <button
                      key={staff.userId}
                      onClick={() =>
                        setSelectedStaff({
                          userId: staff.userId,
                          fullName: staff.fullName,
                          email: staff.email,
                        })
                      }
                      className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted hover:border-primary/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {staff.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {staff.email}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="p-4 pt-2 flex gap-3">
              <button
                onClick={() => {
                  setAssignModal(null);
                  setSelectedStaff(null);
                }}
                className="flex-1 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedStaff) {
                    toast.error("Please select a staff member");
                    return;
                  }
                  handleAssign(
                    assignModal,
                    selectedStaff.userId,
                    selectedStaff.email,
                  );
                  setSelectedStaff(null);
                }}
                disabled={!selectedStaff}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
