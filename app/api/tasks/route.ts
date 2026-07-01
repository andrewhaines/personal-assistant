import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_at', { ascending: true, nullsFirst: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ tasks: data });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  if (!body.title || typeof body.title !== 'string') {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: body.title,
      notes: body.notes ?? null,
      due_at: body.due_at ?? null,
      priority: body.priority ?? 2,
      source: body.source ?? 'manual',
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ task: data }, { status: 201 });
}
