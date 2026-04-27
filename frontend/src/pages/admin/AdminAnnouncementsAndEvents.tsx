/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useCallback } from "react";

// [IMPORT] Components
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import SearchBar from "../../components/SearchBar";
import Dropdown from "../../components/Dropdown";
import Pagination from "../../components/Pagination";
import PageLayout from "../../components/layouts/PageLayout";
import AnnouncementCard from "../../components/cards/announcement/AnnouncementCard";
import EventCard from "../../components/cards/event/EventCard";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import DeleteButton from "../../components/buttons/DeleteButton";

// [IMPORT] Helpers, Constants & Types
import {
  formatDate,
  formatDateInput,
  safeJson,
  toISOStringOrNull,
  getEventDateDisplay,
  getVisiblePages,
} from "../../helpers";
import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS, ANNOUNCEMENT_INITIAL, EVENT_INITIAL } from "../../constants";
import { GeneralModalConfig, Announcement, SchoolEvent, EventType, AnnouncementFormData, EventFormData } from "../../types";

type AnnouncementSort = "title-asc" | "title-desc" | "published-asc" | "published-desc" | "expiry-asc" | "expiry-desc";
type EventSort = "title-asc" | "title-desc" | "date-asc" | "date-desc";
type DateRangeFilter = "all" | "this-week" | "this-month" | "this-year";

const matchesDateRange = (dateStr: string | undefined | null, range: DateRangeFilter): boolean => {
  if (range === "all") return true;
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  if (range === "this-week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }
  if (range === "this-month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (range === "this-year") {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
};

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "This Week", value: "this-week" },
  { label: "This Month", value: "this-month" },
  { label: "This Year", value: "this-year" },
];


// [HOOK] Returns a responsive items-per-page value based on viewport width.
// Breakpoints mirror the Tailwind grid columns used in the card grids:
//   < 640px  (sm)  → 1 col  → 5  cards
//   < 768px  (md)  → 2 cols → 8  cards  (2 cols × 4 rows)
//   < 1024px (lg)  → 3 cols → 9  cards  (3 cols × 3 rows)
//   ≥ 1024px       → 4 cols → 12 cards  (4 cols × 3 rows)
const useItemsPerPage = () => {
  const getItems = useCallback(() => {
    const w = window.innerWidth;
    if (w < 640)  return 5;
    if (w < 768)  return 8;
    if (w < 1024) return 9;
    return 12;
  }, []);

  const [itemsPerPage, setItemsPerPage] = useState(getItems);

  useEffect(() => {
    const onResize = () => setItemsPerPage(getItems());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getItems]);

  return itemsPerPage;
};

