import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-foreground/20 border-t-primary-foreground mx-auto"></div>
          <p className="text-primary-foreground text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-600 to-primary-700 flex items-center justify-center relative overflow-hidden mobile-full-height">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-4 md:top-20 md:left-20 w-32 h-32 md:w-64 md:h-64 bg-primary-foreground rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-4 md:bottom-20 md:right-20 w-48 h-48 md:w-96 md:h-96 bg-primary-foreground rounded-full blur-3xl"></div>
      </div>
      
      <div className="text-center max-w-3xl px-4 md:px-8 relative z-10 w-full">
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-krona text-primary-foreground mb-4 sm:mb-6 md:mb-8 tracking-tight leading-none">
          evotar
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/90 mb-3 sm:mb-4 md:mb-6 font-medium px-2">
          Secure your voice with our trusted voting platform
        </p>
        <p className="text-sm sm:text-base md:text-lg text-primary-foreground/80 mb-6 sm:mb-8 md:mb-12 leading-relaxed px-4 max-w-2xl mx-auto">
          Join thousands of students who trust evotar for secure, transparent, and accessible voting.
        </p>
        <div className="space-y-4 sm:space-y-6 md:space-y-8 px-4">
          <Button 
            onClick={() => navigate('/login')}
            size="lg"
            className="bg-background text-primary hover:bg-background/95 text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[48px] touch-manipulation"
          >
            Access Voting Portal
          </Button>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-8 text-sm text-primary-foreground/70 px-2">
            <button 
              onClick={() => navigate('/about')} 
              className="hover:text-primary-foreground transition-colors font-medium p-2 touch-manipulation"
            >
              About
            </button>
            <button 
              onClick={() => navigate('/faq')} 
              className="hover:text-primary-foreground transition-colors font-medium p-2 touch-manipulation"
            >
              FAQ
            </button>
            <button 
              onClick={() => navigate('/privacy')} 
              className="hover:text-primary-foreground transition-colors font-medium p-2 touch-manipulation"
            >
              Privacy
            </button>
            <button 
              onClick={() => navigate('/terms')} 
              className="hover:text-primary-foreground transition-colors font-medium p-2 touch-manipulation"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
