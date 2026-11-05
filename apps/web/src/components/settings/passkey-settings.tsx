import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startRegistration } from "@simplewebauthn/browser";
import { KeyRound, Loader2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getApi } from "@/lib/api";
import { supportsPasskeys, passkeyError } from "@/lib/passkeys";
import { toast } from "@/hooks/use-toast";

export function PasskeySettings() {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [supported] = React.useState(supportsPasskeys);
  const keys = useQuery({ queryKey: ["auth", "passkeys"], queryFn: () => getApi().auth.listPasskeys() });
  const reportError = (error: unknown) => toast({ variant: "destructive", title: "Passkey request failed", description: passkeyError(error) });
  const add = useMutation({
    mutationFn: async () => {
      const { options, challengeId } = await getApi().auth.passkeyRegistrationOptions();
      const response = await startRegistration({ optionsJSON: options });
      await getApi().auth.verifyPasskeyRegistration({ challengeId, response, name: name.trim() });
    },
    onSuccess: () => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["auth", "passkeys"] });
      toast({ title: "Passkey added", description: "You can now sign in with this passkey." });
    },
    onError: reportError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => getApi().auth.deletePasskey(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "passkeys"] });
      toast({ title: "Passkey removed" });
    },
    onError: reportError,
  });
  const busy = add.isPending || remove.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>Sign in with your fingerprint, face, security key, or a password manager like 1Password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {keys.isPending ? <p className="text-sm text-muted-foreground">Loading passkeys…</p> : keys.isError ? (
          <div role="alert" className="text-sm text-destructive">Could not load passkeys. <Button variant="ghost" size="sm" onClick={() => void keys.refetch()}>Retry</Button></div>
        ) : keys.data.length === 0 ? <p className="text-sm text-muted-foreground">No passkeys added yet. Your password remains available for sign-in.</p> : (
          <ul className="divide-y divide-border">
            {keys.data.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground">{key.lastUsedAt ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : `Added ${new Date(key.createdAt).toLocaleDateString()}`}</p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={busy} aria-label={`Remove ${key.name}`} onClick={() => remove.mutate(key.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
        {supported ? (
          <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); if (name.trim()) add.mutate(); }}>
            <Label htmlFor="passkey-name">Passkey name</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="passkey-name" name="passkey-name" autoComplete="off" placeholder="e.g. 1Password or personal laptop" value={name} maxLength={100} required disabled={busy} onChange={(event) => setName(event.target.value)} />
              <Button type="submit" disabled={busy || !name.trim()} className="shrink-0">
                {add.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-1.5 h-3.5 w-3.5" />}
                Add passkey
              </Button>
            </div>
          </form>
        ) : <p className="text-sm text-muted-foreground">To add a passkey, open this account in a supported browser using HTTPS or localhost.</p>}
      </CardContent>
    </Card>
  );
}
