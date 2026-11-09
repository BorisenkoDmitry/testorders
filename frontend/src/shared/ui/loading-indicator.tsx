import { LoaderCircle } from "lucide-react";

export function LoadingIndicator({ children = "Обновляем данные…", className = "text-muted-foreground" }: { children?: string; className?: string }) {
  return <span role="status" className={"inline-flex items-center gap-2 text-sm " + className}>
    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />{children}
  </span>;
}
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={"animate-pulse rounded bg-muted motion-reduce:animate-none " + className} />;
}
