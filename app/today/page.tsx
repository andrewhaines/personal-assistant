import { runAssistantTurn } from '@/lib/assistant/briefing';
import { Card, CardContent } from '@/components/ui/card';
import RefreshButton from './RefreshButton';

export const dynamic = 'force-dynamic';

const BRIEFING_PROMPT =
  'What should I be doing today? Account for anything time-sensitive this week and flag any scheduling gaps or conflicts.';

export default async function TodayPage() {
  const briefing = await runAssistantTurn([{ role: 'user', content: BRIEFING_PROMPT }]);

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4 gap-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-bold">Today</h1>
      <Card className="animate-fade-in">
        <CardContent className="whitespace-pre-wrap">{briefing}</CardContent>
      </Card>
      <RefreshButton />
    </div>
  );
}
