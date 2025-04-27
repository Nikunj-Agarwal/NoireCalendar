import { Button } from "@/components/ui/button";

type CalendarViewType = "year" | "month" | "week" | "day";

interface BottomNavigationProps {
  activeView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const BottomNavigation = ({ activeView, onViewChange }: BottomNavigationProps) => {
  return (
    <div className="bg-background border-t border-secondary py-5 px-6 safe-area-bottom shadow-md">
      <div className="max-w-md mx-auto bg-card rounded-2xl overflow-hidden flex shadow-md">
        <Button 
          variant="ghost"
          className={`flex-1 py-5 px-2 text-lg font-medium text-foreground hover:bg-secondary transition-all duration-300 ${
            activeView === "year" ? "bg-secondary" : ""
          }`}
          onClick={() => onViewChange("year")}
        >
          <span>Year</span>
        </Button>
        
        <Button 
          variant="ghost"
          className={`flex-1 py-5 px-2 text-lg font-medium text-foreground hover:bg-secondary transition-all duration-300 ${
            activeView === "month" ? "bg-secondary" : ""
          }`}
          onClick={() => onViewChange("month")}
        >
          <span>Month</span>
        </Button>
        
        <Button 
          variant="ghost"
          className={`flex-1 py-5 px-2 text-lg font-medium text-foreground hover:bg-secondary transition-all duration-300 ${
            activeView === "week" ? "bg-secondary" : ""
          }`}
          onClick={() => onViewChange("week")}
        >
          <span>Week</span>
        </Button>
        
        <Button 
          variant="ghost"
          className={`flex-1 py-5 px-2 text-lg font-medium text-foreground hover:bg-secondary transition-all duration-300 ${
            activeView === "day" ? "bg-secondary" : ""
          }`}
          onClick={() => onViewChange("day")}
        >
          <span>Day</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;
