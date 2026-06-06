import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  savedDIYPosts: string[];
  toggleDIYPostSave: (postId: string) => void;
  isDIYPostSaved: (postId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("cozyStitch_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedDIYPosts, setSavedDIYPosts] = useState<string[]>(() => {
    const saved = localStorage.getItem("lenem_saved_diy_posts");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cozyStitch_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("lenem_saved_diy_posts", JSON.stringify(savedDIYPosts));
  }, [savedDIYPosts]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  const toggleDIYPostSave = (postId: string) => {
    setSavedDIYPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  const isDIYPostSaved = (postId: string) => {
    return savedDIYPosts.includes(postId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        savedDIYPosts,
        toggleDIYPostSave,
        isDIYPostSaved,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}