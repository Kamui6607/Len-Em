export interface ProductVariant {
  id: string;
  color?: string;
  hexCode?: string;
  stock: number;
  price: number;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  category: "yarn" | "tools" | "kit";
  tags: string[];
  description: string;
  image: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  materials?: string[];
  material?: string;
  weight?: string;
  yardage?: number;
  estimatedTime?: string;
  rating: number;
  reviewCount: number;
  popularity: number;
  createdAt: string;
  linkedComboIds?: string[];
  variants?: ProductVariant[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "Soft Cotton Yarn - Blush Pink",
    category: "yarn",
    linkedComboIds: ["combo-beginner-scarf", "combo-strawberry-case", "combo-daisy-top", "combo-bow-bag"],
    tags: ["cotton", "beginner-friendly", "soft", "breathable"],
    description: "Ultra-soft cotton yarn perfect for beginners. This gentle blush pink creates cozy, breathable pieces.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Cotton",
    weight: "DK Weight",
    yardage: 220,
    difficulty: "beginner",
    rating: 4.8,
    reviewCount: 124,
    popularity: 95,
    createdAt: "2026-03-15",
    variants: [
      {
        id: "1-blush",
        color: "Blush Pink",
        hexCode: "#F5C6C6",
        stock: 25,
        price: 12.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "1-cream",
        color: "Cream",
        hexCode: "#FFF8DC",
        stock: 18,
        price: 12.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "1-rose",
        color: "Dusty Rose",
        hexCode: "#C08081",
        stock: 12,
        price: 14.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "1-lavender",
        color: "Lavender",
        hexCode: "#D8BFD8",
        stock: 7,
        price: 12.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "2",
    name: "Rainbow Pastel Yarn Bundle",
    category: "yarn",
    linkedComboIds: ["combo-pro-hat", "combo-bunny-hat", "combo-phone-charm", "combo-cloud-cardigan"],
    tags: ["bundle", "pastel", "multi-color", "gift"],
    description: "A dreamy collection of 6 pastel colors. Perfect for creating gradient projects or mix-and-match pieces.",
    image: "https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Acrylic Blend",
    weight: "Medium Weight",
    yardage: 150,
    difficulty: "beginner",
    rating: 4.6,
    reviewCount: 89,
    popularity: 88,
    createdAt: "2026-04-01",
    variants: [
      {
        id: "2-bundle",
        color: "Multi-color",
        hexCode: "#FFB3BA",
        stock: 10,
        price: 34.99,
        images: ["https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "3",
    name: "Chunky Merino Wool - Sage Green",
    category: "yarn",
    linkedComboIds: ["combo-promax-tote", "combo-sage-tote", "combo-checkerboard-blanket"],
    tags: ["wool", "chunky", "luxury", "warm"],
    description: "Luxuriously soft merino wool in a calming sage green. Ideal for quick, cozy projects.",
    image: "https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Merino Wool",
    weight: "Chunky",
    yardage: 120,
    difficulty: "beginner",
    rating: 4.9,
    reviewCount: 67,
    popularity: 92,
    createdAt: "2026-02-20",
    variants: [
      {
        id: "3-sage",
        color: "Sage Green",
        hexCode: "#9CA884",
        stock: 15,
        price: 18.99,
        images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "3-charcoal",
        color: "Charcoal",
        hexCode: "#4A4A4A",
        stock: 20,
        price: 18.99,
        images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "3-oatmeal",
        color: "Oatmeal",
        hexCode: "#D4C9B5",
        stock: 5,
        price: 18.99,
        images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "4",
    name: "Sunset Gradient Yarn",
    category: "yarn",
    tags: ["gradient", "self-striping", "unique", "artisan"],
    description: "Self-striping yarn that creates beautiful sunset gradients as you crochet. No color changes needed!",
    image: "https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Acrylic",
    weight: "DK Weight",
    yardage: 200,
    difficulty: "intermediate",
    rating: 4.5,
    reviewCount: 42,
    popularity: 78,
    createdAt: "2026-04-10",
    variants: [
      {
        id: "4-sunset",
        color: "Sunset",
        hexCode: "#FF6B35",
        stock: 8,
        price: 16.99,
        images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "4-ocean",
        color: "Ocean",
        hexCode: "#0077B6",
        stock: 14,
        price: 16.99,
        images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "4-forest",
        color: "Forest",
        hexCode: "#2D6A4F",
        stock: 0,
        price: 16.99,
        images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "5",
    name: "Beginner Crochet Hook Set",
    category: "tools",
    linkedComboIds: ["combo-beginner-scarf", "combo-pro-hat", "combo-phone-charm"],
    tags: ["hooks", "set", "ergonomic", "starter"],
    description: "Complete set of ergonomic crochet hooks in all essential sizes. Designed for comfort during long crochet sessions.",
    image: "https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Aluminum",
    rating: 4.7,
    reviewCount: 203,
    popularity: 98,
    createdAt: "2026-01-10",
    variants: [
      {
        id: "5-set",
        stock: 30,
        price: 24.99,
        images: ["https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "6",
    name: "Premium Bamboo Hook Set",
    category: "tools",
    linkedComboIds: ["combo-beginner-scarf", "combo-pro-hat", "combo-bunny-hat"],
    tags: ["bamboo", "eco-friendly", "premium", "smooth"],
    description: "Eco-friendly bamboo hooks that are gentle on your hands. Smooth finish for effortless stitching.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Bamboo",
    rating: 4.8,
    reviewCount: 156,
    popularity: 85,
    createdAt: "2026-03-05",
    variants: [
      {
        id: "6-set",
        stock: 22,
        price: 32.99,
        images: ["https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "7",
    name: "Cozy Blanket Starter Kit",
    category: "kit",
    linkedComboIds: ["combo-beginner-scarf", "combo-promax-tote", "combo-scrunchie-set"],
    tags: ["blanket", "starter", "beginner", "complete"],
    description: "Everything you need to create your first chunky blanket. Includes yarn, hook, and step-by-step video tutorial.",
    image: "https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    estimatedTime: "2-3 weeks",
    materials: ["5 skeins chunky yarn", "Size N hook", "Pattern booklet", "Video access"],
    rating: 4.9,
    reviewCount: 312,
    popularity: 99,
    createdAt: "2026-02-01",
    variants: [
      {
        id: "7-blanket",
        color: "Chunky Gray",
        hexCode: "#B0B0B0",
        stock: 20,
        price: 49.99,
        images: ["https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "7-blanket-cream",
        color: "Cream",
        hexCode: "#FFF8DC",
        stock: 3,
        price: 49.99,
        images: ["https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "8",
    name: "Cute Amigurumi Animals Kit",
    category: "kit",
    linkedComboIds: ["combo-pro-hat", "combo-daisy-top"],
    tags: ["amigurumi", "animals", "cute", "gift", "beginner-friendly"],
    description: "Make adorable mini animals! Kit includes yarn in 6 colors, stuffing, safety eyes, and patterns for 3 animals.",
    image: "https://images.unsplash.com/photo-1630191631464-24a005b8cfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "intermediate",
    estimatedTime: "1-2 weeks",
    materials: ["6 yarn colors", "Polyfill stuffing", "Safety eyes", "3 patterns"],
    rating: 4.7,
    reviewCount: 178,
    popularity: 91,
    createdAt: "2026-03-20",
    variants: [
      {
        id: "8-amigurumi",
        stock: 15,
        price: 39.99,
        images: ["https://images.unsplash.com/photo-1630191631464-24a005b8cfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "9",
    name: "Self-Care Scrunchie Kit",
    category: "kit",
    linkedComboIds: ["combo-promax-tote", "combo-checkerboard-blanket", "combo-cloud-cardigan"],
    tags: ["scrunchie", "quick", "self-care", "gift", "beginner"],
    description: "Create trendy scrunchies for yourself or gifts! Quick project perfect for stress relief.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    estimatedTime: "1-2 hours",
    materials: ["3 yarn skeins", "Hair ties", "Hook", "Pattern"],
    rating: 4.4,
    reviewCount: 95,
    popularity: 82,
    createdAt: "2026-04-15",
    variants: [
      {
        id: "9-scrunchie",
        stock: 40,
        price: 22.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "10",
    name: "Alpaca Silk Fingering Yarn",
    category: "yarn",
    linkedComboIds: ["combo-promax-tote", "combo-sage-tote", "combo-bow-bag"],
    tags: ["alpaca", "silk", "luxury", "fingering", "lace"],
    description: "Sumptuously soft alpaca and silk blend in a delicate fingering weight. Perfect for shawls and lightweight garments.",
    image: "https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Alpaca & Silk",
    weight: "Fingering",
    yardage: 400,
    difficulty: "advanced",
    rating: 4.9,
    reviewCount: 56,
    popularity: 74,
    createdAt: "2026-04-20",
    variants: [
      {
        id: "10-rose",
        color: "Dusty Rose",
        hexCode: "#C08081",
        stock: 11,
        price: 22.99,
        images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "10-ivory",
        color: "Ivory",
        hexCode: "#FFFFF0",
        stock: 9,
        price: 22.99,
        images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "10-mauve",
        color: "Mauve",
        hexCode: "#E0B0FF",
        stock: 0,
        price: 22.99,
        images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "11",
    name: "Organic Cotton Yarn - Natural",
    category: "yarn",
    tags: ["organic", "cotton", "natural", "eco-friendly", "undyed"],
    description: "GOTS-certified organic cotton yarn in its natural undyed state. Gentle on sensitive skin and the planet.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Organic Cotton",
    weight: "DK Weight",
    yardage: 250,
    difficulty: "beginner",
    rating: 4.6,
    reviewCount: 78,
    popularity: 80,
    createdAt: "2026-05-01",
    variants: [
      {
        id: "11-cream",
        color: "Cream",
        hexCode: "#FFF8DC",
        stock: 22,
        price: 14.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
      {
        id: "11-brown",
        color: "Brown",
        hexCode: "#8B4513",
        stock: 16,
        price: 14.99,
        images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
  {
    id: "12",
    name: "Stitch Markers & Notions Set",
    category: "tools",
    tags: ["notions", "accessories", "stitch-markers", "essential"],
    description: "Everything notion you need in one cute set. Includes stitch markers, row counters, darning needles, and scissors.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Plastic & Metal",
    rating: 4.3,
    reviewCount: 234,
    popularity: 87,
    createdAt: "2026-01-25",
    variants: [
      {
        id: "12-set",
        stock: 50,
        price: 8.99,
        images: ["https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
      },
    ],
  },
];

/** Helpers for backward compatibility — get base price/default variant */
export function getBasePrice(product: Product): number {
  return product.variants?.[0]?.price ?? 0;
}

export function getDefaultVariant(product: Product) {
  return product.variants?.[0] ?? null;
}

export function getTotalStock(product: Product): number {
  return product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
}

/**
 * Dynamically extract filter options from the current product set.
 * Colors come from variant data, never hardcoded.
 */
export function getDynamicFilters(products: Product[]) {
  const yarnProducts = products.filter((p) => p.category === "yarn");
  const kitProducts = products.filter((p) => p.category === "kit");

  // Dynamic colors: extract from variant hexCode/color pairs across all yarn products
  const colorMap = new Map<string, string>();
  yarnProducts.forEach((p) => {
    p.variants?.forEach((v) => {
      if (v.color && v.hexCode && !colorMap.has(v.color)) {
        colorMap.set(v.color, v.hexCode);
      }
    });
  });

  const colors = Array.from(colorMap.entries()).map(([name, hex]) => ({
    name,
    hex,
    count: yarnProducts.filter((p) =>
      p.variants?.some((v) => v.color === name)
    ).length,
  }));

  // Materials
  const materialSet = new Set<string>();
  yarnProducts.forEach((p) => {
    if (p.material) materialSet.add(p.material);
  });
  const materials = Array.from(materialSet).map((name) => ({
    name,
    count: yarnProducts.filter((p) => p.material === name).length,
  }));

  // Weights
  const weightSet = new Set<string>();
  yarnProducts.forEach((p) => {
    if (p.weight) weightSet.add(p.weight);
  });
  const weights = Array.from(weightSet).map((name) => ({
    name,
    count: yarnProducts.filter((p) => p.weight === name).length,
  }));

  // Difficulties
  const difficultySet = new Set<string>();
  kitProducts.forEach((p) => {
    if (p.difficulty) difficultySet.add(p.difficulty);
  });
  const difficulties = Array.from(difficultySet).map((name) => ({
    name,
    count: kitProducts.filter((p) => p.difficulty === name).length,
  }));

  return { colors, materials, weights, difficulties };
}

export interface CommunityPost {
  id: string;
  username: string;
  image: string;
  caption: string;
  likes: number;
  project: string;
}

export const communityPosts: CommunityPost[] = [
  {
    id: "1",
    username: "cozy_maker",
    image: "https://images.unsplash.com/photo-1586219835562-cc2cbaeb5ef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Just finished my first blanket! Took me 3 weeks but so worth it for those Netflix nights ☁️",
    likes: 234,
    project: "Cozy Blanket",
  },
  {
    id: "2",
    username: "yarn_therapy",
    image: "https://images.unsplash.com/photo-1519412849983-957822373d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Crocheting between study sessions = best stress relief 💜",
    likes: 189,
    project: "Study Break Scarf",
  },
  {
    id: "3",
    username: "stitch_n_chill",
    image: "https://images.unsplash.com/photo-1628723367681-5dc96eb6f1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Made these little guys for my friends! They loved them 🐻",
    likes: 312,
    project: "Amigurumi Bears",
  },
];
