import { useNavigate } from "react-router";
import { Eye, Plus, ShoppingBag } from "lucide-react";
import { Button } from "../../components/ui/button";
import { creatorDiyPosts } from "../../../features/creator/data/creator.mock";

export function CreatorDIY() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3f342c]">Creator DIY posts</h1>
          <p className="text-muted-foreground">Show finished creations, link your material combo, and let viewers buy instantly.</p>
        </div>
        <Button onClick={() => navigate("/diy/create")} className="rounded-full bg-[#b7664e] hover:bg-[#9f5844]"><Plus className="mr-2 h-4 w-4" />Post new DIY</Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {creatorDiyPosts.map((post) => (
          <article key={post.id} className="overflow-hidden rounded-3xl border border-[#eadcc7] bg-card shadow-sm">
            <div className="relative h-56 overflow-hidden bg-[#f4eadb]">
              <img src={post.image} alt={post.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              <span className="absolute left-4 top-4 rounded-full bg-[#fff8ed]/90 px-3 py-1 text-xs font-bold text-[#b7664e]">{post.tag}</span>
            </div>
            <div className="space-y-4 p-5">
              <h2 className="text-xl font-bold text-[#3f342c]">{post.title}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#fff8ed] p-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="h-4 w-4" />Views</div><p className="mt-1 text-2xl font-bold text-[#3f342c]">{post.views.toLocaleString()}</p></div>
                <div className="rounded-2xl bg-[#e8f0df] p-3"><div className="flex items-center gap-2 text-sm text-[#6f8f63]"><ShoppingBag className="h-4 w-4" />Purchases</div><p className="mt-1 text-2xl font-bold text-[#3f342c]">{post.comboPurchases}</p></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
