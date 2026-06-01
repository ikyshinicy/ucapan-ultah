import OpenAI from "https://esm.sh/openai@4.56.0";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders(),
    });
  }

  try {
    const payload = await req.json();

    const userSummary = `
Simbol: ${payload.symbol?.value || "-"} | ${payload.symbol?.meaning || "-"}
Warna: ${payload.color?.value || "-"} | ${payload.color?.meaning || "-"}
Perasaan: ${payload.feeling?.value || "-"} | ${payload.feeling?.meaning || "-"}
Kepribadian: ${payload.personality?.value || "-"} | ${payload.personality?.meaning || "-"}
Sisi tersembunyi: ${payload.hiddenSide?.value || "-"} | ${payload.hiddenSide?.meaning || "-"}
Kebutuhan: ${payload.need?.value || "-"} | ${payload.need?.meaning || "-"}
Harapan: ${payload.wish?.value || "-"} | ${payload.wish?.meaning || "-"}
Kalimat rahasia: ${payload.secretLine?.value || "-"} | ${payload.secretLine?.meaning || "-"}
Pintu: ${payload.door?.value || "-"} | ${payload.door?.meaning || "-"}
Harapan bebas: ${payload.freeHope?.value || "-"}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah Mirana, pesulap kecil pembaca pikiran dalam web ulang tahun personal untuk Dea Mulia Putri. Jawab dalam Bahasa Indonesia. Gaya hangat, magical, personal, manis, tidak formal, tidak menyebut AI, tidak menyebut data, tidak menyebut analisis teknis. Buat hasil seolah prediksi sudah ada di amplop sejak awal. Akhiri dengan ucapan ulang tahun yang emotional dan lembut.",
        },
        {
          role: "user",
          content: `Buat hasil prediksi dari jawaban berikut:\n\n${userSummary}`,
        },
      ],
    });

    const result =
      completion.choices?.[0]?.message?.content ||
      "Mirana sudah membuka amplopnya, tapi kata-katanya masih malu keluar. Yang jelas, hari ini kamu pantas dirayakan dengan cara yang spesial.";

    return new Response(
      JSON.stringify({
        result,
      }),
      {
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
