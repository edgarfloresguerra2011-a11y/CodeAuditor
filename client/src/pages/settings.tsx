import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Key, 
  Video, 
  Brain, 
  Image as ImageIcon,
  MessageSquare,
  Globe,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const API_TYPES = [
  { value: "text_generation", label: "Generación de Texto", icon: MessageSquare },
  { value: "image_generation", label: "Generación de Imágenes", icon: ImageIcon },
  { value: "video_generation", label: "Generación de Video", icon: Video },
  { value: "reasoning", label: "Razonamiento/Análisis", icon: Brain },
  { value: "translation", label: "Traducción", icon: Globe },
];

interface ApiConfig {
  id?: number;
  userId: string;
  name: string;
  type: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  metadata?: any;
  isActive: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ApiConfig>>({
    name: "",
    type: "text_generation",
    apiKey: "",
    baseUrl: "",
    model: "",
    isActive: 1,
  });

  useEffect(() => {
    fetchConfigs();
  }, [user]);

  const fetchConfigs = async () => {
    try {
      const userId = user?.uid || "demo-user";
      const response = await fetch(`/api/api-configs?userId=${userId}`);
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const userId = user?.uid || "demo-user";
      const dataToSave = { ...formData, userId };
      
      let response;
      if (editingId) {
        response = await fetch(`/api/api-configs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
      } else {
        response = await fetch("/api/api-configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
      }

      if (!response.ok) throw new Error("Error al guardar");

      toast({
        title: "Éxito",
        description: editingId ? "API actualizada" : "API agregada correctamente",
      });

      setFormData({
        name: "",
        type: "text_generation",
        apiKey: "",
        baseUrl: "",
        model: "",
        isActive: 1,
      });
      setEditingId(null);
      setShowAddForm(false);
      fetchConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta API?")) return;
    
    try {
      const response = await fetch(`/api/api-configs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      toast({
        title: "API eliminada",
        description: "La configuración se eliminó correctamente",
      });

      fetchConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (config: ApiConfig) => {
    setFormData(config);
    setEditingId(config.id || null);
    setShowAddForm(true);
  };

  const handleToggleActive = async (config: ApiConfig) => {
    try {
      const response = await fetch(`/api/api-configs/${config.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: config.isActive === 1 ? 0 : 1 }),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      fetchConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    const apiType = API_TYPES.find(t => t.value === type);
    return apiType ? apiType.icon : Key;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de APIs</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus claves API para generación de contenido</p>
          </div>
          <Button 
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setFormData({
                name: "",
                type: "text_generation",
                apiKey: "",
                baseUrl: "",
                model: "",
                isActive: 1,
              });
            }}
            data-testid="button-add-api"
          >
            <Plus className="mr-2 h-4 w-4" />
            {showAddForm ? "Cancelar" : "Agregar API"}
          </Button>
        </div>

        {showAddForm && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>{editingId ? "Editar" : "Agregar"} Configuración API</CardTitle>
              <CardDescription>
                Configura una nueva API para usar en la generación de ebooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la API</Label>
                  <Input
                    id="name"
                    placeholder="Ej: OpenAI GPT-4"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-api-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de API</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="select-api-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {API_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    data-testid="input-api-key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo (opcional)</Label>
                  <Input
                    id="model"
                    placeholder="Ej: gpt-4, claude-3"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    data-testid="input-model"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="baseUrl">Base URL (opcional)</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.example.com"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    data-testid="input-base-url"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} data-testid="button-save-api">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : configs.length === 0 ? (
          <Card className="py-20">
            <CardContent className="text-center space-y-4">
              <Key className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No hay APIs configuradas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agrega tu primera API para comenzar a generar contenido
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => {
              const TypeIcon = getTypeIcon(config.type);
              const typeLabel = API_TYPES.find(t => t.value === config.type)?.label || config.type;
              
              return (
                <Card key={config.id} className="relative" data-testid={`card-api-${config.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TypeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base" data-testid={`text-api-name-${config.id}`}>
                            {config.name}
                          </CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {typeLabel}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={config.isActive === 1}
                        onCheckedChange={() => handleToggleActive(config)}
                        data-testid={`switch-active-${config.id}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs space-y-1">
                      {config.model && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Modelo:</span>
                          <span className="font-mono">{config.model}</span>
                        </div>
                      )}
                      {config.baseUrl && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base URL:</span>
                          <span className="font-mono truncate max-w-[150px]">{config.baseUrl}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Key:</span>
                        <span className="font-mono">••••••••</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(config)}
                        data-testid={`button-edit-${config.id}`}
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(config.id!)}
                        data-testid={`button-delete-${config.id}`}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
