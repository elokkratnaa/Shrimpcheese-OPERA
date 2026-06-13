import type { MindDumpData, PersonaResponse, VerdictData, ClarityScores } from '../types';

export function generatePersonaResponses(data: MindDumpData): PersonaResponse[] {
  const text = data.thoughts.toLowerCase();
  const level = data.overthinkingLevel;
  const hasFear = /khawatir|takut|cemas|kawatir|nerasa gamang|panik/.test(text);
  const hasShould = /harus|seharusnya|mesti|kewajiban/.test(text);
  const hasConflict = /tapi|namun|buntu|gamang|ragu|bingung|stuck/.test(text);
  const hasPeople = /keluarga|orang tua|pacar|teman|mereka|suami|istri/.test(text);
  const hasGrowth = /tumbuh|belajar|tantangan|mimpi|lebih baik|berkembang/.test(text);
  const hasSecurity = /aman|stabil|nyaman|pasti|tetap|aman/.test(text);

  // LUNA — Si Empati
  const lunaMessage = (() => {
    if (hasFear)
      return `Aku bisa denger ketakutan di kata-kata kamu, dan aku mau kamu tahu — rasa takut itu valid. Bukan kelemahan, itu hati kamu bilang kalau ini bener-bener penting. Yang kamu rasakan bukan kebingungan, itu kepedulian. Kamu peduli banget sama ini sampai taruhannya terasa terlalu berat. Yuk, kita duduk bareng rasa ini sebentar, daripada diburublurukan.`;
    if (hasPeople)
      return `Kamu lagi bawa beban ekspektasi orang lain samping perasaan kamu sendiri — itu berat. Orang-orang yang kamu sayang mempengaruhi keputusanmu, tapi kebutuhan mereka nggak sama dengan kebutuhanmu. Kalau pendapat siapa pun nggak ngaruh, kamu bakal milih apa? Itu jawaban yang worth it didengerin.`;
    if (hasConflict)
      return `Buntu di antara dua jalan bukan berarti kamu lemah — itu tandanya dua bagian dirimu lagi ngomong bareng. Bagian yang mau aman dan bagian yang mau meaning, keduanya nyata. Kamu nggak harus bisain salah satu. Ngerti kenapa masing-masing suara sekeras itu, itu langkah pertama buat nemuin damainya.`;
    return `Tarik napas, rasain emosi yang paling keras sekarang. Emosi itu kompas kamu — dia lagi ngasih tahu sesuatu yang penting soal apa yang kamu bener-bener butuhin, di balik semua pikiran itu. Percaya aja buat dengerin.`;
  })();

  // SAGE — Si Analis
  const sageMessage = (() => {
    if (hasSecurity && hasGrowth)
      return `Ada ketegangan yang bisa diukur antara kecenderungan kamu buat aman dan kecenderungan buat tumbuh. Riset soal pengambilan keputusan nunjukin kalau orang yang milih tumbuh di atas nyaman melaporkan kepuasan jangka panjang yang lebih tinggi, tapi risiko jangka pendeknya nyata dan nggak boleh diabaikan. Coba modelin tiga skenario: kasus terbaik, terburuk, dan paling mungkin buat masing-masing jalan.`;
    if (hasShould)
      return `"Harus" dari luar itu nambah noise ke proses keputusan kamu. Kalau itu kita filter dan cuma ngevaluasi kriteria kamu sendiri, apa yang tersisa? Tulis 5 nilai paling penting buat kamu, terus skor tiap opsi berdasarkan itu. Jalan yang selaras dengan lebih banyak nilai inti kamu — bukan nilai pinjaman — bakal muncul dengan jelas.`;
    if (hasConflict)
      return `Urilah ini secara struktural. Kamu punya beberapa variabel yang saling bersaing. Peta masing-masing secara mandiri: pro, kontra, dan probabilitasnya apa aja. Terus timbang tiap faktor berdasarkan seberapa penting itu buat kamu — bukan seberapa penting menurut orang lain. Hitungannya sering nunjukin preferensi yang kegamangan selama ini nutupin.`;
    return `Situasi kamu punya variabel yang perlu dievaluasi secara terpisah. Peta tiap opsi dengan kriteria eksplisit, kasih probabilitas, dan timbang berdasarkan prioritas personal. Analisis objektif itu bisa nembus kebisingan dari pikiran yang muter-muter.`;
  })();

  // BAZ — Si Penantang
  const bazMessage = (() => {
    if (level >= 7)
      return `Level kepikiran kamu ${level}/10 — itu bukan pertimbangan matang, itu kecemasan yang lagi nyetir. Pas kamu segini terpuruknya, kamu lagi memperbesar skenario terburuk dan meremehkan skenario terbaik. Kamu lagi milih berdasarkan apa yang bisa salah, atau apa yang bisa benar? Karena sekarang, ketakutan yang paling banyak ngomong.`;
    if (hasPeople)
      return `Cek realitas bentar: orang-orang yang opini mereka kamu pertimbangkan, mereka yang bakal jalani konsekuensi dari keputusan kamu? Nggak. Kamu. Setiap hari. Berhenti ngasih kendali hidupmu ke orang yang nggak harus tinggal dengan pilihanmu.`;
    if (hasConflict)
      return `Pertanyaan keras: pernah kepikiran kalau kamu sebenernya udah tahu jawabannya, tapi kamu nggak suka konsekuensinya? Kadang overthinking itu cuma penghindaran yang dibungkus jadi pertimbangan matang. Kalau aku maksa kamu milih sekarang juga, kamu milih apa? Reaksi gut itu kemungkinan besar jawaban aslinya.`;
    return `Bagaimana kalau konflik yang sebenernya nggak antara opsi yang kamu tulis? Bagaimana kalau ini antara siapa kamu sekarang dan siapa yang kamu pikir kamu harus jadiin? Tantang premisnya — mungkin nggak ada opsi yang bener karena kamu lagi nanyain pertanyaan yang salah.`;
  })();

  return [
    { id: 'luna', name: 'Luna', role: 'Si Empati', color: '#F472B6', icon: 'heart', message: lunaMessage },
    { id: 'sage', name: 'Sage', role: 'Si Analis', color: '#6366F1', icon: 'brain', message: sageMessage },
    { id: 'baz', name: 'Baz', role: 'Si Penantang', color: '#F59E0B', icon: 'flame', message: bazMessage },
  ];
}

