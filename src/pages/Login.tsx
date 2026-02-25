import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package } from "lucide-react";
import { Session } from "@supabase/supabase-js";



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * 1. Maneja la sesión existente y redirecciona.
   * Si ya estás logueado, ve directamente al panel de administración.
   */
  useEffect(() => {
    // Comprobar si ya existe una sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Redirigir directamente si la sesión existe (asumes que eres el admin)
        navigate('/admin');
      }
    });

    // Escuchar cambios de estado de autenticación (ej: cuando haces login o logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          // El listener también redirige si la sesión cambia a activa
          navigate('/admin');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  /**
   * 2. Maneja el envío del formulario de inicio de sesión.
   * Al ser exitoso, el onAuthStateChange (useEffect) manejará la redirección.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Éxito: onAuthStateChange en useEffect capturará el cambio y redirigirá.
      toast({
        title: 'Bienvenido',
        description: 'Inicio de sesión exitoso',
      });

    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: 'Error',
        description: error.message || 'Credenciales inválidas o usuario no confirmado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario ya está en sesión (navegará automáticamente), puedes mostrar un spinner.
  // if (session) return <p>Cargando...</p>; 

  return (
    // <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="min-h-screen flex items-center justify-center bg-[url('/panel-bg.jpg')] bg-cover bg-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/nani-logo.png"
            alt="Logo nani"
            className="mx-auto rounded-full w-[220px] h-[220px] object-contain animate-in fade-in duration-700"
          />

          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-200 -50 to-gold-dark bg-clip-text text-transparent mb-2">
            Panel de Administración NaniMakeup
          </h1>
          <p className="text-muted-foreground"></p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Campos Email y Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Botones */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Volver al inicio
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;