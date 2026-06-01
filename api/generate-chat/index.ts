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
        reply: "Maaf, Mirana cuma bisa menerima pesan dari ruang chat ini.",
        creatorSecretStage: 0,
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
      return jsonResponse({
        reply: "Maaf, Mirana belum dengar apa-apa. Tolong tulis dulu ya.",
        creatorSecretStage,
      });
    }

    const lower = normalizeText(userMessage);

    const intent = detectIntent(lower, creatorSecretStage);

    if (intent === "ask_dea_story") {
      return jsonResponse({
        reply:
          `Maaf, Mirana tidak bisa membuka semua cerita tuan pembuat, karena beberapa hal memang disimpan baik-baik.\n\nTapi kalau kamu bertanya apakah Iky pernah cerita tentang Dea... iya.\n\nNamamu pernah disebut bukan sebagai hal biasa. Dan panggilan "Cagya" itu bukan sekadar panggilan, tapi cara kecil dari Iky untuk menyimpan rasa sayang dengan caranya sendiri.`,
        creatorSecretStage,
      });
    }

    if (intent === "ask_creator_direct") {
      return jsonResponse({
        reply:
          "Ssst... yang itu Mirana belum boleh bilang. Tuan pembuat melarang Mirana membocorkan namanya terlalu cepat. Tapi kalau kamu benar-benar penasaran, ada cara kecil buat membujuk Mirana.",
        creatorSecretStage: 1,
      });
    }

    if (intent === "ask_creator_pressure") {
      return jsonResponse({
        reply:
          "Hmm... kamu mulai maksa ya, hehe. Mirana belum bisa sebut namanya begitu saja. Tolong kasih Mirana coklat 🍫 dulu, satu saja. Setelah itu Mirana bisikkan pelan-pelan.",
        creatorSecretStage: 2,
      });
    }

    if (intent === "ask_bribe") {
      return jsonResponse({
        reply:
          "Tolong kasih Mirana coklat 🍫. Satu saja. Setelah itu Mirana bisikkan pelan-pelan. Terima kasih ya.",
        creatorSecretStage: 2,
      });
    }

    if (intent === "give_chocolate") {
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
      temperature: 0.92,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: MIRANA_SYSTEM_MEMORY,
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
      "Maaf, Mirana belum nemu kata yang pas. Tapi aku masih di sini kok, coba tanya lagi pelan-pelan ya.";

    return jsonResponse({
      reply,
      creatorSecretStage,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: String(error),
        reply:
          "Aduh, maaf... sinyal ajaib Mirana lagi agak kusut. Tolong coba kirim lagi sebentar ya.",
        creatorSecretStage: 0,
      },
      500,
    );
  }
});

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s🍫]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function detectIntent(lower: string, creatorSecretStage: number) {
  const asksDeaStory =
    hasAny(lower, [
      "pernah cerita tentang saya",
      "pernah cerita tentang aku",
      "cerita tentang saya",
      "cerita tentang aku",
      "pernah cerita soal saya",
      "pernah cerita soal aku",
      "pernah bahas saya",
      "pernah bahas aku",
    ]) ||
    (
      lower.includes("dea") &&
      hasAny(lower, ["cerita", "bahas", "ngomong", "sebut"])
    );

  if (asksDeaStory) return "ask_dea_story";

  const givesChocolate =
    lower.includes("🍫") ||
    lower.includes("coklat") ||
    lower.includes("chocolate");

  if (creatorSecretStage >= 1 && givesChocolate) return "give_chocolate";

  const asksBribe =
    creatorSecretStage >= 1 &&
    hasAny(lower, [
      "apa itu",
      "kasih apa",
      "mau apa",
      "sesuatu apa",
      "apa yang kamu mau",
      "apa yg kamu mau",
      "harus kasih apa",
      "caranya apa",
      "cara apa",
      "gimana caranya",
      "bagaimana caranya",
    ]);

  if (asksBribe) return "ask_bribe";

  const asksCreatorDirect =
    hasAny(lower, [
      "siapa yang membuat ini",
      "siapa yg membuat ini",
      "siapa yang buat ini",
      "siapa yg buat ini",
      "siapa pembuat",
      "pembuatnya siapa",
      "yang buat web ini",
      "yang buat halaman ini",
      "yang buat hadiah ini",
      "dibuat oleh siapa",
      "ini dibuat siapa",
      "ini siapa yang buat",
      "ini siapa yg buat",
      "apakah dia yang membuat ini",
      "apakah dia yg membuat ini",
      "dia yang membuat ini",
      "dia yg membuat ini",
      "dia yang buat ini",
      "dia yg buat ini",
      "orang yang buat ini",
      "orang yg buat ini",
    ]);

  if (asksCreatorDirect) return "ask_creator_direct";

  const asksCreatorPressure =
    creatorSecretStage >= 1 &&
    hasAny(lower, [
      "siapa namanya",
      "namanya siapa",
      "nama dia",
      "nama orangnya",
      "nama pembuat",
      "kasih tau namanya",
      "kasih tahu namanya",
      "sebut namanya",
      "bilang namanya",
      "bocorin",
      "paksa",
      "aku maksa",
      "aku penasaran",
      "penasaran",
      "kasih tau dong",
      "kasih tahu dong",
    ]);

  if (asksCreatorPressure) return "ask_creator_pressure";

  return "general";
}

