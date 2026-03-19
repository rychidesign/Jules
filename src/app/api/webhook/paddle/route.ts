import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Logic to verify Paddle webhook signature
  const body = await req.json()
  const supabase = await createClient()

  const { userId, plan } = body.data;

  const { error } = await supabase
    .from('profiles')
    .update({ plan: plan.toUpperCase() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })

  return NextResponse.json({ success: true })
}
