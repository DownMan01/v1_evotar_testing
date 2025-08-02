import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, QrCode, Calendar, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useVoteReceipt } from '@/hooks/useVoteReceipt';

interface VerificationData {
  receipt_id: string;
  election_id: string;
  election_title: string;
  selected_candidates: Array<{ position: string; candidate: string }>;
  voting_date: string;
  created_at: string;
}

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { loading, verifyReceipt } = useVoteReceipt();

  const receiptId = searchParams.get('receiptId');
  const token = searchParams.get('token');

  useEffect(() => {
    const performVerification = async () => {
      if (!receiptId || !token) {
        setError('Missing receipt ID or verification token in URL');
        return;
      }

      const result = await verifyReceipt(receiptId, token);
      
      if (result.success && result.data) {
        // Convert the database result to our interface
        const verificationData: VerificationData = {
          receipt_id: result.data.receipt_id,
          election_id: result.data.election_id,
          election_title: result.data.election_title,
          selected_candidates: result.data.selected_candidates as Array<{ position: string; candidate: string }>,
          voting_date: result.data.voting_date,
          created_at: result.data.created_at
        };
        setVerificationData(verificationData);
      } else {
        setError(result.error || 'Verification failed');
      }
    };

    performVerification();
  }, [receiptId, token, verifyReceipt]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Verifying your vote receipt...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground">
              Please check your QR code or receipt ID and try again.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Vote Verified Successfully</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your vote has been confirmed and recorded in the election system. Below are the details of your verified vote.
          </p>
        </div>

        {/* Election Information */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Election Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-primary/5">Election Name</Badge>
                </div>
                <p className="font-semibold text-lg">{verificationData.election_title}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-primary/5">Election ID</Badge>
                </div>
                <p className="font-mono text-sm text-muted-foreground">{verificationData.election_id}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Badge variant="outline" className="bg-primary/5">Voting Date</Badge>
                </div>
                <p className="font-medium">{formatDate(verificationData.voting_date)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <Badge variant="outline" className="bg-primary/5">Receipt ID</Badge>
                </div>
                <p className="font-mono text-sm text-muted-foreground">{verificationData.receipt_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Candidates */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Your Selected Candidates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationData.selected_candidates.map((selection, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    index % 2 === 0 ? 'bg-primary/5 border-primary/10' : 'bg-secondary/50 border-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {selection.position}
                        </Badge>
                      </div>
                      <p className="font-semibold text-lg">{selection.candidate}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Details */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Verification Complete</h3>
                <p className="text-muted-foreground">
                  Your vote was successfully verified on {formatDate(verificationData.created_at)}
                </p>
              </div>
              <Alert className="text-left bg-primary/5 border-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>Your vote is secure and anonymous.</strong> This verification confirms your selections 
                  were recorded correctly without revealing your identity to anyone.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center">
          <Button asChild>
            <Link to="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Verify;