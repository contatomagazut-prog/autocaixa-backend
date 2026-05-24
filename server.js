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

email:req.body.email

},

external_reference:

req.body.userId,

notification_url:

"https://autocaixa-backend.vercel.app/webhook"

})
      }
    )

    const data = await response.json()

    console.log("Pagamento criado:")
    console.log(data)

console.log(
"EMAIL RECEBIDO APP:"
)

console.log(
req.body.email
)

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

headers:{

Authorization:

`Bearer ${process.env.MP_ACCESS_TOKEN}`

}

}

)

const pagamentoData =

await pagamento.json()


// ==========================
// BUSCAR EMAIL TEMPORARIO
// ==========================

const usuarioId =

pagamentoData.external_reference

let emailFinal =

"EMAIL_NAO_ENCONTRADO"

try{

const buscaEmail=

await fetch(

`${process.env.SUPABASE_URL}/rest/v1/pagamentos_pendentes?usuario_id=eq.${usuarioId}`,

{

headers:{

apikey:

process.env.SUPABASE_KEY,

Authorization:

`Bearer ${process.env.SUPABASE_KEY}`

}

}

)

const dadosEmail=

await buscaEmail.json()

if(

dadosEmail?.length

){

emailFinal=

dadosEmail[0].email

}

}catch(e){

console.log(

"ERRO EMAIL TEMPORARIO"

)

console.log(e)

}

console.log(

"EMAIL FINAL:"

)

console.log(

emailFinal

)

console.log(

"========== PAGAMENTO JSON =========="

)

console.log(

JSON.stringify(

pagamentoData,

null,

2

)

)

console.log(

"========== FIM JSON =========="

)


    // ==========================
    // APENAS APROVADO
    // ==========================

    if (pagamentoData.status !== "approved") {

      return res.status(200).json({
        ignored: true
      })

    }

    // ==========================
// BUSCAR EMAIL TEMPORARIO
// ==========================

const usuarioId =

pagamentoData.external_reference

let emailFinal =

"EMAIL_NAO_ENCONTRADO"

try{

const buscaEmail=

await fetch(

`${process.env.SUPABASE_URL}/rest/v1/pagamentos_pendentes?usuario_id=eq.${usuarioId}`,

{

headers:{

apikey:

process.env.SUPABASE_KEY,

Authorization:

`Bearer ${process.env.SUPABASE_KEY}`

}

}

)

const dadosEmail=

await buscaEmail.json()

if(

dadosEmail?.length

){

emailFinal=

dadosEmail[0].email

}

}catch(e){

console.log(

"ERRO EMAIL TEMPORARIO"

)

console.log(e)

}

console.log(

"EMAIL FINAL:"

)

console.log(

emailFinal

)

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

emailFinal,

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

emailFinal

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