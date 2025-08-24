import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const floatingCircles = useMemo(() => (
    Array.from({ length: 15 }).map((_, i) => {
      const size = 60 + (i % 3) * 20;
      return {
        size,
        top: Math.random() * 100,
        animationDelay: i * 2,
        duration: 20 + (i % 5) * 5,
      };
    })
  ), []);

  const ambientCircles = useMemo(() => (
    Array.from({ length: 8 }).map((_, i) => {
      const size = 40 + (i % 2) * 30;
      return {
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: i * 3,
        duration: 25 + i * 2,
      };
    })
  ), []);

  useEffect(() => {
    const validateResetToken = async () => {
      try {
        // Check if we have access and refresh tokens in URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          toast({
            title: "Invalid Reset Link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session || !data.user) {
          toast({
            title: "Invalid Reset Link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Verify the session is valid by getting the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          toast({
            title: "Invalid Reset Link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        setHasValidSession(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while validating your reset link.",
          variant: "destructive",
        });
        navigate('/login');
      } finally {
        setIsValidating(false);
      }
    };

    validateResetToken();
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your password has been updated successfully!",
        });
        navigate('/login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating tokens
  if (isValidating) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-primary-700">
          {/* Perfect floating circles with checkmarks */}
          <div className="absolute inset-0 overflow-hidden">
            {floatingCircles.map((item, i) => (
              <div
                key={`floating-circle-${i}`}
                className="absolute bg-primary-foreground/10 rounded-full flex items-center justify-center animate-gentle-float"
                style={{
                  width: `${item.size}px`,
                  height: `${item.size}px`,
                  left: `-${item.size}px`,
                  top: `${item.top}%`,
                  animationDelay: `${item.animationDelay}s`,
                  '--duration': `${item.duration}s`,
                } as React.CSSProperties}
              >
                <Check 
                  className="text-primary-foreground/50" 
                  size={item.size * 0.3}
                />
              </div>
            ))}
          </div>
          
          {/* Additional ambient floating circles */}
          <div className="absolute inset-0">
            {ambientCircles.map((item, i) => (
              <div
                key={`ambient-circle-${i}`}
                className="absolute bg-primary-foreground/5 rounded-full flex items-center justify-center animate-fade-float"
                style={{
                  width: `${item.size}px`,
                  height: `${item.size}px`,
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  animationDelay: `${item.animationDelay}s`,
                  '--duration': `${item.duration}s`,
                } as React.CSSProperties}
              >
                <Check 
                  className="text-primary-foreground/30" 
                  size={item.size * 0.25}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-8 pb-20">
          <Card className="w-full max-w-md bg-card shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold text-blue-600">
                Validating Reset Link...
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your password reset link
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* White Footer */}
        <footer className="absolute bottom-0 left-0 right-0 bg-background border-t z-20">
          <div className="flex justify-center space-x-6 py-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <span className="text-muted-foreground/70">Evotar © 2025</span>
          </div>
        </footer>
      </div>
    );
  }

  // Only show form if session is valid
  if (!hasValidSession) {
    return null; // Will be redirected to login
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        {/* Perfect floating circles with checkmarks */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingCircles.map((item, i) => (
            <div
              key={`floating-circle-${i}`}
              className="absolute bg-primary-foreground/10 rounded-full flex items-center justify-center animate-gentle-float"
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `-${item.size}px`,
                top: `${item.top}%`,
                animationDelay: `${item.animationDelay}s`,
                '--duration': `${item.duration}s`,
              } as React.CSSProperties}
            >
              <Check 
                className="text-primary-foreground/50" 
                size={item.size * 0.3}
              />
            </div>
          ))}
        </div>
        
        {/* Additional ambient floating circles */}
        <div className="absolute inset-0">
          {ambientCircles.map((item, i) => (
            <div
              key={`ambient-circle-${i}`}
              className="absolute bg-primary-foreground/5 rounded-full flex items-center justify-center animate-fade-float"
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `${item.left}%`,
                top: `${item.top}%`,
                animationDelay: `${item.animationDelay}s`,
                '--duration': `${item.duration}s`,
              } as React.CSSProperties}
            >
              <Check 
                className="text-primary-foreground/30" 
                size={item.size * 0.25}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 md:px-8 pb-20">
        <Card className="w-full max-w-md bg-card shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-blue-600 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="p-1 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Reset Your Password
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* White Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-background border-t z-20">
        <div className="flex justify-center space-x-6 py-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">About</a>
          <a href="#" className="hover:text-primary transition-colors">FAQ</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <span className="text-muted-foreground/70">Evotar © 2025</span>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;