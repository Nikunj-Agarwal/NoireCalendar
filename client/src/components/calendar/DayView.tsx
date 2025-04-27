import { useMemo, useState, useEffect, useRef } from "react";
import { 
  format, 
  eachHourOfInterval, 
  startOfDay, 
  endOfDay, 
  isSameDay, 
  areIntervalsOverlapping,
  isSameHour,
  addHours,
  isWithinInterval,
  differenceInMinutes
} from "date-fns";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Event } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  isLoading: boolean;
  onEventClick?: (event: Event) => void;
}

const DayView = ({ currentDate, events, isLoading, onEventClick }: DayViewProps) => {
  const isMobile = useIsMobile();
  
  // State for managing notes editing
  const [editingHourIndex, setEditingHourIndex] = useState<number | null>(null);
  const [editingAllDay, setEditingAllDay] = useState(false);
  const [editingNote, setEditingNote] = useState('');
  const noteInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to determine if a color is light or dark
  const isColorLight = (hex: string) => {
    // Convert hex to RGB
    let r = 0, g = 0, b = 0;
    
    // 3 digits
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } 
    // 6 digits
    else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    
    // Counting the perceptive luminance
    // Human eye favors green color... 
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return true if light, false if dark
    return luminance > 0.5;
  };
  
  // Get hours of the day
  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    return eachHourOfInterval({ start: dayStart, end: dayEnd });
  }, [currentDate]);
  
  // Show all hours without filtering
  const displayHours = useMemo(() => {
    return hours;
  }, [hours]);
  
  // Filter events for all-day events
  const allDayEvents = useMemo(() => {
    return events.filter(event => event.allDay && 
      isWithinInterval(currentDate, { 
        start: new Date(event.startDate), 
        end: new Date(event.endDate) 
      })
    );
  }, [events, currentDate]);
  
  // Process timed events for the day view
  const processedEvents = useMemo(() => {
    // Filter out all-day events
    const timedEvents = events.filter(event => !event.allDay);
    
    // For each event, calculate its full time span
    return timedEvents.map(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const dayStart = startOfDay(currentDate);
      
      // Determine which hour this event starts in
      const eventStartHour = new Date(dayStart);
      eventStartHour.setHours(
        isSameDay(eventStart, currentDate) ? eventStart.getHours() : 0,
        isSameDay(eventStart, currentDate) ? eventStart.getMinutes() : 0, 
        0, 0
      );
      
      // Calculate total minutes from the start of the day
      const startMinutes = 
        (eventStartHour.getHours() * 60) + 
        eventStartHour.getMinutes();
      
      // Calculate the event's duration in minutes
      let durationMinutes = differenceInMinutes(eventEnd, eventStart);
      
      // If event ends on a different day, adjust duration to end at midnight
      if (!isSameDay(eventStart, eventEnd)) {
        const endOfCurrentDay = endOfDay(currentDate);
        durationMinutes = differenceInMinutes(endOfCurrentDay, eventStart);
      }
      
      // Calculate top position as percentage of day height (24h = 100%)
      const topPercentage = (startMinutes / (24 * 60)) * 100;
      
      // Calculate height as percentage of day height
      const heightPercentage = (durationMinutes / (24 * 60)) * 100;
      
      return {
        ...event,
        topPercentage,
        heightPercentage: Math.max(heightPercentage, 1), // Ensure minimum visibility
        displayStartTime: format(eventStart, 'h:mm a'),
        displayEndTime: format(eventEnd, 'h:mm a')
      };
    }).filter(event => {
      // Only include events that actually have some part during this day
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return areIntervalsOverlapping(
        { start: startOfDay(currentDate), end: endOfDay(currentDate) },
        { start: eventStart, end: eventEnd }
      );
    });
  }, [events, currentDate]);
  
  // Render the events that span their full duration
  const renderProcessedEvents = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 p-2">
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }
    
    if (processedEvents.length === 0) {
      return null;
    }
    
    return processedEvents.map(event => {
      // Determine if this is a light color that needs dark text
      const colorHex = event.color || '#3498db';
      const isLightColor = isColorLight(colorHex);
      
      return (
        <div
          key={`event-${event.id}`}
          className={`absolute right-2 rounded-md px-3 py-2 overflow-hidden text-xs shadow-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${isLightColor ? 'text-gray-900' : 'text-white'}`}
          style={{
            top: `${event.topPercentage}%`,
            height: `${event.heightPercentage}%`,
            left: 0,
            backgroundColor: colorHex,
            zIndex: 10
          }}
          onClick={() => onEventClick && onEventClick(event)}
        >
          <div className="font-bold truncate text-sm flex flex-col mb-1">
            <span>{event.title}</span>
            <span className={`text-[10px] ${isLightColor ? 'text-gray-700' : 'text-white/80'} mt-1`}>
              {event.displayStartTime} - {event.displayEndTime}
            </span>
          </div>
          {!isMobile && event.location && (
            <div className={`text-xs ${isLightColor ? 'text-gray-700' : 'text-white/80'} truncate`}>
              {event.location}
            </div>
          )}
        </div>
      );
    });
  };
  
  // Handle note clicking and editing for time slots
  const handleNoteClick = (hourIndex: number) => {
    setEditingAllDay(false);
    setEditingHourIndex(hourIndex);
    setEditingNote('');
    
    // Focus the input field after a short delay
    setTimeout(() => {
      if (noteInputRef.current) {
        noteInputRef.current.focus();
      }
    }, 50);
  };
  
  // Handle all-day note clicking
  const handleAllDayNoteClick = () => {
    setEditingHourIndex(null);
    setEditingAllDay(true);
    setEditingNote('');
    
    // Focus the input field after a short delay
    setTimeout(() => {
      if (noteInputRef.current) {
        noteInputRef.current.focus();
      }
    }, 50);
  };
  
  // Handle note submission
  const handleNoteSubmit = () => {
    if (editingNote.trim()) {
      // In a real implementation, this would save to the database
      if (editingHourIndex !== null) {
        console.log(`Note for hour ${editingHourIndex}: ${editingNote}`);
      } else if (editingAllDay) {
        console.log(`All-day note: ${editingNote}`);
      }
      
      // Reset editing state
      setEditingHourIndex(null);
      setEditingAllDay(false);
      setEditingNote('');
    }
  };
  
  // Handle key press in the input field
  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNoteSubmit();
    } else if (e.key === 'Escape') {
      setEditingHourIndex(null);
      setEditingAllDay(false);
      setEditingNote('');
    }
  };
  
  return (
    <motion.div 
      className="view-container flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Day header */}
      <div className="text-center py-4 sm:py-6 sticky top-0 bg-card border-b border-secondary z-10 rounded-t-lg shadow-sm">
        <div className="text-xl sm:text-2xl font-bold text-white">{format(currentDate, 'EEEE, MMMM d')}</div>
      </div>
      
      {/* All-day events */}
      <div className="bg-secondary/20 rounded-md p-4 mb-4 sm:mb-6 border border-secondary/30">
        <div className="text-base text-white font-medium mb-2">All-day Notes</div>
        {isLoading ? (
          <Skeleton className="h-8 w-full bg-secondary/20" />
        ) : (
          <div className="cursor-text" onClick={handleAllDayNoteClick}>
            {editingAllDay ? (
              <div className="w-full py-1">
                <input
                  ref={noteInputRef}
                  type="text"
                  className="w-full bg-transparent text-white border-b border-white/30 p-2 focus:outline-none focus:border-primary"
                  placeholder="Add an all-day note..."
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  onBlur={handleNoteSubmit}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allDayEvents.map((event, idx) => {
                  const colorHex = event.color || '#3498db';
                  const isLightColor = isColorLight(colorHex);
                  
                  return (
                    <div
                      key={idx}
                      className={`text-sm px-3 py-2 rounded-md font-medium shadow-sm cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${isLightColor ? 'text-gray-900' : 'text-white'}`}
                      style={{ backgroundColor: colorHex }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        onEventClick && onEventClick(event);
                      }}
                    >
                      {event.title}
                    </div>
                  );
                })}
                {allDayEvents.length === 0 && (
                  <div className="text-sm text-muted-foreground py-1 italic">Click to add all-day note...</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Time slots */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="rounded-md border border-secondary/30 overflow-hidden relative">
          {/* Timed events overlay positioned to not cover the time column */}
          <div className="absolute inset-0 left-[80px] sm:left-[100px] z-20">
            {renderProcessedEvents()}
          </div>
          
          {/* Time slots with hour markers */}
          {displayHours.map((hour, i) => (
            <motion.div 
              key={i} 
              className="flex border-b border-secondary/50 hover:bg-secondary/10 transition-colors duration-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <div className="w-16 sm:w-20 text-right pr-3 py-3 text-sm sm:text-base text-white font-medium bg-secondary/20 z-10">
                {format(hour, 'h a')}
              </div>
              <div className="flex-1 min-h-[60px] sm:min-h-[80px] relative p-2">
                <div className="w-full h-full flex items-center">
                  {/* Empty hour slot for event placement */}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DayView;
