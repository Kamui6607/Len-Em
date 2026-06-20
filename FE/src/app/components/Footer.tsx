import { Instagram, Youtube, MessageCircle } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground">🧶</span>
              </div>
              <span className="font-semibold text-xl text-foreground">Len&Em</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your cozy corner for yarn, kits, and creative vibes.
            </p>
          </div>

          <div>
            <h4 className="mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/kits" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  DIY Kits
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  Yarn
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  Tools
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/learn" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  Beginner's Guide
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center">
                  Live Workshops
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Connect</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Join our community and stay inspired!
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors active:scale-95 min-h-[44px] min-w-[44px]"
                aria-label="Instagram"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors active:scale-95 min-h-[44px] min-w-[44px]"
                aria-label="Youtube"
              >
                <Youtube className="size-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors active:scale-95 min-h-[44px] min-w-[44px]"
                aria-label="Messenger"
              >
                <MessageCircle className="size-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2026 Len&Em. Made with 💛 for makers everywhere.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors min-h-[44px] flex items-center">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors min-h-[44px] flex items-center">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary transition-colors min-h-[44px] flex items-center">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