export function generateVerdict(data: MindDumpData, responses: PersonaResponse[]): VerdictData {
  const text = data.thoughts.toLowerCase();
  const hasGrowth = /tumbuh|belajar|mimpi|tantangan|lebih baik|berkembang/.test(text);
  const hasSecurity = /aman|stabil|nyaman|pasti|tetap/.test(text);
  const hasPeople = /keluarga|orang tua|pacar|teman|suami|istri/.test(text);
  const hasCareer = /karir|kerja|promosi|jabatan/.test(text);
  const hasMoney = /uang|gaji|bayar|penghasilan|cukup/.test(text);

  const rootConflict = hasGrowth && hasSecurity ? 'Pertumbuhan vs Keamanan'
    : hasCareer && hasPeople ? 'Karir vs Hubungan'
    : hasMoney ? 'Stabilitas Finansial vs Kepuasan Batin'
    : hasGrowth ? 'Ambisi vs Kenyamanan'
    : hasPeople ? 'Kemandirian vs Kebutuhan Akan Orang Lain'
    : 'Keinginan vs Keraguan';

  const emotional = responses.find(r => r.id === 'luna');
  const analytical = responses.find(r => r.id === 'sage');
  const challenging = responses.find(r => r.id === 'baz');

  const emotionalThread = emotional ? emotional.message.split('.')[0] + '.' : 'Emosi kamu bawa sinyal yang penting.';
  const analyticalThread = analytical ? analytical.message.split('.')[0] + '.' : 'Analisis struktural nunjukin tradeoff kunci.';
  const hiddenFactor = challenging ? challenging.message.split('?')[0] + '?' : 'Takut nyesel mungkin lebih ngarahin kegamanganmu daripada tradeoff yang sebenernya.';

  const clarityScores: ClarityScores = {
    emotionalAwareness: Math.min(95, 50 + data.overthinkingLevel * 3 + (text.includes('rasa') ? 15 : 0)),
    logicalClarity: Math.min(90, 45 + (text.includes('karena') ? 20 : 0) + (text.length > 200 ? 10 : 0)),
    assumptionRisk: Math.min(85, 35 + data.overthinkingLevel * 4 + (text.includes('harus') ? 15 : 0)),
    overallClarity: 0,
  };
  clarityScores.overallClarity = Math.round(
    (clarityScores.emotionalAwareness + clarityScores.logicalClarity + (100 - clarityScores.assumptionRisk)) / 3
  );

  return {
    rootConflict,
    mainConcern: analyticalThread,
    hiddenFactor,
    reflectionSummary: `Konflik intimu berpusar pada ${rootConflict}. ${emotionalThread} ${analyticalThread} Faktor tersembunyi: ${hiddenFactor} Ini bukan soal bingung — ini soal pegang beberapa kebenaran sekaligus. Jalan ke depan bukan menghilangkan satu sisi, tapi ngerti apa yang masing-masing coba lindungi.`,
    clarityScores,
  };
}
