import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const { error } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });

        if (error) throw error;

        setStatus("success");
        setMessage("Your email has been verified successfully! You are now officially registered for the Digital Skills Mastery Course.");
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "Verification failed. The link may be invalid or expired.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center animate-fade-in">
        <CardContent className="pt-12 pb-8">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Verifying Your Email...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your registration.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Email Verified!
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate("/")} variant="outline">
                Return Home
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Verification Failed
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate("/register")} variant="outline">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
