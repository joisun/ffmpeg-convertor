import Header from "./Header";
import { Toaster } from "@/components/ui/toaster";
import VideoToX from "@/pages/VideoToX";

export default function Layout() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <Header />
      <main className="min-h-0 flex-1 overflow-hidden">
        <VideoToX />
      </main>
      <Toaster />
    </div>
  );
}