const AdminAnnouncementsAndEvents = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // [STATES] Announcement Search, Sort & Filter
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementSort, setAnnouncementSort] = useState<AnnouncementSort>("published-desc");
  const [announcementDateFilters, setAnnouncementDateFilters] = useState<string[]>([]);
  const [announcementActiveDropdown, setAnnouncementActiveDropdown] = useState<"sort" | "filter" | null>(null);

  // [STATES] Event Search, Sort & Filter
  const [eventSearch, setEventSearch] = useState("");
  const [eventSort, setEventSort] = useState<EventSort>("date-asc");
  const [eventDateFilters, setEventDateFilters] = useState<string[]>([]);
  const [eventActiveDropdown, setEventActiveDropdown] = useState<"sort" | "filter" | null>(null);

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

  // [STATES] Detail Modals
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

  // [STATES] Pagination
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const itemsPerPage = useItemsPerPage();

  const openGeneralModal = (config: Partial<Omit<GeneralModalConfig, "isOpen">>) => {
    setGeneralModal(prev => ({ ...prev, isOpen: true, ...config }));
  };

  const closeGeneralModal = () => {
    setGeneralModal(prev => ({ ...prev, isOpen: false }));
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: announcementFormData.title.trim(),
          content: announcementFormData.content.trim(),
          publishedAt: toISOStringOrNull(announcementFormData.publishedAt),
          expiresAt: toISOStringOrNull(announcementFormData.expiresAt),
        }),
      });

      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Request failed");

      // * [SUCCESS] Announcement Saved
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
    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Announcement",
      message: "Are you sure you want to delete this announcement? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/announcements/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await safeJson(res);
          if (!data.success) throw new Error(data.message || "Failed to delete announcement");

          setAnnouncements(prev => prev.filter(a => a.id !== id));
          setShowAnnouncementDetailModal(false);

          // * [SUCCESS] Announcement Deleted
          openGeneralModal({
            title: "Announcement Deleted",
            message: "The announcement has been deleted successfully.",
            type: "success",
            confirmText: "OK",
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
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

      // * [SUCCESS] Event Saved
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
    // ? [CONFIRMATION] Before deleting, ask user to confirm
    openGeneralModal({
      title: "Delete Event",
      message: "Are you sure you want to delete this event? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      isCancelable: true,
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/events/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await safeJson(res);
          if (!data.success) throw new Error(data.message || "Failed to delete event");

          setEvents(prev => prev.filter(e => e.id !== id));
          setShowEventDetailModal(false);

          // * [SUCCESS] Event Deleted
          openGeneralModal({
            title: "Event Deleted",
            message: "The event has been deleted successfully.",
            type: "success",
            confirmText: "OK",
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
            isCancelable: false,
            onConfirm: () => closeGeneralModal(),
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // * [COMPUTE] Filtered & sorted announcements
  const filteredAnnouncements = announcements
    .filter(a => {
      const matchesSearch =
        a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
        (a.content && a.content.toLowerCase().includes(announcementSearch.toLowerCase()));
      const matchesDate = announcementDateFilters.length === 0 || announcementDateFilters.some(r => matchesDateRange(a.publishedAt, r as DateRangeFilter));
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      switch (announcementSort) {
        case "title-asc":      return a.title.localeCompare(b.title);
        case "title-desc":     return b.title.localeCompare(a.title);
        case "published-asc":  return new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
        case "published-desc": return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();
        case "expiry-asc":     return new Date(a.expiresAt ?? 0).getTime() - new Date(b.expiresAt ?? 0).getTime();
        case "expiry-desc":    return new Date(b.expiresAt ?? 0).getTime() - new Date(a.expiresAt ?? 0).getTime();
        default: return 0;
      }
    });

  // * [COMPUTE] Filtered & sorted events
  const filteredEvents = events
    .filter(e => {
      const matchesSearch =
        e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(eventSearch.toLowerCase()));
      const matchesDate = eventDateFilters.length === 0 || eventDateFilters.some(r => matchesDateRange(e.startDate, r as DateRangeFilter));
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      switch (eventSort) {
        case "title-asc":  return a.title.localeCompare(b.title);
        case "title-desc": return b.title.localeCompare(a.title);
        case "date-asc":   return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "date-desc":  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        default: return 0;
      }
    });

  // * [COMPUTE] Pagination slices
  const announcementTotalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const displayedAnnouncements = filteredAnnouncements.slice((announcementPage - 1) * itemsPerPage, announcementPage * itemsPerPage);

  const eventTotalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const displayedEvents = filteredEvents.slice((eventPage - 1) * itemsPerPage, eventPage * itemsPerPage);

  // ? [LOADING STATE]
  if (loading) return <Skeleton />;

  return (
    <>
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

      {/* [MODAL] Announcement Detail */}
      <Modal
        isOpen={showAnnouncementDetailModal}
        onClose={() => setShowAnnouncementDetailModal(false)}
        title="Announcement Details"
        type="info"
        confirmText="Edit"
        onConfirm={() => selectedAnnouncement && handleEditAnnouncement(selectedAnnouncement)}
        isCancelable
      >
        <div className="space-y-4 p-1">
          <div className="space-y-1">
            <p className="text-[var(--color-text-500)] text-xs">
              Published {formatDate(selectedAnnouncement?.publishedAt)}
            </p>
            <h3 className="text-lg font-bold text-[var(--color-text-900)] leading-snug">
              {selectedAnnouncement?.title}
            </h3>
          </div>
          <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md p-3">
            <p className="text-[var(--color-text-700)] text-sm leading-relaxed whitespace-pre-wrap">
              {selectedAnnouncement?.content}
            </p>
          </div>
          {selectedAnnouncement?.expiresAt && (
            <div className="flex justify-between items-center text-xs text-[var(--color-text-500)]">
              <span>Expiry Date</span>
              <span className="font-medium text-[var(--color-text-700)]">
                {formatDate(selectedAnnouncement.expiresAt)}
              </span>
            </div>
          )}
          <div className="border-t border-[var(--color-bg-200)] pt-3 flex justify-end">
            <DeleteButton
              text="Delete Announcement"
              onClick={() => selectedAnnouncement && handleDeleteAnnouncement(selectedAnnouncement.id)}
            />
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
        isCancelable
      >
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
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
            <h3 className="text-lg font-bold text-[var(--color-text-900)] leading-snug">
              {selectedEvent?.title}
            </h3>
          </div>
          <div className="bg-[var(--color-bg-50)] border border-[var(--color-bg-200)] rounded-md p-3">
            <p className="text-[var(--color-text-700)] text-sm leading-relaxed whitespace-pre-wrap">
              {selectedEvent?.description || "No description available."}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            {selectedEvent?.location && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-700)] font-figree font-semibold">Location</span>
                <span className="text-[var(--color-text-900)] truncate text-right max-w-[220px]">
                  📍 {selectedEvent.location}
                </span>
              </div>
            )}
            {selectedEvent?.endDate && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-700)] font-figree font-semibold">Ends</span>
                <span className="text-[var(--color-text-900)]">{formatDate(selectedEvent.endDate)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-[var(--color-bg-200)] pt-3 flex justify-end">
            <DeleteButton
              text="Delete Event"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
            />
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
            <label className="text-xs font-semibold text-[var(--color-text-700)]">
              Title <span className="text-[var(--color-red-500)]">*</span>
            </label>
            <input
              type="text"
              value={announcementFormData.title}
              onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Midterm Exams Schedule"
              className="input-base w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">
              Content <span className="text-[var(--color-red-500)]">*</span>
            </label>
            <textarea
              value={announcementFormData.content}
              onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write the announcement content here..."
              rows={4}
              className="input-base w-full resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Publish Date</label>
              <input
                type="datetime-local"
                value={announcementFormData.publishedAt}
                onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                className="input-base w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Expiry Date</label>
              <input
                type="datetime-local"
                value={announcementFormData.expiresAt}
                onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                className="input-base w-full"
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
            <label className="text-xs font-semibold text-[var(--color-text-700)]">
              Title <span className="text-[var(--color-red-500)]">*</span>
            </label>
            <input
              type="text"
              value={eventFormData.title}
              onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Science Fair"
              className="input-base w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-700)]">Description</label>
            <textarea
              value={eventFormData.description}
              onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the event..."
              rows={3}
              className="input-base w-full resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Type</label>
              <select
                value={eventFormData.type}
                onChange={(e) => setEventFormData(prev => ({ ...prev, type: e.target.value as EventType }))}
                className="input-base w-full"
              >
                {EVENT_TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">Location</label>
              <input
                type="text"
                value={eventFormData.location}
                onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Gymnasium"
                className="input-base w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">
                Start Date <span className="text-[var(--color-red-500)]">*</span>
              </label>
              <input
                type="datetime-local"
                value={eventFormData.startDate}
                onChange={(e) => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="input-base w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-700)]">End Date</label>
              <input
                type="datetime-local"
                value={eventFormData.endDate}
                onChange={(e) => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="input-base w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOnline"
              checked={eventFormData.isOnline}
              onChange={(e) => setEventFormData(prev => ({ ...prev, isOnline: e.target.checked }))}
              className="accent-[var(--color-primary-600)] size-4"
            />
            <label htmlFor="isOnline" className="text-sm text-[var(--color-text-700)] cursor-pointer select-none">
              This is an online event
            </label>
          </div>
        </div>
      </Modal>

      {/* [LAYOUT] Admin Page */}
      <PageLayout header={<span className="page-title">Announcements & Events</span>}>
        <div className="space-y-8">

          {/* [SECTION] Announcements */}
          <section className="space-y-3">
            <div className="bg-[var(--color-primary-700)] text-[var(--color-text-50)] px-4 py-3 rounded-md shadow-md">
              <h2 className="text-xl font-bold uppercase tracking-wide">Announcements</h2>
            </div>

            {/* [TOOLBAR] Search + Sort + Filter + Add */}
            <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 w-full">
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={announcementSearch}
                    placeholder="Search announcements..."
                    onChange={setAnnouncementSearch}
                    onResetPage={() => setAnnouncementPage(1)}
                  />
                </div>
                <div className="flex gap-x-2 ml-auto shrink-0">
                  <Dropdown
                    icon="/sort.svg"
                    label="Sort"
                    isOpen={announcementActiveDropdown === "sort"}
                    onToggle={() => setAnnouncementActiveDropdown(announcementActiveDropdown === "sort" ? null : "sort")}
                    selected={announcementSort}
                    onSelect={(v) => { setAnnouncementSort(v as AnnouncementSort); setAnnouncementPage(1); }}
                    options={[
                      { label: "Title ↑", value: "title-asc" },
                      { label: "Title ↓", value: "title-desc" },
                      { label: "Published (Newest)", value: "published-desc" },
                      { label: "Published (Oldest)", value: "published-asc" },
                      { label: "Expiry (Soonest)", value: "expiry-asc" },
                      { label: "Expiry (Latest)", value: "expiry-desc" },
                    ]}
                    width="w-48"
                  />
                  <Dropdown
                    icon="/filter.svg"
                    label="Filter"
                    isOpen={announcementActiveDropdown === "filter"}
                    onToggle={() => setAnnouncementActiveDropdown(announcementActiveDropdown === "filter" ? null : "filter")}
                    selectedValues={announcementDateFilters}
                    onSelectMultiple={(v) => { setAnnouncementDateFilters(v); setAnnouncementPage(1); }}
                    options={DATE_RANGE_OPTIONS}
                    width="w-36"
                  />
                </div>
              </div>
              <div className="w-full md:w-auto md:ml-auto">
                <PrimaryButton
                  text="Add Announcement"
                  iconSrc="/add.svg"
                  onClick={handleAddAnnouncement}
                  className="w-full md:w-auto"
                />
              </div>
            </div>

            {filteredAnnouncements.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {displayedAnnouncements.map(item => (
                    <AnnouncementCard
                      key={item.id}
                      announcement={item}
                      formatDate={formatDate}
                      onClick={(a) => { setSelectedAnnouncement(a); setShowAnnouncementDetailModal(true); }}
                    />
                  ))}
                </div>
                <Pagination
                  page={announcementPage}
                  totalPages={announcementTotalPages}
                  onPageChange={setAnnouncementPage}
                  getVisiblePages={getVisiblePages}
                />
              </>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-[var(--color-text-200)] rounded-xl bg-[var(--color-bg-50)]">
                <EmptyState
                  title={announcements.length === 0 ? "No announcements yet" : "No announcements found"}
                  subtitle={
                    announcements.length === 0
                      ? "Create the first announcement to notify advisers and visitors."
                      : "No announcements match your current search or filters."
                  }
                />
              </div>
            )}
          </section>

          {/* [SECTION] Upcoming Events */}
          <section className="space-y-3">
            <div className="bg-[var(--color-secondary-600)] text-[var(--color-text-50)] px-4 py-3 rounded-md shadow-md">
              <h2 className="text-xl font-bold uppercase tracking-wide">Upcoming Events</h2>
            </div>

            {/* [TOOLBAR] Search + Sort + Filter + Add */}
            <div className="bg-[var(--color-bg-100)] px-3 sm:px-4 py-4 rounded-lg flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
              <div className="flex items-stretch gap-2 w-full">
                <div className="w-full sm:w-64 md:w-80 lg:w-96">
                  <SearchBar
                    value={eventSearch}
                    placeholder="Search events..."
                    onChange={setEventSearch}
                    onResetPage={() => setEventPage(1)}
                  />
                </div>
                <div className="flex gap-x-2 ml-auto shrink-0">
                  <Dropdown
                    icon="/sort.svg"
                    label="Sort"
                    isOpen={eventActiveDropdown === "sort"}
                    onToggle={() => setEventActiveDropdown(eventActiveDropdown === "sort" ? null : "sort")}
                    selected={eventSort}
                    onSelect={(v) => { setEventSort(v as EventSort); setEventPage(1); }}
                    options={[
                      { label: "Title ↑", value: "title-asc" },
                      { label: "Title ↓", value: "title-desc" },
                      { label: "Date (Soonest)", value: "date-asc" },
                      { label: "Date (Latest)", value: "date-desc" },
                    ]}
                  />
                  <Dropdown
                    icon="/filter.svg"
                    label="Filter"
                    isOpen={eventActiveDropdown === "filter"}
                    onToggle={() => setEventActiveDropdown(eventActiveDropdown === "filter" ? null : "filter")}
                    selectedValues={eventDateFilters}
                    onSelectMultiple={(v) => { setEventDateFilters(v); setEventPage(1); }}
                    options={DATE_RANGE_OPTIONS}
                    width="w-36"
                  />
                </div>
              </div>
              <div className="w-full md:w-auto md:ml-auto">
                <SecondaryButton
                  text="Add Event"
                  iconSrc="/add.svg"
                  onClick={handleAddEvent}
                  className="w-full md:w-auto"
                />
              </div>
            </div>

            {filteredEvents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {displayedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      getEventDateDisplay={getEventDateDisplay}
                      onClick={(e) => { setSelectedEvent(e); setShowEventDetailModal(true); }}
                    />
                  ))}
                </div>
                <Pagination
                  page={eventPage}
                  totalPages={eventTotalPages}
                  onPageChange={setEventPage}
                  getVisiblePages={getVisiblePages}
                />
              </>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-[var(--color-text-200)] rounded-xl bg-[var(--color-bg-50)]">
                <EmptyState
                  title={events.length === 0 ? "No upcoming events" : "No events found"}
                  subtitle={
                    events.length === 0
                      ? "Add events to keep everyone informed about school activities."
                      : "No events match your current search or filters."
                  }
                />
              </div>
            )}
          </section>

        </div>
      </PageLayout>
    </>
  );
};

export default AdminAnnouncementsAndEvents;