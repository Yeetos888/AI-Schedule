import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { groqChat, GROQ_MODELS } from '../../lib/groq';
import { getChatSystemPrompt } from '../../lib/prompts';
import { AI_TOOLS, executeToolCall } from '../../lib/tools';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import type { ChatMessage } from '../../types';

export const ChatAssistantView: React.FC = () => {
  const settings = useStore((s) => s.settings);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const moveEvent = useStore((s) => s.moveEvent);
  const deleteTask = useStore((s) => s.deleteTask);
  const messages = useStore((s) => s.chatMessages);
  const setMessages = useStore((s) => s.setChatMessages);
  const clearChatMessages = useStore((s) => s.clearChatMessages);
  const smartModel = settings.smartModel || GROQ_MODELS.SMART;

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsProcessing(true);

    try {
      // Build conversation history for Groq
      let conversationHistory: any[] = [
        { role: 'system', content: getChatSystemPrompt() },
        ...newMessages.map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'tool',
              tool_call_id: m.tool_call_id,
              name: m.name,
              content: m.content,
            };
          }
          if (m.tool_calls) {
            return {
              role: 'assistant',
              content: m.content || '',
              tool_calls: m.tool_calls,
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        }),
      ];

      // Tool execution loop (capped at 5 iterations)
      let loopCount = 0;
      const MAX_LOOPS = 5;

      while (loopCount < MAX_LOOPS) {
        loopCount++;

        const response = await groqChat({
          model: smartModel,
          messages: conversationHistory,
          tools: AI_TOOLS,
          tool_choice: 'auto',
          temperature: 0.3,
        });

        const choice = response.choices?.[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          throw new Error('No response message returned from Groq.');
        }

        // If tool calls were made
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          // Check for destructive actions before auto-executing
          let hasPendingConfirmation = false;
          let confirmationPayload: any = null;

          for (const tc of assistantMessage.tool_calls) {
            const fnName = tc.function.name;
            const args = JSON.parse(tc.function.arguments || '{}');

            if (fnName === 'delete_event' || fnName === 'move_event' || fnName === 'delete_task') {
              hasPendingConfirmation = true;
              confirmationPayload = {
                actionType: fnName,
                targetId: args.id,
                details:
                  fnName === 'delete_event'
                    ? `Delete event with ID "${args.id}"`
                    : fnName === 'move_event'
                    ? `Move event to ${args.newStart} - ${args.newEnd}`
                    : `Delete task with ID "${args.id}"`,
                payload: args,
              };
              break;
            }
          }

          if (hasPendingConfirmation) {
            // Stop loop and ask user for confirmation in the UI
            const confirmMsg: ChatMessage = {
              id: `asst-${Date.now()}`,
              role: 'assistant',
              content:
                assistantMessage.content ||
                'This action modifies or removes existing items. Please confirm below to proceed:',
              pendingConfirmation: confirmationPayload,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, confirmMsg]);
            break;
          }

          // Execute non-destructive tools
          const toolResults: any[] = [];
          for (const tc of assistantMessage.tool_calls) {
            const fnName = tc.function.name;
            const args = JSON.parse(tc.function.arguments || '{}');
            const execution = await executeToolCall(fnName, args);

            toolResults.push({
              tool_call_id: tc.id,
              name: fnName,
              content: JSON.stringify(execution.result || { error: execution.error }),
            });
          }

          // Append assistant response and tool outputs to history
          conversationHistory.push(assistantMessage);
          for (const tr of toolResults) {
            conversationHistory.push({
              role: 'tool',
              tool_call_id: tr.tool_call_id,
              name: tr.name,
              content: tr.content,
            });
          }

          // Continue loop to let Groq generate the natural response
          continue;
        }

        // Plain text assistant reply received
        const finalMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: assistantMessage.content || 'Action executed successfully.',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, finalMsg]);
        break;
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err?.message || 'Failed to communicate with Groq AI.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = (msgId: string, actionData: any) => {
    const { actionType, targetId, payload } = actionData;

    if (actionType === 'delete_event') {
      deleteEvent(targetId);
    } else if (actionType === 'move_event') {
      moveEvent(targetId, payload.newStart, payload.newEnd);
    } else if (actionType === 'delete_task') {
      deleteTask(targetId);
    }

    // Clear confirmation on message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              content: `${m.content}\n\n✓ Action confirmed and executed.`,
              pendingConfirmation: undefined,
            }
          : m
      )
    );
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              content: `${m.content}\n\n✕ Action was cancelled.`,
              pendingConfirmation: undefined,
            }
          : m
      )
    );
  };

  const quickPrompts = [
    "What's free on my calendar today?",
    'List all my high priority tasks',
    'Add a task: Review Q3 metrics by Friday with high priority',
    'Schedule a 30m team check-in tomorrow at 10am',
  ];

  return (
    <div className="flex flex-col h-[75vh] glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Groq AI Assistant
              <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Tool Calling Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Direct access to calendar, tasks, and scheduling store
            </p>
          </div>
        </div>

        <button
          onClick={clearChatMessages}
          className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'glass-card text-slate-200 border border-slate-800'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {/* Destructive Action Confirmation Card */}
                {msg.pendingConfirmation && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Destructive Action Confirmation</span>
                    </div>
                    <p className="text-slate-300">{msg.pendingConfirmation.details}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          handleConfirmAction(msg.id, msg.pendingConfirmation)
                        }
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow transition"
                      >
                        Confirm & Execute
                      </button>
                      <button
                        onClick={() => handleCancelAction(msg.id)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Checking planner state & formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp)}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] whitespace-nowrap border border-slate-700/60 transition shrink-0"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask AI assistant to list events, create tasks, move meetings, or plan your day..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
