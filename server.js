import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// ==============================
// TESTE ONLINE
// ==============================

app.get("/", (req, res) => {

  res.status(200).send("Backend online")

})

// ==============================
// CRIAR PAGAMENTO MERCADO PAGO
// ==============================

app.post("/criar-pagamento", async (req, res) => {

  try {

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${process.env.MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify({

  items:[
    {
      title:"AUTOCAIXA PRO",
      quantity:1,
      currency_id:"BRL",
      unit_price:0.12
    }
  ],

  payer:{

    email:

      req.body.email ||

      "cliente@autocaixa.com"

  },

  external_reference:

    req.body.userId ||

    "SEM_USUARIO",

  notification_url:
    "https://autocaixa-backend.vercel.app/webhook"

})
      }
    )

    const data = await response.json()

    console.log("Pagamento criado:")
    console.log(data)

    return res.status(200).json({
      init_point: data.init_point
    })

  } catch (err) {

    console.log(err)

    return res.status(500).json({
      error: err.message
    })

  }

})

// ==============================
// WEBHOOK MERCADO PAGO
// ==============================

app.post("/webhook", async (req, res) => {

  try {

    console.log("Webhook recebido:")
    console.log(req.body)

    console.log("URL COMPLETA:")
    console.log(process.env.SUPABASE_URL)

    console.log("TAMANHO:")
    console.log(process.env.SUPABASE_URL?.length)

    let paymentId = null

    // PAYMENT
    if (req.body?.type === "payment") {

      paymentId = req.body?.data?.id

    }

    // MERCHANT ORDER
    if (req.body?.topic === "merchant_order") {

      console.log("Merchant order ignorado")

      return res.status(200).json({
        ignored: true
      })

    }

    // SEM PAYMENT ID
    if (!paymentId) {

      return res.status(200).json({
        ignored: true
      })

    }

    // ==========================
    // CONSULTA PAGAMENTO
    // ==========================

    const pagamento = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    )

    const pagamentoData = await pagamento.json()

console.log("========== PAGAMENTO JSON ==========")

console.log(
JSON.stringify(
pagamentoData,
null,
2
)
)

console.log("========== FIM JSON ==========")



    // ==========================
    // APENAS APROVADO
    // ==========================

    if (pagamentoData.status !== "approved") {

      return res.status(200).json({
        ignored: true
      })

    }

    // ==========================
    // SALVAR SUPABASE
    // ==========================

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/assinaturas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_KEY,
          Authorization:
            `Bearer ${process.env.SUPABASE_KEY}`,
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({

  payment_id:
    String(paymentId),

  status:
    pagamentoData.status,

  valor:
    pagamentoData.transaction_amount,

  usuario_id:
    pagamentoData.external_reference,

  email_pagador:

pagamentoData.payer?.email ||

pagamentoData.additional_info?.payer?.email ||

pagamentoData.metadata?.email ||

pagamentoData.transaction_details?.payer?.email ||

pagamentoData.card?.cardholder?.email ||

pagamentoData.point_of_interaction
 ?.transaction_data
 ?.payer_email ||

"EMAIL_NAO_DISPONIVEL",

  data_pagamento:
    pagamentoData.date_approved,

  comprovante_pix:

    JSON.stringify({

      id:
        pagamentoData.id,

      valor:
        pagamentoData.transaction_amount,

      data:
        pagamentoData.date_approved,

      status:
        pagamentoData.status,

      metodo:
        pagamentoData.payment_method_id,

      email:

pagamentoData.payer?.email ||

pagamentoData.additional_info?.payer?.email ||

pagamentoData.metadata?.email ||

pagamentoData.transaction_details?.payer?.email ||

pagamentoData.card?.cardholder?.email ||

pagamentoData.point_of_interaction
 ?.transaction_data
 ?.payer_email ||

"EMAIL_NAO_DISPONIVEL"

    }),

  data_brasilia:

    new Date(
      Date.now() - 10800000
    ).toISOString()

})
      }
    )

    const data = await response.text()

    console.log("STATUS SUPABASE:")
    console.log(response.status)

    console.log("RESPOSTA SUPABASE:")
    console.log(data)

    return res.status(200).json({
      success: true
    })

  } catch (err) {

    console.log(err)

    return res.status(500).json({
      error: err.message
    })

  }

})

export default app