import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  reference: string;
  description: string;
  price: number;
  image_url?: string;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    }
  };

  const loadProducts = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar isAdmin={isAdmin} />

      {/* Hero Section */}
      <section className="relative py-20  px-4 overflow-hidden">
        {/* <div className="absolute inset-0  bg-gradient-to-br from-green-dark via-green-mid to-background opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div> */}

        <div className="container  bg-cover bg-center bg-no-repeat rounded-3xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">


            {/* <img
              src="/nani-logo.png"
              alt=""
              className="mx-auto rounded-full w-[220px] h-[220px] object-contain animate-in fade-in duration-700"
            /> */}
            <h1 className="text-5xl md:text-6xl font-bold font-['Fredoka'] bg-gradient-to-r from-gray-500 via-dark-300 to-red-200 bg-clip-text text-transparent">
              Catálogo de Productos NaniMakeup
            </h1>
            <p className="text-xl from-primary via-gold-dark font-['Fredoka']">

            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto font-['Fredoka']">
              Encuentra los mejores accesorios y productos de belleza y cuidado personal para resaltar tu estilo único. ¡Explora nuestro catálogo y descubre lo que tenemos para ti!
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="mt-16 py-8 px-4 bg-background/40 backdrop-blur-md border-y border-border">
        <div className="container mx-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {searchQuery ? "Resultados de búsqueda" : "Catálogo de Productos"}
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"} {searchQuery && "encontrados"}
              </p>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  reference={product.reference}
                  description={product.description}
                  price={product.price}
                  imageUrl={product.image_url}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  {searchQuery
                    ? "No se encontraron productos con ese criterio de búsqueda"
                    : "Aún no hay productos en el catálogo"}
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-[url('/panel-bg.jpg')] bg-cover backdrop-blur-sm py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2026 NaniMakeup. Powered by Adsvanced.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
