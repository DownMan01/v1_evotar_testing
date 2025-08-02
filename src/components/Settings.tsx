import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserHistory } from '@/hooks/useUserHistory';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfileUpdateRequests } from '@/hooks/useProfileUpdateRequests';
import { 
  Shield, 
  User, 
  Key, 
  History, 
  Calendar, 
  Eye, 
  Settings as SettingsIcon, 
  MapPin, 
  Monitor, 
  Clock, 
  LogIn, 
  LogOut,
  Lock,
  Save
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const Settings = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { isVoter } = usePermissions();
  const { userHistory, loading: historyLoading, error: historyError } = useUserHistory();
  const { submitUpdateRequest } = useProfileUpdateRequests();

  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [locationCache, setLocationCache] = useState<Record<string, string>>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState<Record<string, boolean>>({});
  const [profileData, setProfileData] = useState({
    email: profile?.email || '',
    year_level: profile?.year_level || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Helper function to parse browser info from user agent
  const parseBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    
    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return { browser, os };
  };

  // Helper function to get location from IP using free geolocation API
  const getLocationFromIP = async (ip: string): Promise<string> => {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      if (data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`;
      } else if (data.country_name) {
        return data.country_name;
      }
      return 'Unknown';
    } catch (error) {
      console.error('Failed to get location:', error);
      return 'Unknown';
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-600" />;
      case 'cast_vote':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'profile_update_request':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'submit_appeal':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'approve_user_registration':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'reject_user_registration':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'approve_profile_update':
        return <User className="h-4 w-4 text-green-600" />;
      case 'reject_profile_update':
        return <User className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  // Load locations for IPs when user history is loaded
  useEffect(() => {
    const loadLocations = async () => {
      const ipsToLoad = userHistory
        .filter(entry => entry.ip_address && !locationCache[entry.ip_address])
        .map(entry => entry.ip_address!)
        .filter((ip, index, arr) => arr.indexOf(ip) === index); // Remove duplicates

      for (const ip of ipsToLoad) {
        if (!isLoadingLocation[ip]) {
          setIsLoadingLocation(prev => ({ ...prev, [ip]: true }));
          try {
            const location = await getLocationFromIP(ip);
            setLocationCache(prev => ({ ...prev, [ip]: location }));
          } catch (error) {
            console.error(`Failed to load location for IP ${ip}:`, error);
            setLocationCache(prev => ({ ...prev, [ip]: 'Unknown' }));
          } finally {
            setIsLoadingLocation(prev => ({ ...prev, [ip]: false }));
          }
        }
      }
    };

    if (userHistory.length > 0) {
      loadLocations();
    }
  }, [userHistory, locationCache, isLoadingLocation]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if user is Staff or Admin - they can update directly
      if (profile?.role === 'Staff' || profile?.role === 'Administrator') {
        const { error } = await supabase
          .from('profiles')
          .update({
            email: profileData.email,
            year_level: profileData.year_level,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);

        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to update profile",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Profile updated successfully"
          });
        }
      } else {
        // Voters need approval
        const success = await submitUpdateRequest({
          email: profileData.email,
          year_level: profileData.year_level
        });
        
        if (success) {
          // Reset form to current profile values
          setProfileData({
            email: profile?.email || '',
            year_level: profile?.year_level || ''
          });
        }
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully."
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-4 lg:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 lg:h-7 lg:w-7" />
          Settings
        </h2>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Image Display */}
            {profile?.id_image_url && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">ID Image</Label>
                 <div className="relative w-full max-w-sm mx-auto">
                   <img 
                     src={profile.id_image_url} 
                     alt="ID Image" 
                     className="w-full h-40 lg:h-48 object-cover rounded-lg border"
                   />
                   <div className="absolute bottom-1 left-1 lg:bottom-2 lg:left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                     Uploaded ID
                   </div>
                  <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                    <DialogTrigger asChild>
                     <Button 
                       size="sm" 
                       variant="secondary"
                       className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-black/70 hover:bg-black/80 text-white border-none h-8 w-8 lg:h-10 lg:w-10 p-0"
                     >
                       <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                     </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>ID Image - Full Size</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img 
                          src={profile.id_image_url} 
                          alt="ID Image Full Size" 
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                <p className="font-medium">{profile?.student_id || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                <p className="capitalize font-medium">{profile?.role}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Registration Status</Label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  profile?.registration_status === 'Approved' ? 'bg-green-100 text-green-800' :
                  profile?.registration_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile?.registration_status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.role === 'Voter' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Profile updates require staff approval. Only email address and year level can be updated.
                </p>
              </div>
            )}
            
            {(profile?.role === 'Staff' || profile?.role === 'Administrator') && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> As a {profile.role}, you can update your profile directly without approval.
                </p>
              </div>
            )}
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Full Name (Read-only)</Label>
                  <p className="font-medium p-2 bg-muted rounded">{profile?.full_name || 'Not provided'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Student ID (Read-only)</Label>
                  <p className="font-medium p-2 bg-muted rounded">{profile?.student_id || 'Not provided'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Course (Read-only)</Label>
                  <p className="font-medium p-2 bg-muted rounded">{profile?.course || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileData.email} 
                  onChange={e => setProfileData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} 
                  placeholder="Enter your email address" 
                 />
                 {profile?.role === 'Voter' && (
                   <p className="text-xs text-muted-foreground">Changes require staff approval</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label htmlFor="year_level">Year Level <span className="text-red-500">*</span></Label>
                 <Input 
                   id="year_level" 
                   value={profileData.year_level} 
                   onChange={e => setProfileData(prev => ({
                     ...prev,
                     year_level: e.target.value
                   }))} 
                   placeholder="Enter your year level" 
                 />
                 {profile?.role === 'Voter' && (
                   <p className="text-xs text-muted-foreground">Changes require staff approval</p>
                 )}
               </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Gender (Read-only)</Label>
                <p className="font-medium p-2 bg-muted rounded">{profile?.gender || 'Not provided'}</p>
              </div>
              
               <Button type="submit" disabled={loading} className="flex items-center gap-2">
                 <Save className="h-4 w-4" />
                 {loading ? 
                   (profile?.role === 'Voter' ? 'Submitting Request...' : 'Updating Profile...') : 
                   (profile?.role === 'Voter' ? 'Request Profile Update' : 'Update Profile')
                 }
               </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:gap-6">
        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input 
                  id="new_password" 
                  type="password" 
                  value={passwordData.newPassword} 
                  onChange={e => setPasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  placeholder="Enter new password" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input 
                  id="confirm_password" 
                  type="password" 
                  value={passwordData.confirmPassword} 
                  onChange={e => setPasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))} 
                  placeholder="Confirm new password" 
                />
              </div>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {loading ? 'Updating...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User History - Only for voters */}
        {isVoter && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                User History & Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : historyError ? (
                <div className="text-center py-8 text-destructive">
                  <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Error loading user history</p>
                  <p className="text-sm">{historyError}</p>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No activity history found.</p>
                  <p className="text-sm">Your actions will appear here as you use the system.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userHistory.map((entry) => {
                    const browserInfo = parseBrowserInfo(entry.user_agent);
                    const isAuthAction = ['login', 'logout'].includes(entry.action);
                    
                    return (
                       <div key={entry.id} className="border rounded-lg p-3 lg:p-4 bg-card hover:shadow-sm transition-shadow">
                         <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 lg:gap-0">
                           <div className="flex items-start gap-2 lg:gap-3 flex-1">
                             <div className="mt-0.5 lg:mt-1">
                               {getActivityIcon(entry.action)}
                             </div>
                             <div className="flex-1 space-y-2">
                               <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                                 <h4 className="font-medium text-xs lg:text-sm">{entry.description}</h4>
                                 <Badge variant={isAuthAction ? 'secondary' : 'outline'} className="text-xs w-fit">
                                   {entry.action}
                                 </Badge>
                               </div>
                              
                              {/* Enhanced details for login/logout */}
                              {isAuthAction && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    {entry.ip_address && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>
                                          {entry.ip_address}
                                          {locationCache[entry.ip_address] && ` • ${locationCache[entry.ip_address]}`}
                                          {isLoadingLocation[entry.ip_address] && ' • Loading...'}
                                        </span>
                                      </div>
                                    )}
                                    {entry.user_agent && (
                                      <div className="flex items-center gap-1">
                                        <Monitor className="h-3 w-3" />
                                        <span>{browserInfo.browser} on {browserInfo.os}</span>
                                      </div>
                                    )}
                                  </div>
                                  {!entry.ip_address && (
                                    <div className="text-xs text-muted-foreground/70">
                                      <span>Location data not available for this session</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Enhanced details for other actions */}
                              {!isAuthAction && (
                                <div className="space-y-1">
                                  {entry.resource_type && (
                                    <p className="text-xs text-muted-foreground">
                                      <span className="font-medium">Resource:</span> {entry.resource_type}
                                    </p>
                                  )}
                                  {entry.details && typeof entry.details === 'object' && Object.keys(entry.details).length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {Object.entries(entry.details).filter(([key]) => !['actor_name', 'actor_username', 'timestamp'].includes(key)).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-1">
                                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                          <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                           <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 lg:mt-0 lg:ml-4">
                             <Clock className="h-3 w-3" />
                             <div className="lg:text-right">
                               <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                               <div className="text-[10px] opacity-75">
                                 {new Date(entry.timestamp).toLocaleTimeString([], { 
                                   hour: '2-digit', 
                                   minute: '2-digit' 
                                 })}
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Role</Label>
                <p className="capitalize font-medium">{profile?.role}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <p className="font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <p className="font-medium">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};