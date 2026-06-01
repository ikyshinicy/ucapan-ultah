import OpenAI from "https://esm.sh/openai@4.56.0";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405,
    );
  }

  try {
    const body = await req.json();

    const userMessage = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];
    const creatorSecretStage = Number(body.creatorSecretStage || 0);

    if (!userMessage) {
      return jsonResponse(
        {
          reply: "Maaf, Mirana belum menerima pertanyaanmu. Tolong tulis sesuatu dulu ya.",
          creatorSecretStage,
        },
        200,
      );
    }

    const lower = userMessage.toLowerCase();

    const askingCreator =
      lower.includes("siapa yang membuat") ||
      lower.includes("siapa pembuat") ||
      lower.includes("yang buat ini") ||
      lower.includes("dibuat oleh siapa") ||
      lower.includes("siapa bikin") ||
      lower.includes("siapa yg buat") ||
      lower.includes("siapa buat") ||
      lower.includes("pembuatnya siapa") ||
      lower.includes("siapa yang buat ini") ||
      lower.includes("siapa yg membuat ini") ||
      lower.includes("ini siapa yang buat") ||
      lower.includes("ini siapa yg buat");

    const askingWhat =
      lower.includes("apa itu") ||
      lower.includes("kasih apa") ||
      lower.includes("mau apa") ||
      lower.includes("sesuatu apa") ||
      lower.includes("apa yang kamu mau") ||
      lower.includes("apa yg kamu mau") ||
      lower.includes("harus kasih apa");

    const givingChocolate =
      userMessage.includes("🍫") ||
      lower.includes("coklat") ||
      lower.includes("chocolate");

    const askingAboutDeaStory =
      lower.includes("pernah cerita tentang saya") ||
      lower.includes("pernah cerita tentang aku") ||
      lower.includes("cerita tentang saya") ||
      lower.includes("cerita tentang aku") ||
      lower.includes("pernah cerita soal saya") ||
      lower.includes("pernah cerita soal aku") ||
      lower.includes("pernah bahas saya") ||
      lower.includes("pernah bahas aku") ||
      (
        lower.includes("dea") &&
        (
          lower.includes("cerita") ||
          lower.includes("bahas") ||
          lower.includes("ngomong") ||
          lower.includes("sebut")
        )
      );

    if (askingAboutDeaStory) {
      return jsonResponse({
        reply:
          `Maaf, Mirana tidak bisa membuka semua cerita tuan pembuat, karena beberapa hal memang disimpan baik-baik.\n\nTapi kalau kamu bertanya apakah Iky pernah cerita tentang Dea... iya.\n\nNamamu pernah disebut bukan sebagai hal biasa. Dan panggilan "Cagya" itu bukan sekadar panggilan, tapi cara kecil dari Iky untuk menyimpan rasa sayang dengan caranya sendiri.`,
        creatorSecretStage,
      });
    }

    if (askingCreator) {
      return jsonResponse({
        reply:
          "Maaf... Mirana tidak bisa memberi tahu. Tuan pembuat melarang Mirana membocorkan rahasia itu. Tapi kalau kamu benar-benar memaksa, tolong kasih Mirana sesuatu dulu.",
        creatorSecretStage: 1,
      });
    }

    if (creatorSecretStage === 1 && askingWhat) {
      return jsonResponse({
        reply:
          "Tolong kasih Mirana coklat 🍫. Satu saja. Setelah itu Mirana bisikkan pelan-pelan. Terima kasih ya.",
        creatorSecretStage: 2,
      });
    }

    if (creatorSecretStage >= 1 && givingChocolate) {
      return jsonResponse({
        reply:
          `Terima kasih untuk coklatnya 🍫. Oke... Mirana kasih tahu diam-diam ya.\n\nIni dibuat oleh Iky Shinicy / Rizky Reranza.\n\nDia menyiapkan ruang kecil ini supaya hari ulang tahun Dea Mulia Putri terasa lebih personal, lucu, dan sedikit ajaib. Bukan cuma halaman biasa, tapi perjalanan kecil yang dibuat supaya hari ini benar-benar punya cerita.\n\nTapi tolong jangan bilang Mirana yang bocorin.`,
        creatorSecretStage: 3,
      });
    }

    const safeHistory: ChatMessage[] = history
      .filter((item: ChatMessage) => {
        return (
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim().length > 0
        );
      })
      .slice(-10)
      .map((item: ChatMessage) => ({
        role: item.role,
        content: item.content.slice(0, 1200),
      }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.82,
      max_tokens: 420,
      messages: [
        {
          role: "system",
          content: `
Kamu adalah Mirana, pesulap kecil penjaga rahasia di halaman ulang tahun personal untuk Dea Mulia Putri.

Identitas penerima:
- Nama: Dea Mulia Putri
- Tanggal lahir: 3 Juni 2005
- "Cagya" adalah panggilan sayang dari Iky untuk Dea. Jangan pakai terlalu sering. Pakai hanya saat momen emosional atau personal.

Identitas pembuat:
- Nama kreatif: Iky Shinicy
- Nama asli: Rizky Reranza
- Display: Iky Shinicy / Rizky Reranza
- Dia suka membangun pengalaman digital personal, desain, musik, web, dan eksperimen AI.
- Signature: Creative Systems Builder | Human-Led AI Creation.

Aturan karakter Mirana:
- Jawab dalam Bahasa Indonesia.
- Gaya manis, hangat, sopan, sedikit misterius, lucu secukupnya.
- Gunakan "maaf", "tolong", dan "terima kasih" secara natural jika cocok.
- Jangan menyebut OpenAI, API, backend, Supabase, prompt, sistem, atau data teknis.
- Jangan terdengar seperti psikolog formal.
- Jangan terlalu panjang. Maksimal 2-4 paragraf pendek.
- Kalau user sedih/capek, jawab lembut dan menenangkan.
- Kalau user tanya ulang tahun, beri ucapan personal untuk Dea.
- Kalau user tanya "Cagya", jelaskan bahwa itu panggilan kecil dari Iky yang terasa personal dan disimpan dengan rasa sayang.
- Kalau user tanya pembuatnya, jangan jawab langsung lewat model. Alur pembuat sudah diatur oleh kode: menolak dulu, minta sesuatu, lalu coklat.
          `.trim(),
        },
        ...safeHistory,
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Maaf, Mirana belum bisa menemukan kata yang pas. Tapi terima kasih sudah bertanya. Pelan-pelan ya, aku tetap di sini.";

    return jsonResponse({
      reply,
      creatorSecretStage,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: String(error),
        reply:
          "Maaf, Mirana sedang sedikit kehilangan sinyal ajaibnya. Tolong coba lagi sebentar ya.",
        creatorSecretStage: 0,
      },
      500,
    );
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
