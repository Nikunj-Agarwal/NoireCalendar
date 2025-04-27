import { useMemo } from "react";
import { 
  format, 
  getDate, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  startOfDay,
  endOfDay,
  areIntervalsOverlapping
} from "date-fns";
import { motion } from "framer-motion";
import { Event } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface YearViewProps {
  currentDate: Date;
  events: Event[];
  isLoading: boolean;
  onMonthClick?: (date: Date) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const YearView = ({ currentDate, events, isLoading, onMonthClick }: YearViewProps) => {
  const currentYear = currentDate.getFullYear();
  
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      return date;
    });
  }, [currentYear]);
  
  // Get events for a specific month
  const getEventsForMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    return events.filter(event => 
      areIntervalsOverlapping(
        { start: monthStart, end: monthEnd },
        { start: new Date(event.startDate), end: new Date(event.endDate) }
      )
    );
  };
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    if (!day) return [];
    
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    return events.filter(event => 
      areIntervalsOverlapping(
        { start: dayStart, end: dayEnd },
        { start: new Date(event.startDate), end: new Date(event.endDate) }
      )
    );
  };

  const getDaysInMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get days from previous month to fill the calendar
    const startDay = monthStart.getDay();
    
    // Add empty slots for days before the start of the month
    const calendarDays = Array(startDay).fill(null).concat(days);
    
    // Add any additional days to make the total a multiple of 7
    const remaining = (7 - (calendarDays.length % 7)) % 7;
    return calendarDays.concat(Array(remaining).fill(null));
  };

  // Handle month click to navigate to month view
  const handleMonthClick = (month: Date) => {
    if (onMonthClick) {
      onMonthClick(month);
    }
  };
  
  // Render month with event indicators
  const renderMonth = (month: Date, index: number) => {
    const monthDays = getDaysInMonth(month);
    const eventsForMonth = getEventsForMonth(month);
    
    if (isLoading) {
      return (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{ duration: 0.3 }}
          className="bg-card rounded-lg shadow-sm p-4"
        >
          <Skeleton className="h-6 w-20 mx-auto mb-2" />
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array(7).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-4 w-4 mx-auto" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(35).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-6 w-6 mx-auto rounded-full" />
            ))}
          </div>
        </motion.div>
      );
    }
    
    return (
      <motion.div
        key={index}
        variants={itemVariants}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="bg-card rounded-lg shadow-sm p-4 transition-all duration-300 cursor-pointer hover:shadow-md border border-secondary/20"
        onClick={() => handleMonthClick(month)}
        aria-label={`View ${format(month, 'MMMM yyyy')}`}
      >
        <h3 className="text-lg font-medium text-center mb-2">
          {format(month, 'MMMM')}
          {eventsForMonth.length > 0 && (
            <span className="ml-2 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">
              {eventsForMonth.length}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
          <div className="text-center">S</div>
          <div className="text-center">M</div>
          <div className="text-center">T</div>
          <div className="text-center">W</div>
          <div className="text-center">T</div>
          <div className="text-center">F</div>
          <div className="text-center">S</div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {monthDays.map((day, dayIndex) => {
            if (!day) {
              return (
                <div 
                  key={`empty-${dayIndex}`} 
                  className="text-center p-1 text-muted-foreground opacity-40"
                ></div>
              );
            }
            
            const isCurrentMonth = isSameMonth(day, month);
            const isCurrentDay = isToday(day);
            const eventsForDay = getEventsForDay(day);
            const hasEvents = eventsForDay.length > 0;
            
            return (
              <div 
                key={dayIndex} 
                className={`text-center p-1 relative ${
                  !isCurrentMonth ? 'text-muted-foreground opacity-40' : ''
                }`}
              >
                <div className={`${
                  isCurrentDay 
                    ? 'bg-red-500 text-white rounded-full w-5 h-5 mx-auto shadow-[0_0_5px_rgba(255,0,0,0.5)] flex items-center justify-center font-bold' 
                    : ''
                }`}>
                  {getDate(day)}
                </div>
                {hasEvents && isCurrentMonth && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };
  
  return (
    <motion.div 
      className="view-container pb-4 h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="h-full overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map((month, index) => renderMonth(month, index))}
        </div>
      </div>
    </motion.div>
  );
};

export default YearView;
