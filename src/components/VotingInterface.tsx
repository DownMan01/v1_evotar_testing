import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useVoteReceipt } from '@/hooks/useVoteReceipt';
import { supabase } from '@/integrations/supabase/client';
import { Vote, Check, AlertCircle, Download } from 'lucide-react';
import { generateVotingReceipt, downloadReceipt, generateReceiptId } from '@/utils/receiptGenerator';

interface Candidate {
  id: string;
  full_name: string;
  bio: string | null;
  image_url: string | null;
  position_id: string;
}

interface Position {
  id: string;
  title: string;
  description: string | null;
  candidates: Candidate[];
}

interface Election {
  id: string;
  title: string;
  description: string | null;
  status: string;
  positions: Position[];
}

interface VotingInterfaceProps {
  election: Election;
  onVoteComplete: () => void;
}

export const VotingInterface = ({ election, onVoteComplete }: VotingInterfaceProps) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { canVote } = usePermissions();
  const { toast } = useToast();
  const { saveVoteReceipt } = useVoteReceipt();

  useEffect(() => {
    const checkVoteStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check both voting_sessions (more reliable) and votes table
      const { data: sessionData } = await supabase
        .from('voting_sessions')
        .select('has_voted')
        .eq('election_id', election.id)
        .eq('voter_id', user.id)
        .eq('has_voted', true)
        .maybeSingle();
      
      if (sessionData) {
        setHasVoted(true);
        return;
      }
      
      // Fallback check in votes table
      const { data: voteData } = await supabase
        .from('votes')
        .select('id')
        .eq('election_id', election.id)
        .eq('voter_id', user.id)
        .maybeSingle();
      
      if (voteData) setHasVoted(true);
    };
    checkVoteStatus();
  }, [election.id]);

  const handleCandidateSelect = (positionId: string, candidateId: string) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const handleSubmitVotes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the existing voting session - it should already exist from when user started voting
      const { data: sessionData, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('session_token, has_voted, expires_at')
        .eq('voter_id', user.id)
        .eq('election_id', election.id)
        .single();

      if (sessionError || !sessionData) {
        throw new Error('No active voting session found. Please refresh and try again.');
      }

      if (sessionData.has_voted) {
        throw new Error('You have already voted in this election.');
      }

      if (new Date(sessionData.expires_at) < new Date()) {
        throw new Error('Your voting session has expired. Please refresh and try again.');
      }

      // Prepare votes array for batch submission
      const votes = Object.entries(selectedCandidates).map(([positionId, candidateId]) => ({
        candidate_id: candidateId,
        position_id: positionId,
        election_id: election.id
      }));

      // Submit all votes at once using the existing session token
      const { data: voteResult, error: voteError } = await supabase.rpc('cast_multiple_anonymous_votes', {
        p_session_token: sessionData.session_token,
        p_votes: votes,
        p_election_id: election.id
      });

      if (voteError || !voteResult) {
        throw new Error('Failed to submit votes. Please try again.');
      }
      
  // Generate verification token and receipt data
  const receiptId = generateReceiptId(election.id);
  const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const votingDate = new Date().toISOString();
  
  const selectedCandidatesForReceipt = election.positions.map(position => {
    const selectedCandidate = position.candidates.find(
      c => c.id === selectedCandidates[position.id]
    );
    return {
      position: position.title,
      candidate: selectedCandidate?.full_name || 'Unknown'
    };
  });

  // Generate and automatically download PDF receipt
  const receiptData = {
    electionTitle: election.title,
    electionId: election.id,
    votingDate: new Date().toLocaleString(),
    selectedCandidates: selectedCandidatesForReceipt,
    receiptId,
    verificationToken
  };
  
  await generateVotingReceipt(receiptData);
      
      // Save receipt data to database for verification
      await saveVoteReceipt(
        receiptId,
        election.id,
        election.title,
        selectedCandidatesForReceipt,
        verificationToken,
        votingDate
      );
      
      // Show success message
      toast({
        title: "Votes Cast Successfully!",
        description: `Your votes for ${election.title} have been recorded. Receipt downloaded automatically.`,
        variant: "default",
      });
      
      setShowConfirmDialog(false);
      setHasVoted(true); // Update local state immediately
      onVoteComplete();
    } catch (error: any) {
      console.error('Failed to submit votes:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit votes. Please try again.';
      if (error.message?.includes('Invalid or expired voting session')) {
        errorMessage = 'Your voting session has expired. Please refresh the page and try again.';
      } else if (error.message?.includes('already voted')) {
        errorMessage = 'You have already voted in this election.';
        setHasVoted(true); // Update local state
      } else if (error.message?.includes('No active voting session')) {
        errorMessage = 'No active voting session found. Please refresh and try again.';
      } else if (error.message?.includes('expired')) {
        errorMessage = 'Your voting session has expired. Please refresh and try again.';
      }
      
      toast({
        title: "Voting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!canVote) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            You don't have permission to vote. Only approved voters can participate in elections.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasVoted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Vote Already Cast</h3>
          <p className="text-muted-foreground">You have already voted in this election.</p>
        </CardContent>
      </Card>
    );
  }

  if (election.status !== 'Active') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {election.status === 'Upcoming' ? 'Voting has not started yet.' : 'Voting has ended.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const allPositionsSelected = election.positions.every(position => 
    selectedCandidates[position.id]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Cast Your Vote: {election.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select one candidate for each position. Your vote will be recorded securely.
          </p>
        </CardHeader>
      </Card>

      {election.positions.map((position) => (
        <Card key={position.id}>
          <CardHeader>
            <CardTitle className="text-lg">{position.title}</CardTitle>
            {position.description && (
              <p className="text-sm text-muted-foreground">{position.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {position.candidates.map((candidate) => {
                const isSelected = selectedCandidates[position.id] === candidate.id;
                return (
                  <Card
                    key={candidate.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleCandidateSelect(position.id, candidate.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={candidate.image_url || undefined} alt={candidate.full_name} />
                        <AvatarFallback>
                          {getInitials(candidate.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-medium mb-1">{candidate.full_name}</h4>
                      {candidate.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{candidate.bio}</p>
                      )}
                      {isSelected && (
                        <Badge className="mt-2">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!allPositionsSelected || loading}
            size="lg"
            className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2"
          >
            <Vote className="h-4 w-4" />
            Submit My Votes
          </Button>

          {!allPositionsSelected && (
            <p className="text-sm text-destructive font-medium">
              Please select a candidate for each position to continue.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Votes</DialogTitle>
            <DialogDescription className="text-red-600">
              Please review your selections before submitting. Once submitted, your votes cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {election.positions.map((position) => {
              const selectedCandidate = position.candidates.find(
                c => c.id === selectedCandidates[position.id]
              );
              return (
                <div key={position.id} className="flex justify-between items-center">
                  <span className="font-medium">{position.title}:</span>
                  <span className="text-muted-foreground">
                    {selectedCandidate?.full_name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Review Again
            </Button>
            <Button onClick={handleSubmitVotes} disabled={loading}>
              {loading ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};