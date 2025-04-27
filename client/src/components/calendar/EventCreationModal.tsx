import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  onEventUpdated?: () => void;
  date?: Date;
  event?: {
    id: number;
    title: string;
    description?: string;
    location?: string;
    color?: string;
    allDay?: boolean;
    start: Date;
    end: Date;
    notifications?: boolean;
  };
  isEditing?: boolean;
}

const EventCreationModal = ({ 
  isOpen, 
  onClose, 
  onEventCreated,
  onEventUpdated,
  event,
  isEditing = false,
  date: initialDate = new Date() 
}: EventCreationModalProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [color, setColor] = useState(event?.color || "#3498db");
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [notifications, setNotifications] = useState(event?.notifications || false);
  
  // Time state - separate components
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
  
  // Legacy time values for compatibility
  const [startTime, setStartTime] = useState(event?.start ? format(new Date(event.start), "HH:mm") : "09:00");
  const [endTime, setEndTime] = useState(event?.end ? format(new Date(event.end), "HH:mm") : "10:00");
  
  const [selectedDate, setSelectedDate] = useState<Date>(event?.start ? new Date(event.start) : initialDate);
  
  // Get time format settings
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  
  // Fetch settings and populate fields when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Get time format from settings
      const fetchSettings = async () => {
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const settings = await response.json();
            setTimeFormat(settings.timeFormat || "12h");
          }
        } catch (error) {
          console.error("Failed to fetch settings:", error);
        }
      };
      
      fetchSettings();
      
      // Initialize event data if in edit mode
      if (event && isEditing) {
        setTitle(event.title);
        setDescription(event.description || "");
        setLocation(event.location || "");
        setColor(event.color || "#3498db");
        setAllDay(event.allDay || false);
        setNotifications(event.notifications || false);
        
        // Set date and times
        setSelectedDate(new Date(event.start));
        setStartTime(format(new Date(event.start), "HH:mm"));
        setEndTime(format(new Date(event.end), "HH:mm"));
      }
    }
  }, [isOpen, event, isEditing]);
  
  // Synchronize separate time components with legacy time format
  useEffect(() => {
    if (startTime) {
      const [hourStr, minuteStr] = startTime.split(":");
      const hour = parseInt(hourStr, 10);
      
      if (timeFormat === "12h") {
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        
        setStartHour(displayHour.toString().padStart(2, '0'));
        setStartMinute(minuteStr);
        setStartPeriod(period);
      } else {
        setStartHour(hourStr);
        setStartMinute(minuteStr);
      }
    }
    
    if (endTime) {
      const [hourStr, minuteStr] = endTime.split(":");
      const hour = parseInt(hourStr, 10);
      
      if (timeFormat === "12h") {
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        
        setEndHour(displayHour.toString().padStart(2, '0'));
        setEndMinute(minuteStr);
        setEndPeriod(period);
      } else {
        setEndHour(hourStr);
        setEndMinute(minuteStr);
      }
    }
  }, [startTime, endTime, timeFormat]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const clearForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setColor("#3498db");
    setAllDay(false);
    setNotifications(false);
    
    // Reset time components
    setStartHour("09");
    setStartMinute("00");
    setStartPeriod("AM");
    setEndHour("10");
    setEndMinute("00");
    setEndPeriod("AM");
    
    // Keep legacy time values in sync
    setStartTime("09:00");
    setEndTime("10:00");
    
    setSelectedDate(new Date());
  };
  
  // Handle event deletion
  const handleDelete = async () => {
    if (!isEditing || !event?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      // No deletion toast notification
      
      clearForm();
      onClose();
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Failed to delete event",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Create date objects with the selected times
  const createDateWithTime = (baseDate: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };
  
  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Event title required",
        description: "Please enter a title for your event",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create start and end date objects
      const startDate = allDay 
        ? new Date(new Date(selectedDate).setHours(0, 0, 0, 0)) 
        : createDateWithTime(selectedDate, startTime);
        
      const endDate = allDay 
        ? new Date(new Date(selectedDate).setHours(23, 59, 59, 999)) 
        : createDateWithTime(selectedDate, endTime);
      
      // Validate end time is after start time
      if (!allDay && endDate <= startDate) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const eventData = {
        title,
        description: description || null,
        location: location || null,
        color,
        allDay,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notifications,
        userId: 1, // Default user
      };
      
      let endpoint = '/api/events';
      let method = 'POST';
      
      // If editing an existing event, use PUT method and include the ID
      if (isEditing && event?.id) {
        endpoint = `/api/events/${event.id}`;
        method = 'PUT';
      }
      
      const response = await fetch(endpoint, {
        method,
        body: JSON.stringify(eventData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // No toast notification for creation/update
      
      clearForm();
      onClose();
      if (isEditing && onEventUpdated) {
        onEventUpdated();
      } else if (!isEditing && onEventCreated) {
        onEventCreated();
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} event:`, error);
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} event`,
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated color options to use pastel colors
  const colorOptions = [
    { value: "#F9D7D3", label: "Pastel Pink" },
    { value: "#BFE1D9", label: "Pastel Mint" },
    { value: "#D3E5F3", label: "Pastel Blue" },
    { value: "#F3E5D3", label: "Pastel Sand" },
    { value: "#E2D3F3", label: "Pastel Lavender" },
    { value: "#F3D3EB", label: "Pastel Lilac" },
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border border-secondary rounded-xl p-4 max-h-[90vh] overflow-y-auto w-[95%] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {isEditing ? "Edit Note" : "New Note"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update your calendar note." : "Add a new note to your noir calendar."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-white text-base font-medium">Note title*</Label>
            <Input
              id="title"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-secondary"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-white text-base font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-secondary resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="location" className="text-white text-base font-medium">Location</Label>
            <Input
              id="location"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-secondary"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white text-base font-medium">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full bg-background border-secondary text-white font-medium justify-start flex items-center"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-secondary [color-scheme:dark]">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="dark:bg-card text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox 
                id="all-day" 
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(checked === true)}
                className="border-white"
              />
              <Label htmlFor="all-day" className="cursor-pointer text-white">All day note</Label>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox 
                id="notifications" 
                checked={notifications}
                onCheckedChange={(checked) => setNotifications(checked === true)}
                className="border-white"
              />
              <Label htmlFor="notifications" className="cursor-pointer text-white">
                Device notifications
              </Label>
            </div>
          </div>
          
          {!allDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Time Section */}
              <div className="grid gap-2">
                <Label htmlFor="start-time" className="text-white text-base font-medium">Start time</Label>
                
                {timeFormat === "12h" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Hours */}
                    <Select 
                      value={startHour}
                      onValueChange={(value) => {
                        setStartHour(value);
                        // Update legacy time value
                        const hour = parseInt(value);
                        const hourValue = startPeriod === "PM" && hour < 12 
                          ? hour + 12 
                          : startPeriod === "AM" && hour === 12 ? 0 : hour;
                        setStartTime(`${hourValue.toString().padStart(2, '0')}:${startMinute}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const hour = idx + 1; // 1-12
                          return (
                            <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                              <span className="text-white">{hour}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-white text-lg">:</span>
                    
                    {/* Minutes */}
                    <Select 
                      value={startMinute}
                      onValueChange={(value) => {
                        setStartMinute(value);
                        // Update legacy time value
                        const hour = parseInt(startHour);
                        const hourValue = startPeriod === "PM" && hour < 12 
                          ? hour + 12 
                          : startPeriod === "AM" && hour === 12 ? 0 : hour;
                        setStartTime(`${hourValue.toString().padStart(2, '0')}:${value}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            <span className="text-white">{minute}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* AM/PM */}
                    <Select 
                      value={startPeriod}
                      onValueChange={(value) => {
                        setStartPeriod(value);
                        // Update legacy time value
                        const hour = parseInt(startHour);
                        const hourValue = value === "PM" && hour < 12 
                          ? hour + 12 
                          : value === "AM" && hour === 12 ? 0 : hour;
                        setStartTime(`${hourValue.toString().padStart(2, '0')}:${startMinute}`);
                      }}
                    >
                      <SelectTrigger className="w-[70px] bg-background border-secondary px-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        <SelectItem value="AM">
                          <span className="text-white">AM</span>
                        </SelectItem>
                        <SelectItem value="PM">
                          <span className="text-white">PM</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 24-hour format */}
                    <Select 
                      value={startHour}
                      onValueChange={(value) => {
                        setStartHour(value);
                        setStartTime(`${value}:${startMinute}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary max-h-[200px]">
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                            <span className="text-white">{hour.toString().padStart(2, '0')}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-white text-lg">:</span>
                    
                    {/* Minutes */}
                    <Select 
                      value={startMinute}
                      onValueChange={(value) => {
                        setStartMinute(value);
                        setStartTime(`${startHour}:${value}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            <span className="text-white">{minute}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* End Time Section */}
              <div className="grid gap-2">
                <Label htmlFor="end-time" className="text-white text-base font-medium">End time</Label>
                
                {timeFormat === "12h" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Hours */}
                    <Select 
                      value={endHour}
                      onValueChange={(value) => {
                        setEndHour(value);
                        // Update legacy time value
                        const hour = parseInt(value);
                        const hourValue = endPeriod === "PM" && hour < 12 
                          ? hour + 12 
                          : endPeriod === "AM" && hour === 12 ? 0 : hour;
                        setEndTime(`${hourValue.toString().padStart(2, '0')}:${endMinute}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const hour = idx + 1; // 1-12
                          return (
                            <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                              <span className="text-white">{hour}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-white text-lg">:</span>
                    
                    {/* Minutes */}
                    <Select 
                      value={endMinute}
                      onValueChange={(value) => {
                        setEndMinute(value);
                        // Update legacy time value
                        const hour = parseInt(endHour);
                        const hourValue = endPeriod === "PM" && hour < 12 
                          ? hour + 12 
                          : endPeriod === "AM" && hour === 12 ? 0 : hour;
                        setEndTime(`${hourValue.toString().padStart(2, '0')}:${value}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            <span className="text-white">{minute}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* AM/PM */}
                    <Select 
                      value={endPeriod}
                      onValueChange={(value) => {
                        setEndPeriod(value);
                        // Update legacy time value
                        const hour = parseInt(endHour);
                        const hourValue = value === "PM" && hour < 12 
                          ? hour + 12 
                          : value === "AM" && hour === 12 ? 0 : hour;
                        setEndTime(`${hourValue.toString().padStart(2, '0')}:${endMinute}`);
                      }}
                    >
                      <SelectTrigger className="w-[70px] bg-background border-secondary px-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        <SelectItem value="AM">
                          <span className="text-white">AM</span>
                        </SelectItem>
                        <SelectItem value="PM">
                          <span className="text-white">PM</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 24-hour format */}
                    <Select 
                      value={endHour}
                      onValueChange={(value) => {
                        setEndHour(value);
                        setEndTime(`${value}:${endMinute}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary max-h-[200px]">
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                            <span className="text-white">{hour.toString().padStart(2, '0')}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-white text-lg">:</span>
                    
                    {/* Minutes */}
                    <Select 
                      value={endMinute}
                      onValueChange={(value) => {
                        setEndMinute(value);
                        setEndTime(`${endHour}:${value}`);
                      }}
                    >
                      <SelectTrigger className="w-[80px] bg-background border-secondary">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-secondary">
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            <span className="text-white">{minute}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="color" className="text-white text-base font-medium">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="bg-background border-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-secondary">
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded-full mr-3" 
                        style={{ backgroundColor: option.value }}
                      ></div>
                      <span className="text-white">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Notifications toggle moved to the top section */}
        </div>
        
        <DialogFooter className="flex flex-wrap justify-between gap-3 mt-4">
          <div>
            {isEditing && event?.id && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                clearForm();
                onClose();
              }}
              disabled={isSubmitting}
              className="text-white border-secondary hover:bg-secondary px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSubmitting || !title.trim()}
              className="bg-white text-black hover:bg-gray-200 px-8"
            >
              {isSubmitting 
                ? isEditing ? "Updating..." : "Creating..." 
                : isEditing ? "Update" : "Save"
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreationModal;