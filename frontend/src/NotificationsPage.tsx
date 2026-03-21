// [IMPORT] Hooks
import { useState } from "react";

// [IMPORT] Components
import Modal from "./components/Modal";

// ?[INTERFACES]
interface Announcement {
  id: number;
  date: string;
  title: string;
  description?: string;
}

interface SchoolEvent {
  id: number;
  month: string;
  day: string;
  title: string;
  description?: string;
}

const NotificationsPage = () => {
  // [STATES]
  const [announcements] = useState<Announcement[]>([
    { id: 1, date: "2026-02-22", title: "Midterm Exams Schedule Released" },
    { id: 2, date: "2026-03-18", title: "School Maintenance Day" },
  ]);

  const [events] = useState<SchoolEvent[]>([
    { id: 1, month: "Mar", day: "25", title: "Science Fair", description: "Annual school-wide science fair in the gymnasium." },
    { id: 2, month: "Apr", day: "01", title: "Arts Week Opening Ceremony", description: "Kickoff of Arts Week with performances and exhibits." },
    { id: 3, month: "Apr", day: "10", title: "Parent-Teacher Meeting", description: "PTM for all grade levels." },
    { id: 4, month: "Apr", day: "15", title: "School Sports Day", description: "Inter-class sports competitions." },
  ]);

  const [visibleEvents, setVisibleEvents] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

  // [HANDLERS]
  const handleSeeMoreEvents = () => setVisibleEvents((prev) => prev + 3);
  const handleEventClick = (event: SchoolEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // [HELPER] Format date as "Month Day, Year"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="flex-1 p-4 space-y-8 pb-10 bg-[var(--color-bg-200)]">
      {/* [MODAL] Event Details */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Event Details"
        type="info"
        confirmText="Close"
      >
        <div className="p-1">
          <p className="text-[var(--color-primary-600)] font-bold text-sm mb-1">{selectedEvent?.month} {selectedEvent?.day}</p>
          <h3 className="text-lg font-bold text-[var(--color-text-900)] mb-2">{selectedEvent?.title}</h3>
          <p className="text-[var(--color-text-600)] text-sm leading-relaxed">
            {selectedEvent?.description || "No specific details available at this time."}
          </p>
        </div>
      </Modal>
      
      {/* [SECTION] Announcements */}
      <section>
        <div className="bg-[var(--color-primary-700)] text-[var(--color-text-50)] p-4 rounded-md mb-4 shadow-md">
          <h2 className="text-xl font-bold uppercase tracking-wide">Announcements</h2>
        </div>

        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="bg-[var(--color-bg-50)] border border-[var(--color-text-300)] p-4 rounded-lg shadow-lg">
                <p className="body-small text-[var(--color-text-600)] mb-1">{formatDate(item.date)}</p>
                <p className="font-figtree font-bold text-[var(--color-text-800)] leading-tight">{item.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-[var(--color-text-200)] rounded-xl bg-[var(--color-bg-50)]">
            <p className="text-[var(--color-text-400)] italic text-sm">No announcements posted yet.</p>
          </div>
        )}
      </section>

      {/* [SECTION] Upcoming Events */}
      <section>
        <div className="bg-[var(--color-secondary-600)] text-[var(--color-text-50)] p-4 rounded-md mb-4 shadow-md">
          <h2 className="text-xl font-bold uppercase tracking-wide">Upcoming Events</h2>
        </div>

        {events.length > 0 ? (
          <>
            <div className="space-y-3">
              {events.slice(0, visibleEvents).map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex bg-[var(--color-bg-100)] border border-[var(--color-text-200)] rounded-lg overflow-hidden transition-all duration-150 ease-in-out hover:bg-[var(--color-bg-50)]"
                >
                  <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-[var(--color-text-200)] min-w-[80px] bg-[var(--color-bg-50)]">
                    <span className="text-xs text-[var(--color-text-500)] font-bold uppercase">{event.month}</span>
                    <span className="text-2xl font-black text-[var(--color-text-800)]">{event.day}</span>
                  </div>
                  <div className="p-4 flex items-center">
                    <p className="font-bold text-[var(--color-text-800)] text-sm leading-snug">{event.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {visibleEvents < events.length && (
              <button
                onClick={handleSeeMoreEvents}
                className="w-full text-center text-[var(--color-text-600)] underline text-sm mt-6 font-medium hover:text-[var(--color-text-800)] cursor-pointer"
              >
                See More Events
              </button>
            )}
          </>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-[var(--color-text-200)] rounded-xl bg-[var(--color-text-50)]">
            <span className="text-3xl block mb-2 opacity-30"></span>
            <p className="text-[var(--color-text-400)] italic text-sm">No upcoming events scheduled.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsPage;