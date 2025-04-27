import { useMemo, useState, useEffect } from "react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  eachHourOfInterval, 
  startOfDay, 
  endOfDay, 
  isSameDay,
  isSameHour,
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes
} from "date-fns";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Event } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  isLoading: boolean;
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

const WeekView = ({ currentDate, events, isLoading, onDayClick, onEventClick }: WeekViewProps) => {
  const isMobile = useIsMobile();
  
  // Get the week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);
  
  // Get hours of the day
  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    return eachHourOfInterval({ start: dayStart, end: dayEnd });
  }, [currentDate]);
  
  // Current time for display
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
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
  
  // Filter hours for mobile to show only business hours by default
  const displayHours = useMemo(() => {
    // Show all hours - mobile now shows all hours too for complete view
    return hours;
  }, [hours]);
  
  // For mobile, limit the days shown
  const displayDays = useMemo(() => {
    if (!isMobile) return weekDays;
    
    // Find today or the closest day in the week
    const todayIndex = weekDays.findIndex(day => isSameDay(day, new Date()));
    
    if (todayIndex !== -1) {
      // If today is in the week, show 3 days centered on today
      const startIndex = Math.max(0, Math.min(todayIndex - 1, weekDays.length - 3));
      return weekDays.slice(startIndex, startIndex + 3);
    } else {
      // If today is not in the week, show first 3 days
      return weekDays.slice(0, 3);
    }
  }, [weekDays, isMobile]);
  
  // Process timed events for the week view
  const processedEvents = useMemo(() => {
    // Group events by day
    const eventsByDay = new Map<string, any[]>();
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day);
      
      // Filter events for this specific day that are not all-day
      const dayEvents = events.filter(event => {
        if (event.allDay) return false;
        
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        return areIntervalsOverlapping(
          { start: dayStart, end: endOfDay(day) },
          { start: eventStart, end: eventEnd }
        );
      });
      
      // Process each event for its correct position on this day
      const processedDayEvents = dayEvents.map(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        // Determine which hour this event starts in for this day
        const eventStartHour = new Date(dayStart);
        eventStartHour.setHours(
          isSameDay(eventStart, day) ? eventStart.getHours() : 0,
          isSameDay(eventStart, day) ? eventStart.getMinutes() : 0, 
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
          const endOfCurrentDay = endOfDay(day);
          durationMinutes = differenceInMinutes(endOfCurrentDay, eventStart);
        }
        
        // Calculate top position as percentage of day height
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
      });
      
      eventsByDay.set(dayKey, processedDayEvents);
    });
    
    return eventsByDay;
  }, [weekDays, events]);
  
  // Get all-day events for a specific day
  const getAllDayEventsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    return events.filter(event => 
      event.allDay && 
      areIntervalsOverlapping(
        { start: dayStart, end: dayEnd },
        { start: new Date(event.startDate), end: new Date(event.endDate) }
      )
    );
  };
  
  // Calculate position and height for an event in the hour slot
  const getEventStyles = (event: Event, day: Date, hour: Date) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    const dayStart = startOfDay(day);
    const hourStart = new Date(dayStart);
    hourStart.setHours(hour.getHours(), 0, 0, 0);
    const hourEnd = addHours(hourStart, 1);
    
    // Calculate how many minutes from the start of the hour
    // this is used for the top position
    let topOffset = 0;
    if (
      isSameDay(eventStart, day) && 
      isSameHour(eventStart, hourStart)
    ) {
      topOffset = eventStart.getMinutes();
    }
    
    // Calculate the height based on duration within this hour
    let duration = 60; // default to full hour
    
    if (
      isSameDay(eventStart, day) && 
      isSameHour(eventStart, hourStart)
    ) {
      if (
        isSameDay(eventEnd, day) && 
        isSameHour(eventEnd, hourStart)
      ) {
        // Event starts and ends in this hour
        duration = differenceInMinutes(eventEnd, eventStart);
      } else {
        // Event starts in this hour but ends later
        duration = 60 - eventStart.getMinutes();
      }
    } else if (
      isSameDay(eventEnd, day) && 
      isSameHour(eventEnd, hourStart)
    ) {
      // Event ends in this hour
      duration = eventEnd.getMinutes();
    }
    
    // Minimum height to ensure visibility
    duration = Math.max(duration, 15);
    
    return {
      top: `${(topOffset / 60) * 100}%`,
      height: `${(duration / 60) * 100}%`,
      backgroundColor: event.color || '#3498db',
    };
  };
  
  // Render the processed events for a day
  const renderProcessedEventsForDay = (day: Date) => {
    if (isLoading) {
      return (
        <Skeleton className="h-20 w-full absolute left-0 right-0 top-1" />
      );
    }
    
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayEvents = processedEvents.get(dayKey) || [];
    
    if (dayEvents.length === 0) {
      return null;
    }
    
    return dayEvents.map(event => {
      // Determine if this is a light color that needs dark text
      const colorHex = event.color || '#3498db';
      const isLightColor = isColorLight(colorHex);
      
      return (
        <div
          key={`event-${event.id}-${dayKey}`}
          className={`absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden text-xs z-20 shadow-md transition-all duration-200 hover:opacity-90 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isLightColor ? 'text-gray-900' : 'text-white'}`}
          style={{
            top: `${event.topPercentage}%`,
            height: `${event.heightPercentage}%`,
            backgroundColor: colorHex,
          }}
          onClick={() => onEventClick && onEventClick(event)}
        >
          <div className="font-medium truncate text-xs flex flex-col">
            <span className="truncate">{event.title}</span>
            <span className={`text-[9px] ${isLightColor ? 'text-gray-700' : 'text-white/80'}`}>
              {event.displayStartTime}
            </span>
          </div>
        </div>
      );
    });
  };
  
  // Render all day events for a day header
  const renderAllDayEventsForDay = (day: Date) => {
    if (isLoading) {
      return null;
    }
    
    const allDayEvents = getAllDayEventsForDay(day);
    if (allDayEvents.length === 0) return null;
    
    // If there's just one event, show a mini pill with the event
    if (allDayEvents.length === 1) {
      const event = allDayEvents[0];
      const colorHex = event.color || '#3498db';
      const isLightColor = isColorLight(colorHex);
      
      return (
        <div 
          className="absolute bottom-0 left-0 right-0 text-center px-1"
          onClick={(e) => {
            e.stopPropagation(); // Don't trigger day click
            onEventClick && onEventClick(event);
          }}
        >
          <div 
            className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer ${isLightColor ? 'text-gray-900' : 'text-white'}`}
            style={{ backgroundColor: colorHex }}
          >
            {event.title}
          </div>
        </div>
      );
    }
    
    // If there are multiple events, show a count indicator
    return (
      <div 
        className="absolute top-1 right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation(); // Don't trigger day click
          // Click on the first event as an example
          onEventClick && onEventClick(allDayEvents[0]);
        }}
      >
        {allDayEvents.length}
      </div>
    );
  };
  
  return (
    <motion.div 
      className="view-container overflow-x-auto overflow-y-auto"
      style={{ height: 'calc(100vh - 180px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`week-container ${isMobile ? 'min-w-full' : 'min-w-[800px]'} rounded-xl overflow-hidden shadow-md bg-black/20 backdrop-blur-sm`}>
        {/* Time column */}
        <div className="border-r border-secondary/30 sticky left-0 bg-gradient-to-b from-card to-card/90 backdrop-blur-sm z-20">
          <div className="h-12 sm:h-14 sticky top-0 bg-black/60 rounded-tl-xl shadow-sm flex items-center justify-center">
            <span className="text-xs font-semibold text-white">TIME</span>
          </div> 
          {displayHours.map((hour, i) => (
            <div 
              key={i} 
              className="h-12 sm:h-16 pr-1 sm:pr-3 text-right text-xs sm:text-sm text-white/90 font-medium flex items-center justify-end bg-black/30"
            >
              <div className="flex flex-row sm:flex-col items-center sm:items-end">
                <span className="text-white font-bold text-[10px] sm:text-sm">{format(hour, 'h')}</span>
                <span className="text-white text-[9px] sm:text-xs ml-0.5 sm:ml-0">{format(hour, 'a')}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Day columns */}
        {displayDays.map((day, dayIndex) => {
          const isToday = isSameDay(day, new Date());
          const isLastColumn = dayIndex === displayDays.length - 1;
          
          const handleDayClick = () => {
            if (onDayClick) {
              onDayClick(day);
            }
          };
          
          return (
            <div key={dayIndex} className={`border-r border-secondary/20 ${isLastColumn ? 'rounded-tr-xl' : ''} bg-background/60 backdrop-blur-sm relative`}>
              {/* Processed events that span multiple hours */}
              {renderProcessedEventsForDay(day)}
              {/* Day header */}
              <motion.div 
                className={`h-12 sm:h-14 flex flex-col items-center justify-center relative 
                  ${isToday 
                    ? 'bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.4)] text-white border-b-2 border-b-white' 
                    : 'bg-card/60 backdrop-blur-sm border-b border-secondary/30'
                  }
                  cursor-pointer hover:bg-secondary/30 transition-all duration-200
                  sticky top-0 z-10 ${isLastColumn ? 'rounded-tr-xl' : ''} shadow-md
                  ${isToday 
                    ? 'border-l-2 border-r-2 border-l-primary border-r-primary font-bold' 
                    : ''
                  }
                `}
                onClick={handleDayClick}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`text-xs sm:text-sm ${isToday ? 'text-white font-semibold' : 'text-muted-foreground font-medium'}`}>{format(day, 'EEE')}</div>
                <div className={`text-sm sm:text-lg ${isToday ? 'text-white font-bold' : 'font-semibold'}`}>{format(day, 'd')}</div>
                {isToday && <div className="w-8 h-0.5 bg-white mt-1 rounded-full"></div>}
                {renderAllDayEventsForDay(day)}
              </motion.div>
              
              {/* Time slots */}
              {displayHours.map((hour, hourIndex) => {
                const isLastHour = hourIndex === displayHours.length - 1;
                const isEvenHour = hourIndex % 2 === 0;
                
                return (
                  <div 
                    key={hourIndex} 
                    className={`h-12 sm:h-16 border-b border-secondary/20 relative group
                      ${isLastHour && isLastColumn ? 'rounded-br-xl' : ''}
                      ${isLastHour && dayIndex === 0 ? 'rounded-bl-xl' : ''}
                      ${isToday ? 'bg-white/10' : isEvenHour ? 'bg-black/10' : 'bg-black/5'}
                      hover:bg-secondary/10 transition-all duration-300
                    `}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 
                      ${isToday ? 'bg-gradient-to-r from-transparent via-primary/10 to-transparent' : 'bg-gradient-to-r from-transparent via-white/5 to-transparent'} 
                      transition-opacity duration-500`}></div>
                    
                    {isToday && (
                      <>
                        <div className="absolute left-0 w-1 h-full bg-primary/50"></div>
                        <div className="absolute right-0 w-1 h-full bg-primary/50"></div>
                        
                        {/* Current time indicator */}
                        {isSameHour(hour, currentTime) && (
                          <div 
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 flex items-center"
                            style={{ 
                              top: `${(currentTime.getMinutes() / 60) * 100}%`,
                              boxShadow: '0 0 8px rgba(255, 0, 0, 0.8)'
                            }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-lg"></div>
                            <div className="text-xs text-red-500 absolute -left-8 -mt-3 font-bold">
                              {format(currentTime, 'h:mm')}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Hour specific content */}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeekView;
