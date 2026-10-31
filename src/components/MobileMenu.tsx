import { Menu, ArrowUpRight, Home, CalendarDays, Music2, Play, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "./ui/sheet";

const links = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/years/", label: "年度から探す", icon: CalendarDays },
  { href: "/records/music/", label: "曲を探す", icon: Music2 },
  { href: "/records/media/", label: "動画を見る", icon: Play },
  { href: "/about/", label: "このサイトについて", icon: BookOpen },
  { href: "/contribute/", label: "連絡・情報提供", icon: MessageCircle },
];

export default function MobileMenu({ currentPath }: { currentPath: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="header-icon" aria-label="メニューを開く"><Menu /></Button>
      </SheetTrigger>
      <SheetContent side="right" className="navigation-sheet">
        <SheetHeader>
          <SheetTitle>MassGame Archive</SheetTitle>
          <SheetDescription>あの年の曲と演技を、もう一度。</SheetDescription>
        </SheetHeader>
        <nav aria-label="メニュー" className="sheet-links">
          {links.map(({ href, label, icon: Icon }) => (
            <SheetClose asChild key={href}>
              <a href={href} aria-current={(href === "/" ? currentPath === href : currentPath.startsWith(href)) ? "page" : undefined}>
                <Icon size={20} /><span>{label}</span><ArrowUpRight size={16} />
              </a>
            </SheetClose>
          ))}
        </nav>
        <p className="sheet-note">広大附属マスゲームの<br />非公式アーカイブ</p>
      </SheetContent>
    </Sheet>
  );
}
