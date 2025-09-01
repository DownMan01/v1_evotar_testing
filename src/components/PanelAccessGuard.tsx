import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Smartphone, AlertTriangle, Shield, Settings, Database } from 'lucide-react';
import { usePanelAccessControl } from '@/hooks/usePanelAccessControl';

interface PanelAccessGuardProps {
  children: ReactNode;
  panelName: string;
}

export const PanelAccessGuard = ({ children, panelName }: PanelAccessGuardProps) => {
  const { isPanelAccessDenied, canAccessPanels } = usePanelAccessControl();

  if (!isPanelAccessDenied && canAccessPanels) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-warning/20 bg-warning/5">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 rounded-full bg-warning/10">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            Desktop Access Required
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Administrative Interface Restriction
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              The <span className="font-semibold text-foreground">{panelName}</span> is restricted to desktop devices to ensure secure and efficient administrative operations. This restriction is implemented for the following critical reasons:
            </p>
            
            <div className="grid gap-4 md:grid-cols-1">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Enhanced Security</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Administrative functions require additional security measures and input validation that are optimized for desktop environments with proper keyboard and mouse controls.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <Settings className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Complex Interface Management</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    The panel contains sophisticated data tables, form controls, and multi-step workflows that require precise interaction and larger screen real estate for proper functionality.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Data Integrity & Audit Compliance</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Administrative actions are logged and audited. Desktop access ensures proper session management, reduces accidental modifications, and maintains comprehensive audit trails.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6 py-4 bg-muted/10 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Current Device</span>
              <span className="text-xs text-destructive">Restricted</span>
            </div>
            <div className="text-muted-foreground text-xl">→</div>
            <div className="flex flex-col items-center space-y-2">
              <Monitor className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-primary">Desktop Required</span>
              <span className="text-xs text-green-600">Full Access</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <p className="mb-3 font-medium text-foreground text-sm">Alternative Access Options:</p>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Elections management and results viewing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Candidate information and profiles</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">User settings and account management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Voting statistics and reports</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-muted/40">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Please access this panel from a desktop computer (minimum screen width: 768px) to continue with administrative functions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};