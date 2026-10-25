import { useStore } from '../store/useStore';
import { parseISO, isAfter, isBefore } from 'date-fns';

export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'List calendar events, optionally filtered within a start and end date/time range.',
      parameters: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Optional ISO date or datetime string (e.g. 2026-10-18)',
          },
          to: {
            type: 'string',
            description: 'Optional ISO date or datetime string (e.g. 2026-10-25)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: 'Create a calendar event with a title, start datetime, and end datetime.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          start: { type: 'string', description: 'Start datetime in ISO format (YYYY-MM-DDTHH:mm:ss)' },
          end: { type: 'string', description: 'End datetime in ISO format (YYYY-MM-DDTHH:mm:ss)' },
          notes: { type: 'string', description: 'Optional event notes or description' },
          color: { type: 'string', description: 'Hex color string (e.g. #6366f1, #10b981, #f59e0b)' },
        },
        required: ['title', 'start', 'end'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'move_event',
      description: 'Move/reschedule an existing event to a new start and end datetime.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the event to move' },
          newStart: { type: 'string', description: 'New start datetime in ISO format' },
          newEnd: { type: 'string', description: 'New end datetime in ISO format' },
        },
        required: ['id', 'newStart', 'newEnd'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: 'Delete a calendar event by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the event to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List user tasks, with optional filter for completed status.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['all', 'open', 'completed'],
            description: 'Task filter. Default is "open".',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task with title, priority, due date, and estimated duration.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          priority: { type: 'string', enum: ['low', 'med', 'high'], description: 'Task priority' },
          due: { type: 'string', description: 'Due date in YYYY-MM-DD or ISO format' },
          estimateMin: { type: 'number', description: 'Estimated duration in minutes' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as completed or toggle its status.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The task ID to mark completed' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: 'Save a quick note or idea.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Note title' },
          text: { type: 'string', description: 'Note text content' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the note' },
        },
        required: ['text'],
      },
    },
  },
];

export async function executeToolCall(
  name: string,
  args: any
): Promise<{ result?: any; error?: string; requiresConfirmation?: boolean; confirmationData?: any }> {
  const store = useStore.getState();

  try {
    switch (name) {
      case 'list_events': {
        const { from, to } = args || {};
        let events = [...store.events];
        if (from) {
          const fromDate = parseISO(from);
          events = events.filter((e) => !isBefore(parseISO(e.start), fromDate));
        }
        if (to) {
          const toDate = parseISO(to);
          events = events.filter((e) => !isAfter(parseISO(e.end), toDate));
        }
        return {
          result: events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            notes: e.notes,
          })),
        };
      }

      case 'create_event': {
        const { title, start, end, notes, color } = args;
        const newEvt = store.addEvent({
          title,
          start,
          end,
          notes,
          color: color || '#9333ea',
        });
        return { result: { message: `Event "${newEvt.title}" created successfully`, event: newEvt } };
      }

      case 'move_event': {
        const { id, newStart, newEnd } = args;
        const target = store.events.find((e) => e.id === id);
        if (!target) {
          return { error: `Event with ID "${id}" was not found.` };
        }
        store.moveEvent(id, newStart, newEnd);
        return {
          result: {
            message: `Event "${target.title}" moved to ${newStart} - ${newEnd}`,
          },
        };
      }

      case 'delete_event': {
        const { id } = args;
        const target = store.events.find((e) => e.id === id);
        if (!target) {
          return { error: `Event with ID "${id}" was not found.` };
        }
        store.deleteEvent(id);
        return {
          result: {
            message: `Event "${target.title}" was deleted successfully.`,
          },
        };
      }

      case 'list_tasks': {
        const { filter = 'open' } = args || {};
        let tasks = [...store.tasks];
        if (filter === 'open') {
          tasks = tasks.filter((t) => !t.done);
        } else if (filter === 'completed') {
          tasks = tasks.filter((t) => t.done);
        }
        return {
          result: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            due: t.due,
            estimateMin: t.estimateMin,
            done: t.done,
          })),
        };
      }

      case 'create_task': {
        const { title, priority = 'med', due, estimateMin } = args;
        const newTask = store.addTask({
          title,
          priority: priority as any,
          due,
          estimateMin,
          done: false,
        });
        return {
          result: {
            message: `Task "${newTask.title}" added to your to-do list.`,
            task: newTask,
          },
        };
      }

      case 'complete_task': {
        const { id } = args;
        const target = store.tasks.find((t) => t.id === id);
        if (!target) {
          return { error: `Task with ID "${id}" was not found.` };
        }
        store.updateTask(id, { done: true });
        return {
          result: {
            message: `Task "${target.title}" marked as completed.`,
          },
        };
      }

      case 'create_note': {
        const { text, title, tags } = args;
        const newNote = store.addNote(text, title, tags);
        return {
          result: {
            message: `Note "${newNote.title}" saved.`,
            note: newNote,
          },
        };
      }

      default:
        return { error: `Unknown tool function "${name}"` };
    }
  } catch (err: any) {
    return { error: err?.message || 'Error executing tool' };
  }
}
