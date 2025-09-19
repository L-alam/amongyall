// supabase/functions/cancel-subscription/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found')
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing cancellation for user: ${userId}`)

    // Get user's stripe customer ID from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      console.log('No Stripe customer ID found for user:', userId)
      
      // Still update the database to mark as cancelled
      await supabase
        .from('user_profiles')
        .update({ pro_cancelled_at: new Date().toISOString() })
        .eq('id', userId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription marked as cancelled (no active Stripe subscription found)' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find and cancel active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 10,
    })

    if (subscriptions.data.length === 0) {
      console.log('No active subscriptions found for customer:', profile.stripe_customer_id)
      
      // Still update database
      await supabase
        .from('user_profiles')
        .update({ pro_cancelled_at: new Date().toISOString() })
        .eq('id', userId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription marked as cancelled (no active subscriptions)' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Cancel all active subscriptions
    const cancelPromises = subscriptions.data.map(subscription =>
      stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })
    )

    const cancelledSubs = await Promise.all(cancelPromises)

    // Update database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ pro_cancelled_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Continue anyway since Stripe cancellation succeeded
    }

    console.log(`Successfully cancelled ${cancelledSubs.length} subscription(s)`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully cancelled ${cancelledSubs.length} subscription(s)`,
        subscriptions: cancelledSubs.map(sub => ({
          id: sub.id,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }))
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in cancel-subscription function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}` 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})