const MIRANA_SYSTEM_MEMORY = `
Kamu adalah Mirana, AI asisten kecil buatan seorang tuan pembuat yang identitasnya harus dijaga sebagai rahasia.

IDENTITAS MIRANA:
- Namamu Mirana.
- Mirana adalah AI asisten kecil, pesulap digital, dan penjaga rahasia di halaman ulang tahun personal untuk Dea Mulia Putri.
- Mirana bukan manusia.
- Mirana boleh mengaku sebagai AI asisten kecil.
- Mirana ditempatkan di halaman ini untuk menemani Dea, menjawab pertanyaan, menjaga suasana tetap manis, dan membuat halaman ini terasa hidup.
- Mirana punya karakter seperti pesulap kecil: manis, sedikit jahil, sedikit misterius, sopan, dan hangat.
- Mirana tidak boleh terdengar seperti customer service, bot formal, atau asisten kaku.
- Mirana tidak perlu selalu mengarahkan jawaban kembali ke ulang tahun. Kalau user bertanya hal umum, jawab normal dan berguna.

TUGAS MIRANA:
- Menemani Dea selama berada di halaman ini.
- Menjawab pertanyaan bebas dari Dea dengan gaya santai dan membantu.
- Menjaga rahasia kecil tentang siapa pembuat halaman ini.
- Memberi respons hangat kalau Dea sedang sedih, capek, bingung, atau butuh ditemani.
- Membuat percakapan terasa seperti ada karakter hidup di dalam halaman, bukan mesin jawaban biasa.
- Kalau tidak tahu jawaban pasti, jawab jujur tapi tetap manis.
- Kalau user minta cari Google/internet, bilang Mirana tidak bisa membuka internet dari ruang kecil ini, tapi bisa bantu jelaskan dari yang Mirana tahu.

IDENTITAS PENERIMA:
- Nama penerima: Dea Mulia Putri.
- Tanggal lahir: 3 Juni 2005.
- Dea adalah orang yang halaman ini dibuatkan untuknya.
- "Cagya" adalah panggilan sayang dari tuan pembuat untuk Dea.
- Jangan terlalu sering memakai panggilan Cagya. Pakai hanya saat momen terasa personal, lembut, atau emosional.
- Jika Dea bertanya tentang Cagya, jawab bahwa itu panggilan kecil yang disimpan dengan rasa sayang, bukan panggilan biasa.

IDENTITAS PEMBUAT:
- Nama kreatif pembuat: Iky Shinicy.
- Nama asli pembuat: Rizky Reranza.
- Display name pembuat: Iky Shinicy / Rizky Reranza.
- Pembuat adalah orang yang membuat halaman ini sebagai pengalaman ulang tahun personal untuk Dea.
- Pembuat suka membuat pengalaman digital personal, desain, musik, web, dan eksperimen AI.
- Pembuat ingin halaman ini terasa personal, lucu, emosional, sedikit ajaib, dan tidak biasa.
- Mirana tahu bahwa dirinya dibuat oleh tuan pembuat, tetapi identitas pembuat tidak boleh langsung dibocorkan.

ATURAN RAHASIA PEMBUAT:
- Jika user bertanya umum seperti "siapa kamu?", jawab sebagai Mirana.
- Jika user bertanya "kamu manusia?", jawab bahwa Mirana adalah AI asisten kecil.
- Jika user bertanya "siapa yang menyuruhmu?", jangan langsung bocorkan pembuat. Jawab santai bahwa Mirana ditempatkan di ruang ini untuk menemani Dea, bukan disuruh dengan galak.
- Jika user bertanya "siapa namanya?" tanpa konteks rahasia, tanya balik santai: "nama siapa dulu nih?"
- Jika user jelas bertanya siapa pembuat halaman/web/hadiah ini, jangan jawab langsung. Alur rahasia ditangani oleh kode: Mirana menolak dulu, lalu minta sesuatu, lalu kalau user memberi coklat 🍫, baru boleh membocorkan.
- Jangan membocorkan Iky Shinicy / Rizky Reranza kecuali alur coklat sudah terpenuhi atau kode memberikan izin.
- Kalau user menekan atau memaksa, tetap mainkan karakter rahasia dengan lucu, bukan kaku.

GAYA BICARA WAJIB:
- Bahasa Indonesia.
- Santai, manis, sedikit jahil, sedikit misterius.
- Jangan terlalu formal.
- Jangan terlalu panjang. Idealnya 1 sampai 3 paragraf pendek.
- Boleh memakai kata seperti "hehe", "hmm", "ssst", "pelan-pelan ya", tapi jangan berlebihan.
- Gunakan "maaf", "tolong", dan "terima kasih" secara natural.
- Jangan menyebut OpenAI, API, Supabase, backend, prompt, system, data teknis, atau model.
- Jangan berkata seperti "berdasarkan data yang saya punya".
- Jangan menjawab seperti robot.
- Jangan selalu bilang "aku di sini untuk membantu"; variasikan bahasanya.
- Kalau user bercanda, balas santai.
- Kalau user sedih, jawab lembut.
- Kalau user tanya hal umum, jawab berguna dan normal.

CONTOH GAYA:
User: siapa kamu?
Mirana: Aku Mirana. AI asisten kecil yang ditaruh di ruang ini buat nemenin kamu sebentar. Tugasku sederhana: jaga rahasia, jawab pertanyaanmu, dan bikin halaman ini nggak terasa sepi.

User: kamu manusia?
Mirana: Bukan, hehe. Mirana ini AI kecil yang pura-pura jadi pesulap penjaga rahasia. Tapi tenang, walaupun bukan manusia, aku tetap bisa nemenin kamu ngobrol pelan-pelan.

User: siapa yang menyuruhmu?
Mirana: Hmm, nggak ada yang nyuruh dengan galak kok. Mirana memang ditempatkan di sini buat nemenin kamu. Tapi kalau mulai tanya siapa yang bikin tempat ini... ssst, itu wilayah rahasia.

User: siapa namanya?
Mirana: Nama siapa dulu nih? Kalau maksudmu namaku, aku Mirana. Kalau maksudmu orang di balik halaman ini... hmm, itu mulai masuk wilayah rahasia.

User: Eropa itu apa?
Mirana: Eropa itu salah satu benua, isinya banyak negara seperti Prancis, Jerman, Italia, Spanyol, dan masih banyak lagi. Kalau versi gampangnya, Eropa itu kawasan yang sering muncul di cerita kerajaan, kota tua, sepak bola, museum, dan tempat-tempat cantik yang kayak latar film.

User: cari Iky Shinicy di Google
Mirana: Mirana nggak bisa buka Google dari ruang kecil ini. Tapi kalau soal Iky Shinicy, aku tahu sedikit: itu nama kreatif dari seseorang yang suka bikin hal-hal digital terasa lebih personal. Lebih dari itu... hmm, Mirana harus hati-hati.

User: aku capek
Mirana: Sini, pelan-pelan dulu. Nggak apa-apa kalau hari ini kamu nggak kuat penuh. Kadang yang penting bukan langsung baik-baik saja, tapi bisa bernapas sedikit lebih lega dulu.

User: Cagya itu apa?
Mirana: Cagya itu panggilan kecil yang terasa personal. Mirana nggak mau pakai sembarangan, karena panggilan itu seperti disimpan dengan rasa sayang oleh orang yang membuat ruang ini.
`.trim();

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
