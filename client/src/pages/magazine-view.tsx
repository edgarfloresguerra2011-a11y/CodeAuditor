import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Printer, 
  Maximize2,
  Heart,
  ChefHat,
  Clock,
  Users,
  Loader2
} from "lucide-react";

export default function MagazineView() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mockups, setMockups] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  useEffect(() => {
    async function loadProject() {
      try {
        const [projectRes, mockupsRes, chaptersRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/projects/${id}/mockups`),
          fetch(`/api/projects/${id}/chapters`)
        ]);
        
        const projectData = await projectRes.json();
        const mockupsData = await mockupsRes.json();
        const chaptersData = await chaptersRes.json();
        
        setProject(projectData);
        setMockups(mockupsData);
        setChapters(chaptersData);
      } catch (error) {
        console.error("Failed to load project:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProject();
  }, [id]);

  // New marketing mockups
  const mockupTabletOffice = mockups.find(m => m.type === "tablet_office");
  const mockupBook3d = mockups.find(m => m.type === "book_3d");
  const mockupMultiDevice = mockups.find(m => m.type === "multi_device");
  
  // Fallback to old types for backwards compatibility
  const mockup3d = mockups.find(m => m.type === "3d");
  const mockupMobile = mockups.find(m => m.type === "mobile");
  const mockupDesktop = mockups.find(m => m.type === "desktop");
  
  const heroImage = mockupBook3d?.imageUrl || mockup3d?.imageUrl || chapters[0]?.imageUrl || "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2070";
  const image1 = mockupTabletOffice?.imageUrl || chapters[1]?.imageUrl || mockupMobile?.imageUrl || "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=800";
  const image2 = mockupMultiDevice?.imageUrl || chapters[2]?.imageUrl || mockupDesktop?.imageUrl || "https://images.unsplash.com/photo-1494390248081-4e521a5940db?q=80&w=800";
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-100 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-zinc-200 flex items-center justify-between px-4 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm uppercase tracking-widest text-zinc-900">KETO VIBES <span className="text-orange-500">MAGAZINE</span></h1>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Preview Mode</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Printer className="mr-2 h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" className="h-8 bg-black hover:bg-zinc-800 text-white">
            <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </header>

      {/* Magazine Viewer */}
      <div className="flex-1 overflow-hidden flex justify-center p-8">
        <ScrollArea className="h-full w-full max-w-5xl bg-white shadow-2xl rounded-sm border border-zinc-200">
          
          {/* Page 1: Cover/Hero */}
          <div className="aspect-[1/1.4] w-full relative overflow-hidden">
            <img 
              src={heroImage} 
              className="absolute inset-0 w-full h-full object-cover"
              alt={project?.title || "Ebook Cover"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            
            <div className="absolute bottom-12 left-12 right-12 text-white">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none mb-4 text-lg px-4 py-1">FEATURED</Badge>
              <h1 className="text-6xl font-black leading-tight mb-4 font-serif">{project?.title?.toUpperCase() || "YOUR EBOOK"}</h1>
              <p className="text-xl text-zinc-200 max-w-lg">
                {chapters[0]?.title || "Premium AI-generated content with stunning visuals"}
              </p>
            </div>
          </div>

          {/* Page 2: Content Grid */}
          <div className="p-12 bg-white">
            <div className="grid grid-cols-12 gap-8">
              {/* Sidebar Info */}
              <div className="col-span-4 space-y-8 border-r border-zinc-100 pr-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">15 Minutes</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <Users className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Serves 2 People</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <ChefHat className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Beginner Friendly</span>
                  </div>
                </div>

                <div className="p-6 bg-orange-50 rounded-xl border border-orange-100">
                  <h3 className="font-bold text-orange-900 mb-4 uppercase tracking-wide text-sm">Ingredients</h3>
                  <ul className="space-y-3 text-orange-800 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2 cups</span> Greek Yogurt
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1/2 cup</span> Fresh Berries
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2 tbsp</span> Chia Seeds
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1 tsp</span> Honey (Optional)
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main Text */}
              <div className="col-span-8 space-y-6">
                <p className="first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left text-lg leading-relaxed text-zinc-600">
                  Breakfast is often called the most important meal of the day, and for good reason. When you're following a ketogenic lifestyle, the first meal sets the metabolic tone for the next 12 hours.
                </p>
                <p className="text-lg leading-relaxed text-zinc-600">
                  This bowl isn't just about hitting macros; it's about texture. The crunch of the chia seeds contrasts perfectly with the creamy richness of the full-fat yogurt. We recommend sourcing local berries whenever possible to maximize the flavor profile without adding unnecessary sugars.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="aspect-square rounded-lg overflow-hidden relative group">
                    <img src={image1} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview 1" />
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden relative group">
                    <img src={image2} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Preview 2" />
                  </div>
                </div>
                
                {/* Mostrar mockups profesionales para venta */}
                {(mockupTabletOffice || mockupBook3d || mockupMultiDevice) && (
                  <div className="mt-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 shadow-sm">
                    <h3 className="font-bold text-orange-900 mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                      <span className="text-orange-500">🎯</span> Mockups Profesionales para Venta
                    </h3>
                    <p className="text-xs text-orange-700 mb-4">Imágenes de marketing generadas con IA para promocionar tu ebook</p>
                    <div className="grid grid-cols-3 gap-4">
                      {mockupTabletOffice && (
                        <div className="text-center group">
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 shadow-md hover:shadow-xl transition-shadow">
                            <img src={mockupTabletOffice.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Tablet Office Mockup" />
                          </div>
                          <Badge className="text-xs bg-orange-500 text-white">Tablet en Oficina</Badge>
                        </div>
                      )}
                      {mockupBook3d && (
                        <div className="text-center group">
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 shadow-md hover:shadow-xl transition-shadow">
                            <img src={mockupBook3d.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="3D Book Mockup" />
                          </div>
                          <Badge className="text-xs bg-orange-500 text-white">Libro 3D</Badge>
                        </div>
                      )}
                      {mockupMultiDevice && (
                        <div className="text-center group">
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 shadow-md hover:shadow-xl transition-shadow">
                            <img src={mockupMultiDevice.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Multi-Device Mockup" />
                          </div>
                          <Badge className="text-xs bg-orange-500 text-white">Multi-Dispositivo</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page 3: Full Bleed Quote */}
          <div className="py-24 px-12 bg-zinc-900 text-center flex items-center justify-center">
            <blockquote className="max-w-2xl">
              <p className="text-4xl font-serif italic text-white leading-relaxed mb-6">
                "Food is symbolic of love when words are inadequate."
              </p>
              <footer className="text-orange-500 font-bold tracking-widest uppercase text-sm">
                — Alan D. Wolfelt
              </footer>
            </blockquote>
          </div>

        </ScrollArea>
      </div>
    </div>
  );
}
