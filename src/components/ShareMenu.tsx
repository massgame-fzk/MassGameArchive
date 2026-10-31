import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";

export default function ShareMenu({ title, text, url }: { title: string; text: string; url: string }) {
  const [status, setStatus] = useState("");
  const [shareUrl, setShareUrl] = useState(url);
  const [canShare, setCanShare] = useState(false);
  return <Sheet onOpenChange={(open) => {
    if (open) { setShareUrl(location.href); setStatus(""); setCanShare(typeof navigator.share === "function"); }
  }}>
    <SheetTrigger asChild><Button variant="ghost" size="icon" className="header-icon" aria-label="このページを共有"><Share2 /></Button></SheetTrigger>
    <SheetContent side="bottom" className="share-sheet">
      <SheetHeader><SheetTitle>思い出を、つなぐ。</SheetTitle><SheetDescription>このページを友人や仲間に共有する</SheetDescription></SheetHeader>
      <div className="share-options">
        <Button variant="outline" onClick={async () => {
          try { await navigator.clipboard.writeText(shareUrl); setStatus("リンクをコピーしました"); }
          catch { setStatus("コピーできませんでした。アドレスバーからURLをコピーしてください。"); }
        }}>{status === "リンクをコピーしました" ? <Check /> : <Copy />}リンクをコピー</Button>
        {canShare && <Button variant="outline" onClick={async () => {
          try { await navigator.share({ title, text, url: shareUrl }); }
          catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("共有できませんでした。リンクのコピーをお試しください。"); }
        }}><Share2 />ほかのアプリで共有</Button>}
        <div className="social-links">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">X</a>
          <a href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">LINE</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
        <p role="status" className="share-status">{status}</p>
      </div>
    </SheetContent>
  </Sheet>;
}
