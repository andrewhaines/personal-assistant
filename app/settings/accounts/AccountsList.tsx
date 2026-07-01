'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type GoogleAccount = {
  id: string;
  google_email: string;
};

export default function AccountsList({ accounts }: { accounts: GoogleAccount[] }) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  async function disconnect(id: string) {
    setRemovingId(id);
    await fetch(`/api/google/accounts/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  if (accounts.length === 0) {
    return <div className="text-muted-foreground italic">No Google accounts connected yet.</div>;
  }

  return (
    <div className="space-y-2">
      {accounts.map(account => (
        <Card key={account.id} className="animate-fade-in">
          <CardContent className="flex items-center justify-between">
            <span>{account.google_email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disconnect(account.id)}
              disabled={removingId === account.id}
            >
              {removingId === account.id ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
