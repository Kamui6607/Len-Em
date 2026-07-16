import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router";
import { orderReportService } from "../../features/orderReport/services/orderReport.service";
import type { ReportTargetType } from "../../types/report.types";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  className?: string;
}

export function ReportButton({ targetType, targetId, targetTitle, className = "" }: ReportButtonProps) {
  // targetType is available for future use (DIY posts vs orders)
  void targetType;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide both title and description");
      return;
    }

    setSubmitting(true);
    try {
      // Send File objects directly - the service will handle FormData
      await orderReportService.create({
        orderId: targetId,
        title: title.trim(),
        description: description.trim(),
        images: images, // Pass File[] directly
      });

      toast.success("Report submitted. Our team will review it.");
      setOpen(false);
      setTitle("");
      setDescription("");
      setImages([]);
    } catch (error) {
      console.error("Failed to submit report:", error);
      
      // Handle validation errors from backend
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError?.response?.data?.message;
      
      if (errorMessage && errorMessage.includes("validation failed")) {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors ${className}`}
        aria-label="Report"
      >
        <Flag className="size-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Report Content</h3>
              <p className="text-xs text-muted-foreground mt-1">Reporting: {targetTitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what's wrong with this item..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Images (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {images.map((img, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${i + 1}`}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setTitle("");
                    setDescription("");
                    setImages([]);
                  }}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}