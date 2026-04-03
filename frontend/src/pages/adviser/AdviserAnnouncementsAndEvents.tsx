/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";

// Components
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

// Types
import { GeneralModalConfig } from "../../types";

// ? [INTERFACES]
interface Announcement {
  id: number;
  title: string;
  content: string;
  publishedAt?: string;
  expiresAt?: string;
  createdById: number;
  createdBy?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

type EventType = "SCHOOL_EVENT" | "ACADEMIC_EVENT" | "COMMUNITY_SERVICE" | "OTHER";

interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  location?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  isOnline: boolean;
  createdById: number;
  createdBy?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

// [CONSTANTS]
const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SCHOOL_EVENT: "School Event",
  ACADEMIC_EVENT: "Academic Event",
  COMMUNITY_SERVICE: "Community Service",
  OTHER: "Other",
};

const AdviserAnnouncementsAndEvents = () => {
  // [STATES] Entities
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATE] General Modal
  const [generalModal, setGeneralModal] = useState<GeneralModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "default",
    confirmText: "OK",
    isCancelable: true,
    onConfirm: () => {},
  });

  // [STATES] Visible events (paginate-style)
  const [visibleEvents, setVisibleEvents] = useState(3);

  // [HELPERS]
  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal((prev) => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal((prev) => ({ ...prev, isOpen: false }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  // [HELPER] Safely parse response JSON — avoids crash on non-JSON 500 bodies
  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: `Server error (${res.status})` };
    }
  };

  const getEventDateDisplay = (event: SchoolEvent) => {
    const start = new Date(event.startDate);
    return {
      month: start.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: String(start.getDate()).padStart(2, "0"),
    };
  };

  // * [HANDLE] Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Failed to fetch announcements");
      setAnnouncements(Array.isArray(data.data?.announcements) ? data.data.announcements : []);
    } catch (err) {
      // ! [ERROR] Fetching announcements failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Announcements",
        message: "We couldn't load announcements at the moment. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setAnnouncements([]);
    }
  };

  // * [HANDLE] Fetch Events
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Failed to fetch events");
      setEvents(Array.isArray(data.data?.events) ? data.data.events : []);
    } catch (err) {
      // ! [ERROR] Fetching events failed
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Events",
        message: "We couldn't load events at the moment. Please check your connection and try again.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
      setEvents([]);
    }
  };

  // * [HANDLE] Initial data load
  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchAnnouncements(), fetchEvents()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ? [LOADING STATE] Show skeleton while loading
  if (loading) return <Skeleton />;

  return (
    <div className="flex-1 p-4 space-y-8 pb-10 bg-[var(--color-bg-200)]">
      {/* ─── SECTION: Announcements ─────────────────────────────────────── */}
      <section>
        <div className="bg-[var(--color-primary-700)] text-[var(--color-text-50)] p-4 rounded-md mb-4 shadow-md flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-wide">Announcements</h2>
        </div>

        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--color-bg-50)] border border-[var(--color-text-300)] p-4 rounded-lg shadow-lg cursor-pointer hover:bg-[var(--color-bg-100)] transition-colors duration-150"
              >
                <p className="body-small text-[var(--color-text-600)] mb-1">{formatDate(item.publishedAt)}</p>
                <p className="font-figtree font-bold text-[var(--color-text-800)] leading-tight">{item.title}</p>
                {item.content && (
                  <p className="text-[var(--color-text-600)] text-sm mt-1 line-clamp-2">{item.content}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-[var(--color-text-200)] rounded-xl bg-[var(--color-bg-50)]">
            <EmptyState
              title="No announcements yet"
              subtitle="Create the first announcement to notify advisers and visitors."
              iconSrc="/no-data-icon.svg"
            />
          </div>
        )}
      </section>

      {/* ─── SECTION: Upcoming Events ───────────────────────────────────── */}
      <section>
        <div className="bg-[var(--color-secondary-600)] text-[var(--color-text-50)] p-4 rounded-md mb-4 shadow-md flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-wide">Upcoming Events</h2>
        </div>

        {events.length > 0 ? (
          <>
            <div className="space-y-3">
              {events.slice(0, visibleEvents).map((event) => {
                const { month, day } = getEventDateDisplay(event);
                return (
                  <div
                    key={event.id}
                    className="flex bg-[var(--color-bg-100)] border border-[var(--color-text-200)] rounded-lg overflow-hidden transition-all duration-150 ease-in-out hover:bg-[var(--color-bg-50)] cursor-pointer"
                  >
                    {/* [DATE BADGE] */}
                    <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-[var(--color-text-200)] min-w-[80px] bg-[var(--color-bg-50)]">
                      <span className="text-xs text-[var(--color-text-500)] font-bold uppercase">{month}</span>
                      <span className="text-2xl font-black text-[var(--color-text-800)]">{day}</span>
                    </div>

                    {/* [EVENT INFO] */}
                    <div className="p-4 flex flex-col justify-center gap-1 flex-1">
                      <p className="font-bold text-[var(--color-text-800)] text-sm leading-snug">{event.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-200)] text-[var(--color-text-600)]">
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                        {event.isOnline && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)]">
                            Online
                          </span>
                        )}
                        {event.location && (
                          <span className="text-xs text-[var(--color-text-500)]">📍 {event.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleEvents < events.length && (
              <button
                onClick={() => setVisibleEvents((prev) => prev + 3)}
                className="w-full text-center text-[var(--color-text-600)] underline text-sm mt-6 font-medium hover:text-[var(--color-text-800)] cursor-pointer"
              >
                See More Events
              </button>
            )}
          </>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-[var(--color-text-200)] rounded-xl bg-[var(--color-bg-50)]">
            <EmptyState
              title="No upcoming events"
              subtitle="Add events to keep everyone informed about school activities."
              iconSrc="/no-data-icon.svg"
            />
          </div>
        )}
      {/* [MODAL] General */}
      <Modal
        isOpen={generalModal.isOpen}
        onClose={closeGeneralModal}
        title={generalModal.title}
        message={generalModal.message}
        type={generalModal.type}
        confirmText={generalModal.confirmText}
        onConfirm={generalModal.onConfirm}
        isCancelable={generalModal.isCancelable}
      />
      </section>
    </div>
  );
};

export default AdviserAnnouncementsAndEvents;