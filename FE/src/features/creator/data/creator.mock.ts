export type CourseStatus = "Draft" | "Published";
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface CreatorCourse {
  id: string;
  name: string;
  level: CourseLevel;
  lessonCount: number;
  enrolledStudents: number;
  status: CourseStatus;
}

export interface CreatorLesson {
  id: string;
  courseId: string;
  name: string;
  duration: string;
  linkedProducts: number;
  views: number;
}

export interface CreatorLinkedProduct {
  id: string;
  name: string;
  lesson: string;
  clicks: number;
  estimatedRevenue: number;
}

export interface CreatorDiyPost {
  id: string;
  title: string;
  image: string;
  views: number;
  comboPurchases: number;
  tag: string;
}

export const creatorCourses: CreatorCourse[] = [
  {
    id: "course-beginner-amigurumi",
    name: "Beginner Amigurumi Friends",
    level: "Beginner",
    lessonCount: 5,
    enrolledStudents: 1284,
    status: "Published",
  },
  {
    id: "course-sage-cardigan",
    name: "Sage Weekend Cardigan",
    level: "Intermediate",
    lessonCount: 5,
    enrolledStudents: 642,
    status: "Draft",
  },
];

export const creatorLessons: CreatorLesson[] = [
  { id: "l1", courseId: "course-beginner-amigurumi", name: "Picking soft cotton yarn", duration: "08:12", linkedProducts: 3, views: 4210 },
  { id: "l2", courseId: "course-beginner-amigurumi", name: "Magic ring without stress", duration: "11:45", linkedProducts: 2, views: 3980 },
  { id: "l3", courseId: "course-beginner-amigurumi", name: "Single crochet rhythm", duration: "14:20", linkedProducts: 4, views: 3560 },
  { id: "l4", courseId: "course-beginner-amigurumi", name: "Stuffing and shaping plushies", duration: "10:32", linkedProducts: 3, views: 2890 },
  { id: "l5", courseId: "course-beginner-amigurumi", name: "Final face embroidery", duration: "09:18", linkedProducts: 5, views: 2574 },
  { id: "l6", courseId: "course-sage-cardigan", name: "Gauge swatch for wearables", duration: "12:06", linkedProducts: 4, views: 1940 },
  { id: "l7", courseId: "course-sage-cardigan", name: "Ribbing cuffs and hem", duration: "16:40", linkedProducts: 3, views: 1765 },
  { id: "l8", courseId: "course-sage-cardigan", name: "Panel shaping basics", duration: "18:22", linkedProducts: 5, views: 1320 },
  { id: "l9", courseId: "course-sage-cardigan", name: "Joining seams cleanly", duration: "15:17", linkedProducts: 2, views: 1184 },
  { id: "l10", courseId: "course-sage-cardigan", name: "Blocking for soft drape", duration: "07:54", linkedProducts: 3, views: 980 },
];

export const revenueByDay = Array.from({ length: 30 }, (_, index) => ({
  day: `${index + 1}`,
  revenue: Math.round(180 + Math.sin(index / 3) * 60 + index * 9 + (index % 5) * 22),
}));

export const topVideoProducts = [
  { name: "Milk Cotton Pastel Set", sales: 324 },
  { name: "Beginner Hook Kit", sales: 286 },
  { name: "Sage Cardigan Combo", sales: 198 },
  { name: "Safety Eyes Pack", sales: 162 },
  { name: "Pro Blocking Mat", sales: 124 },
];

export const linkedProducts: CreatorLinkedProduct[] = [
  { id: "p1", name: "Milk Cotton Pastel Set", lesson: "Picking soft cotton yarn", clicks: 816, estimatedRevenue: 7350 },
  { id: "p2", name: "Beginner Hook Kit", lesson: "Magic ring without stress", clicks: 642, estimatedRevenue: 5136 },
  { id: "p3", name: "Safety Eyes Pack", lesson: "Final face embroidery", clicks: 384, estimatedRevenue: 1536 },
  { id: "p4", name: "Sage Cardigan Combo", lesson: "Panel shaping basics", clicks: 298, estimatedRevenue: 8940 },
  { id: "p5", name: "Pro Blocking Mat", lesson: "Blocking for soft drape", clicks: 176, estimatedRevenue: 3168 },
];

export const creatorDiyPosts: CreatorDiyPost[] = [
  { id: "diy-1", title: "Cherry Bunny Keychain", image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=800&q=80", views: 12800, comboPurchases: 342, tag: "Viral plush" },
  { id: "diy-2", title: "Sage Campus Tote", image: "https://images.unsplash.com/photo-1607344645866-009c320f3ab8?auto=format&fit=crop&w=800&q=80", views: 8230, comboPurchases: 118, tag: "Lifestyle" },
  { id: "diy-3", title: "Idol Lightstick Cozy", image: "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?auto=format&fit=crop&w=800&q=80", views: 21450, comboPurchases: 524, tag: "Idol economy" },
];
