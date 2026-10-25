import React, { useState, useRef } from 'react';
import { Sparkles, Mic, MicOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { groqChat, groqTranscribe, GROQ_MODELS } from '../lib/groq';
import { getQuickAddPrompt } from '../lib/prompts';
import { quickAddSchema } from '../lib/schemas';
import { useStore } from '../store/useStore';
import { ConfirmCard } from './ConfirmCard';
import type { QuickAddResult } from '../types';

export const QuickAddBar: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingParsedData, setPendingParsedData] = useState<QuickAddResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const addEvent = useStore((s) => s.addEvent);
  const addTask = useStore((s) => s.addTask);
  const fastModel = useStore((s) => s.settings.fastModel) || GROQ_MODELS.FAST;

  const handleParseText = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await groqChat({
        model: fastModel,
        messages: [
          { role: 'system', content: getQuickAddPrompt() },
          { role: 'user', content: textToParse.trim() },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const rawJson = response.choices?.[0]?.message?.content;
      if (!rawJson) {
        throw new Error('No response received from Groq AI.');
      }

      const parsed = JSON.parse(rawJson);
      const validated = quickAddSchema.parse(parsed);

      setPendingParsedData(validated as QuickAddResult);
      setInput('');
    } catch (err: any) {
      console.error('Quick Add parse error:', err);
      setErrorMessage(err?.message || 'Failed to parse natural language input.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSave = (data: QuickAddResult) => {
    if (data.type === 'event') {
      const now = new Date();
      const defaultStart = now.toISOString();
      const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      addEvent({
        title: data.title,
        start: data.start || defaultStart,
        end: data.end || defaultEnd,
        notes: data.notes,
        color: '#9333ea',
      });
    } else {
      addTask({
        title: data.title,
        priority: data.priority || 'med',
        due: data.due,
        estimateMin: data.estimateMin || 30,
        done: false,
      });
    }
    setPendingParsedData(null);
  };

  // Voice recording logic with Groq Whisper
  const handleToggleVoice = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setErrorMessage(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());

          if (audioBlob.size > 0) {
            setIsLoading(true);
            try {
              const transcribedText = await groqTranscribe(audioBlob);
              if (transcribedText.trim()) {
                setInput(transcribedText);
                await handleParseText(transcribedText);
              } else {
                setErrorMessage('No speech detected in audio.');
              }
            } catch (err: any) {
              setErrorMessage(err?.message || 'Voice transcription failed.');
            } finally {
              setIsLoading(false);
            }
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error('Microphone access error:', err);
        setErrorMessage('Could not access microphone. Please grant permission.');
      }
    }
  };

  return (
    <>
      <div className="w-full relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleParseText(input);
          }}
          className="relative flex items-center"
        >
          <div className="absolute left-4 flex items-center gap-1.5 text-indigo-400 pointer-events-none">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isRecording}
            placeholder={
              isRecording
                ? 'Listening... Click mic to stop and parse...'
                : 'AI Quick Add: "Dentist next Tuesday 4pm for an hour" or "High priority task to review PR by tomorrow"'
            }
            className={`w-full py-3.5 pl-11 pr-24 rounded-2xl glass-panel text-slate-100 placeholder-slate-400 text-sm border shadow-lg transition-all focus:outline-none ${
              isRecording
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-slate-700/60 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {/* Voice Add button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isLoading}
              title={isRecording ? 'Stop recording' : 'Voice add (Groq Whisper)'}
              className={`p-2 rounded-xl transition ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isRecording}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition shadow-md shadow-indigo-600/30"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/60 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {pendingParsedData && (
        <ConfirmCard
          initialData={pendingParsedData}
          onConfirm={handleConfirmSave}
          onCancel={() => setPendingParsedData(null)}
        />
      )}
    </>
  );
};
