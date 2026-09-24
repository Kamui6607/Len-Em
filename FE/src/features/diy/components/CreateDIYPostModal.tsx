import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Button } from "../../../shared/components/ui/button";
import { diyService } from "../services/diy.service";
import { useAuth } from "../../../shared/hooks/useAuth";

interface CreateDIYPostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDIYPostModal({ onClose, onSuccess }: CreateDIYPostModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postTags, setPostTags] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [postImages, setPostImages] = useState<File[]>([]);

  const submitPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (!postTitle.trim() || !postDescription.trim()) {
      toast.error("Vui lòng nhập tiêu đề và mô tả");
      return;
    }

    setPostSubmitting(true);
    try {
      await diyService.createPost(
        {
          title: postTitle.trim(),
          description: postDescription.trim(),
          tags: postTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          price: postPrice ? Math.max(0, Number(postPrice)) : undefined,
        },
        postImages,
      );
      toast.success("Đã gửi bài viết. Vui lòng chờ admin duyệt.");
      onSuccess();
    } catch {
      toast.error("Không thể đăng bài viết");
    } finally {
      setPostSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.form
        onSubmit={submitPost}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl md:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Post sản phẩm</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bài viết sẽ ở trạng thái Pending và cần admin duyệt trước
              khi hiển thị.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-muted-foreground hover:text-foreground"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Tiêu đề
            <input
              required
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              className="input mt-1"
              placeholder="Ví dụ: Túi len hoa cúc"
            />
          </label>
          <label className="block text-sm font-medium">
            Mô tả
            <textarea
              required
              value={postDescription}
              onChange={(event) => setPostDescription(event.target.value)}
              className="input mt-1 min-h-28 resize-y"
              placeholder="Mô tả sản phẩm hoặc công thức DIY"
            />
          </label>
          <label className="block text-sm font-medium">
            Tags
            <input
              value={postTags}
              onChange={(event) => setPostTags(event.target.value)}
              className="input mt-1"
              placeholder="len, beginner, túi xách"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Phân tách bằng dấu phẩy
            </span>
          </label>
          <label className="block text-sm font-medium">
            Giá (không bắt buộc)
            <input
              type="number"
              min="0"
              value={postPrice}
              onChange={(event) => setPostPrice(event.target.value)}
              className="input mt-1"
              placeholder="0"
            />
          </label>
          <label className="block text-sm font-medium">
            Hình ảnh
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setPostImages(Array.from(event.target.files ?? []))
              }
              className="input mt-1"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={postSubmitting}>
            {postSubmitting ? "Đang đăng..." : "Gửi bài"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
