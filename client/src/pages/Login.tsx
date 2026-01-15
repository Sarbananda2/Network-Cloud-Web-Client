import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ShieldCheck, MonitorSmartphone, Wifi } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-secondary/50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left: Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              System Monitor v1.0
            </div>
            <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-4">
              Monitor your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                network fleet.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
              Real-time visibility into your connected devices. Secure, read-only access for administration and monitoring.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
              <ShieldCheck className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Secure Access</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade authentication via Replit Auth.</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-border shadow-sm">
              <MonitorSmartphone className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Device Status</h3>
              <p className="text-sm text-muted-foreground">Live tracking of online, offline, and away states.</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="border-0 shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-xl p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="relative z-10 text-center space-y-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/25">
                <Wifi className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-display">Welcome Back</h2>
                <p className="text-muted-foreground">Sign in to access your dashboard</p>
              </div>

              <Button 
                size="lg" 
                onClick={handleLogin}
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                data-testid="button-login"
              >
                Sign in with Replit
              </Button>
              
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
