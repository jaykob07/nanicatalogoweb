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




interface Product {
  id: string;
  name: string;
  reference: string;
  description: string;
  price: number;
  image_url?: string;
}

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * 🛠️ CORRECCIÓN CLAVE: Función de carga envuelta en useCallback
   * y manejando su propio estado 'loading'.
   */
  const loadProducts = useCallback(async () => {
    // 1. Inicia la carga aquí
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);

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
    }
  }, [toast]); // Dependencias: solo 'toast' si lo usa

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
  }, [navigate, loadProducts]); // Agregamos loadProducts a las dependencias

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
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteProductId);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado exitosamente",
      });

      // Refresca la lista de productos
      loadProducts();
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

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Panel de Administración</h2>
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

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No se encontraron productos" : "No hay productos registrados"}
            </p>
          </div>
        )}
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
              loadProducts(); // Recarga la lista después de guardar
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

