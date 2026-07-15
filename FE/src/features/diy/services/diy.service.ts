import axiosClient from "../../../lib/axiosClient";
import type { CreateDIYPostDTO, DIYPost } from "../types/diy.types";

export interface DIYPostsResponse {
  posts: DIYPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const diyService = {
  getAllPosts: (params?: { page?: number; limit?: number; status?: string }) =>
    axiosClient.get<{ status: string; data: DIYPostsResponse }>("/diy-posts", { params }),

  getPostById: (id: string) =>
    axiosClient.get<{ status: string; data: { post: DIYPost } }>(`/diy-posts/${id}`),

  createPost: (data: CreateDIYPostDTO, images: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    images.forEach((file) => formData.append("images", file));
    return axiosClient.post("/diy-posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updatePost: (id: string, data: Partial<CreateDIYPostDTO>, images?: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (images && images.length > 0) {
      images.forEach((file) => formData.append("images", file));
    }
    return axiosClient.put(`/diy-posts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deletePost: (id: string) =>
    axiosClient.delete(`/diy-posts/${id}`),
};