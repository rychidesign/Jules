import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { planId } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Mock Paddle checkout URL generation
  const checkoutUrl = `https://checkout.paddle.com/checkout/mock?plan=${planId}&email=${user.email}&user_id=${user.id}`

  return NextResponse.json({ url: checkoutUrl })
}
