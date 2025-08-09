import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { StepUpVerification } from './StepUpVerification';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Vote, FileText, Settings, Shield, Eye, UserCheck, UserX, Clock, CheckCircle, XCircle, Trash2, EyeOff, Monitor, Smartphone, MapPin, User, Calendar, Info, RefreshCw } from 'lucide-react';
import { ElectionDeletion } from '@/components/ElectionDeletion';
interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  student_id: string | null;
  email: string | null;
  role: string;
  registration_status: string;
  course: string | null;
  year_level: string | null;
  gender: string | null;
  id_image_url: string | null;
  created_at: string;
}
// Remove the old AuditLog interface - we'll use the one from useAuditLogs
export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const {
    profile,
    canManageUsers,
    canViewAuditLogs
  } = usePermissions();
  const { user } = useAuth();
  const {
    auditLogs,
    loading: auditLogsLoading,
    error: auditLogsError,
    refetch: refetchAuditLogs
  } = useAuditLogs();
  const {
    pendingActions,
    approveAction,
    rejectAction,
    refetch
  } = usePendingActions();
  const {
    loading: userManagementLoading,
    approveUser,
    rejectUser,
    getAllUsers,
    fetchPendingUsers
  } = useUserManagement();
  
  useEffect(() => {
    // Debounce the fetching to avoid too many parallel requests
    const loadData = async () => {
      if (canManageUsers) {
        await fetchUsers();
        await fetchElections();
      }
      // Audit logs are handled by useAuditLogs hook automatically
    };
    
    // Only call refetch once during initial load, not repeatedly
    if (user && (canManageUsers || canViewAuditLogs)) {
      loadData();
    }
  }, [canManageUsers, canViewAuditLogs, user]);
  const fetchUsers = async () => {
    try {
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Supabase error fetching users:', error);
        throw error;
      }
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      
      if (error.name === 'AbortError') {
        console.error('Users request timeout');
      } else if (error.message?.includes('Failed to fetch')) {
        console.error('Network connection error for users');
      }
    }
  };

  const fetchElections = async () => {
    try {
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });
        
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Supabase error fetching elections:', error);
        throw error;
      }
      
      setElections(data || []);
    } catch (error: any) {
      console.error('Failed to fetch elections:', error);
      
      if (error.name === 'AbortError') {
        console.error('Elections request timeout');
      } else if (error.message?.includes('Failed to fetch')) {
        console.error('Network connection error for elections');
      }
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      // Show refresh toast
      toast({
        title: "Refreshing data...",
        description: "Fetching latest information from the database",
      });

      // Run all refresh functions in parallel for efficiency
      const refreshPromises = [];
      
      if (canManageUsers) {
        refreshPromises.push(fetchUsers());
        refreshPromises.push(fetchElections());
      }
      
      refreshPromises.push(refetch()); // Refresh pending actions
      refreshPromises.push(refetchAuditLogs()); // Refresh audit logs
      
      await Promise.all(refreshPromises);
      
      toast({
        title: "Data refreshed",
        description: "All admin panel data has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh some data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove loadAuditLogs function - handled by useAuditLogs hook
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Otherwise, generate public URL from path
    const {
      data
    } = supabase.storage.from('student-ids').getPublicUrl(imageUrl);
    return data.publicUrl;
  };
  const UserDetailsDialog = ({
    user,
    onStatusUpdate
  }: {
    user: User;
    onStatusUpdate?: (userId: string, status: 'Approved' | 'Rejected') => void;
  }) => {
    const imageUrl = user.id_image_url ? getImageUrl(user.id_image_url) : null;
    const [showImageModal, setShowImageModal] = useState(false);
    return <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            User Details - {user.full_name || 'No Name'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={`${getRoleColor(user.role)} text-white`}>
              {user.role}
            </Badge>
            <Badge className={`${getStatusColor(user.registration_status)} text-white`}>
              {user.registration_status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student ID:</label>
                <p className="text-sm">{user.student_id || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email:</label>
                <p className="text-sm">{user.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course:</label>
                <p className="text-sm">{user.course || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Year Level:</label>
                <p className="text-sm">{user.year_level || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender:</label>
                <p className="text-sm">{user.gender || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registered:</label>
                <p className="text-sm">{new Date(user.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {user.id_image_url && <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Student ID Image:</label>
                <Button variant="outline" size="sm" onClick={() => setShowImageModal(true)} className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  View Full Size
                </Button>
              </div>
              <div className="border p-4 bg-muted/30 rounded-lg">
                {imageUrl ? <img src={imageUrl} alt="Student ID" onClick={() => setShowImageModal(true)} className="w-1/2 max-w-md mx-auto rounded border cursor-pointer" /> : <div className="w-full h-48 bg-muted flex items-center justify-center rounded">
                    <p className="text-muted-foreground">Loading image...</p>
                  </div>}
              </div>
              
              {/* Full Size Image Modal */}
              <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Student ID Image - {user.full_name || 'No Name'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center p-4">
                    {imageUrl && <img src={imageUrl} alt="Student ID Full Size" className="max-w-full max-h-[70vh] object-contain rounded border" />}
                  </div>
                </DialogContent>
              </Dialog>
            </div>}
          
          {onStatusUpdate && user.registration_status === 'Pending' && <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Admin Notes (Optional):</label>
                <Textarea 
                  placeholder="Add any notes about this decision..." 
                  value={adminNotes[user.user_id] || ''} 
                  onChange={(e) => setAdminNotes(prev => ({ ...prev, [user.user_id]: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={() => onStatusUpdate(user.user_id, 'Approved')} disabled={loading || userManagementLoading} className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Approve User
                </Button>
                <Button variant="outline" onClick={() => onStatusUpdate(user.user_id, 'Rejected')} disabled={loading || userManagementLoading} className="flex items-center gap-2 bg-red-600 hover:bg-red-450 text-white hover:text-white ">
                  <UserX className="h-4 w-4" />
                  Reject User
                </Button>
              </div>
            </div>}
        </div>
      </DialogContent>;
  };
  const updateUserStatus = async (userId: string, status: 'Approved' | 'Rejected') => {
    if (!profile || !canManageUsers) {
      console.error('No permission to manage users');
      return;
    }
    
    setLoading(true);
    try {
      const adminNotesForUser = adminNotes[userId] || undefined;
      
      let success = false;
      
      if (status === 'Approved') {
        success = await approveUser(userId, adminNotesForUser);
      } else {
        success = await rejectUser(userId, adminNotesForUser);
      }
      
      if (success) {
        // Clear admin notes for this user
        setAdminNotes(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        
        // Refresh all data after approval/rejection
        await Promise.all([
          fetchUsers(),
          refetch() // Refresh pending actions
        ]);
      }
    } catch (error: any) {
      console.error('Error in updateUserStatus:', error);
    } finally {
      setLoading(false);
    }
  };
  const updateUserRole = async (userId: string, newRole: 'Voter' | 'Staff' | 'Administrator') => {
    if (!profile || !canManageUsers) {
      console.error('No permission to manage user roles');
      return;
    }
    
    setLoading(true);
    try {
      // Use the database function to update user role properly
      const { error } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_new_role: newRole,
        p_admin_notes: `Role changed to ${newRole} by ${profile.full_name}`
      });
      
      if (error) throw error;
      
      // Refresh the users list after role change
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleResultsVisibility = async (electionId: string, showResults: boolean) => {
    if (!profile || !canManageUsers) {
      console.error('No permission to manage elections');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('toggle_election_results_visibility', {
        p_election_id: electionId,
        p_show_results: showResults
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Results ${showResults ? 'shown to' : 'hidden from'} voters`,
      });
      
      // Refresh elections list
      await fetchElections();
    } catch (error: any) {
      console.error('Failed to toggle results visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update results visibility",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-500';
      case 'Rejected':
        return 'bg-red-500';
      case 'Pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-500';
      case 'Staff':
        return 'bg-blue-500';
      case 'Voter':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  if (!canManageUsers && !canViewAuditLogs) {
    return <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to access this panel.</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-slate-950">
          Admin Panel
        </h2>
        <div className="flex items-center gap-2 md:gap-4">
          <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs md:text-sm">
            {pendingActions.filter(a => a.status === 'Pending').length + users.filter(u => u.registration_status === 'Pending').length} Pending
          </Badge>
          <Button
            onClick={refreshAllData}
            disabled={loading || auditLogsLoading || userManagementLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-blue-100 p-2 md:p-3 mr-3 md:mr-4">
              <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending Users</p>
              <p className="text-xl md:text-2xl font-bold">{users.filter(u => u.registration_status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3 md:mr-4">
              <Vote className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Election Requests</p>
              <p className="text-xl md:text-2xl font-bold">{pendingActions.filter(a => a.action_type === 'create_election' && a.status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3 md:mr-4">
              <UserCheck className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Candidate Requests</p>
              <p className="text-xl md:text-2xl font-bold">{pendingActions.filter(a => a.action_type === 'add_candidate' && a.status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-orange-100 p-2 md:p-3 mr-3 md:mr-4">
              <FileText className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Result Requests</p>
              <p className="text-xl md:text-2xl font-bold">{pendingActions.filter(a => a.action_type === 'publish_results' && a.status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1">
          <TabsTrigger value="approvals" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Pending Approvals</span>
            <span className="sm:hidden">Approvals</span>
          </TabsTrigger>
          {canManageUsers && <TabsTrigger value="users" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>}
          {canManageUsers && <TabsTrigger value="elections" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Vote className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Election Management</span>
              <span className="sm:hidden">Elections</span>
            </TabsTrigger>}
          {canViewAuditLogs && <TabsTrigger value="audit" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>}
        </TabsList>

        {canManageUsers && <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map(user => <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{user.full_name || 'No Name'}</h4>
                            <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>
                              {user.role}
                            </Badge>
                            <Badge className={`${getStatusColor(user.registration_status)} text-white text-xs`}>
                              {user.registration_status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>ID: {user.student_id || 'N/A'}</span>
                            <span>Email: {user.email || 'N/A'}</span>
                            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <UserDetailsDialog user={user} />
                          </Dialog>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-muted-foreground">Role:</label>
                            <StepUpVerification
                              onVerified={() => {
                                const select = document.querySelector(`select[value="${user.role}"]`) as HTMLSelectElement;
                                if (select) {
                                  updateUserRole(user.user_id, select.value as 'Voter' | 'Staff' | 'Administrator');
                                }
                              }}
                              actionType="update_user_role"
                              title="Role Change Verification"
                              description="Please verify your identity to change user roles"
                            >
                              <select 
                                value={user.role} 
                                onChange={e => updateUserRole(user.user_id, e.target.value as 'Voter' | 'Staff' | 'Administrator')} 
                                disabled={loading} 
                                className="text-sm border border-border rounded px-2 py-1 bg-background"
                              >
                                <option value="Voter">Voter</option>
                                <option value="Staff">Staff</option>
                                <option value="Administrator">Administrator</option>
                              </select>
                            </StepUpVerification>
                          </div>
                        </div>
                      </div>
                    </div>)}
                  
                  {users.length === 0 && <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>}

        {canManageUsers && (
          <TabsContent value="elections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Election Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {elections.map(election => (
                    <div key={election.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{election.title}</h4>
                            <Badge className={`${election.status === 'Active' ? 'bg-green-500' : election.status === 'Upcoming' ? 'bg-blue-500' : 'bg-gray-500'} text-white text-xs`}>
                              {election.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Start: {new Date(election.start_date).toLocaleDateString()}</span>
                            <span>End: {new Date(election.end_date).toLocaleDateString()}</span>
                            <span>Eligible: {election.eligible_voters || 'All Courses'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Results Visibility Toggle */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleResultsVisibility(election.id, !election.show_results_to_voters)}
                              disabled={loading}
                              className={`flex items-center gap-1 ${
                                election.show_results_to_voters 
                                  ? 'bg-green-100 text-green-700 border-green-200' 
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }`}
                            >
                              {election.show_results_to_voters ? (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Hide Results
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Show Results
                                </>
                              )}
                            </Button>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                election.show_results_to_voters 
                                  ? 'border-green-200 text-green-700' 
                                  : 'border-red-200 text-red-700'
                              }`}
                            >
                              {election.show_results_to_voters ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                          
                          <ElectionDeletion 
                            election={election} 
                            onDeleted={() => fetchElections()}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {elections.length === 0 && (
                    <div className="text-center py-8">
                      <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No elections found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="approvals" className="space-y-6">
          {/* User Account Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending User Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.filter(user => user.registration_status === 'Pending').map(user => <div key={user.id} className="border rounded-lg bg-blue-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{user.full_name || 'No Name'}</h4>
                          <Badge className="bg-yellow-500 text-white text-xs">
                            Pending Approval
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>ID: {user.student_id || 'N/A'}</span>
                          <span>Email: {user.email || 'N/A'}</span>
                          <span>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <UserDetailsDialog user={user} onStatusUpdate={updateUserStatus} />
                        </Dialog>
                        
                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={() => updateUserStatus(user.user_id, 'Approved')} disabled={loading || userManagementLoading} className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                            <UserCheck className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateUserStatus(user.user_id, 'Rejected')} disabled={loading || userManagementLoading} className="flex items-center gap-1 border-red-200 hover:border-red-300 bg-red-600 hover:bg-red-500 text-white">
                            <UserX className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>)}
                
                {users.filter(user => user.registration_status === 'Pending').length === 0 && <div className="text-center py-6">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No pending user registrations</p>
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Staff Action Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Staff Action Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.filter(action => action.status === 'Pending').map(action => <div key={action.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">
                            {action.action_type === 'create_election' && 'Create Election Request'}
                            {action.action_type === 'add_candidate' && 'Add Candidate Request'}
                            {action.action_type === 'publish_results' && 'Publish Results Request'}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {action.action_type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Requested: {new Date(action.requested_at).toLocaleString()}
                        </p>
                        
                        <div className="bg-muted/50 p-3 rounded text-sm space-y-2">
                          <h5 className="font-medium">Request Details:</h5>
                          {action.action_type === 'create_election' && <div>
                              <p><strong>Title:</strong> {action.action_data.title}</p>
                              <p><strong>Description:</strong> {action.action_data.description}</p>
                              <p><strong>Start Date:</strong> {new Date(action.action_data.start_date).toLocaleString()}</p>
                              <p><strong>End Date:</strong> {new Date(action.action_data.end_date).toLocaleString()}</p>
                              {action.action_data.positions && <div>
                                  <p><strong>Positions:</strong></p>
                                  <ul className="list-disc list-inside ml-4">
                                    {action.action_data.positions.map((pos: any, index: number) => <li key={index}>{pos.title} - {pos.description}</li>)}
                                  </ul>
                                </div>}
                            </div>}
                          {action.action_type === 'add_candidate' && <div>
                              <p><strong>Candidate Name:</strong> {action.action_data.full_name}</p>
                              <p><strong>Bio:</strong> {action.action_data.bio}</p>
                              <p><strong>Election ID:</strong> {action.action_data.election_id}</p>
                              <p><strong>Position ID:</strong> {action.action_data.position_id}</p>
                            </div>}
                          {action.action_type === 'publish_results' && <div>
                              <p><strong>Election ID:</strong> {action.action_data.election_id}</p>
                              <p>Staff is requesting to publish the results for this election.</p>
                            </div>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Textarea placeholder="Add admin notes (optional)" value={adminNotes[action.id] || ''} onChange={e => setAdminNotes({
                    ...adminNotes,
                    [action.id]: e.target.value
                  })} className="min-h-[80px]" />
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={async () => {
                      const success = await approveAction(action.id, adminNotes[action.id]);
                      if (success) {
                        setAdminNotes({
                          ...adminNotes,
                          [action.id]: ''
                        });
                        await refetch();
                        await refetchAuditLogs();
                      }
                    }} disabled={loading} className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Approve
                        </Button>
                        
                        <Button size="sm" variant="outline" onClick={async () => {
                      const success = await rejectAction(action.id, adminNotes[action.id] || 'Rejected by admin');
                      if (success) {
                        setAdminNotes({
                          ...adminNotes,
                          [action.id]: ''
                        });
                        await refetch();
                        await refetchAuditLogs();
                      }
                    }} disabled={loading} className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>)}
                
                {pendingActions.filter(action => action.status === 'Pending').length === 0 && <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </div>}
                
                {pendingActions.filter(action => action.status !== 'Pending').length > 0 && <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Recent Actions</h3>
                    <div className="space-y-3">
                      {pendingActions.filter(action => action.status !== 'Pending').slice(0, 5).map(action => <div key={action.id} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {action.action_type === 'create_election' && 'Election Creation'}
                                {action.action_type === 'add_candidate' && 'Candidate Addition'}
                                {action.action_type === 'publish_results' && 'Results Publication'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(action.reviewed_at || action.requested_at).toLocaleString()}
                                
                              </p>
                            </div>
                            <Badge className={`text-xs ${action.status === 'Approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                              {action.status}
                            </Badge>
                          </div>
                          {action.admin_notes && <p className="text-xs text-muted-foreground mt-1">
                              Notes: {action.admin_notes}
                            </p>}
                        </div>)}
                    </div>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canViewAuditLogs && <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Trail ({auditLogs.length} records)
                </CardTitle>
                {auditLogsError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                    Error loading audit logs: {auditLogsError}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {auditLogsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2 mb-1" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map(log => {
                      const getActionIcon = (action: string) => {
                        switch (action) {
                          case 'login': return <User className="h-4 w-4 text-green-600" />;
                          case 'logout': return <User className="h-4 w-4 text-red-600" />;
                          case 'cast_vote': return <Vote className="h-4 w-4 text-blue-600" />;
                          case 'approve_user_registration': 
                          case 'reject_user_registration': 
                            return <UserCheck className="h-4 w-4 text-purple-600" />;
                          case 'update_user_role': return <Shield className="h-4 w-4 text-orange-600" />;
                          case 'approve_action':
                          case 'reject_action':
                            return <CheckCircle className="h-4 w-4 text-indigo-600" />;
                          default: return <Info className="h-4 w-4 text-gray-600" />;
                        }
                      };

                      const getActionColor = (action: string) => {
                        switch (action) {
                          case 'login': return 'border-l-green-500 bg-green-50/50';
                          case 'logout': return 'border-l-red-500 bg-red-50/50';
                          case 'cast_vote': return 'border-l-blue-500 bg-blue-50/50';
                          case 'approve_user_registration': return 'border-l-green-500 bg-green-50/50';
                          case 'reject_user_registration': return 'border-l-red-500 bg-red-50/50';
                          case 'update_user_role': return 'border-l-orange-500 bg-orange-50/50';
                          case 'approve_action': return 'border-l-green-500 bg-green-50/50';
                          case 'reject_action': return 'border-l-red-500 bg-red-50/50';
                          default: return 'border-l-gray-500 bg-gray-50/50';
                        }
                      };

                      return (
                        <div key={log.id} className={`p-4 border rounded-lg border-l-4 ${getActionColor(log.action)}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getActionIcon(log.action)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-foreground">
                                  {log.description}
                                </h4>
                                {log.resource_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.resource_type}
                                  </Badge>
                                )}
                                {log.actor_role && (
                                  <Badge variant="secondary" className={`text-xs ${getRoleColor(log.actor_role)} text-white`}>
                                    {log.actor_role}
                                  </Badge>
                                )}
                              </div>

                              {/* Actor Information */}
                              <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="font-medium">
                                    {log.actor_profile?.full_name || 'System'}
                                  </span>
                                  {log.actor_profile?.student_id && (
                                    <span className="text-xs">({log.actor_profile.student_id})</span>
                                  )}
                                  {log.actor_profile?.email && (
                                    <span className="text-xs">• {log.actor_profile.email}</span>
                                  )}
                                </div>
                              </div>

                              {/* Timestamp and Technical Details */}
                              <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                {log.ip_address && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>IP: {log.ip_address}</span>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div className="flex items-center gap-1">
                                    {log.user_agent.includes('Mobile') ? 
                                      <Smartphone className="h-3 w-3" /> : 
                                      <Monitor className="h-3 w-3" />
                                    }
                                    <span className="truncate max-w-xs">
                                      {log.user_agent.includes('Chrome') ? 'Chrome' :
                                       log.user_agent.includes('Firefox') ? 'Firefox' :
                                       log.user_agent.includes('Safari') ? 'Safari' :
                                       log.user_agent.includes('Edge') ? 'Edge' : 'Other'}
                                    </span>
                                  </div>
                                )}
                                {log.resource_id && (
                                  <div className="flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    <span>ID: {log.resource_id.slice(0, 8)}...</span>
                                  </div>
                                )}
                              </div>

                              {/* Additional Profile Information */}
                              {log.actor_profile && (
                                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                                  {log.actor_profile.course && (
                                    <span>Course: {log.actor_profile.course}</span>
                                  )}
                                  {log.actor_profile.year_level && (
                                    <span>Year: {log.actor_profile.year_level}</span>
                                  )}
                                </div>
                              )}

                              {/* Details Section */}
                              {log.details && Object.keys(log.details).length > 0 && (
                                <details className="mt-3">
                                  <summary className="cursor-pointer text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    View detailed information
                                  </summary>
                                  <div className="mt-2 p-3 bg-muted/30 rounded text-xs">
                                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {auditLogs.length === 0 && !auditLogsLoading && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No audit logs found</h3>
                        <p className="text-sm text-muted-foreground">System activity will appear here as users interact with the platform.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>}
      </Tabs>
    </div>;
};