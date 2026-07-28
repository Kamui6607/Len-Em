import axiosClient from "../../../lib/axiosClient";
import type { CreateSupportDIYDTO, SupportDIYPost, SupportDIYPostsResponse } from "../types/supportDIY.types";

export const supportDIYService = {
  getAllPosts: (params?: { page?: number; limit?: number; status?: string; creatorId?: string; linkedComboId?: string; linkedProductId?: string }) =>
    axiosClient.get<{ status: string; data: SupportDIYPostsResponse }>("/support-diy", { params }),

  getPostById: (id: string) =>
    axiosClient.get<{ status: string; data: { post: SupportDIYPost } }>(`/support-diy/${id}`),

  createPost: (data: CreateSupportDIYDTO, images: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    images.forEach((file) => formData.append("images", file));
    return axiosClient.post("/support-diy", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updatePost: (id: string, data: Partial<CreateSupportDIYDTO>, images?: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (images && images.length > 0) {
      images.forEach((file) => formData.append("images", file));
    }
    return axiosClient.put(`/support-diy/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updatePostStatus: (id: string, data: { status: string }) =>
    axiosClient.patch<{ status: string; data: { post: SupportDIYPost } }>(
      `/support-diy/${id}/status`,
      data,
    ),

  deletePost: (id: string) =>
    axiosClient.delete(`/support-diy/${id}`),
};