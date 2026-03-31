import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HOOPAY_API = 'https://api.pay.hoopay.com.br'
const PLAN_PRICES: Record<string, number> = {
  starter: 97,
  professional: 197,
  clinic: 397,
  enterprise: 797,
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
  })
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Body — ler raw text e parsear manualmente (evitar problemas de stream)
    const rawBody = await req.text()
    let body: any = {}
    try { body = JSON.parse(rawBody) } catch { body = {} }
    const { action } = body
    console.log('payment-charge action:', action, 'body keys:', Object.keys(body))

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return err('Header Authorization ausente', 401)

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authErr } = await authClient.auth.getUser()
    if (authErr || !user) {
      console.error('Auth error:', authErr?.message)
      return err('Não autorizado', 401)
    }
    console.log('User authenticated:', user.id)

    const { data: profile } = await db.from('profiles').select('clinica_id, nome_completo, email, telefone').eq('id', user.id).single()
    if (!profile?.clinica_id) return err('Sem clínica vinculada', 403)
    console.log('Profile found, clinica_id:', profile.clinica_id)

    const HOOPAY_CLIENT_ID = Deno.env.get('HOOPAY_CLIENT_ID') ?? ''
    const HOOPAY_CLIENT_SECRET = Deno.env.get('HOOPAY_CLIENT_SECRET') ?? ''
    const basicAuth = btoa(`${HOOPAY_CLIENT_ID}:${HOOPAY_CLIENT_SECRET}`)

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`

    switch (action) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CRIAR COBRANÇA — PIX, BOLETO ou CARTÃO
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'create_charge': {
        const { plano, metodo, card, documento } = body
        // plano: 'starter' | 'professional' | 'clinic' | 'enterprise'
        // metodo: 'pix' | 'boleto' | 'cartao'
        // card: { number, holder, expirationDate, cvv, installments } (só para cartão)
        // documento: CPF ou CNPJ (enviado pelo frontend)

        const valor = PLAN_PRICES[plano]
        if (!valor) return err('Plano inválido')

        // Buscar dados da clínica para customer
        const { data: clinica } = await db.from('clinicas').select('nome, email, telefone, cnpj, endereco').eq('id', profile.clinica_id).single()

        const doc = (documento || clinica?.cnpj || '').replace(/\D/g, '')
        if (!doc) return err('CPF ou CNPJ obrigatório para pagamento')

        const customer = {
          email: clinica?.email || profile.email || user.email,
          name: clinica?.nome || profile.nome_completo,
          phone: (clinica?.telefone || profile.telefone || '').replace(/\D/g, '') || '11999999999',
          document: doc,
        }

        const endereco = clinica?.endereco as any
        const address = endereco ? {
          zipcode: endereco.cep || '',
          street: endereco.logradouro || '',
          streetNumber: endereco.numero || '',
          neighborhood: endereco.bairro || '',
          complement: endereco.complemento || '',
          city: endereco.cidade || '',
          state: endereco.estado || '',
        } : undefined

        const products = [{ title: `CliniPlus ${plano}`, amount: valor, quantity: 1 }]

        let payments: any[] = []
        if (metodo === 'pix') {
          payments = [{ type: 'pix', amount: valor }]
        } else if (metodo === 'boleto') {
          payments = [{ type: 'billet' }]
        } else if (metodo === 'cartao') {
          if (!card) return err('Dados do cartão obrigatórios')
          payments = [{
            type: 'creditCard',
            number: card.number,
            holder: card.holder,
            expirationDate: card.expirationDate,
            cvv: card.cvv,
            installments: card.installments || 1,
            amount: valor,
          }]
        } else {
          return err('Método de pagamento inválido')
        }

        const chargeBody: any = {
          amount: valor,
          customer,
          products,
          payments,
          data: {
            ip: '0.0.0.0',
            callbackURL: webhookUrl,
            src: 'cliniplus',
          },
        }
        if (address) chargeBody.address = address

        // Chamar HooPay API
        console.log('Calling HooPay:', metodo, valor, 'doc:', doc)
        const hoopayRes = await fetch(`${HOOPAY_API}/charge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify(chargeBody),
        })

        const hoopayText = await hoopayRes.text()
        console.log('HooPay response status:', hoopayRes.status, 'body:', hoopayText.substring(0, 500))
        let hoopayData: any
        try { hoopayData = JSON.parse(hoopayText) } catch { return err('Resposta inválida da HooPay') }

        if (hoopayData.errors) {
          console.error('HooPay error:', JSON.stringify(hoopayData.errors))
          return err(hoopayData.errors?.[0]?.message || 'Erro na HooPay')
        }

        const paymentStatus = hoopayData.payment?.status
        const charge = hoopayData.payment?.charges?.[0]

        // Salvar pagamento no banco
        const now = new Date()
        const periodoFim = new Date(now)
        periodoFim.setMonth(periodoFim.getMonth() + 1)

        const pagamento: any = {
          clinica_id: profile.clinica_id,
          plano_slug: plano,
          provider: 'hoopay',
          provider_payment_id: charge?.uuid || null,
          hoopay_order_uuid: hoopayData.orderUUID,
          valor,
          status: paymentStatus === 'paid' ? 'aprovado' : 'pendente',
          metodo_pagamento: metodo === 'cartao' ? 'cartao' : metodo,
          periodo_inicio: now.toISOString(),
          periodo_fim: periodoFim.toISOString(),
        }

        // PIX — salvar QR code e payload
        if (metodo === 'pix' && charge) {
          pagamento.pix_qrcode = charge.pixQrCode || null
          pagamento.pix_payload = charge.pixPayload || null
        }

        // Boleto — salvar URL e código de barras
        if (metodo === 'boleto' && charge) {
          pagamento.boleto_url = charge.billetUrl || null
          pagamento.boleto_barcode = charge.billetBarCode || null
        }

        // Cartão — salvar token para recorrência
        if (metodo === 'cartao' && charge?.card?.cardToken) {
          pagamento.card_token = charge.card.cardToken

          // Salvar token separadamente para recorrência futura
          await db.from('clinica_card_tokens').upsert({
            clinica_id: profile.clinica_id,
            card_token: charge.card.cardToken,
            ultimos_4_digitos: card.number?.slice(-4) || null,
            ativo: true,
          }, { onConflict: 'clinica_id' })
        }

        const { data: pagamentoSalvo, error: pgErr } = await db.from('pagamentos').insert(pagamento).select().single()
        if (pgErr) console.error('Erro ao salvar pagamento:', pgErr)

        // Se cartão aprovado, ativar plano imediatamente
        if (paymentStatus === 'paid') {
          const { data: clinicaAtual } = await db.from('clinicas').select('configuracoes').eq('id', profile.clinica_id).single()
          const configAtual = (clinicaAtual?.configuracoes as any) ?? {}
          await db.from('clinicas').update({
            configuracoes: { ...configAtual, plano, status: 'ativo' },
            status_plano: 'ativo',
            trial_ate: null,
          }).eq('id', profile.clinica_id)
        }

        // Montar resposta
        const response: any = {
          success: true,
          status: paymentStatus,
          orderUUID: hoopayData.orderUUID,
          pagamento_id: pagamentoSalvo?.id,
        }

        if (metodo === 'pix') {
          response.pix = {
            qrcode: charge?.pixQrCode,
            payload: charge?.pixPayload,
            expireAt: charge?.expireAt,
          }
        } else if (metodo === 'boleto') {
          response.boleto = {
            url: charge?.billetUrl,
            barcode: charge?.billetBarCode,
            expireAt: charge?.expireAt,
          }
        } else if (metodo === 'cartao') {
          response.message = paymentStatus === 'paid'
            ? 'Pagamento aprovado! Plano ativado.'
            : hoopayData.payment?.message || 'Pagamento recusado'
        }

        return ok(response)
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CONSULTAR STATUS PIX
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'check_pix': {
        const { orderUUID } = body
        if (!orderUUID) return err('orderUUID obrigatório')

        const pixRes = await fetch(`${HOOPAY_API}/pix/consult/${orderUUID}`, {
          headers: { 'Authorization': `Basic ${basicAuth}` },
        })
        const pixData = await pixRes.json()
        return ok(pixData)
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LISTAR PAGAMENTOS DA CLÍNICA
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'list_payments': {
        const { data: payments } = await db.from('pagamentos')
          .select('*')
          .eq('clinica_id', profile.clinica_id)
          .order('created_at', { ascending: false })
          .limit(20)

        return ok({ payments: payments ?? [] })
      }

      default:
        return err('Ação inválida')
    }
  } catch (e: any) {
    console.error('Payment error:', e)
    return err(e.message || 'Erro interno', 500)
  }
})
