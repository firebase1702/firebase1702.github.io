import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: In a real production app, ensure the API key is handled securely via backend proxy if possible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Analyzes a shift report for potential risks, clarity, and suggests improvements.
 */
export const analyzeShiftReport = async (notes: string, machineId: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key not configured.";

  try {
    const prompt = `
      Anda adalah asisten AI untuk operator pabrik industri.
      Analisa catatan laporan shift berikut untuk Mesin ${machineId}.
      
      Catatan: "${notes}"
      
      Tugas:
      1. Identifikasi apakah ada risiko keamanan atau operasional.
      2. Berikan ringkasan singkat (maksimal 2 kalimat).
      3. Jika ada masalah, sarankan tindakan perbaikan sederhana.
      
      Format output dalam HTML sederhana (gunakan <b>, <ul>, <li>, <p> saja).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Tidak ada analisa yang dihasilkan.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Gagal menghubungkan ke layanan AI. Silakan coba lagi nanti.";
  }
};

/**
 * Chat with SOP Knowledge Base (Simulated Context)
 */
export const askSOPAssistant = async (question: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key not configured.";

  try {
    const systemContext = `
      Anda adalah Ahli SOP (Standard Operating Procedure) Pabrik Pintar.
      Jawab pertanyaan operator dengan singkat, tegas, dan mengutamakan keselamatan kerja (K3).
      Gunakan Bahasa Indonesia yang formal namun mudah dipahami.
      
      Konteks Umum:
      - Jika mesin overheat, matikan segera dan lapor supervisor.
      - APD (Alat Pelindung Diri) wajib dipakai di zona merah.
      - Prosedur startup mesin: Cek kelistrikan -> Cek hidrolik -> Nyalakan panel utama -> Warming up 5 menit.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: question,
      config: {
        systemInstruction: systemContext,
      }
    });

    return response.text || "Maaf, saya tidak mengerti pertanyaan tersebut.";
  } catch (error) {
    console.error("Gemini SOP Error:", error);
    return "Terjadi kesalahan saat memproses pertanyaan.";
  }
};