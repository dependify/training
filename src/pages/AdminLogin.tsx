import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthForm = z.infer<typeof authSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) navigate("/admin");
  }, [navigate]);

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const r = await fetch("/api/admin/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.email, password: data.password }) })
        if (!r.ok) throw new Error("Sign up failed")
        toast({ title: "Account created!", description: "You can now sign in." })
        setIsSignUp(false)
        form.reset()
      } else {
        const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.email, password: data.password }) })
        if (!r.ok) throw new Error("Login failed")
        const j = await r.json()
        localStorage.setItem("admin_token", j.token)
        localStorage.setItem("is_superadmin", j.isSuperAdmin ? "true" : "false")
        toast({ title: "Login successful", description: "Welcome back!" })
        navigate("/admin")
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: isSignUp ? "Sign Up Failed" : "Login Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">
            {isSignUp ? "Create Admin Account" : "Admin Login"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Sign up to request admin access" : "Sign in to access the dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
