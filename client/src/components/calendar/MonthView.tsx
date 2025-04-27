import { useMemo, useState, useEffect } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isToday, 
  isSameDay, 
  eachDayOfInterval,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
  startOfDay,
  endOfDay
} from "date-fns";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Event, CalendarSettings } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  isLoading: boolean;
  onDayClick?: (date: Date) => void;
}

const dayVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const MonthView = ({ currentDate, events, isLoading, onDayClick }: MonthViewProps) => {
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<CalendarSettings>({
    theme: "dark",
    startOfWeek: "sunday",
    timeFormat: "12h",
    eventDisplayMode: "dots",
  });
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        // Keep using default settings if there's an error
      }
    };
    
    fetchSettings();
  }, []);
  
  const calendarDays = useMemo(() => {
    // Get the start and end of the month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Get the start of the first week and end of the last week
    // to have a complete calendar grid
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    // Get all days in the interval
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);
  
  // Group days into weeks for the grid
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    let week = [];
    
    for (let i = 0; i < calendarDays.length; i++) {
      week.push(calendarDays[i]);
      
      // If it's the last day of the week or the last day overall
      if (calendarDays[i].getDay() === 6 || i === calendarDays.length - 1) {
        weeks.push(week);
        week = [];
      }
    }
    
    return weeks;
  }, [calendarDays]);

  // For mobile view, show more weeks
  const filteredWeeks = useMemo(() => {
    if (!isMobile) return calendarWeeks;
    
    // Show 4 weeks of the month instead of just the current week
    // First find weeks that contain days in the current month
    const weeksInCurrentMonth = calendarWeeks.filter(week => 
      week.some(day => day && isSameMonth(day, currentDate))
    );
    
    return weeksInCurrentMonth;
  }, [calendarWeeks, currentDate, isMobile]);
  
  const displayWeeks = useMemo(() => {
    return isMobile 
      ? (filteredWeeks.length ? filteredWeeks : [calendarWeeks[0]]) 
      : calendarWeeks;
  }, [isMobile, filteredWeeks, calendarWeeks]);
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    return events.filter(event => 
      areIntervalsOverlapping(
        { start: dayStart, end: dayEnd }, 
        { start: new Date(event.startDate), end: new Date(event.endDate) }
      )
    );
  };
  
  // Render event dots or compact event items
  const renderEvents = (day: Date) => {
    const eventsForDay = getEventsForDay(day);
    
    if (isLoading) {
      return (
        <div className="space-y-1 mt-1">
          <Skeleton className="h-3 w-12 bg-muted" />
          {!isMobile && <Skeleton className="h-3 w-10 bg-muted" />}
        </div>
      );
    }
    
    if (eventsForDay.length === 0) {
      return null;
    }
    
    // Different display modes based on settings
    switch (settings.eventDisplayMode) {
      case "dots":
        return (
          <div className="mt-1 flex flex-wrap gap-1 justify-center">
            {eventsForDay.slice(0, 5).map((event, idx) => (
              <div 
                key={idx} 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: event.color || '#ffffff' }}
                title={event.title}
              />
            ))}
            {eventsForDay.length > 5 && (
              <div className="text-xs text-white/70 ml-1">+{eventsForDay.length - 5}</div>
            )}
          </div>
        );
        
      case "color":
        return (
          <div className="mt-1 flex flex-wrap gap-1">
            {eventsForDay.slice(0, isMobile ? 2 : 4).map((event, idx) => (
              <div 
                key={idx} 
                className="w-full h-1.5 rounded-sm"
                style={{ backgroundColor: event.color || '#ffffff' }}
                title={event.title}
              />
            ))}
            {eventsForDay.length > (isMobile ? 2 : 4) && (
              <div className="text-xs text-white/70">+{eventsForDay.length - (isMobile ? 2 : 4)}</div>
            )}
          </div>
        );
        
      case "box":
        return (
          <div className="mt-1 space-y-1 text-xs">
            {eventsForDay.slice(0, isMobile ? 1 : 2).map((event, idx) => (
              <div 
                key={idx} 
                className="truncate rounded px-1 py-0.5"
                style={{ 
                  backgroundColor: event.color ? `${event.color}55` : 'rgba(255,255,255,0.2)',
                  color: '#ffffff'
                }}
              >
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {eventsForDay.length > (isMobile ? 1 : 2) && (
              <div className="text-xs text-white/70">+{eventsForDay.length - (isMobile ? 1 : 2)}</div>
            )}
          </div>
        );
        
      case "text":
      default:
        return (
          <div className="mt-1 space-y-1 text-xs">
            {eventsForDay.slice(0, isMobile ? 1 : 2).map((event, idx) => (
              <div 
                key={idx} 
                className="truncate rounded px-1 py-0.5 flex items-center"
                style={{ 
                  backgroundColor: event.color ? `${event.color}33` : 'rgba(255,255,255,0.1)', 
                  borderLeft: `3px solid ${event.color || '#ffffff'}`,
                  color: '#ffffff'
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0"
                    style={{ backgroundColor: event.color || '#ffffff' }} />
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {eventsForDay.length > (isMobile ? 1 : 2) && (
              <div className="text-xs text-white/70 pl-1">
                +{eventsForDay.length - (isMobile ? 1 : 2)} more
              </div>
            )}
          </div>
        );
    }
  };
  
  return (
    <motion.div 
      className="view-container overflow-hidden h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Weekday Headers */}
      <div className="month-grid mb-3 font-semibold text-foreground bg-secondary/30 rounded-lg py-2 sticky top-0 gap-1 sm:gap-3">
        <div className="text-center py-3 px-1 text-base text-white font-bold relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-white/10">{isMobile ? "S" : "Sun"}</div>
        <div className="text-center py-3 px-1 text-base text-white font-bold relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-white/10">{isMobile ? "M" : "Mon"}</div>
        <div className="text-center py-3 px-1 text-base text-white font-bold relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-white/10">{isMobile ? "T" : "Tue"}</div>
        <div className="text-center py-3 px-1 text-base text-white font-bold relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-white/10">{isMobile ? "W" : "Wed"}</div>
        <div className="text-center py-3 px-1 text-base text-white font-bold relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-white/10">{isMobile ? "T" : "Thu"}</div>
        <div className="text-center py-3 px-1 text-base text-white font-bold relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-white/10">{isMobile ? "F" : "Fri"}</div>
        <div className="text-center py-3 px-1 text-base text-white font-bold">{isMobile ? "S" : "Sat"}</div>
      </div>
      
      {/* Calendar Grid */}
      <div className="month-grid gap-1 sm:gap-3 flex-grow">
        {displayWeeks.flat().map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelectedDay = isToday(day);
          const eventsForDay = getEventsForDay(day);
          const hasEvents = eventsForDay.length > 0;
          
          const handleClick = () => {
            if (onDayClick && isCurrentMonth) {
              onDayClick(day);
            }
          };
          
          return (
            <motion.div
              key={index}
              variants={dayVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: index * 0.01 }}
              className={`calendar-day flex flex-col p-2 sm:p-3 rounded-lg shadow-sm cursor-pointer
                ${!isCurrentMonth ? 'opacity-30 pointer-events-none bg-card/50' : 'bg-card'}
                ${isSelectedDay ? 'day-selected bg-white/10 border-2 border-white' : ''}
                ${hasEvents ? 'hover:border border-white/50' : ''}
                ${!isCurrentMonth ? 'bg-opacity-60' : ''}
                h-full
              `}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClick}
              aria-label={`View events for ${format(day, 'MMM d, yyyy')}`}
            >
              <span className={`text-base sm:text-lg mb-1 font-medium ${isSelectedDay ? 'text-white' : ''}`}>
                {format(day, 'd')}
              </span>
              <div className="flex-1 overflow-y-auto">
                {renderEvents(day)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MonthView;
