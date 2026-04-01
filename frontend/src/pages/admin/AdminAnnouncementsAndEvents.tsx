/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";

// Components
import Skeleton from "../../components/Skeleton";
import PrimaryButton from "../../components/PrimaryButton";
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

interface AnnouncementFormData {
  title: string;
  content: string;
  publishedAt: string;
  expiresAt: string;
}

interface EventFormData {
  title: string;
  description: string;
  location: string;
  type: EventType;
  startDate: string;
  endDate: string;
  isOnline: boolean;
}

// [CONSTANTS]
const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SCHOOL_EVENT: "School Event",
  ACADEMIC_EVENT: "Academic Event",
  COMMUNITY_SERVICE: "Community Service",
  OTHER: "Other",
};

const EVENT_TYPE_OPTIONS: EventType[] = [
  "SCHOOL_EVENT",
  "ACADEMIC_EVENT",
  "COMMUNITY_SERVICE",
  "OTHER",
];

const ANNOUNCEMENT_INITIAL: AnnouncementFormData = {
  title: "",
  content: "",
  publishedAt: "",
  expiresAt: "",
};

const EVENT_INITIAL: EventFormData = {
  title: "",
  description: "",
  location: "",
  type: "OTHER",
  startDate: "",
  endDate: "",
  isOnline: false,
};

