import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ImagePlus, Plus, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { products } from "../data/products";

interface ComboItem {
  productId: string;
  name: string;
  thumbnail: string;
  price: number;
  quantity: number;
}

export function DIYCreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);

  const searchableProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return products
      .map((product) => ({
        productId: product.id,
        name: product.name,
        thumbnail: product.image,
        price: product.variants?.[0]?.price ?? 0,
        tags: product.tags,
      }))
      .filter((product) => {
        if (!search) return true;
        return (
          product.name.toLowerCase().includes(search) ||
          product.tags.some((tag) => tag.toLowerCase().includes(search))
        );
      })
      .slice(0, 8);
  }, [productSearch]);

  const comboTotal = comboItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const addTag = () => {
    const normalized = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!normalized || tags.includes(normalized)) return;
    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  };

  const addProductToCombo = (product: Omit<ComboItem, "quantity">) => {
    setComboItems((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setComboItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeComboItem = (productId: string) => {
    setComboItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || imagePreviews.length === 0 || comboItems.length === 0) {
      toast.error("Please add a title, description, image, and at least one material");
      return;
    }

    toast.success("DIY post submitted successfully");
    setTitle("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setImagePreviews([]);
    setComboItems([]);
    setProductSearch("");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-background p-6 md:p-10">
          <Badge variant="secondary" className="mb-4">Create DIY</Badge>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-5xl">Share your make with Len&Em.</h1>
          <p className="max-w-3xl text-muted-foreground md:text-lg">
            Upload your handmade creation, link the exact materials you used, and let viewers buy the combo instantly.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <main className="space-y-6">
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <Label htmlFor="images">Images</Label>
                  <div className="mt-2 rounded-2xl border border-dashed p-5">
                    <label htmlFor="images" className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                      <ImagePlus className="size-8" />
                      <span>Upload multiple images with preview</span>
                    </label>
                    <Input id="images" type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {imagePreviews.map((preview) => (
                        <div key={preview} className="relative overflow-hidden rounded-xl border">
                          <img src={preview} alt="DIY preview" className="aspect-square w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImagePreviews((prev) => prev.filter((item) => item !== preview))}
                            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Coquette bow mini bag" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell viewers what inspired your creation..." rows={5} />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add a tag and press Enter"
                      />
                      <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="gap-1">
                          #{tag}
                          <button type="button" onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}>
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="text-2xl font-semibold">Link material combo</h2>
                  <p className="text-sm text-muted-foreground">Search shop products and add each material with quantity.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search yarn, hooks, scissors..." className="pl-9" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {searchableProducts.map((product) => (
                    <div key={product.productId} className="flex gap-3 rounded-xl border p-3">
                      <img src={product.thumbnail} alt={product.name} className="size-14 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => addProductToCombo(product)}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
            <h2 className="text-2xl font-semibold">Combo preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">{comboItems.length} material{comboItems.length === 1 ? "" : "s"} selected</p>

            <div className="mt-5 space-y-3">
              {comboItems.map((item) => (
                <div key={item.productId} className="rounded-xl border p-3">
                  <div className="flex gap-3">
                    <img src={item.thumbnail} alt={item.name} className="size-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-medium">{item.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                    </div>
                    <button type="button" onClick={() => removeComboItem(item.productId)} className="text-muted-foreground hover:text-destructive">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Label htmlFor={`qty-${item.productId}`} className="text-sm">Quantity</Label>
                    <Input
                      id={`qty-${item.productId}`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                      className="h-8 w-20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="my-5 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${comboTotal.toFixed(2)}</span>
            </div>

            <Button type="submit" size="lg" className="w-full">
              <Send className="size-4" /> Submit DIY post
            </Button>
          </aside>
        </div>
      </form>
    </div>
  );
}
