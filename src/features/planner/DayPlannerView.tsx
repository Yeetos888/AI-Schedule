import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
  Layers,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { groqChat, GROQ_MODELS } from '../../lib/groq';
import { getDayPlannerPrompt, getWeeklySummaryPrompt } from '../../lib/prompts';
import { dayPlannerSchema, weeklySummarySchema } from '../../lib/schemas';
import {
  hasOverlap,
  isWithinWorkingHours,
  formatTime,
  getTodayIsoDate,
} from '../../lib/dateUtils';
import confetti from 'canvas-confetti';
import type { TimeBlockProposal } from '../../types';

export const DayPlannerView: React.FC = () => {
  const events = useStore((s) => s.events);
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const settings = useStore((s) => s.settings);
  const addEvent = useStore((s) => s.addEvent);
  const latestDayPlan = useStore((s) => s.latestDayPlan);
  const setLatestDayPlan = useStore((s) => s.setLatestDayPlan);
  const latestWeeklySummary = useStore((s) => s.latestWeeklySummary);
  const setLatestWeeklySummary = useStore((s) => s.setLatestWeeklySummary);
  const smartModel = settings.smartModel || GROQ_MODELS.SMART;

  const [isPlanning, setIsPlanning] = useState(false);
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<TimeBlockProposal[]>(latestDayPlan?.schedule || []);
  const [aiSummary, setAiSummary] = useState<string | null>(latestDayPlan?.summary || null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(latestDayPlan?.advice || null);

  // Weekly summary state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [weeklyBrief, setWeeklyBrief] = useState<any | null>(latestWeeklySummary || null);

  const todayStr = getTodayIsoDate();
  const todayEvents = events.filter((e) => e.start.startsWith(todayStr));
  const openTasks = tasks.filter((t) => !t.done);

  const handleGenerateDayPlan = async () => {
    if (openTasks.length === 0) {
      setPlannerError('You have no open tasks to schedule. Create some tasks first!');
      return;
    }

    setIsPlanning(true);
    setPlannerError(null);
    setProposals([]);

    try {
      const prompt = getDayPlannerPrompt(
        openTasks,
        todayEvents,
        settings.workingHoursStart,
        settings.workingHoursEnd
      );

      const response = await groqChat({
        model: smartModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const rawJson = response.choices?.[0]?.message?.content;
      if (!rawJson) throw new Error('No schedule returned by Groq AI.');

      const parsed = JSON.parse(rawJson);
      const validated = dayPlannerSchema.parse(parsed);

      // Validate proposals against overlaps, unknown tasks, working hours
      const verifiedProposals: TimeBlockProposal[] = [];

      for (const item of validated.schedule) {
        const matchedTask = tasks.find((t) => t.id === item.taskId);
        if (!matchedTask) continue; // Skip unknown task IDs

        // Check if overlaps with existing calendar events
        let hasConflict = false;
        for (const evt of todayEvents) {
          if (hasOverlap(item.start, item.end, evt.start, evt.end)) {
            hasConflict = true;
            break;
          }
        }

        // Check working hours
        const withinHours = isWithinWorkingHours(
          item.start,
          item.end,
          settings.workingHoursStart,
          settings.workingHoursEnd
        );

        verifiedProposals.push({
          taskId: matchedTask.id,
          taskTitle: matchedTask.title,
          start: item.start,
          end: item.end,
          accepted: !hasConflict && withinHours,
        });
      }

      setProposals(verifiedProposals);
      const summ = validated.summary || 'Optimal schedule created for your focus tasks.';
      const adv = validated.advice || 'Group high-cognitive load items before lunch.';
      setAiSummary(summ);
      setAiAdvice(adv);
      setLatestDayPlan({
        schedule: verifiedProposals,
        summary: summ,
        advice: adv,
        date: todayStr,
      });
    } catch (err: any) {
      console.error('Day Planner error:', err);
      setPlannerError(err?.message || 'Failed to generate day plan.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleAcceptAllToCalendar = () => {
    const acceptedList = proposals.filter((p) => p.accepted);
    if (acceptedList.length === 0) return;

    for (const item of acceptedList) {
      addEvent({
        title: `[Focus] ${item.taskTitle}`,
        start: item.start,
        end: item.end,
        color: '#8b5cf6',
        notes: `Time-blocked by AI Schedule for task: ${item.taskTitle}`,
      });
    }

    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setProposals([]);
    setLatestDayPlan(null);
    setAiSummary('All accepted time-blocks were synced to your calendar!');
  };

  const handleGenerateWeeklySummary = async () => {
    setIsSummarizing(true);
    setPlannerError(null);
    try {
      const prompt = getWeeklySummaryPrompt(events, tasks, habits);
      const response = await groqChat({
        model: smartModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const rawJson = response.choices?.[0]?.message?.content;
      if (!rawJson) throw new Error('No response from AI.');

      const parsed = JSON.parse(rawJson);
      const validated = weeklySummarySchema.parse(parsed);
      setWeeklyBrief(validated);
      setLatestWeeklySummary(validated);
    } catch (err: any) {
      console.error('Weekly summary error:', err);
      setPlannerError(err?.message || 'Failed to generate weekly summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> AI Day Planner & Weekly Brief
          </h2>
          <p className="text-xs text-slate-400">
            Intelligently time-block your day around existing events and working hours
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateWeeklySummary}
            disabled={isSummarizing || isPlanning}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition disabled:opacity-50"
          >
            {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />}
            Weekly Brief
          </button>

          <button
            onClick={handleGenerateDayPlan}
            disabled={isPlanning || isSummarizing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Plan Today's Schedule
          </button>
        </div>
      </div>

      {plannerError && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{plannerError}</span>
        </div>
      )}

      {/* Weekly Executive Brief Card */}
      {weeklyBrief && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 text-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 7-Day Executive Brief
            </span>
            <button
              onClick={() => {
                setWeeklyBrief(null);
                setLatestWeeklySummary(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Dismiss
            </button>
          </div>

          <h3 className="text-lg font-bold text-white">{weeklyBrief.headline}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Top Priorities
              </h4>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {weeklyBrief.keyPriorities.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Workload Assessment
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {weeklyBrief.workloadAssessment}
              </p>

              {weeklyBrief.overdueWarnings?.length > 0 && (
                <div className="mt-3 text-xs text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-900/50">
                  <span className="font-semibold">Urgent: </span>
                  {weeklyBrief.overdueWarnings.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan summary & advice */}
      {aiSummary && (
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1">
            Day Schedule Blueprint
          </h4>
          <p className="text-sm text-slate-200">{aiSummary}</p>
          {aiAdvice && (
            <p className="text-xs text-indigo-300 mt-2 font-medium">💡 Tip: {aiAdvice}</p>
          )}
        </div>
      )}

      {/* Proposals List */}
      {proposals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Proposed Time Blocks ({proposals.filter((p) => p.accepted).length} of {proposals.length} scheduled)
            </h3>
            <button
              onClick={handleAcceptAllToCalendar}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition"
            >
              <FileCheck className="w-4 h-4" /> Accept & Sync to Calendar
            </button>
          </div>

          <div className="space-y-2">
            {proposals.map((item, idx) => (
              <div
                key={idx}
                className={`glass-card p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  item.accepted ? 'border-purple-500/40 bg-purple-950/10' : 'border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setProposals(
                        proposals.map((p, i) => (i === idx ? { ...p, accepted: !p.accepted } : p))
                      );
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      item.accepted
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-slate-600 text-transparent'
                    }`}
                  >
                    ✓
                  </button>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{item.taskTitle}</h4>
                    <div className="flex items-center gap-2 text-xs text-indigo-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {formatTime(item.start)} - {formatTime(item.end)}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.accepted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.accepted ? 'Ready to Block' : 'Excluded'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context overview: Today's fixed commitments */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" /> Fixed Events Today ({todayEvents.length})
        </h3>
        {todayEvents.length === 0 ? (
          <p className="text-xs text-slate-400">No fixed calendar events today. Full day open for focus blocks!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {todayEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
              >
                <p className="font-semibold text-slate-200 truncate">{evt.title}</p>
                <p className="text-slate-400 mt-1">
                  {formatTime(evt.start)} - {formatTime(evt.end)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
