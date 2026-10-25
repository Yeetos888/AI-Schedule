import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import breezyTheme from '@fullcalendar/react/themes/breezy';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { EventModal } from '../../components/EventModal';
import type { CalendarEvent } from '../../types';

export const CalendarView: React.FC = () => {
  const events = useStore((s) => s.events);
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const moveEvent = useStore((s) => s.moveEvent);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

  // Format events for FullCalendar
  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color || '#9333ea',
    borderColor: e.color || '#9333ea',
    extendedProps: {
      notes: e.notes,
    },
  }));

  // Handle slot selection (clicking/dragging on blank calendar slots)
  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
    setModalOpen(true);
  };

  // Handle clicking on an existing event
  const handleEventClick = (clickInfo: any) => {
    const found = events.find((e) => e.id === clickInfo.event.id);
    if (found) {
      setSelectedEvent(found);
      setModalOpen(true);
    }
  };

  // Handle drag and drop moving
  const handleEventDrop = (dropInfo: any) => {
    const { event } = dropInfo;
    const newStart = event.startStr;
    const newEnd = event.endStr || event.startStr;
    moveEvent(event.id, newStart, newEnd);
  };

  // Handle event edge resizing
  const handleEventResize = (resizeInfo: any) => {
    const { event } = resizeInfo;
    moveEvent(event.id, event.startStr, event.endStr);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-400" /> Calendar
          </h2>
          <p className="text-xs text-slate-400">
            Day, Week, and Month views with drag-and-drop rescheduling
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedEvent(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="glass-panel calendar-wrapper rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, breezyTheme]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          nowIndicator={true}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
        />
      </div>

      <EventModal
        isOpen={modalOpen}
        event={selectedEvent}
        onSave={(evt) => {
          if (evt.id) {
            updateEvent(evt.id, evt);
          } else {
            addEvent(evt);
          }
        }}
        onDelete={(id) => deleteEvent(id)}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};
