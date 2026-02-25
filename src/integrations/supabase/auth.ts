import { supabase } from "@/integrations/supabase/client";

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error:", error.message);
    return null;
  }

  return data;
};
