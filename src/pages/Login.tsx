
import { LoginForm } from '@/components/LoginForm';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TypingDescription from '@/components/TypingDescription';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        {/* Perfect floating circles with checkmarks */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => {
            const size = 60 + (i % 3) * 20; // Perfect sizes: 60, 80, 100px
            const animationDelay = i * 2;
            const duration = 20 + (i % 5) * 5;
            
            return (
              <div
                key={`floating-circle-${i}`}
                className="absolute bg-primary-foreground/10 rounded-full flex items-center justify-center animate-gentle-float"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `-${size}px`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${animationDelay}s`,
                  '--duration': `${duration}s`,
                } as React.CSSProperties}
              >
                <Check 
                  className="text-primary-foreground/50" 
                  size={size * 0.3}
                />
              </div>
            );
          })}
        </div>
        
        {/* Additional ambient floating circles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => {
            const size = 40 + (i % 2) * 30;
            
            return (
              <div
                key={`ambient-circle-${i}`}
                className="absolute bg-primary-foreground/5 rounded-full flex items-center justify-center animate-fade-float"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 3}s`,
                  '--duration': `${25 + i * 2}s`,
                } as React.CSSProperties}
              >
                <Check 
                  className="text-primary-foreground/30" 
                  size={size * 0.25}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Mobile: Compact Header */}
        <div className="lg:hidden flex flex-col items-center justify-center px-4 pt-8 pb-4">
          <h1 className="text-3xl font-krona text-primary-foreground mb-2 tracking-tight">
            evotar
          </h1>
          <div className="min-h-[24px] text-center">
            <TypingDescription />
          </div>
        </div>

        {/* Desktop: Left side - Branding */}
        <div className="hidden lg:flex flex-1 items-center justify-end px-16 py-0">
          <div className="text-left max-w-md w-full">
            <h1 className="text-6xl font-krona text-primary-foreground mb-6 tracking-tight">
              evotar
            </h1>
            <div className="min-h-[64px]">
              <TypingDescription />
            </div>
          </div>
        </div>

        {/* Login Form - Mobile optimized */}
        <div className="flex-1 flex items-center justify-center lg:justify-start px-4 md:px-8 pb-24 lg:pb-0">
          <LoginForm />
        </div>
      </div>

      {/* White Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-background border-t z-20">
        <div className="flex justify-center space-x-6 py-4 text-sm text-muted-foreground">
          <button onClick={() => navigate('/about')} className="hover:text-primary transition-colors">About</button>
          <button onClick={() => navigate('/faq')} className="hover:text-primary transition-colors">FAQ</button>
          <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Privacy</button>
          <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Terms</button>
          <span className="text-muted-foreground/70">Evotar © 2025</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
