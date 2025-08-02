import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoteReceipt = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveVoteReceipt = async (
    receiptId: string,
    electionId: string,
    electionTitle: string,
    selectedCandidates: Array<{ position: string; candidate: string }>,
    verificationToken: string,
    votingDate: string
  ) => {
    setLoading(true);
    try {
      // Create receipt hash for security
      const receiptData = {
        election_id: electionId,
        selected_candidates: selectedCandidates,
        voting_date: votingDate
      };
      const receiptHash = btoa(JSON.stringify(receiptData));

      const { error } = await supabase
        .from('vote_receipts')
        .insert({
          receipt_id: receiptId,
          election_id: electionId,
          election_title: electionTitle,
          selected_candidates: selectedCandidates,
          receipt_hash: receiptHash,
          verification_token: verificationToken,
          voting_date: votingDate,
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to save vote receipt:', error);
      toast({
        title: "Error",
        description: "Failed to save receipt data. Your vote was still recorded.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = async (receiptId: string, verificationToken: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vote_receipts')
        .select('*')
        .eq('receipt_id', receiptId)
        .eq('verification_token', verificationToken)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        return { success: false, error: 'Invalid receipt ID or verification token' };
      }

      // Mark as verified
      await supabase
        .from('vote_receipts')
        .update({ is_verified: true })
        .eq('receipt_id', receiptId);

      return { success: true, data };
    } catch (error) {
      console.error('Failed to verify receipt:', error);
      return { success: false, error: 'Failed to verify receipt' };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveVoteReceipt,
    verifyReceipt,
  };
};