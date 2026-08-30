import { NextResponse } from 'next/server';
import * as store from '@/lib/store';

export async function GET() {
  const teams = await store.getAllTeams();
  return NextResponse.json({ success: true, teams });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, track, leaderId } = body;
    const result = await store.createTeam({ name, description, track, leaderId });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
