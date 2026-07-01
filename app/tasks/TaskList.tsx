'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  priority: number;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  completed_at: string | null;
};

const PRIORITY_LABEL: Record<number, string> = { 1: 'High', 2: 'Medium', 3: 'Low' };
const PRIORITY_VARIANT: Record<number, 'destructive' | 'secondary' | 'outline'> = {
  1: 'destructive',
  2: 'secondary',
  3: 'outline',
};

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState(2);
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);

  const openTasks = tasks
    .filter(t => t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return a.due_at.localeCompare(b.due_at);
    });
  const doneTasks = tasks.filter(t => t.status === 'done');

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        due_at: dueAt ? new Date(`${dueAt}T00:00:00`).toISOString() : null,
        priority,
      }),
    });

    const { task } = await res.json();
    setTasks(prev => [...prev, task]);
    setTitle('');
    setDueAt('');
    setPriority(2);
    setAdding(false);
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));

    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const { task } = await res.json();
    setTasks(prev => prev.map(t => (t.id === id ? task : t)));
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }

  const isOverdue = (t: Task) =>
    t.due_at !== null && new Date(t.due_at) < new Date() && t.status !== 'done';

  return (
    <div className="flex-1 overflow-y-auto space-y-4">
      <form onSubmit={addTask} className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Add a task..."
          disabled={adding}
          className="flex-1 min-w-[10rem]"
        />
        <Input
          type="date"
          value={dueAt}
          onChange={e => setDueAt(e.target.value)}
          disabled={adding}
          className="w-auto"
        />
        <Select
          value={String(priority)}
          onValueChange={value => setPriority(Number(value))}
        >
          <SelectTrigger disabled={adding}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">High</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="3">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={adding || !title.trim()}>
          Add
        </Button>
      </form>

      <div className="space-y-2">
        {openTasks.map(t => (
          <Card key={t.id} className="animate-fade-in">
            <CardContent className="flex items-start gap-3">
              <Checkbox
                checked={false}
                onCheckedChange={() => updateTask(t.id, { status: 'done' })}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{t.title}</span>
                  <Badge variant={PRIORITY_VARIANT[t.priority]}>
                    {PRIORITY_LABEL[t.priority]}
                  </Badge>
                  {isOverdue(t) && <Badge variant="destructive">Overdue</Badge>}
                </div>
                {t.due_at && (
                  <div className="text-xs text-muted-foreground">
                    Due {new Date(t.due_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteTask(t.id)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {openTasks.length === 0 && (
          <div className="text-muted-foreground italic">No open tasks.</div>
        )}
      </div>

      {doneTasks.length > 0 && (
        <div>
          <Button variant="link" size="sm" onClick={() => setShowDone(v => !v)}>
            {showDone ? 'Hide' : 'Show'} done ({doneTasks.length})
          </Button>
          {showDone && (
            <div className="space-y-2 mt-2">
              {doneTasks.map(t => (
                <Card key={t.id} className="animate-fade-in">
                  <CardContent className="flex items-start gap-3">
                    <Checkbox checked disabled className="mt-1" />
                    <div className="flex-1 line-through text-muted-foreground">
                      {t.title}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteTask(t.id)}>
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
