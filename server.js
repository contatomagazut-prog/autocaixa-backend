import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {

  res.status(200).send("Backend online")

})

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
          status: "approved"
        })
      }
    )

    const data = await response.text()

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