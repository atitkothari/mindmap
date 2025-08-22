"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { storage, MindMap } from "@/lib/storage";
import { MindMapEditor } from "@/components/MindMapEditor";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Save } from "lucide-react";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const mapId = params.mapId as string;
  const [map, setMap] = useState<MindMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (mapId) {
      const loadedMap = storage.getMap(mapId);
      if (loadedMap) {
        setMap(loadedMap);
      } else {
        // Map not found, redirect to dashboard
        router.push("/dashboard");
      }
      setIsLoading(false);
    }
  }, [mapId, router]);

  const handleSave = (updatedMap: MindMap) => {
    storage.saveMap(updatedMap);
    setMap(updatedMap);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading mind map...</p>
        </div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Mind map not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {map.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Save className="h-4 w-4" />
              <span>Auto-saved</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-4rem)]">
        <MindMapEditor map={map} onSave={handleSave} />
      </main>
    </div>
  );
}
