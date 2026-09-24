// ============================================================
// Video Service — all API calls related to videos
// ============================================================
// Endpoints (Video management API):
//   POST /videos/upload           — Upload a video file to Cloudinary (≤500MB)
//   POST /videos                  — Create a new video entry
//   GET  /videos                  — Get all videos (paginated, filter/search/sort)
//   GET  /videos/premium          — Get premium videos (paginated)
//   GET  /videos/my               — Get my uploaded videos (paginated)
//   GET  /videos/{id}             — Get video details (auto-increments view count)
//   PATCH /videos/{id}            — Update own video (uploader only)
//   DELETE /videos/{id}           — Soft delete own video (uploader only)
//   POST /videos/{id}/rate        — Rate a video 1–5 stars
//   PATCH /videos/admin-update/{id}   — Admin update a video
//   DELETE /videos/admin-delete/{id}  — Admin soft delete a video
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";

const VIDEOS_BASE = "/videos";

// ── Types ────────────────────────────────────────────────────

/** Video category known to the BE (extendable — the API types it as plain string). */
export type VideoType = "community" | "premium";

export interface VideoRating {
  _id: string;
  userId: string;
  score: number;
  createdAt: string;
}

/**
 * Video entry. `attachedProducts` / `attachedKits` are id arrays on the way in
 * (POST/PATCH) but may arrive populated from GET — keep both shapes writable.
 */
export interface Video {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  type: VideoType | string;
  url: string;
  category?: string;
  tags?: string[];
  attachedProducts?: Array<string | { _id: string; name?: string }>;
  attachedKits?: Array<string | { _id: string; name?: string }>;
  viewCount?: number;
  rating?: number;
  ratings?: VideoRating[];
  uploader?:
    | string
    | { _id?: string; id?: string; userId?: string; fullName?: string; username?: string };
  createdBy?:
    | string
    | { _id?: string; id?: string; userId?: string; fullName?: string; username?: string };
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Shape returned by GET /videos, /videos/premium and /videos/my. */
export interface VideoListResponse {
  videos: Video[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

/** POST /videos/upload response data. */
export interface UploadedVideo {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  type: VideoType | string;
  url: string;
  category?: string;
  tags?: string[];
  attachedProducts?: string[];
  attachedKits?: string[];
}

// ── Service ──────────────────────────────────────────────────

export const videoService = {
  /** POST /videos/upload — Upload a video file to Cloudinary (mp4, mov, avi, webm, mkv; max 500MB) */
  uploadVideo: (video: File) => {
    const formData = new FormData();
    formData.append("video", video);
    return axiosClient.post<ApiResponse<{ url: string } & UploadedVideo>>(
      `${VIDEOS_BASE}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        // Large files easily exceed the client's default 15s timeout.
        timeout: 600_000,
      }
    );
  },

  /** POST /videos — Create a new video with metadata and attached products/kits */
  create: (data: CreateVideoRequest) =>
    axiosClient.post<ApiResponse<{ video: Video }>>(VIDEOS_BASE, data),

  /** GET /videos — Retrieve a paginated list of videos */
  getAll: (params?: VideoListParams) =>
    axiosClient.get<ApiResponse<VideoListResponse>>(VIDEOS_BASE, { params }),

  /** GET /videos/premium — Get premium videos */
  getPremium: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<ApiResponse<VideoListResponse>>(`${VIDEOS_BASE}/premium`, { params }),

  /** GET /videos/my — Get my uploaded videos */
  getMy: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<ApiResponse<VideoListResponse>>(`${VIDEOS_BASE}/my`, { params }),

  /** GET /videos/{id} — Get video details by ID (automatically increments view count) */
  getById: (id: string) =>
    axiosClient.get<ApiResponse<{ video: Video }>>(`${VIDEOS_BASE}/${id}`),

  /** PATCH /videos/{id} — Update own video (uploader only) */
  update: (id: string, data: UpdateVideoRequest) =>
    axiosClient.patch<ApiResponse<{ video: Video }>>(`${VIDEOS_BASE}/${id}`, data),

  /** DELETE /videos/{id} — Soft delete own video (uploader only) */
  delete: (id: string) =>
    axiosClient.delete<ApiResponse<{ message?: string }>>(`${VIDEOS_BASE}/${id}`),

  /** POST /videos/{id}/rate — Rate a video 1–5 stars (re-rating overrides) */
  rate: (id: string, score: number) =>
    axiosClient.post<ApiResponse<{ message?: string }>>(`${VIDEOS_BASE}/${id}/rate`, { score }),

  /** PATCH /videos/admin-update/{id} — Admin update a video */
  adminUpdate: (id: string, data: UpdateVideoRequest) =>
    axiosClient.patch<ApiResponse<{ video: Video }>>(`${VIDEOS_BASE}/admin-update/${id}`, data),

  /** DELETE /videos/admin-delete/{id} — Admin soft delete a video */
  adminDelete: (id: string) =>
    axiosClient.delete<ApiResponse<{ message?: string }>>(`${VIDEOS_BASE}/admin-delete/${id}`),
};

/** PATCH /videos/{id} & PATCH /videos/admin-update/{id} — only these fields. */
export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  attachedProducts?: string[];
  attachedKits?: string[];
}

export interface VideoListParams {
  type?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}
