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
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
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
    console.log('Skipping PaymentIntent - likely from subscription (handled elsewhere)')
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

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
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

    // Calculate next billing date safely
    let proExpiresAt = null
    if (subscription.current_period_end && subscription.current_period_end > 0) {
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      proExpiresAt = currentPeriodEnd.toISOString()
    }
    
    console.log(`Subscription details: status=${subscription.status}, period_end=${subscription.current_period_end}, expires_at=${proExpiresAt}`)
    
    // Update user profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_pro: subscription.status === 'active',
        pro_expires_at: proExpiresAt,
        pro_activated_at: subscription.status === 'active' ? new Date().toISOString() : null,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log(`Updated subscription for user ${profile.id}: status=${subscription.status}`)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
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

    // If this is a subscription payment, get the subscription
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      
      // Update pro status and extend expiration
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          is_pro: true,
          pro_expires_at: currentPeriodEnd.toISOString(),
          subscription_status: subscription.status,
        })
        .eq('id', profile.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    // Record the payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: profile.id,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method: 'stripe',
        created_at: new Date(),
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
    }

    console.log(`Successfully processed payment for user ${profile.id}`)
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

    // Mark subscription as cancelled but let them keep pro until period end
    const { error } = await supabase
      .from('user_profiles')
      .update({
        pro_cancelled_at: new Date().toISOString(),
        subscription_status: 'canceled',
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating cancelled subscription:', error)
    } else {
      console.log(`Cancelled subscription for user ${profile.id}`)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
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

    // You might want to send a notification to the user about payment failure
    console.log(`Payment failed for user ${profile.id}, invoice: ${invoice.id}`)
    
    // Optionally update subscription status
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating payment failed status:', error)
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}