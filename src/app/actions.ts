"use server";

import { env } from "~/env";
import type { AnalyzeResult, ApiResponse } from "~/lib/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function analyzeAudio(formData: FormData): Promise<AnalyzeResult> {
  const file = formData.get("audio");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No audio file was provided." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "The file is too large. The limit is 20 MB." };
  }

  try {
    const audio_b64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (env.MODAL_KEY && env.MODAL_SECRET) {
      headers["Modal-Key"] = env.MODAL_KEY;
      headers["Modal-Secret"] = env.MODAL_SECRET;
    }

    const response = await fetch(env.INFERENCE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ audio_data: audio_b64 }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Inference API error", response.status, detail);
      return {
        ok: false,
        error: `The analysis service returned ${response.status} ${response.statusText}. Make sure the file is a valid audio file (WAV works best).`,
      };
    }

    const data = (await response.json()) as ApiResponse;
    return { ok: true, data };
  } catch (err) {
    console.error("Failed to analyze audio", err);
    return {
      ok: false,
      error: "Could not reach the analysis service. Please try again.",
    };
  }
}
