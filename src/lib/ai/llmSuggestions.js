// src/lib/ai/llmSuggestions.js
// Optional hybrid LLM suggestions layer (only enriches advice if VITE_LLM_API_KEY is present)

export async function fetchLlmSuggestions(idea, weakOrMissingKeys) {
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  if (!apiKey || !weakOrMissingKeys || weakOrMissingKeys.length === 0) {
    return null;
  }

  const baseUrl = import.meta.env.VITE_LLM_BASE_URL || "https://api.openai.com/v1";
  const model = import.meta.env.VITE_LLM_MODEL || "gpt-4o-mini";

  const subset = {};
  for (const k of weakOrMissingKeys) {
    subset[k] = idea.sections?.[k] || "";
  }

  const prompt = `Startup idea sections (JSON). For each weak/missing section give ONE concrete improvement sentence. Do not assess success probability. Max 120 words total.
Sections: ${JSON.stringify(subset)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a pragmatic startup advisor assisting early-stage founders." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 250
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn("LLM suggestion request failed with status:", res.status);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn("LLM suggestions could not be fetched (fallback to rule tips):", err.message);
    return null;
  }
}
