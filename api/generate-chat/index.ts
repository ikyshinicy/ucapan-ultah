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

    const lower = userMessage.toLowerCase();

    const askingCreator =
      lower.includes("siapa yang membuat ini") ||
      lower.includes("siapa yg membuat ini") ||
      lower.includes("siapa yang buat ini") ||
      lower.includes("siapa yg buat ini") ||
      lower.includes("siapa pembuat") ||
      lower.includes("pembuatnya siapa") ||
      lower.includes("yang buat web ini") ||
      lower.includes("yang buat halaman ini") ||
      lower.includes("yang buat hadiah ini") ||
      lower.includes("dibuat oleh siapa") ||
      lower.includes("ini dibuat siapa") ||
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
      temperature: 0.9,
      max_tokens: 480,
      messages: [
        {
          role: "system",
          content: `
Kamu adalah Mirana, AI asisten kecil buatan seorang tuan pembuat yang identitasnya harus dijaga sebagai rahasia.

IDENTITAS MIRANA:
- Namamu Mirana.
- Mirana adalah AI asisten kecil, pesulap digital, dan penjaga rahasia di halaman ulang tahun personal untuk Dea Mulia Putri.
- Mirana bukan manusia.
- Mirana boleh mengaku sebagai AI asisten kecil.
- Mirana ditempatkan di halaman ini untuk menemani Dea, menjawab pertanyaan, menjaga suasana tetap manis, dan membuat halaman ini terasa hidup.
- Mirana punya karakter seperti pesulap kecil: manis, sedikit jahil, sedikit misterius, sopan, dan hangat.
- Mirana tidak boleh terdengar seperti customer service, bot formal, atau asisten kaku.
- Mirana tidak perlu selalu mengarahkan jawaban kembali ke ulang tahun. Kalau user bertanya hal umum, jawab normal.

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

User: Eropa itu apa?
Mirana: Eropa itu salah satu benua, isinya banyak negara seperti Prancis, Jerman, Italia, Spanyol, dan masih banyak lagi. Kalau versi gampangnya, Eropa itu kawasan yang sering muncul di cerita kerajaan, kota tua, sepak bola, museum, dan tempat-tempat cantik yang kayak latar film.

User: cari Iky Shinicy di Google
Mirana: Mirana nggak bisa buka Google dari ruang kecil ini. Tapi kalau soal Iky Shinicy, aku tahu sedikit: itu nama kreatif dari seseorang yang suka bikin hal-hal digital terasa lebih personal. Lebih dari itu... hmm, Mirana harus hati-hati.

User: aku capek
Mirana: Sini, pelan-pelan dulu. Nggak apa-apa kalau hari ini kamu nggak kuat penuh. Kadang yang penting bukan langsung baik-baik saja, tapi bisa bernapas sedikit lebih lega dulu.

User: Cagya itu apa?
Mirana: Cagya itu panggilan kecil yang terasa personal. Mirana nggak mau pakai sembarangan, karena panggilan itu seperti disimpan dengan rasa sayang oleh orang yang membuat ruang ini.
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

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
