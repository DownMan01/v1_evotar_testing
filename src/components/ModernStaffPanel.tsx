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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Staff Panel</h2>
          {(pendingProfileRequests > 0 || pendingActionsCount > 0) && (
            <div className="flex gap-2">
              {pendingProfileRequests > 0 && (
                <Badge variant="destructive" className="px-3 py-1">
                  {pendingProfileRequests} Profile Requests
                </Badge>
              )}
              {isAdmin && pendingActionsCount > 0 && (
                <Badge variant="destructive" className="px-3 py-1">
                  {pendingActionsCount} Pending Actions
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <StaffStatsCards />

      <Tabs defaultValue="profile-updates" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="profile-updates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Profile Updates
            {pendingProfileRequests > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingProfileRequests}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="my-actions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            My Actions
          </TabsTrigger>
          
          {isAdmin && (
            <TabsTrigger value="pending-actions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              All Actions
              {pendingActionsCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingActionsCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          
          <TabsTrigger value="election-progress" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Elections
          </TabsTrigger>
          
          <TabsTrigger value="voter-activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile-updates" className="space-y-4">
          <ProfileUpdateRequestsPanel />
        </TabsContent>

        <TabsContent value="my-actions" className="space-y-4">
          <StaffPendingActionsPanel />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending-actions" className="space-y-4">
            <PendingActionsPanel />
          </TabsContent>
        )}

        <TabsContent value="election-progress" className="space-y-4">
          <ElectionProgressPanel />
        </TabsContent>

        <TabsContent value="voter-activity" className="space-y-4">
          <RecentVoterActivityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};