import { useStore } from '../store/useStore';

const CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export const GROQ_MODELS = {
  FAST: 'openai/gpt-oss-20b',
  SMART: 'openai/gpt-oss-120b',
  WHISPER: 'openai/whisper-large-v3',
};

export function getGroqApiKey(): string {
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  if (envKey && envKey.trim().length > 0 && !envKey.includes('your_key_here')) {
    return envKey.trim();
  }
  const storeKey = useStore.getState().settings.groqApiKey;
  if (storeKey && storeKey.trim().length > 0) {
    return storeKey.trim();
  }
  return '';
}

export async function groqChat(body: Record<string, any>, retries = 3): Promise<any> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API Key is not configured. Please set VITE_GROQ_API_KEY in .env or enter it in Settings.');
  }

  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const delay = 1000 * Math.pow(2, i);
        console.warn(`Groq 429 Rate Limit encountered. Retrying in ${delay}ms (attempt ${i + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (err: any) {
      lastError = err;
      if (i < retries - 1 && err.message?.includes('429')) {
        continue;
      }
      if (i === retries - 1) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Request to Groq timed out or rate limited. Please try again shortly.');
}

export async function groqTranscribe(audioBlob: Blob): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API Key is not configured. Please set VITE_GROQ_API_KEY in .env or enter it in Settings.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', GROQ_MODELS.WHISPER);
  formData.append('temperature', '0');
  formData.append('response_format', 'json');

  const res = await fetch(AUDIO_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq Whisper transcription failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.text || '';
}
