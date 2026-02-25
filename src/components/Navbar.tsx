import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { LogOut, Package, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  isAdmin?: boolean;
}

export const Navbar = ({ isAdmin = false }: NavbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      navigate("/");
    }
  };

  return (

    // <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <nav className="border-b border-border bg-white/60 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/nani-logo.png"
              alt="Logo"
              className="w-20 h-20 rounded-full object-cover"
            />
          </Link>

          <div className="flex items-center gap-4">
            {/* <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Inicio
              </Link>
            </Button> */}

            {isAdmin && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    Panel Admin
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </>
            )}

            {!isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">
                  Iniciar Sesión
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
