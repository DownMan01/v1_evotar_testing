import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Shield, Users, Vote, CheckCircle } from 'lucide-react';
const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-foreground/20 border-t-primary-foreground mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-primary-foreground/5 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-primary-foreground text-xl font-semibold">Welcome back</h2>
            <p className="text-primary-foreground/80 text-sm">Loading your dashboard...</p>
          </div>
        </div>
      </div>;
  }
  const features = [{
    icon: Shield,
    title: "Secure Authentication",
    description: "Multi-factor security"
  }, {
    icon: Users,
    title: "Transparent",
    description: "Audited elections"
  }, {
    icon: Vote,
    title: "Accessible",
    description: "Digital convenience"
  }, {
    icon: CheckCircle,
    title: "Verified",
    description: "Audit trail system"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-primary via-primary-600 to-primary-700 relative overflow-hidden mobile-full-height">
      {/* Modern geometric background */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-foreground/8 rounded-full blur-3xl animate-gentle-float" style={{
        animationDelay: '0s',
        animationDuration: '20s'
      }}></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-primary-foreground/12 rounded-full blur-2xl animate-gentle-float" style={{
        animationDelay: '5s',
        animationDuration: '25s'
      }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-primary-foreground/6 rounded-full blur-xl animate-gentle-float" style={{
        animationDelay: '10s',
        animationDuration: '30s'
      }}></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,hsl(var(--primary-foreground)/0.03)_25px,hsl(var(--primary-foreground)/0.03)_26px,transparent_27px),linear-gradient(hsl(var(--primary-foreground)/0.03)_24px,transparent_25px,transparent_26px,hsl(var(--primary-foreground)/0.03)_27px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 md:px-8">
        <div className="text-center max-w-4xl animate-fade-in">
          {/* Main heading */}
          <div className="mb-8 space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-krona text-primary-foreground mb-6 tracking-tight leading-none">
              evotar
            </h1>
            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-xl sm:text-2xl md:text-3xl text-primary-foreground/95 font-semibold leading-tight">Every Vote Matters</p>
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
                Secure, transparent, and accessible voting for the SJCSI community
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
            {features.map((feature, index) => <div key={feature.title} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all duration-300" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <feature.icon className="h-8 w-8 text-primary-foreground mx-auto mb-3" />
                <h3 className="text-primary-foreground font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-primary-foreground/70 text-xs">{feature.description}</p>
              </div>)}
          </div>

          {/* CTA Section */}
          <div className="space-y-8">
            <Button onClick={() => navigate('/login')} size="lg" className="bg-background text-primary hover:bg-background/95 hover:shadow-2xl text-base md:text-lg px-8 md:px-12 py-4 md:py-5 rounded-2xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 group touch-manipulation">
              <span>Access Voting Portal</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="text-xs text-primary-foreground/60">
              Official digital voting platform for <span className="font-semibold text-primary-foreground/80">SJCSI</span> student elections
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/70">
            {[{
            label: 'About',
            path: '/about'
          }, {
            label: 'FAQ',
            path: '/faq'
          }, {
            label: 'Privacy',
            path: '/privacy'
          }, {
            label: 'Terms',
            path: '/terms'
          }].map(link => <button key={link.label} onClick={() => navigate(link.path)} className="hover:text-primary-foreground transition-all duration-200 font-medium relative group touch-manipulation">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-foreground transition-all duration-200 group-hover:w-full"></span>
              </button>)}
          </div>
        </div>
      </div>
    </div>;
};
export default Index;