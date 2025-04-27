import { useState, useEffect, useCallback } from "react";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import BottomNavigation from "@/components/calendar/BottomNavigation";
import YearView from "@/components/calendar/YearView";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import SettingsMenu from "@/components/calendar/SettingsMenu";
import EventCreationModal from "@/components/calendar/EventCreationModal";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear,
  startOfDay,
  endOfDay,
  format,
  addDays
} from "date-fns";

type CalendarViewType = "year" | "month" | "week" | "day";

// Interface for the Event format expected by the Modal component
interface ModalEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  color?: string;
  allDay?: boolean;
  start: Date;
  end: Date;
  notifications?: boolean;
}

const Calendar = () => {
  // States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewType>("month");
  const [showSettings, setShowSettings] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ModalEvent | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Calculate date range based on current view and date
  const getDateRange = useCallback(() => {
    let start, end;
    
    switch (view) {
      case "year":
        start = startOfYear(currentDate);
        end = endOfYear(currentDate);
        break;
      case "month":
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case "week":
        start = startOfWeek(currentDate, { weekStartsOn: 0 });
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
        break;
      case "day":
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        break;
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
    }
    
    return { start, end };
  }, [currentDate, view]);
  
  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { start, end } = getDateRange();
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      
      const response = await fetch(`/api/events?start=${startStr}&end=${endStr}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error loading events",
        description: "Could not load your calendar events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, toast]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      
      switch (view) {
        case "year":
          newDate.setFullYear(newDate.getFullYear() - 1);
          break;
        case "month":
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "day":
          newDate.setDate(newDate.getDate() - 1);
          break;
      }
      
      return newDate;
    });
  }, [view]);

  const handleNext = useCallback(() => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      
      switch (view) {
        case "year":
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
        case "month":
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "day":
          newDate.setDate(newDate.getDate() + 1);
          break;
      }
      
      return newDate;
    });
  }, [view]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Format current period label
  const getCurrentLabel = useCallback(() => {
    switch (view) {
      case "year":
        return format(currentDate, "yyyy");
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week": {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        const end = endOfWeek(currentDate, { weekStartsOn: 0 });
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      }
      case "day":
        return format(currentDate, "EEEE, MMM d, yyyy");
      default:
        return "";
    }
  }, [currentDate, view]);
  
  // Event handlers
  const toggleSettings = () => setShowSettings(!showSettings);
  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setIsEditing(false);
    setShowEventModal(true);
  };
  
  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(undefined);
    setIsEditing(false);
  };
  
  const handleEventCreated = () => {
    fetchEvents();
    setShowEventModal(false);
    setEditingEvent(undefined);
    setIsEditing(false);
  };
  
  const handleEventUpdated = () => {
    fetchEvents();
    setShowEventModal(false);
    setEditingEvent(undefined);
    setIsEditing(false);
  };
  
  const handleEventClick = (event: Event) => {
    // Transform the event to match the format expected by the modal
    const transformedEvent: ModalEvent = {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      color: event.color,
      allDay: event.allDay,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      // Use the notifications value from the event data or default to false
      notifications: event.notifications || false
    };
    
    setEditingEvent(transformedEvent);
    setIsEditing(true);
    setShowEventModal(true);
  };
  
  // Fetch events when date or view changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <motion.div 
      className="flex flex-col h-screen max-w-screen-xl mx-auto bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CalendarHeader 
        currentPeriod={getCurrentLabel()}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onSettingsClick={toggleSettings}
        onCreateEvent={handleCreateEvent}
      />
      
      <main className={`flex-1 overflow-auto ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="h-full flex flex-col">
          {view === "year" && (
            <YearView 
              currentDate={currentDate} 
              events={events} 
              isLoading={isLoading}
              onMonthClick={(date) => {
                setCurrentDate(date);
                setView("month");
              }}
            />
          )}
          {view === "month" && (
            <MonthView 
              currentDate={currentDate} 
              events={events} 
              isLoading={isLoading}
              onDayClick={(date) => {
                setCurrentDate(date);
                setView("day");
              }}
            />
          )}
          {view === "week" && (
            <WeekView 
              currentDate={currentDate} 
              events={events} 
              isLoading={isLoading}
              onDayClick={(date) => {
                setCurrentDate(date);
                setView("day");
              }}
              onEventClick={handleEventClick}
            />
          )}
          {view === "day" && (
            <DayView 
              currentDate={currentDate} 
              events={events} 
              isLoading={isLoading}
              onEventClick={handleEventClick}
            />
          )}
          
          {showSettings && (
            <SettingsMenu onClose={() => setShowSettings(false)} />
          )}
        </div>
      </main>
      
      {/* Event Creation/Edit Modal */}
      <EventCreationModal 
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
        date={currentDate}
        event={editingEvent}
        isEditing={isEditing}
      />
      
      <BottomNavigation 
        activeView={view} 
        onViewChange={(newView: CalendarViewType) => setView(newView)}
      />
    </motion.div>
  );
};

export default Calendar;
