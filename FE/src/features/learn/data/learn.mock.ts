import type { Course, Lesson, MaterialCombo } from "../types/learn.types";

export const learnCourses: Course[] = [
  {
    id: "cozy-scarf-basics",
    title: "Cozy Scarf Basics for Total Beginners",
    thumbnail: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    level: "beginner",
    creator: {
      id: "creator-lina",
      name: "Lina Loops",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&w=160&h=160",
    },
    totalLessons: 3,
    totalDuration: 34,
    enrolledCount: 2480,
    rating: 4.9,
    tags: ["scarf", "chain stitch", "stress-relief"],
    linkedComboIds: ["combo-beginner-scarf"],
    description:
      "Start from zero and crochet a soft, wearable scarf while learning the core motions every maker needs.",
  },
  {
    id: "pastel-bucket-hat",
    title: "Pastel Bucket Hat Workshop",
    thumbnail: "https://images.unsplash.com/photo-1618354691229-88d47f285158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    level: "intermediate",
    creator: {
      id: "creator-minh",
      name: "Minh Makes",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&w=160&h=160",
    },
    totalLessons: 3,
    totalDuration: 47,
    enrolledCount: 1325,
    rating: 4.8,
    tags: ["hat", "summer", "idol style"],
    linkedComboIds: ["combo-pro-hat"],
    description:
      "Shape a trendy bucket hat with color changes, clean rounds, and fit checks that fans can recreate fast.",
  },
  {
    id: "statement-tote-pro",
    title: "Statement Tote Bag: Promax Maker Build",
    thumbnail: "https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    level: "advanced",
    creator: {
      id: "creator-ivy",
      name: "Ivy Atelier",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&w=160&h=160",
    },
    totalLessons: 3,
    totalDuration: 69,
    enrolledCount: 820,
    rating: 4.7,
    tags: ["bag", "texture", "creator"],
    linkedComboIds: ["combo-promax-tote"],
    description:
      "Build a durable textured tote with reinforced handles and a material list ready for DIY creator posts.",
  },
];

export const learnLessons: Lesson[] = [
  {
    id: "scarf-lesson-1",
    courseId: "cozy-scarf-basics",
    title: "Choose yarn, hook size, and make a foundation chain",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 10,
    order: 1,
    linkedProducts: [
      { productId: "1", name: "Soft Cotton Yarn - Blush Pink", price: 12.99, thumbnail: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 8 },
      { productId: "5", name: "Bamboo Crochet Hook Set", price: 24.99, thumbnail: "https://images.unsplash.com/photo-1611242320536-f12d3541249b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 18 },
    ],
  },
  {
    id: "scarf-lesson-2",
    courseId: "cozy-scarf-basics",
    title: "Single crochet rows and tension control",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 12,
    order: 2,
    linkedProducts: [
      { productId: "1", name: "Soft Cotton Yarn - Blush Pink", price: 12.99, thumbnail: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 10 },
      { productId: "6", name: "Stitch Marker Ring Pack", price: 7.99, thumbnail: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 24 },
    ],
  },
  {
    id: "scarf-lesson-3",
    courseId: "cozy-scarf-basics",
    title: "Finish, weave ends, and style your scarf",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 12,
    order: 3,
    linkedProducts: [
      { productId: "7", name: "Finishing Needle Kit", price: 8.99, thumbnail: "https://images.unsplash.com/photo-1586219835562-cc2cbaeb5ef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 12 },
    ],
  },
  {
    id: "hat-lesson-1",
    courseId: "pastel-bucket-hat",
    title: "Measure head size and start the crown",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 15,
    order: 1,
    linkedProducts: [
      { productId: "2", name: "Rainbow Pastel Yarn Bundle", price: 34.99, thumbnail: "https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 7 },
      { productId: "5", name: "Bamboo Crochet Hook Set", price: 24.99, thumbnail: "https://images.unsplash.com/photo-1611242320536-f12d3541249b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 20 },
    ],
  },
  {
    id: "hat-lesson-2",
    courseId: "pastel-bucket-hat",
    title: "Shape the sides and switch pastel colors",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 17,
    order: 2,
    linkedProducts: [
      { productId: "2", name: "Rainbow Pastel Yarn Bundle", price: 34.99, thumbnail: "https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 11 },
      { productId: "6", name: "Stitch Marker Ring Pack", price: 7.99, thumbnail: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 27 },
    ],
  },
  {
    id: "hat-lesson-3",
    courseId: "pastel-bucket-hat",
    title: "Create a sturdy brim and final fit check",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 15,
    order: 3,
    linkedProducts: [
      { productId: "8", name: "Compact Yarn Scissors", price: 9.99, thumbnail: "https://images.unsplash.com/photo-1600267165477-6d4cc741b379?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 14 },
    ],
  },
  {
    id: "tote-lesson-1",
    courseId: "statement-tote-pro",
    title: "Plan the tote structure and textured base",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 21,
    order: 1,
    linkedProducts: [
      { productId: "3", name: "Chunky Merino Wool - Sage Green", price: 18.99, thumbnail: "https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 9 },
      { productId: "9", name: "Ergonomic Metal Hook", price: 14.99, thumbnail: "https://images.unsplash.com/photo-1611242320536-f12d3541249b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 26 },
    ],
  },
  {
    id: "tote-lesson-2",
    courseId: "statement-tote-pro",
    title: "Build textured panels and join edges",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 24,
    order: 2,
    linkedProducts: [
      { productId: "3", name: "Chunky Merino Wool - Sage Green", price: 18.99, thumbnail: "https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 12 },
      { productId: "7", name: "Finishing Needle Kit", price: 8.99, thumbnail: "https://images.unsplash.com/photo-1586219835562-cc2cbaeb5ef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 31 },
    ],
  },
  {
    id: "tote-lesson-3",
    courseId: "statement-tote-pro",
    title: "Reinforce handles and prep your DIY post",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 24,
    order: 3,
    linkedProducts: [
      { productId: "10", name: "Leather Handle Pair", price: 19.99, thumbnail: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300", timestamp: 16 },
    ],
  },
];

export const materialCombos: MaterialCombo[] = [
  {
    id: "combo-beginner-scarf",
    name: "Beginner Scarf Starter Combo",
    level: "beginner",
    description: "Soft cotton yarn, bamboo hook, stitch markers, and finishing needles.",
    price: 54.96,
    thumbnail: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
    productIds: ["1", "5", "6", "7"],
  },
  {
    id: "combo-pro-hat",
    name: "Pro Pastel Hat Combo",
    level: "intermediate",
    description: "Pastel yarn bundle with hook, markers, and compact scissors for clean color changes.",
    price: 77.96,
    thumbnail: "https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
    productIds: ["2", "5", "6", "8"],
  },
  {
    id: "combo-promax-tote",
    name: "Promax Statement Tote Combo",
    level: "advanced",
    description: "Chunky yarn, ergonomic hook, finishing needles, and leather handles for creator-ready tote bags.",
    price: 62.96,
    thumbnail: "https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
    productIds: ["3", "7", "9", "10"],
  },
];

export function getLessonsByCourse(courseId: string) {
  return learnLessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}
