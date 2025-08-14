import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { QrCode, Shield, Key, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const TwoFactorSetup = ({ open, onOpenChange, onComplete }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);
  
  const { generateTwoFactorSetup, enableTwoFactor, loading } = useTwoFactor();
  const { toast } = useToast();

  useEffect(() => {
    if (open && step === 'generate') {
      handleGenerateSetup();
    }
  }, [open]);

  const handleGenerateSetup = async () => {
    const data = await generateTwoFactorSetup();
    if (data) {
      setSetupData(data);
      setStep('verify');
    }
  };

  const handleVerifyCode = async () => {
    if (!setupData || !verificationCode) return;

    const success = await enableTwoFactor(
      setupData.secret,
      verificationCode,
      setupData.backupCodes
    );

    if (success) {
      setStep('backup');
    }
  };

  const handleCopyBackupCodes = () => {
    if (!setupData) return;
    
    const codesText = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  const handleComplete = () => {
    setStep('generate');
    setSetupData(null);
    setVerificationCode('');
    setCopiedCodes(false);
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Enable Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === 'verify' && setupData && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Scan QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-4 bg-background rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCode)}`}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Manual Entry Key</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={setupData.secret} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret);
                        toast({ title: "Copied", description: "Secret key copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Label htmlFor="verification-code">Enter 6-digit code from your authenticator app</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center font-mono text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={verificationCode.length !== 6 || loading}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && setupData && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h3 className="font-semibold">2FA Enabled Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure location
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Backup Recovery Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {setupData.backupCodes.map((code, index) => (
                    <Badge key={index} variant="secondary" className="justify-center font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleCopyBackupCodes}
                  className="w-full"
                  disabled={copiedCodes}
                >
                  {copiedCodes ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All Codes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Important:</strong> Store these codes safely. Each can only be used once to access your account if you lose your authenticator device.
              </p>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};