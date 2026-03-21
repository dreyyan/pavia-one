import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal"; // Ensure this path is correct

// --- Interfaces ---
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

const AdviserNotificationsPage: React.FC = () => {
  // --- 1. State Management ---
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleEvents, setVisibleEvents] = useState(3);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

  // --- 2. Backend Linking (Empty by Default) ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            setIsLoading(true);

            // 1. Fetch from your real backend URL
            const response = await fetch("https://your-api-endpoint.ph/api/notifications");
            
            // 2. Convert to JSON
            const data = await response.json();

            // 3. Update the state with real data from the database
            setAnnouncements(data.announcements || []);
            setEvents(data.events || []);

        } catch (error) {
            console.error("Connection failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchData();
  }, []);

  // --- 3. Handlers ---
  const handleSeeMoreEvents = () => setVisibleEvents((prev) => prev + 3);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-[#0055a5] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#0055a5] font-medium animate-pulse">Checking for updates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto shadow-sm border-x border-gray-100">
      
      <main className="flex-1 p-4 space-y-8 pb-10">
        
        {/* --- ANNOUNCEMENTS SECTION --- */}
        <section>
          <div className="bg-[#0055a5] text-white p-4 rounded-md mb-4 shadow-md">
            <h2 className="text-xl font-bold uppercase tracking-wide">Announcements</h2>
          </div>
          
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((item) => (
                <div key={item.id} className="bg-[#f2f2f2] border border-gray-300 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-500 mb-1">{item.date}</p>
                  <p className="font-bold text-gray-800 leading-tight">{item.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <span className="text-3xl block mb-2 opacity-30">📢</span>
              <p className="text-gray-400 italic text-sm">No announcements posted yet.</p>
            </div>
          )}
        </section>

        {/* --- UPCOMING EVENTS SECTION --- */}
        <section>
          <div className="bg-[#cc8e00] text-white p-4 rounded-md mb-4 shadow-md">
            <h2 className="text-xl font-bold uppercase tracking-wide">Upcoming Events</h2>
          </div>
          
          {events.length > 0 ? (
            <>
              <div className="space-y-3">
                {events.slice(0, visibleEvents).map((event) => (
                  <div 
                    key={event.id} 
                    onClick={() => { setSelectedEvent(event); setIsModalOpen(true); }}
                    className="flex bg-[#f2f2f2] border border-gray-300 rounded-xl overflow-hidden shadow-sm hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-gray-300 min-w-[80px] bg-gray-50">
                      <span className="text-xs text-gray-500 font-bold uppercase">{event.month}</span>
                      <span className="text-3xl font-black text-gray-800">{event.day}</span>
                    </div>
                    <div className="p-4 flex items-center">
                      <p className="font-bold text-gray-800 text-sm leading-snug">{event.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              {visibleEvents < events.length && (
                <button 
                  onClick={handleSeeMoreEvents}
                  className="w-full text-center text-gray-500 underline text-sm mt-6 font-medium hover:text-[#cc8e00]"
                >
                  See More Events
                </button>
              )}
            </>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <span className="text-3xl block mb-2 opacity-30">🗓️</span>
              <p className="text-gray-400 italic text-sm">No upcoming events scheduled.</p>
            </div>
          )}
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#0055a5] text-white p-6 text-center space-y-3 mt-auto">
        <h2 className="text-xl font-bold italic border-b border-blue-400 pb-2 inline-block">
          Pavia|<span className="font-light">ONE</span>
        </h2>
        <p className="text-[10px] opacity-70 italic font-light">© 2026 PaviaOne. All rights reserved.</p>
        <div className="text-[10px] space-y-1 opacity-80">
          <p>Need help? Contact support@paviaone.ph</p>
        </div>
      </footer>

      {/* --- MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Event Details"
        type="info"
        confirmText="Close"
      >
        <div className="p-1">
          <p className="text-blue-600 font-bold text-sm mb-1">{selectedEvent?.month} {selectedEvent?.day}</p>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedEvent?.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {selectedEvent?.description || "No specific details available at this time."}
          </p>
        </div>
      </Modal>

    </div>
  );
};

export default AdviserNotificationsPage;