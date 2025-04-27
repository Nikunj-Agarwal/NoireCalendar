import { ChevronLeft, ChevronRight, Settings, CalendarDays, PlusSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarHeaderProps {
  currentPeriod: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onSettingsClick: () => void;
  onCreateEvent: () => void;
}

const CalendarHeader = ({
  currentPeriod,
  onPrevious,
  onNext,
  onToday,
  onSettingsClick,
  onCreateEvent
}: CalendarHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className="flex flex-col border-b border-secondary py-4 px-4 sm:px-6 bg-secondary/10 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              className="flex items-center gap-2 p-0 hover:bg-transparent"
              onClick={onCreateEvent}
            >
              <CalendarDays className="h-6 w-6 mr-1 text-white" />
              <span className="text-lg font-bold text-white tracking-tight mr-1">Make Event</span>
              <Plus className="h-4 w-4 text-white bg-white/20 rounded-full p-0.5" />
            </Button>
          </motion.div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToday}
            className="rounded-full border-white text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-medium px-4"
          >
            Today
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSettingsClick}
            className="rounded-full w-10 h-10 bg-card hover:bg-secondary hover:text-white transition-all duration-300 border border-secondary"
          >
            <Settings className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between py-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onPrevious}
          className="rounded-full w-9 h-9 hover:bg-white hover:text-black transition-all duration-300 border border-secondary"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </Button>
        
        <motion.span 
          key={currentPeriod}
          className="text-xl sm:text-2xl font-bold px-4 text-white tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          {currentPeriod}
        </motion.span>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onNext}
          className="rounded-full w-9 h-9 hover:bg-white hover:text-black transition-all duration-300 border border-secondary"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </Button>
      </div>
    </header>
  );
};

export default CalendarHeader;
