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
  category: string;
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
  // ==================== YARN (Len) ====================
  {
    id: "yarn-cotton-blush",
    name: "Len Cotton Mềm - Hồng Phấn",
    category: "yarn",
    linkedComboIds: ["combo-khan-co-ban", "combo-mu-bunny", "combo-bow-mini"],
    tags: ["cotton", "beginner-friendly", "mềm", "thoáng khí"],
    description: "Len cotton siêu mềm, phù hợp cho người mới bắt đầu. Màu hồng phấn dễ thương tạo nên những sản phẩm nhẹ nhàng, thoải mái.",
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
      { id: "cotton-blush", color: "Hồng Phấn", hexCode: "#F5C6C6", stock: 25, price: 129000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "cotton-cream", color: "Kem Sữa", hexCode: "#FFF8DC", stock: 18, price: 129000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "cotton-lavender", color: "Oải Hương", hexCode: "#D8BFD8", stock: 12, price: 129000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "cotton-sky", color: "Xanh Trời", hexCode: "#87CEEB", stock: 8, price: 129000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-pastel-bundle",
    name: "Bộ Len Pastel Cầu Vồng",
    category: "yarn",
    linkedComboIds: ["combo-mu-pro", "combo-mu-bunny", "combo-phone-charm", "combo-cardigan-cloud"],
    tags: ["bundle", "pastel", "đa sắc", "quà tặng"],
    description: "Bộ sưu tập 6 màu pastel mơ ước. Hoàn hảo để tạo các dự án gradient hoặc phối màu.",
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
      { id: "pastel-bundle", color: "Cầu Vồng", hexCode: "#FFB3BA", stock: 10, price: 349000, images: ["https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-merino-sage",
    name: "Len Merino Chunky - Xanh Sage",
    category: "yarn",
    linkedComboIds: ["combo-tote-promax", "combo-tote-sage", "combo-checkerboard-blanket"],
    tags: ["wool", "chunky", "sang trọng", "ấm áp"],
    description: "Len merino siêu mềm trong màu xanh sage dịu dàng. Lý tưởng cho các dự án nhanh, ấm áp.",
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
      { id: "merino-sage", color: "Xanh Sage", hexCode: "#9CA884", stock: 15, price: 189000, images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "merino-charcoal", color: "Xám Than", hexCode: "#4A4A4A", stock: 20, price: 189000, images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "merino-oat", color: "Yến Mạch", hexCode: "#D4C9B5", stock: 5, price: 189000, images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-gradient-sunset",
    name: "Len Gradient Hoàng Hôn",
    category: "yarn",
    tags: ["gradient", "tự sọc", "độc đáo", "thủ công"],
    description: "Len tự đổi màu tạo hiệu ứng hoàng hôn tuyệt đẹp khi bạn móc. Không cần thay đổi màu!",
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
      { id: "gradient-sunset", color: "Hoàng Hôn", hexCode: "#FF6B35", stock: 8, price: 169000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "gradient-ocean", color: "Đại Dương", hexCode: "#0077B6", stock: 14, price: 169000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "gradient-forest", color: "Rừng Xanh", hexCode: "#2D6A4F", stock: 0, price: 169000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-alpaca-silk",
    name: "Len Alpaca Silk - Cao Cấp",
    category: "yarn",
    linkedComboIds: ["combo-tote-promax", "combo-tote-sage", "combo-bow-mini"],
    tags: ["alpaca", "silk", "sang trọng", "mảnh"],
    description: "Sợi len alpaca pha silk cực kỳ mềm mại. Hoàn hảo cho khăn choàng và áo nhẹ.",
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
      { id: "alpaca-rose", color: "Hồng Cổ Điển", hexCode: "#C08081", stock: 11, price: 229000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "alpaca-ivory", color: "Ngà", hexCode: "#FFFFF0", stock: 9, price: 229000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-organic-cotton",
    name: "Len Cotton Hữu Cơ - Tự Nhiên",
    category: "yarn",
    tags: ["organic", "cotton", "tự nhiên", "thân thiện"],
    description: "Len cotton hữu cơ GOTS trong trạng thái không nhuộm. Dịu nhẹ cho da nhạy cảm và hành tinh.",
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
      { id: "organic-cream", color: "Kem", hexCode: "#FFF8DC", stock: 22, price: 149000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "organic-brown", color: "Nâu Đất", hexCode: "#8B4513", stock: 16, price: 149000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-bamboo-silk",
    name: "Len Tre Mềm - Mát Lạnh",
    category: "yarn",
    linkedComboIds: ["combo-khan-co-ban", "combo-daisy-top"],
    tags: ["bamboo", "mát", "mùa hè", "sinh thái"],
    description: "Len từ sợi tre tự nhiên, mát lạnh và rất phù hợp cho các dự án mùa hè.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Bamboo",
    weight: "DK Weight",
    yardage: 180,
    difficulty: "beginner",
    rating: 4.4,
    reviewCount: 35,
    popularity: 69,
    createdAt: "2026-05-15",
    variants: [
      { id: "bamboo-white", color: "Trắng Tinh", hexCode: "#F5F5F5", stock: 20, price: 139000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "bamboo-mint", color: "Bạc Hà", hexCode: "#98FF98", stock: 14, price: 139000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "bamboo-peach", color: "Đào", hexCode: "#FFDAB9", stock: 10, price: 139000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-wool-acrylic",
    name: "Len Pha Ấm - Đỏ Cam",
    category: "yarn",
    linkedComboIds: ["combo-mu-pro", "combo-checkerboard-blanket"],
    tags: ["wool", "ấm", "pha", "mùa đông"],
    description: "Len pha wool-acrylic ấm áp với màu đỏ cam rực rỡ. Lý tưởng cho khăn quàng và áo mùa đông.",
    image: "https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Wool-Acrylic",
    weight: "Medium Weight",
    yardage: 160,
    difficulty: "intermediate",
    rating: 4.3,
    reviewCount: 48,
    popularity: 72,
    createdAt: "2026-04-05",
    variants: [
      { id: "wool-red", color: "Đỏ Cam", hexCode: "#FF4500", stock: 12, price: 159000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "wool-navy", color: "Xanh Navy", hexCode: "#000080", stock: 18, price: 159000, images: ["https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-super-chunky",
    name: "Len Cực To - Bự",
    category: "yarn",
    linkedComboIds: ["combo-checkerboard-blanket", "combo-khan-co-ban"],
    tags: ["super chunky", "ấm", "nhanh", "bự"],
    description: "Len siêu to dành cho các dự án cực nhanh. Hoàn thành chăn trong vài giờ!",
    image: "https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Acrylic",
    weight: "Super Bulky",
    yardage: 60,
    difficulty: "beginner",
    rating: 4.7,
    reviewCount: 92,
    popularity: 86,
    createdAt: "2026-03-01",
    variants: [
      { id: "super-gray", color: "Xám", hexCode: "#B0B0B0", stock: 10, price: 249000, images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "super-pink", color: "Hồng", hexCode: "#FF69B4", stock: 7, price: 249000, images: ["https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "yarn-cotton-milk",
    name: "Len Sữa Cotton - Mềm Mại",
    category: "yarn",
    linkedComboIds: ["combo-daisy-top", "combo-scrunchie-set", "combo-strawberry-case"],
    tags: ["cotton", "sữa", "mềm", "bé"],
    description: "Len sữa cotton siêu mềm, cảm giác như chạm vào mây. Phù hợp cho đồ em bé và phụ kiện.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Cotton Milk",
    weight: "DK Weight",
    yardage: 200,
    difficulty: "beginner",
    rating: 4.5,
    reviewCount: 63,
    popularity: 75,
    createdAt: "2026-05-20",
    variants: [
      { id: "milk-white", color: "Trắng Sữa", hexCode: "#FFF8E7", stock: 30, price: 119000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "milk-pink", color: "Hồng Sữa", hexCode: "#FFD1DC", stock: 25, price: 119000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },

  // ==================== TOOLS (Dụng cụ) ====================
  {
    id: "tool-hooks-bamboo",
    name: "Bộ Kim Móc Tre - Cún Yêu",
    category: "tools",
    linkedComboIds: ["combo-khan-co-ban", "combo-mu-pro", "combo-mu-bunny"],
    tags: ["bamboo", "sinh thái", "cao cấp", "mượt"],
    description: "Bộ kim móc tre thân thiện môi trường, nhẹ nhàng trên tay. Bề mặt mượt cho đường móc êm ái.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Tre",
    rating: 4.8,
    reviewCount: 156,
    popularity: 85,
    createdAt: "2026-03-05",
    variants: [
      { id: "bamboo-set", stock: 22, price: 329000, images: ["https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "tool-hooks-aluminum",
    name: "Bộ Kim Móc Nhôm - Cơ Bản",
    category: "tools",
    linkedComboIds: ["combo-khan-co-ban", "combo-mu-pro", "combo-phone-charm"],
    tags: ["hooks", "set", "cơ bản", "bền"],
    description: "Bộ kim móc nhôm đầy đủ kích cỡ. Thiết kế công thái học thoải mái khi móc lâu.",
    image: "https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Nhôm",
    rating: 4.7,
    reviewCount: 203,
    popularity: 98,
    createdAt: "2026-01-10",
    variants: [
      { id: "aluminum-set", stock: 30, price: 249000, images: ["https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "tool-stitch-markers",
    name: "Bộ Đánh Dấu Mũi & Phụ Kiện",
    category: "tools",
    tags: ["phụ kiện", "đánh dấu", "cần thiết"],
    description: "Mọi phụ kiện bạn cần trong một bộ dễ thương. Gồm đánh dấu mũi, đếm hàng, kim may và kéo.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Nhựa & Kim Loại",
    rating: 4.3,
    reviewCount: 234,
    popularity: 87,
    createdAt: "2026-01-25",
    variants: [
      { id: "markers-set", stock: 50, price: 89000, images: ["https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "tool-hook-ergonomic",
    name: "Kim Móc Ergonomic - Cao Cấp",
    category: "tools",
    linkedComboIds: ["combo-tote-promax", "combo-cardigan-cloud", "combo-checkerboard-blanket"],
    tags: ["ergonomic", "cao su", "thoải mái", "chuyên nghiệp"],
    description: "Kim móc công thái học với tay cầm cao su mềm, giảm mỏi tay khi móc lâu.",
    image: "https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Cao su & Kim loại",
    rating: 4.6,
    reviewCount: 88,
    popularity: 82,
    createdAt: "2026-02-15",
    variants: [
      { id: "ergonomic-single", stock: 35, price: 149000, images: ["https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "tool-scissors-needles",
    name: "Kéo Cắt Len & Kim Bay",
    category: "tools",
    linkedComboIds: ["combo-daisy-top", "combo-mu-bunny"],
    tags: ["kéo", "kim", "cắt", "cần thiết"],
    description: "Kéo nhỏ gọn chuyên cắt len + bộ kim bay các cỡ. Bỏ túi mang theo mọi nơi.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Kim Loại",
    rating: 4.4,
    reviewCount: 67,
    popularity: 71,
    createdAt: "2026-04-25",
    variants: [
      { id: "scissors-set", stock: 40, price: 69000, images: ["https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "tool-darning-needles",
    name: "Kim May Len - Bộ 6 Cây",
    category: "tools",
    tags: ["kim", "may", "cơ bản", "cần thiết"],
    description: "Bộ 6 kim may len với đầu to, dễ xỏ. Hoàn thiện sản phẩm chuyên nghiệp.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    material: "Kim Loại",
    rating: 4.5,
    reviewCount: 54,
    popularity: 65,
    createdAt: "2026-05-10",
    variants: [
      { id: "needles-set", stock: 45, price: 49000, images: ["https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },

  // ==================== KITS (Combo) ====================
  {
    id: "kit-blanket-cozy",
    name: "Kit Chăn Ấm - Khởi Đầu",
    category: "kit",
    linkedComboIds: ["combo-khan-co-ban", "combo-tote-promax", "combo-scrunchie-set"],
    tags: ["chăn", "starter", "beginner", "đầy đủ"],
    description: "Mọi thứ bạn cần để tạo chiếc chăn bự đầu tiên. Gồm len, kim móc và hướng dẫn từng bước.",
    image: "https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    estimatedTime: "2-3 tuần",
    materials: ["5 cuộn len chunky", "Kim móc size N", "Sách hướng dẫn", "Video hướng dẫn"],
    rating: 4.9,
    reviewCount: 312,
    popularity: 99,
    createdAt: "2026-02-01",
    variants: [
      { id: "blanket-gray", color: "Xám", hexCode: "#B0B0B0", stock: 20, price: 499000, images: ["https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
      { id: "blanket-cream", color: "Kem", hexCode: "#FFF8DC", stock: 3, price: 499000, images: ["https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "kit-amigurumi-animals",
    name: "Kit Thú Bông Amigurumi - Đáng Yêu",
    category: "kit",
    linkedComboIds: ["combo-mu-pro", "combo-daisy-top"],
    tags: ["amigurumi", "thú bông", "dễ thương", "quà tặng"],
    description: "Làm thú bông mini đáng yêu! Kit gồm len 6 màu, bông, mắt an toàn và hướng dẫn 3 con.",
    image: "https://images.unsplash.com/photo-1630191631464-24a005b8cfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "intermediate",
    estimatedTime: "1-2 tuần",
    materials: ["6 màu len", "Bông gòn", "Mắt an toàn", "3 hướng dẫn"],
    rating: 4.7,
    reviewCount: 178,
    popularity: 91,
    createdAt: "2026-03-20",
    variants: [
      { id: "amigurumi-set", stock: 15, price: 399000, images: ["https://images.unsplash.com/photo-1630191631464-24a005b8cfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "kit-scrunchie-set",
    name: "Kit Nơ Tóc - Tự Chăm Sóc",
    category: "kit",
    linkedComboIds: ["combo-tote-promax", "combo-checkerboard-blanket", "combo-cardigan-cloud"],
    tags: ["scrunchie", "nhanh", "tự chăm sóc", "quà tặng"],
    description: "Tạo nơ tóc thời trang cho bản thân hoặc làm quà! Dự án nhanh, thư giãn.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    estimatedTime: "1-2 giờ",
    materials: ["3 cuộn len", "Dây thun", "Kim móc", "Hướng dẫn"],
    rating: 4.4,
    reviewCount: 95,
    popularity: 82,
    createdAt: "2026-04-15",
    variants: [
      { id: "scrunchie-set", stock: 40, price: 229000, images: ["https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
    ],
  },
  {
    id: "kit-beginner-tools",
    name: "Combo Khởi Nghiệp Đan Móc",
    category: "kit",
    linkedComboIds: ["combo-khan-co-ban", "combo-mu-pro", "combo-mu-bunny"],
    tags: ["starter", "complete", "giá tốt", "tất cả"],
    description: "Combo toàn diện cho người mới: đủ len, kim, phụ kiện và 3 khóa học cơ bản.",
    image: "https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    estimatedTime: "1 tháng",
    materials: ["4 cuộn len cotton", "Bộ kim tre 6 cây", "Phụ kiện đánh dấu", "3 video khóa học"],
    rating: 4.8,
    reviewCount: 245,
    popularity: 96,
    createdAt: "2026-01-20",
    variants: [
      { id: "beginner-combo", stock: 25, price: 599000, images: ["https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"] },
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
    username: "thu_handmade",
    image: "https://images.unsplash.com/photo-1586219835562-cc2cbaeb5ef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Vừa hoàn thành chiếc chăn đầu tiên! Mất 3 tuần nhưng xứng đáng cho những buổi xem Netflix ☁️",
    likes: 234,
    project: "Chăn Ấm Len",
  },
  {
    id: "2",
    username: "minh_handmade",
    image: "https://images.unsplash.com/photo-1519412849983-957822373d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Móc giữa giờ học = giảm stress tốt nhất 💜",
    likes: 189,
    project: "Khăn Quàng Giải Lao",
  },
  {
    id: "3",
    username: "ngoc_tran",
    image: "https://images.unsplash.com/photo-1628723367681-5dc96eb6f1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Làm mấy bạn gấu nhỏ tặng bạn bè! Ai cũng yêu thích 🐻",
    likes: 312,
    project: "Gấu Amigurumi",
  },
  {
    id: "4",
    username: "linh_creator",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Túi tote xanh sage - mất đúng 1 tuần. Đã có thể đi chợ với thành quả 👜",
    likes: 567,
    project: "Túi Tote Sage",
  },
  {
    id: "5",
    username: "thu_handmade",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Set nơ tóc tặng hội chị em. Ai cũng khen xinh! 🎀",
    likes: 178,
    project: "Nơ Tóc Handmade",
  },
  {
    id: "6",
    username: "minh_handmade",
    image: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Chăn ca-rô cho phòng khách. Màu sắc hợp decor quá trời! 🟦🟨",
    likes: 890,
    project: "Chăn Ca-rô",
  },
  {
    id: "7",
    username: "ngoc_tran",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Cardigan cloud puff - như ôm đám mây vậy! ☁️",
    likes: 1234,
    project: "Cardigan Cloud",
  },
  {
    id: "8",
    username: "thu_handmade",
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Túi mini nơ coquette cho ngày hẹn hò 🎀💕",
    likes: 456,
    project: "Túi Mini Coquette",
  },
];