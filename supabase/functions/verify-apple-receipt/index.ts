// supabase/functions/verify-apple-receipt/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Apple's verification endpoints
const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Your App Store Connect shared secret
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET')!

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
    const { receipt, productId, userId } = await req.json()
    
    if (!receipt || !productId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Verifying receipt for user ${userId}, product ${productId}`)

    // Verify receipt with Apple
    const receiptData = {
      'receipt-data': receipt,
      'password': APPLE_SHARED_SECRET,
      'exclude-old-transactions': true,
    }

    // Try production first
    let response = await fetch(PRODUCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData),
    })

    let verification = await response.json()

    // If status is 21007, receipt is from sandbox - try sandbox endpoint
    if (verification.status === 21007) {
      console.log('Receipt from sandbox, trying sandbox endpoint')
      response = await fetch(SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      })
      verification = await response.json()
    }

    // Check verification status
    if (verification.status !== 0) {
      console.error('Receipt verification failed:', verification)
      return new Response(
        JSON.stringify({ 
          error: 'Receipt verification failed',
          status: verification.status 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract subscription info
    const latestReceipt = verification.latest_receipt_info?.[0]
    const pendingRenewalInfo = verification.pending_renewal_info?.[0]
    
    if (!latestReceipt) {
      return new Response(
        JSON.stringify({ error: 'No subscription found in receipt' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse dates (Apple returns milliseconds)
    const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms))
    const purchaseDate = new Date(parseInt(latestReceipt.purchase_date_ms))
    const isActive = expiresDate > new Date()
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_pro: isActive,
        pro_expires_at: expiresDate.toISOString(),
        pro_activated_at: purchaseDate.toISOString(),
        apple_subscription_id: latestReceipt.original_transaction_id,
        subscription_status: isActive ? 'active' : 'expired',
        payment_platform: 'apple',
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Record the purchase
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        apple_transaction_id: latestReceipt.transaction_id,
        apple_original_transaction_id: latestReceipt.original_transaction_id,
        product_id: productId,
        amount: 0, // Apple doesn't provide amount in receipt
        currency: 'USD',
        status: 'succeeded',
        payment_method: 'apple_iap',
        created_at: purchaseDate.toISOString(),
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      // Don't fail the request, subscription is already activated
    }

    console.log(`Successfully activated subscription for user ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        isActive,
        expiresAt: expiresDate.toISOString(),
        autoRenewing: pendingRenewalInfo?.auto_renew_status === '1',
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
    console.error('Error verifying receipt:', error)
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