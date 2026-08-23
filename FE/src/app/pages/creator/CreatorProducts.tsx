import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../shared/components/ui/dialog";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { linkedProducts } from "../../../features/creator/data/creator.mock";

export function CreatorProducts() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-warm-text)]">{t("creator.products.title")}</h1>
          <p className="text-muted-foreground">{t("creator.products.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-full bg-[var(--color-success)] hover:bg-[var(--color-warm-accent-hover)]"><Plus className="mr-2 h-4 w-4" />{t("creator.products.addProductLink")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("creator.products.linkDialogTitle")}</DialogTitle><DialogDescription>{t("creator.products.linkDialogDesc")}</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label htmlFor="product-name">{t("creator.products.tableHeaders.productName")}</Label><Input id="product-name" placeholder={t("creator.products.placeholder.product")} /></div>
              <div className="grid gap-2"><Label htmlFor="lesson-name">{t("creator.products.tableHeaders.linkedLesson")}</Label><Input id="lesson-name" placeholder={t("creator.products.placeholder.lesson")} /></div>
            </div>
            <DialogFooter><Button onClick={() => setOpen(false)} className="bg-[var(--color-success)] hover:bg-[var(--color-warm-accent-hover)]">{t("creator.products.addLink")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl border border-[var(--color-warm-border)] bg-card p-4 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("creator.products.tableHeaders.productName")}</TableHead>
              <TableHead>{t("creator.products.tableHeaders.linkedLesson")}</TableHead>
              <TableHead>{t("creator.products.tableHeaders.clicks")}</TableHead>
              <TableHead>{t("creator.products.tableHeaders.revenue")}</TableHead>
              <TableHead className="text-right">{t("creator.products.tableHeaders.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-semibold text-[var(--color-warm-text)]">{product.name}</TableCell>
                <TableCell>{product.lesson}</TableCell>
                <TableCell>{product.clicks.toLocaleString()}</TableCell>
                <TableCell>${product.estimatedRevenue.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm"><Link2 className="h-4 w-4" />{t("creator.products.changeLink")}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" />{t("creator.products.remove")}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
