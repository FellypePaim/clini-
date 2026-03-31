import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    console.log('HooPay webhook received:', JSON.stringify(body))

    // HooPay envia o orderUUID e status do pagamento
    const orderUUID = body.orderUUID || body.order_uuid || body.uuid
    const paymentStatus = body.payment?.status || body.status
    const charges = body.payment?.charges || body.charges || []

    if (!orderUUID) {
      console.error('Webhook sem orderUUID')
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // Buscar pagamento pelo orderUUID
    const { data: pagamento } = await db.from('pagamentos')
      .select('*')
      .eq('hoopay_order_uuid', orderUUID)
      .single()

    if (!pagamento) {
      console.error('Pagamento não encontrado para orderUUID:', orderUUID)
      return new Response(JSON.stringify({ received: true, error: 'not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // Mapear status HooPay → nosso status
    let novoStatus = pagamento.status
    if (paymentStatus === 'paid' || paymentStatus === 'approved') {
      novoStatus = 'aprovado'
    } else if (paymentStatus === 'refused' || paymentStatus === 'failed') {
      novoStatus = 'cancelado'
    } else if (paymentStatus === 'expired') {
      novoStatus = 'expirado'
    } else if (paymentStatus === 'refunded') {
      novoStatus = 'reembolsado'
    }

    // Atualizar pagamento
    const updateData: any = {
      status: novoStatus,
      updated_at: new Date().toISOString(),
    }

    // Se cartão, salvar token para recorrência
    const charge = charges[0]
    if (charge?.card?.cardToken && !pagamento.card_token) {
      updateData.card_token = charge.card.cardToken
    }
    if (charge?.uuid && !pagamento.provider_payment_id) {
      updateData.provider_payment_id = charge.uuid
    }

    await db.from('pagamentos').update(updateData).eq('id', pagamento.id)

    // Se pagamento aprovado, ativar plano da clínica
    if (novoStatus === 'aprovado' && pagamento.clinica_id) {
      const { data: clinica } = await db.from('clinicas')
        .select('configuracoes')
        .eq('id', pagamento.clinica_id)
        .single()

      const configAtual = (clinica?.configuracoes as any) ?? {}

      await db.from('clinicas').update({
        configuracoes: {
          ...configAtual,
          plano: pagamento.plano_slug,
          status: 'ativo',
        },
        status_plano: 'ativo',
        trial_ate: null,
      }).eq('id', pagamento.clinica_id)

      console.log(`Plano ${pagamento.plano_slug} ativado para clínica ${pagamento.clinica_id}`)

      // Salvar card token se veio no webhook
      if (charge?.card?.cardToken) {
        await db.from('clinica_card_tokens').upsert({
          clinica_id: pagamento.clinica_id,
          card_token: charge.card.cardToken,
          ativo: true,
        }, { onConflict: 'clinica_id' })
      }
    }

    return new Response(JSON.stringify({ received: true, status: novoStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (e: any) {
    console.error('Webhook error:', e)
    return new Response(JSON.stringify({ received: true, error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  }
})
