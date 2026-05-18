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
          "Authorization":
            `Bearer ${process.env.MP_ACCESS_TOKEN}`
        },
        body: JSON.stringify({

          items: [
            {
              title: "AUTOCAIXA PRO",
              quantity: 1,
              currency_id: "BRL",
              unit_price: 0.12
            }
          ],

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

    const paymentId = req.body?.data?.id

    if (!paymentId) {

      return res.status(400).json({
        error: "Pagamento não encontrado"
      })

    }

    // ==========================
    // CONSULTA PAGAMENTO REAL
    // ==========================

    const pagamento = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          "Authorization":
            `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    )

    const pagamentoData = await pagamento.json()

    console.log("Dados pagamento:")
    console.log(pagamentoData)

    // ==========================
    // APENAS PAGAMENTO APROVADO
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
          "apikey": process.env.SUPABASE_KEY,
          "Authorization":
            `Bearer ${process.env.SUPABASE_KEY}`,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          payment_id: String(paymentId),
          status: pagamentoData.status
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