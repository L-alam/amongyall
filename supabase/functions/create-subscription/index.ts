// supabase/functions/create-subscription/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const { method } = req

  // Handle CORS
  if (method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { priceId, userId, paymentMethod } = await req.json()
    
    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Creating subscription for user ${userId} with payment method: ${paymentMethod || 'default'}`)

    // Get or create customer
    let customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, display_name')
      .eq('id', userId)
      .single()

    if (profile?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    } else {
      // Get user email from auth.users
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      
      // Create new customer
      customer = await stripe.customers.create({
        email: user?.email,
        name: profile?.display_name,
        metadata: {
          supabase_user_id: userId,
        },
      })

      // Save customer ID to profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId)
    }

    // Configure subscription based on payment method
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customer.id,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        supabase_user_id: userId,
        payment_method: paymentMethod || 'default',
      },
    }

    // For Apple Pay, add specific payment method types
    if (paymentMethod === 'apple_pay') {
      subscriptionParams.payment_settings = {
        ...subscriptionParams.payment_settings,
        payment_method_types: ['card'],
      }
      
      // Add Apple Pay specific metadata
      subscriptionParams.metadata = {
        ...subscriptionParams.metadata,
        apple_pay_enabled: 'true',
      }
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subscriptionParams)

    const paymentIntent = subscription.latest_invoice?.payment_intent

    console.log(`Subscription created: ${subscription.id}, Payment Intent: ${paymentIntent?.id}`)

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        ephemeralKey: null, // Not needed for subscriptions
        customer: customer.id,
        paymentMethod: paymentMethod || 'default',
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Error creating subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check server logs for more information'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})