const AdminAnnouncementsAndEvents = () => {
  // [STATES] Entities
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // [STATE] Submitting (separate from loading to avoid Skeleton flash on form submit)
  const [submitting, setSubmitting] = useState(false);

  // [STATES] Announcement Form Modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState<AnnouncementFormData>(ANNOUNCEMENT_INITIAL);
  const [announcementFormError, setAnnouncementFormError] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);

  // [STATES] Event Form Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState<EventFormData>(EVENT_INITIAL);
  const [eventFormError, setEventFormError] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  // [STATES] Detail Modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [showAnnouncementDetailModal, setShowAnnouncementDetailModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);

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

  const formatDateInput = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().slice(0, 16);
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

  // [HELPER] Convert datetime-local string (e.g. "2026-04-02T10:00") to full ISO 8601
  // that Prisma/PostgreSQL accepts. Returns null for empty/invalid values.
  const toISOStringOrNull = (value: string): string | null => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/announcements`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/events`, {
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

  // ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────

  // * [HANDLE] Open Add Announcement Modal
  const handleAddAnnouncement = () => {
    setAnnouncementFormData(ANNOUNCEMENT_INITIAL);
    setAnnouncementFormError("");
    setEditingAnnouncementId(null);
    setShowAnnouncementModal(true);
  };

  // * [HANDLE] Open Edit Announcement Modal
  const handleEditAnnouncement = (announcement: Announcement) => {
    setAnnouncementFormData({
      title: announcement.title,
      content: announcement.content,
      publishedAt: formatDateInput(announcement.publishedAt),
      expiresAt: formatDateInput(announcement.expiresAt),
    });
    setAnnouncementFormError("");
    setEditingAnnouncementId(announcement.id);
    setShowAnnouncementDetailModal(false);
    setShowAnnouncementModal(true);
  };

  // * [HANDLE] Submit Announcement (Create or Update)
  const handleAnnouncementSubmit = async () => {
    if (!announcementFormData.title.trim()) {
      setAnnouncementFormError("Title is required.");
      return;
    }
    if (!announcementFormData.content.trim()) {
      setAnnouncementFormError("Content is required.");
      return;
    }

    setSubmitting(true);
    setAnnouncementFormError("");

    const isEditing = editingAnnouncementId !== null;
    const url = isEditing
      ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/announcements/${editingAnnouncementId}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/admin/announcements`;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: announcementFormData.title.trim(),
          content: announcementFormData.content.trim(),
          publishedAt: toISOStringOrNull(announcementFormData.publishedAt),
          expiresAt: toISOStringOrNull(announcementFormData.expiresAt),
        }),
      });

      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Request failed");

      // * [SUCCESS] Announcement saved
      setShowAnnouncementModal(false);
      await fetchAnnouncements();
      openGeneralModal({
        title: isEditing ? "Announcement Updated" : "Announcement Created",
        message: isEditing
          ? "The announcement has been updated successfully."
          : "The announcement has been created successfully.",
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Announcement save failed
      console.error(err);
      setAnnouncementFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // * [HANDLE] Delete Announcement
  const handleDeleteAnnouncement = (id: number) => {
    const onDeleteConfirm = async () => {
      setSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/announcements/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await safeJson(res);
        if (!data.success) throw new Error(data.message || "Failed to delete announcement");

        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        setShowAnnouncementDetailModal(false);

        // * [SUCCESS] Announcement deleted
        openGeneralModal({
          title: "Announcement Deleted",
          message: "The announcement has been deleted successfully.",
          type: "success",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      } catch (err) {
        // ! [ERROR] Announcement deletion failed
        console.error("Delete error:", err);
        openGeneralModal({
          title: "Unable to Delete Announcement",
          message: "We couldn't delete the announcement at the moment. Please try again.",
          type: "error",
          isCancelable: true,
          onConfirm: () => closeGeneralModal(),
        });
      } finally {
        setSubmitting(false);
      }
    };

    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Announcement",
      message: "Are you sure you want to delete this announcement? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: onDeleteConfirm,
    });
  };

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  // * [HANDLE] Open Add Event Modal
  const handleAddEvent = () => {
    setEventFormData(EVENT_INITIAL);
    setEventFormError("");
    setEditingEventId(null);
    setShowEventModal(true);
  };

  // * [HANDLE] Open Edit Event Modal
  const handleEditEvent = (event: SchoolEvent) => {
    setEventFormData({
      title: event.title,
      description: event.description,
      location: event.location ?? "",
      type: event.type,
      startDate: formatDateInput(event.startDate),
      endDate: formatDateInput(event.endDate),
      isOnline: event.isOnline,
    });
    setEventFormError("");
    setEditingEventId(event.id);
    setShowEventDetailModal(false);
    setShowEventModal(true);
  };

  // * [HANDLE] Submit Event (Create or Update)
  const handleEventSubmit = async () => {
    if (!eventFormData.title.trim()) {
      setEventFormError("Title is required.");
      return;
    }
    if (!eventFormData.startDate) {
      setEventFormError("Start date is required.");
      return;
    }

    setSubmitting(true);
    setEventFormError("");

    const isEditing = editingEventId !== null;
    const url = isEditing
      ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/events/${editingEventId}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/admin/events`;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventFormData.title.trim(),
          description: eventFormData.description.trim(),
          location: eventFormData.location.trim() || null,
          type: eventFormData.type,
          startDate: toISOStringOrNull(eventFormData.startDate),
          endDate: toISOStringOrNull(eventFormData.endDate),
          isOnline: eventFormData.isOnline,
        }),
      });

      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Request failed");

      // * [SUCCESS] Event saved
      setShowEventModal(false);
      await fetchEvents();
      openGeneralModal({
        title: isEditing ? "Event Updated" : "Event Created",
        message: isEditing
          ? "The event has been updated successfully."
          : "The event has been created successfully.",
        type: "success",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    } catch (err: any) {
      // ! [ERROR] Event save failed
      console.error(err);
      setEventFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // * [HANDLE] Delete Event
  const handleDeleteEvent = (id: number) => {
    const onDeleteConfirm = async () => {
      setSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/events/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await safeJson(res);
        if (!data.success) throw new Error(data.message || "Failed to delete event");

        setEvents((prev) => prev.filter((e) => e.id !== id));
        setShowEventDetailModal(false);

        // * [SUCCESS] Event deleted
        openGeneralModal({
          title: "Event Deleted",
          message: "The event has been deleted successfully.",
          type: "success",
          isCancelable: false,
          onConfirm: () => closeGeneralModal(),
        });
      } catch (err) {
        // ! [ERROR] Event deletion failed
        console.error("Delete error:", err);
        openGeneralModal({
          title: "Unable to Delete Event",
          message: "We couldn't delete the event at the moment. Please try again.",
          type: "error",
          isCancelable: true,
          onConfirm: () => closeGeneralModal(),
        });
      } finally {
        setSubmitting(false);
      }
    };

    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Event",
      message: "Are you sure you want to delete this event? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: onDeleteConfirm,
    });
  };

  // ? [LOADING STATE] Show skeleton while loading
  if (loading) return <Skeleton />;

  return (
    <div className="flex-1 p-4 space-y-8 pb-10 bg-[var(--color-bg-200)]">
      {/* [MODAL] Announcement Detail */}
      <Modal
        isOpen={showAnnouncementDetailModal}
        onClose={() => setShowAnnouncementDetailModal(false)}
        title="Announcement Details"
        type="info"
        confirmText="Edit"
        onConfirm={() => selectedAnnouncement && handleEditAnnouncement(selectedAnnouncement)}
        isCancelable={true}
      >
        <div className="p-1 space-y-2">
          <p className="text-[var(--color-text-500)] text-xs">{formatDate(selectedAnnouncement?.publishedAt)}</p>
          <h3 className="text-lg font-bold text-[var(--color-text-900)]">{selectedAnnouncement?.title}</h3>
          <p className="text-[var(--color-text-600)] text-sm leading-relaxed">{selectedAnnouncement?.content}</p>
          {selectedAnnouncement?.expiresAt && (
            <p className="text-[var(--color-text-400)] text-xs">Expires: {formatDate(selectedAnnouncement.expiresAt)}</p>
          )}
          <div className="pt-2 border-t border-[var(--color-text-100)]">
            <button
              onClick={() => selectedAnnouncement && handleDeleteAnnouncement(selectedAnnouncement.id)}
              className="text-xs text-[var(--color-red-500)] hover:underline cursor-pointer"
            >
              Delete Announcement
            </button>
          </div>
        </div>
      </Modal>

      {/* [MODAL] Event Detail */}
      <Modal
        isOpen={showEventDetailModal}
        onClose={() => setShowEventDetailModal(false)}
        title="Event Details"
        type="info"
        confirmText="Edit"
        onConfirm={() => selectedEvent && handleEditEvent(selectedEvent)}
        isCancelable={true}
      >
        <div className="p-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[var(--color-primary-600)]">
              {selectedEvent && getEventDateDisplay(selectedEvent).month}{" "}
              {selectedEvent && getEventDateDisplay(selectedEvent).day}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-200)] text-[var(--color-text-600)]">
              {selectedEvent && EVENT_TYPE_LABELS[selectedEvent.type]}
            </span>
            {selectedEvent?.isOnline && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)]">
                Online
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-900)]">{selectedEvent?.title}</h3>
          <p className="text-[var(--color-text-600)] text-sm leading-relaxed">{selectedEvent?.description || "No description available."}</p>
          {selectedEvent?.location && (
            <p className="text-[var(--color-text-500)] text-xs">📍 {selectedEvent.location}</p>
          )}
          {selectedEvent?.endDate && (
            <p className="text-[var(--color-text-400)] text-xs">Ends: {formatDate(selectedEvent.endDate)}</p>
          )}
          <div className="pt-2 border-t border-[var(--color-text-100)]">
            <button
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
              className="text-xs text-[var(--color-red-500)] hover:underline cursor-pointer"
            >
              Delete Event
            </button>
          </div>
        </div>
      </Modal>

      {/* [MODAL] Announcement Form */}
      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title={editingAnnouncementId ? "Edit Announcement" : "Create Announcement"}
        type="default"
        confirmText={submitting ? "Saving..." : editingAnnouncementId ? "Save Changes" : "Create"}
        onConfirm={handleAnnouncementSubmit}
        isCancelable={!submitting}
      >
        <div className="p-1 space-y-3">
          {announcementFormError && (
            <p className="text-[var(--color-red-500)] text-xs">{announcementFormError}</p>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">Title <span className="text-[var(--color-red-500)]">*</span></label>
            <input
              type="text"
              value={announcementFormData.title}
              onChange={(e) => setAnnouncementFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Midterm Exams Schedule"
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">Content <span className="text-[var(--color-red-500)]">*</span></label>
            <textarea
              value={announcementFormData.content}
              onChange={(e) => setAnnouncementFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Write the announcement content here..."
              rows={4}
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Publish Date</label>
              <input
                type="datetime-local"
                value={announcementFormData.publishedAt}
                onChange={(e) => setAnnouncementFormData((prev) => ({ ...prev, publishedAt: e.target.value }))}
                className="w-full bg-[var(--color-bg-50)] rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Expiry Date</label>
              <input
                type="datetime-local"
                value={announcementFormData.expiresAt}
                onChange={(e) => setAnnouncementFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className="w-full bg-[var(--color-bg-50)] rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* [MODAL] Event Form */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editingEventId ? "Edit Event" : "Create Event"}
        type="default"
        confirmText={submitting ? "Saving..." : editingEventId ? "Save Changes" : "Create"}
        onConfirm={handleEventSubmit}
        isCancelable={!submitting}
      >
        <div className="p-1 space-y-3">
          {eventFormError && (
            <p className="text-[var(--color-red-500)] text-xs">{eventFormError}</p>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">Title <span className="text-[var(--color-red-500)]">*</span></label>
            <input
              type="text"
              value={eventFormData.title}
              onChange={(e) => setEventFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Science Fair"
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">Description</label>
            <textarea
              value={eventFormData.description}
              onChange={(e) => setEventFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the event..."
              rows={3}
              className="w-full bg-[var(--color-bg-50)] body-default rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Type</label>
              <select
                value={eventFormData.type}
                onChange={(e) => setEventFormData((prev) => ({ ...prev, type: e.target.value as EventType }))}
                className="w-full bg-[var(--color-bg-50)] rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
              >
                {EVENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Location</label>
              <input
                type="text"
                value={eventFormData.location}
                onChange={(e) => setEventFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Gymnasium"
                className="w-full bg-[var(--color-bg-50)] rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Start Date <span className="text-[var(--color-red-500)]">*</span></label>
              <input
                type="datetime-local"
                value={eventFormData.startDate}
                onChange={(e) => setEventFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-[var(--color-bg-50)] rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">End Date</label>
              <input
                type="datetime-local"
                value={eventFormData.endDate}
                onChange={(e) => setEventFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full bg-[var(--color-bg-50)] rounded-sm px-3 py-2 outline-none border border-[var(--color-text-300)] focus:ring-2 focus:ring-[var(--color-primary-600)] text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOnline"
              checked={eventFormData.isOnline}
              onChange={(e) => setEventFormData((prev) => ({ ...prev, isOnline: e.target.checked }))}
              className="accent-[var(--color-primary-600)] size-4"
            />
            <label htmlFor="isOnline" className="text-sm text-[var(--color-text-700)] cursor-pointer select-none">This is an online event</label>
          </div>
        </div>
      </Modal>

      {/* ─── SECTION: Announcements ─────────────────────────────────────── */}
      <section>
        <div className="bg-[var(--color-primary-700)] text-[var(--color-text-50)] p-4 rounded-md mb-4 shadow-md flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-wide">Announcements</h2>
        </div>

        {/* [BUTTON] Add Announcement */}
        <div className="mb-3">
          <PrimaryButton text="Add Announcement" iconSrc="/add-icon.svg" onClick={handleAddAnnouncement} />
        </div>

        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => { setSelectedAnnouncement(item); setShowAnnouncementDetailModal(true); }}
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

        {/* [BUTTON] Add Event */}
        <div className="mb-3">
          <PrimaryButton text="Add Event" iconSrc="/add-icon.svg" onClick={handleAddEvent} />
        </div>

        {events.length > 0 ? (
          <>
            <div className="space-y-3">
              {events.slice(0, visibleEvents).map((event) => {
                const { month, day } = getEventDateDisplay(event);
                return (
                  <div
                    key={event.id}
                    onClick={() => { setSelectedEvent(event); setShowEventDetailModal(true); }}
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

export default AdminAnnouncementsAndEvents;