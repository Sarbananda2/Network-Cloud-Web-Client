import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Key, Plus, Copy, Check, Trash2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AgentToken {
  id: number;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface NewTokenResponse {
  id: number;
  name: string;
  tokenPrefix: string;
  token: string;
  createdAt: string;
}

export default function AgentTokens() {
  const { toast } = useToast();
  const [newTokenName, setNewTokenName] = useState("");
  const [showNewTokenDialog, setShowNewTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState<NewTokenResponse | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<AgentToken | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: tokens, isLoading } = useQuery<AgentToken[]>({
    queryKey: ["/api/agent-tokens"],
  });

  const createTokenMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/agent-tokens", { name });
      return response.json();
    },
    onSuccess: (data: NewTokenResponse) => {
      setShowNewTokenDialog(false);
      setNewToken(data);
      setNewTokenName("");
      queryClient.invalidateQueries({ queryKey: ["/api/agent-tokens"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      await apiRequest("DELETE", `/api/agent-tokens/${tokenId}`);
    },
    onSuccess: () => {
      toast({
        title: "Token revoked",
        description: "The agent token has been permanently revoked.",
      });
      setTokenToRevoke(null);
      queryClient.invalidateQueries({ queryKey: ["/api/agent-tokens"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke token. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateToken = () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this token.",
        variant: "destructive",
      });
      return;
    }
    createTokenMutation.mutate(newTokenName.trim());
  };

  const handleCopyToken = async () => {
    if (newToken?.token) {
      await navigator.clipboard.writeText(newToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Token copied",
        description: "The token has been copied to your clipboard.",
      });
    }
  };

  const handleCloseNewTokenDialog = () => {
    setNewToken(null);
    setCopied(false);
  };

  const activeTokens = tokens?.filter(t => !t.revokedAt) || [];
  const revokedTokens = tokens?.filter(t => t.revokedAt) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Agent Tokens</h1>
            <p className="text-muted-foreground">
              Create and manage API tokens for your local NetworkCloud agents.
            </p>
          </div>
          
          <Button 
            onClick={() => setShowNewTokenDialog(true)}
            data-testid="button-create-token"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Token
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTokens.length === 0 && revokedTokens.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
            data-testid="empty-state-no-tokens"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Key className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3 text-center">
              No agent tokens yet
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Create an API token to connect your local NetworkCloud agent to this dashboard.
              Each token allows one agent to register and update devices on your behalf.
            </p>
            <Button onClick={() => setShowNewTokenDialog(true)} data-testid="button-create-first-token">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Token
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {activeTokens.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Active Tokens
                  </CardTitle>
                  <CardDescription>
                    These tokens are currently valid and can be used by agents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {activeTokens.map((token) => (
                      <div 
                        key={token.id} 
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        data-testid={`row-token-${token.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium text-foreground" data-testid={`text-token-name-${token.id}`}>
                                {token.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                  {token.tokenPrefix}...
                                </code>
                                <span className="text-xs text-muted-foreground">
                                  Created {formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}
                                </span>
                                {token.lastUsedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    Last used {formatDistanceToNow(new Date(token.lastUsedAt), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTokenToRevoke(token)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          data-testid={`button-revoke-token-${token.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {revokedTokens.length > 0 && (
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-5 h-5" />
                    Revoked Tokens
                  </CardTitle>
                  <CardDescription>
                    These tokens are no longer valid and cannot be used.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {revokedTokens.map((token) => (
                      <div 
                        key={token.id} 
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        data-testid={`row-revoked-token-${token.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium text-muted-foreground line-through">
                                {token.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                  {token.tokenPrefix}...
                                </code>
                                <Badge variant="outline" className="text-xs">Revoked</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Dialog open={showNewTokenDialog} onOpenChange={setShowNewTokenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Agent Token</DialogTitle>
              <DialogDescription>
                Give your token a descriptive name to help you identify which agent is using it.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="e.g., Home Network Agent"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateToken()}
                data-testid="input-token-name"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTokenDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateToken} 
                disabled={createTokenMutation.isPending}
                data-testid="button-confirm-create-token"
              >
                {createTokenMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!newToken} onOpenChange={() => handleCloseNewTokenDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Token Created
              </DialogTitle>
              <DialogDescription>
                Copy this token now. For security, you won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Your API Token</p>
                <code className="text-sm font-mono break-all select-all" data-testid="text-new-token">
                  {newToken?.token}
                </code>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleCopyToken}
                data-testid="button-copy-token"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseNewTokenDialog} data-testid="button-done-token">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!tokenToRevoke} onOpenChange={(open) => !open && setTokenToRevoke(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this token?</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately invalidate the token "{tokenToRevoke?.name}". 
                Any agents using this token will no longer be able to connect.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-revoke">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => tokenToRevoke && revokeTokenMutation.mutate(tokenToRevoke.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-revoke"
              >
                {revokeTokenMutation.isPending ? "Revoking..." : "Revoke Token"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
