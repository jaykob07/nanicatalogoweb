import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductForm } from "@/components/ProductForm";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";




interface Product {
  id: string;
  name: string;
  reference: string;
  description: string;
  price: number;
  image_url?: string;
}

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  action: string;
  product_name: string;
}

const PAGE_SIZE = 24;

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * 🛠️ CORRECCIÓN CLAVE: Función de carga envuelta en useCallback
   * y manejando su propio estado 'loading'.
   */
  const loadProducts = useCallback(async (page = 0, append = false, query = "") => {
    // 1. Inicia la carga aquí
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let productsQuery = supabase
        .from("products")
        .select("*", { count: "exact" });

      if (query.trim()) {
        productsQuery = productsQuery.or(`name.ilike.%${query}%,reference.ilike.%${query}%`);
      }

      const { data, error, count } = await productsQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setProducts((current) => (append ? [...current, ...(data || [])] : data || []));
      setHasMoreProducts(count ? to + 1 < count : (data || []).length === PAGE_SIZE);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
      console.error("Error al cargar productos:", error);

    } finally {
      // 2. Finaliza la carga aquí
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  const loadAuditLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (e) {
      console.error("Error loading audit logs", e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  /**
   * 🛠️ CORRECCIÓN CLAVE: useEffect modificado
   */
  useEffect(() => {
    const handleAuth = (currentSession: Session | null) => {
      setSession(currentSession);

      if (currentSession?.user) {
        setIsAdmin(true);
        // Llama a la carga. loadProducts maneja el setLoading(false) al terminar.
        loadProducts();
        loadAuditLogs();
      } else {
        // No hay sesión: redirigir al login y terminar la carga
        setIsAdmin(false);
        navigate("/login");
        setLoading(false); // Necesario si se redirige antes de que loadProducts se llame
      }
      // ❌ SE ELIMINA DE AQUÍ: setLoading(false); 
    };

    // 1. Configurar listener de cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleAuth(session);
      }
    );

    // 2. Comprobar la sesión existente al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, loadProducts, loadAuditLogs]); // Agregamos loadProducts a las dependencias

  useEffect(() => {
    if (session?.user) {
      loadProducts(0, false, searchQuery);
    }
  }, [searchQuery, session?.user, loadProducts]);

  /**
   * Las funciones handleEdit y handleDelete se mantienen iguales
   */
  const handleEdit = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setEditingProduct({
        ...product,
      });
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      const productToDelete = products.find(p => p.id === deleteProductId);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteProductId);

      if (error) throw error;

      if (productToDelete && session?.user?.email) {
        await supabase.from('audit_logs').insert({
          user_email: session.user.email,
          action: 'ELIMINAR',
          product_name: productToDelete.name
        });
        loadAuditLogs();
      }

      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado exitosamente",
      });

      // Refresca la lista de productos
      loadProducts(0, false, searchQuery);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setDeleteProductId(null);
    }
  };

  const filteredProducts = products;

  const loadMoreProducts = () => {
    loadProducts(Math.floor(products.length / PAGE_SIZE), true, searchQuery);
  };

  const groupedLogs = auditLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('es-ES');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, AuditLog[]>);

  // --- Renderizado ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    // Si no hay sesión, se asume que navigate("/login") ya se ejecutó.
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-6 bg-muted/50 border border-border">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="audit">Auditoría Diaria</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="mb-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Panel de Administración</h2>
                  <p className="text-muted-foreground text-sm">Gestiona el catálogo de productos</p>
                </div>
                {/* Botón de Nuevo Producto */}
                <Button onClick={() => { setEditingProduct(null); setShowForm(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              // Propiedades obligatorias del producto
              id={product.id}
              name={product.name}
              reference={product.reference}
              description={product.description}
              price={product.price}
              imageUrl={product.image_url}

              // Propiedades de control (CRUD)
              isAdmin={true}
              onEdit={handleEdit}
              onDelete={setDeleteProductId}
            />
          ))}
        </div>

            {filteredProducts.length > 0 && hasMoreProducts && (
              <div className="flex justify-center pt-10">
                <Button onClick={loadMoreProducts} disabled={loadingMore} variant="outline" size="lg">
                  {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron productos" : "No hay productos registrados"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit">
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Registro de Actividad</h3>
              {loadingLogs ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>
              ) : Object.keys(groupedLogs).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay registros de auditoría aún.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedLogs).map(([date, logs]) => (
                    <div key={date}>
                      <h4 className="font-semibold text-sm bg-muted/50 inline-block px-3 py-1 rounded-full mb-4 border border-border">{date}</h4>
                      <div className="space-y-3">
                        {logs.map((log) => (
                          <div key={log.id} className="flex justify-between items-center text-sm p-4 bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div>
                              <span className={`font-bold mr-3 ${log.action === 'CREAR' ? 'text-green-500' : log.action === 'EDITAR' ? 'text-yellow-500' : 'text-red-500'}`}>
                                {log.action}
                              </span>
                              <span className="font-medium text-foreground">{log.product_name}</span>
                            </div>
                            <div className="text-muted-foreground text-xs flex flex-col items-end gap-1">
                              <span className="bg-muted px-2 py-0.5 rounded-sm">{log.user_email}</span>
                              <span>{new Date(log.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Creación/Edición */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct || undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingProduct(null);
              loadProducts(0, false, searchQuery); // Recarga la lista después de guardar
              loadAuditLogs(); // Actualiza los logs para mostrar la creación/edición
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
