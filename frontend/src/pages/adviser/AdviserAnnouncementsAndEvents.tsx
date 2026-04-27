/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// [IMPORT] Hooks
import { useState, useEffect, useCallback } from "react";

// [IMPORT] Components
import Modal from "../../components/modal/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import SearchBar from "../../components/toolbar/SearchBar";
import Dropdown from "../../components/toolbar/Dropdown";
import Pagination from "../../components/toolbar/Pagination";
import PageLayout from "../../components/layouts/PageLayout";
import AnnouncementCard from "../../components/cards/announcement/AnnouncementCard";
import EventCard from "../../components/cards/event/EventCard";

// [IMPORT] Helpers, Constants & Types
import {
  formatDate,
  safeJson,
  getEventDateDisplay,
  getVisiblePages,
} from "../../helpers";
import { EVENT_TYPE_LABELS } from "../../constants";
import { GeneralModalConfig, Announcement, SchoolEvent } from "../../types";

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

const AdviserAnnouncementsAndEvents = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/adviser/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.message || "Failed to fetch announcements");
      setAnnouncements(Array.isArray(data.data?.announcements) ? data.data.announcements : []);
    } catch (err) {
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Announcements",
        message: "We couldn't load announcements at the moment.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
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
      console.error(err);
      openGeneralModal({
        title: "Unable to Load Events",
        message: "We couldn't load events at the moment.",
        type: "error",
        confirmText: "Close",
        isCancelable: false,
        onConfirm: () => closeGeneralModal(),
      });
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchAnnouncements(), fetchEvents()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

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

      {/* [MODAL] Announcement Detail (Read Only) */}
      <Modal
        isOpen={showAnnouncementDetailModal}
        onClose={() => setShowAnnouncementDetailModal(false)}
        title="Announcement Details"
        type="info"
        confirmText="Close"
        onConfirm={() => setShowAnnouncementDetailModal(false)}
        isCancelable={false}
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
        </div>
      </Modal>

      {/* [MODAL] Event Detail (Read Only) */}
      <Modal
        isOpen={showEventDetailModal}
        onClose={() => setShowEventDetailModal(false)}
        title="Event Details"
        type="info"
        confirmText="Close"
        onConfirm={() => setShowEventDetailModal(false)}
        isCancelable={false}
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
          </div>
        </div>
      </Modal>

      {/* [LAYOUT] Adviser Page */}
      <PageLayout header={<span className="page-title">Announcements & Events</span>}>
        <div className="space-y-8">

          {/* [SECTION] Announcements */}
          <section className="space-y-3">
            <div className="bg-[var(--color-primary-700)] text-[var(--color-text-50)] px-4 py-3 rounded-md shadow-md">
              <h2 className="text-xl font-bold uppercase tracking-wide">Announcements</h2>
            </div>

            {/* [TOOLBAR] Search + Sort + Filter */}
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
                  subtitle="Check back later for new school updates."
                />
              </div>
            )}
          </section>

          {/* [SECTION] Upcoming Events */}
          <section className="space-y-3">
            <div className="bg-[var(--color-secondary-600)] text-[var(--color-text-50)] px-4 py-3 rounded-md shadow-md">
              <h2 className="text-xl font-bold uppercase tracking-wide">Upcoming Events</h2>
            </div>

            {/* [TOOLBAR] Search + Sort + Filter */}
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
                  subtitle="Stay tuned for upcoming activities and school events."
                />
              </div>
            )}
          </section>

        </div>
      </PageLayout>
    </>
  );
};

export default AdviserAnnouncementsAndEvents;