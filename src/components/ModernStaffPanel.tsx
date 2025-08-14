import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfileUpdateRequests } from '@/hooks/useProfileUpdateRequests';
import { usePendingActions } from '@/hooks/usePendingActions';
import { ProfileUpdateRequestsPanel } from '@/components/ProfileUpdateRequestsPanel';
import { PendingActionsPanel } from '@/components/PendingActionsPanel';
import { StaffPendingActionsPanel } from '@/components/StaffPendingActionsPanel';
import { ElectionProgressPanel } from '@/components/ElectionProgressPanel';
import { RecentVoterActivityPanel } from '@/components/RecentVoterActivityPanel';
import { StaffStatsCards } from '@/components/StaffStatsCards';
import { Users, Settings, Clock, BarChart3, Activity } from 'lucide-react';
export const ModernStaffPanel = () => {
  const { canApproveVoters, isAdmin } = usePermissions();
  const { requests: profileUpdateRequests } = useProfileUpdateRequests();
  const { pendingActions } = usePendingActions();
  if (!canApproveVoters) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to access the staff panel.</p>
        </CardContent>
      </Card>
    );
  }

  const pendingProfileRequests = profileUpdateRequests.filter(r => r.status === 'Pending').length;
  const pendingActionsCount = pendingActions.filter(a => a.status === 'Pending').length;
  
  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Staff Panel</h2>
        {(pendingProfileRequests > 0 || pendingActionsCount > 0) && (
          <div className="flex flex-wrap gap-1">
            {pendingProfileRequests > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-1">
                {pendingProfileRequests} Profile
              </Badge>
            )}
            {isAdmin && pendingActionsCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-1">
                {pendingActionsCount} Actions
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Compact Statistics Cards */}
      <StaffStatsCards />

      <Tabs defaultValue="profile-updates" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'} gap-1`}>
          <TabsTrigger value="profile-updates" className="flex items-center gap-1 text-xs px-2">
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">Updates</span>
            {pendingProfileRequests > 0 && (
              <Badge variant="secondary" className="text-xs h-4 px-1">
                {pendingProfileRequests}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="my-actions" className="flex items-center gap-1 text-xs px-2">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">My Actions</span>
          </TabsTrigger>
          
          {isAdmin && (
            <TabsTrigger value="pending-actions" className="flex items-center gap-1 text-xs px-2">
              <Clock className="h-3 w-3" />
              <span className="hidden lg:inline">All Actions</span>
              <span className="lg:hidden">All</span>
              {pendingActionsCount > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  {pendingActionsCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          
          <TabsTrigger value="election-progress" className="flex items-center gap-1 text-xs px-2">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Elections</span>
          </TabsTrigger>
          
          <TabsTrigger value="voter-activity" className="flex items-center gap-1 text-xs px-2">
            <Activity className="h-3 w-3" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile-updates" className="mt-4">
          <ProfileUpdateRequestsPanel />
        </TabsContent>

        <TabsContent value="my-actions" className="mt-4">
          <StaffPendingActionsPanel />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending-actions" className="mt-4">
            <PendingActionsPanel />
          </TabsContent>
        )}

        <TabsContent value="election-progress" className="mt-4">
          <ElectionProgressPanel />
        </TabsContent>

        <TabsContent value="voter-activity" className="mt-4">
          <RecentVoterActivityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};