import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AccountsList from './AccountsList';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('google_accounts')
    .select('id, google_email')
    .order('created_at', { ascending: true });

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4 gap-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-bold">Connected Accounts</h1>

      {connected && (
        <Alert className="animate-fade-in">
          <AlertDescription>Connected {connected}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertDescription>
            Couldn&apos;t connect that account ({error}). Try again.
          </AlertDescription>
        </Alert>
      )}

      <AccountsList accounts={data ?? []} />

      <Button render={<a href="/api/google/connect" />} className="self-start">
        Connect another Google account
      </Button>
    </div>
  );
}
