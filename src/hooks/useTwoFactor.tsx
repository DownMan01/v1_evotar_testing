import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as OTPAuth from 'otpauth';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export const useTwoFactor = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const generateTwoFactorSetup = useCallback(async (): Promise<TwoFactorSetup | null> => {
    if (!profile || profile.role === 'Voter') {
      toast({
        title: "Access Denied",
        description: "Two-factor authentication is only available for staff and administrators",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Generate a random secret
      const secret = new OTPAuth.Secret({ size: 20 });
      const secretBase32 = secret.base32;
      
      // Create TOTP object
      const totp = new OTPAuth.TOTP({
        issuer: 'Evotar',
        label: profile.email || profile.full_name || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Generate QR code URI
      const qrCode = totp.toString();

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      return {
        secret: secretBase32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      console.error('Error generating 2FA setup:', error);
      toast({
        title: "Error",
        description: "Failed to generate 2FA setup",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const enableTwoFactor = useCallback(async (secret: string, verificationCode: string, backupCodes: string[]) => {
    if (!profile || profile.role === 'Voter') {
      return false;
    }

    try {
      setLoading(true);

      // Verify the code first
      const totp = new OTPAuth.TOTP({
        issuer: 'Evotar',
        label: profile.email || profile.full_name || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const isValid = totp.validate({ token: verificationCode, window: 1 });
      
      if (isValid === null) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect",
          variant: "destructive",
        });
        return false;
      }

      // Save to database via secure RPC (bypasses RLS safely)
      const { error } = await (supabase as any).rpc('enable_two_factor', {
        p_secret: secret,
        p_backup_codes: backupCodes,
      } as any);

      if (error) throw error;

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled",
      });
      return true;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const disableTwoFactor = useCallback(async (verificationCode: string) => {
    if (!profile || profile.role === 'Voter') {
      return false;
    }

    try {
      setLoading(true);

      // Verify current 2FA code
      if (profile.two_factor_secret) {
        const totp = new OTPAuth.TOTP({
          issuer: 'Evotar',
          label: profile.email || profile.full_name || 'User',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(profile.two_factor_secret),
        });

        const isValid = totp.validate({ token: verificationCode, window: 1 });
        
        if (isValid === null) {
          toast({
            title: "Invalid Code",
            description: "The verification code is incorrect",
            variant: "destructive",
          });
          return false;
        }
      }

      // Remove from database via secure RPC
      const { error } = await (supabase as any).rpc('disable_two_factor' as any);

      if (error) throw error;

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const verifyTwoFactor = useCallback(async (code: string): Promise<boolean> => {
    if (!profile || !profile.two_factor_secret) {
      return false;
    }

    try {
      // Check if it's a backup code first
      if (profile.two_factor_recovery_codes?.includes(code.toUpperCase())) {
        // Remove used backup code
        const updatedCodes = profile.two_factor_recovery_codes.filter(
          c => c !== code.toUpperCase()
        );
        
        await supabase
          .from('profiles')
          .update({ two_factor_recovery_codes: updatedCodes })
          .eq('user_id', profile.user_id);

        return true;
      }

      // Verify TOTP code
      const totp = new OTPAuth.TOTP({
        issuer: 'Evotar',
        label: profile.email || profile.full_name || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(profile.two_factor_secret),
      });

      const isValid = totp.validate({ token: code, window: 1 });
      return isValid !== null;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return false;
    }
  }, [profile]);

  const createStepUpVerification = useCallback(async (actionType: string) => {
    if (!profile) return null;

    try {
      const sessionToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('step_up_verifications')
        .insert({
          user_id: profile.user_id,
          session_token: sessionToken,
          action_type: actionType,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
      return sessionToken;
    } catch (error) {
      console.error('Error creating step-up verification:', error);
      return null;
    }
  }, [profile]);

  return {
    loading,
    generateTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,
    createStepUpVerification,
    canUseTwoFactor: profile?.role === 'Staff' || profile?.role === 'Administrator',
    twoFactorEnabled: profile?.two_factor_enabled || false,
  };
};