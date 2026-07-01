import { createSupabaseServerClient } from '@/lib/supabase-server';
import TaskList, { type Task } from './TaskList';

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .order('due_at', { ascending: true, nullsFirst: false });

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--bottom-nav-height)-env(safe-area-inset-bottom))] max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <TaskList initialTasks={(data ?? []) as Task[]} />
    </div>
  );
}
