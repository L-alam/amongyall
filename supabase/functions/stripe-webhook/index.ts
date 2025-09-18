// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)

    console.log(`Received event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.supabase_user_id

  if (!userId) {
    console.error('No user ID in payment intent metadata')
    return
  }

  try {
    // Update user profile to mark as pro
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        pro_activated_at: new Date(),
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return
    }

    // Record the payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        payment_method: 'stripe',
        created_at: new Date(),
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
    }

    console.log(`Successfully upgraded user ${userId} to pro`)
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error)
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  try {
    // Get user by customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.error('No profile found for customer:', customerId)
      return
    }

    // Extend pro subscription
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend 30 days
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating subscription:', error)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionPayment:', error)
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.error('No profile found for customer:', customerId)
      return
    }

    // Mark subscription as cancelled (but don't immediately revoke pro status)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        pro_cancelled_at: new Date(),
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating cancelled subscription:', error)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error)
  }
}