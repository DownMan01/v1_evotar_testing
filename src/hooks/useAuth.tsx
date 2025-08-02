import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  student_id: string | null;
  role: 'Voter' | 'Staff' | 'Administrator';
  full_name: string | null;
  email: string | null;
  registration_status: string | null;
  course: string | null;
  year_level: string | null;
  gender: string | null;
  id_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (studentId: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, studentId: string, password: string, fullName: string, additionalData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Error fetching profile
        return;
      }

      setProfile(data);
    } catch (error) {
      // Error fetching profile
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (studentId: string, password: string) => {
    try {
      // Use the security definer function to get email by student ID
      const { data: email, error: emailError } = await supabase
        .rpc('get_email_by_student_id', { _student_id: studentId });

      if (emailError || !email) {
        return { error: { message: 'Student ID not found' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Log successful login with IP and user agent
      if (!error && data.user) {
        try {
          // Get user's IP address and user agent
          const userAgent = navigator.userAgent;
          
          // Get user's IP address from multiple fallback APIs
          let userIP = null;
          try {
            // Try primary IP service
            const ipResponse = await fetch('https://api.ipify.org?format=json', {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              userIP = ipData.ip;
              console.log('Successfully captured IP for login:', userIP);
            } else {
              throw new Error('Primary IP service failed');
            }
          } catch (ipError) {
            console.warn('Primary IP service failed, trying fallback:', ipError);
            
            // Fallback to alternative IP service
            try {
              const fallbackResponse = await fetch('https://httpbin.org/ip');
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                userIP = fallbackData.origin.split(',')[0].trim(); // Handle potential proxy chains
                console.log('Successfully captured IP via fallback:', userIP);
              }
            } catch (fallbackError) {
              console.warn('All IP services failed:', fallbackError);
            }
          }
          
          console.log('Logging login event for user:', data.user.id, 'IP:', userIP, 'UA:', userAgent);
          
          await supabase.rpc('log_auth_event', {
            p_user_id: data.user.id,
            p_action: 'login',
            p_user_email: email,
            p_user_name: null, // Will be populated by the function
            p_ip_address: userIP,
            p_user_agent: userAgent
          });
          
          console.log('Login event logged successfully');
        } catch (logError) {
          console.error('Failed to log login event:', logError);
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, studentId: string, password: string, fullName: string, additionalData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            student_id: studentId,
            full_name: fullName,
            ...additionalData
          }
        }
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    // Log logout before signing out with user agent
    if (user) {
      try {
        const userAgent = navigator.userAgent;
        
        // Get user's IP address from multiple fallback APIs
        let userIP = null;
        try {
          // Try primary IP service
          const ipResponse = await fetch('https://api.ipify.org?format=json', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            userIP = ipData.ip;
            console.log('Successfully captured IP for logout:', userIP);
          } else {
            throw new Error('Primary IP service failed');
          }
        } catch (ipError) {
          console.warn('Primary IP service failed, trying fallback:', ipError);
          
          // Fallback to alternative IP service
          try {
            const fallbackResponse = await fetch('https://httpbin.org/ip');
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              userIP = fallbackData.origin.split(',')[0].trim(); // Handle potential proxy chains
              console.log('Successfully captured IP via fallback:', userIP);
            }
          } catch (fallbackError) {
            console.warn('All IP services failed:', fallbackError);
          }
        }
        
        console.log('Logging logout event for user:', user.id, 'IP:', userIP, 'UA:', userAgent);
        
        await supabase.rpc('log_auth_event', {
          p_user_id: user.id,
          p_action: 'logout',
          p_user_email: null,
          p_user_name: null,
          p_ip_address: userIP,
          p_user_agent: userAgent
        });
        
        console.log('Logout event logged successfully');
      } catch (logError) {
        console.error('Failed to log logout event:', logError);
      }
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};