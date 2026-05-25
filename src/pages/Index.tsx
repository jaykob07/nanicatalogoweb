import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  reference: string;
  description?: string;
  price: number;
  image_url?: string;
}

const PAGE_SIZE = 40;

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
    checkAdminStatus();
    fetchTotalProducts();
  }, []);

  const fetchTotalProducts = async () => {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (!error && count !== null) {
      setTotalProducts(count);
    }
  };

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

  const loadProducts = async (page = 0, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("products")
        .select("id, name, reference, price, image_url", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setProducts((current) => (append ? [...current, ...(data || [])] : data || []));
      setHasMoreProducts(count ? to + 1 < count : (data || []).length === PAGE_SIZE);
      setActiveTag("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadTags = async () => {
    const { data, error } = await supabase
      .from("product_categories" as any)
      .select("tag");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    const extractedTags = (data || []).map((row: any) => row.tag);
    setTags(extractedTags);
  };

  // Efecto para búsqueda en el backend con debounce
  useEffect(() => {
    if (!searchQuery) {
      if (!activeTag) {
        loadProducts(0);
      }
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setActiveTag(""); // Al buscar por texto limpiamos el tag
      try {
        const { data, error, count } = await supabase
          .from("products")
          .select("id, name, reference, price, image_url", { count: "exact" })
          .or(`name.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;
        setProducts(data || []);
        setHasMoreProducts(count ? PAGE_SIZE < count : (data || []).length === PAGE_SIZE);
      } catch (error: any) {
        console.error("Error searching products:", error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms de retraso

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTag]);

  const handleTagClick = async (tag: string) => {
    if (!tag) {
      setSearchQuery("");
      loadProducts(0);
      return;
    }
    
    if (activeTag === tag) return;
    
    setActiveTag(tag);
    setLoading(true);
    setSearchQuery(""); // Limpiar búsqueda al usar tag
    try {
      const { data, error, count } = await supabase
        .from("products")
        .select("id, name, reference, price, image_url", { count: "exact" })
        .ilike("name", `%${tag}%`)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      setProducts(data || []);
      setHasMoreProducts(count ? PAGE_SIZE < count : (data || []).length === PAGE_SIZE);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al filtrar por categoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    const from = products.length;
    const to = from + PAGE_SIZE - 1;
    setLoadingMore(true);

    try {
      let query = supabase
        .from("products")
        .select("id, name, reference, price, image_url", { count: "exact" });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`);
      } else if (activeTag) {
        query = query.ilike("name", `%${activeTag}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;

      setProducts((current) => [...current, ...(data || [])]);
      setHasMoreProducts(count ? to + 1 < count : (data || []).length === PAGE_SIZE);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar más productos",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredProducts = products; // Ya no filtramos localmente en Index.tsx, porque lo hace el backend

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
        <div className="container mx-auto space-y-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          
          {/* Tags Dropdown */}
          <div className="flex flex-col items-center justify-center gap-2 mt-4 max-w-sm mx-auto">
            <label htmlFor="category-select" className="text-sm font-medium text-muted-foreground">
              Explorar por categoría:
            </label>
            <select
              id="category-select"
              value={activeTag}
              onChange={(e) => handleTagClick(e.target.value)}
              className="flex h-12 w-full items-center justify-between rounded-full border border-input bg-card px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer shadow-sm"
            >
              <option value="">Todas las categorías</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
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
                {searchQuery || activeTag ? "Resultados de búsqueda" : "Catálogo de Productos"}
              </h2>
              {(!searchQuery && !activeTag) && (
                <p className="text-sm font-medium text-amber-500 bg-amber-500/10 inline-block px-3 py-1 rounded-full mb-3">
                  Mostrando los {filteredProducts.length} productos más recientes de un total de {totalProducts}. Usa el buscador, las categorías o carga más resultados.
                </p>
              )}
              <p className="text-muted-foreground">
                {searchQuery || activeTag ? (
                  <>
                    Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"} encontrados (total en catálogo: {totalProducts})
                  </>
                ) : (
                  <>
                    Mostrando {filteredProducts.length} de {totalProducts} productos
                  </>
                )}
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
                  description={product.description || ""}
                  price={product.price}
                  imageUrl={product.image_url}
                  isAdmin={isAdmin}
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

            {filteredProducts.length > 0 && hasMoreProducts && (
              <div className="flex justify-center pt-10">
                <Button onClick={loadMoreProducts} disabled={loadingMore} variant="outline" size="lg">
                  {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </Button>
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
