import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { linkedProducts } from "../../../features/creator/data/creator.mock";

export function CreatorProducts() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3f342c]">Products linked in videos</h1>
          <p className="text-muted-foreground">Manage material combo links and measure add-to-cart intent from lessons.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-full bg-[#7f9b73] hover:bg-[#6f8f63]"><Plus className="mr-2 h-4 w-4" />Add product link</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Link product to lesson</DialogTitle><DialogDescription>Mock relationship for product ↔ lesson conversion tracking.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label htmlFor="product-name">Product</Label><Input id="product-name" placeholder="Beginner / Pro / Promax combo" /></div>
              <div className="grid gap-2"><Label htmlFor="lesson-name">Lesson</Label><Input id="lesson-name" placeholder="Magic ring without stress" /></div>
            </div>
            <DialogFooter><Button onClick={() => setOpen(false)} className="bg-[#7f9b73] hover:bg-[#6f8f63]">Add link</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl border border-[#eadcc7] bg-card p-4 shadow-sm">
        <Table>
          <TableHeader><TableRow><TableHead>Product name</TableHead><TableHead>Linked lesson</TableHead><TableHead>Add-to-cart clicks</TableHead><TableHead>Estimated revenue</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {linkedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-semibold text-[#3f342c]">{product.name}</TableCell>
                <TableCell>{product.lesson}</TableCell>
                <TableCell>{product.clicks.toLocaleString()}</TableCell>
                <TableCell>${product.estimatedRevenue.toLocaleString()}</TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button variant="ghost" size="sm"><Link2 className="h-4 w-4" />Change link</Button><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" />Remove</Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
