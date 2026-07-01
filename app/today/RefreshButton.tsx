'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  function refresh() {
    setClicked(true);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button onClick={refresh} disabled={isPending} className="self-start">
      {isPending ? 'Refreshing...' : clicked ? 'Refresh again' : 'Refresh'}
    </Button>
  );
}
