import { useState, useCallback, useMemo, useEffect } from "react";
import { 
  addMonths, 
  addWeeks, 
  addDays, 
  subMonths, 
  subWeeks, 
  subDays, 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear,
  startOfDay,
  endOfDay
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";

type CalendarViewType = "year" | "month" | "week" | "day";

export const useCalendar = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewType>("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Navigate to previous period
  const handlePrevious = useCallback(() => {
    setCurrentDate((prevDate) => {
      switch (view) {
        case "year":
          return new Date(prevDate.getFullYear() - 1, 0, 1);
        case "month":
          return subMonths(prevDate, 1);
        case "week":
          return subWeeks(prevDate, 1);
        case "day":
          return subDays(prevDate, 1);
        default:
          return prevDate;
      }
    });
  }, [view]);
  
  // Navigate to next period
  const handleNext = useCallback(() => {
    setCurrentDate((prevDate) => {
      switch (view) {
        case "year":
          return new Date(prevDate.getFullYear() + 1, 0, 1);
        case "month":
          return addMonths(prevDate, 1);
        case "week":
          return addWeeks(prevDate, 1);
        case "day":
          return addDays(prevDate, 1);
        default:
          return prevDate;
      }
    });
  }, [view]);
  
  // Navigate to today
  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);
  
  // Get formatted period label
  const currentLabel = useMemo(() => {
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
  
  // Calculate date range for current view
  const dateRange = useMemo(() => {
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
  
  // Fetch events for the current date range
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { start, end } = dateRange;
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
  }, [dateRange, toast]);
  
  // Fetch events when date range changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  return {
    currentDate,
    view,
    setView,
    handlePrevious,
    handleNext,
    handleToday,
    currentLabel,
    events,
    isLoading,
    dateRange,
    fetchEvents
  };
};
