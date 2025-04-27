import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, MoonStar, Sun, Clock, Calendar as CalendarIcon, Info, Palette, Circle, SquareCheck, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsMenuProps {
  onClose: () => void;
}

const settingsVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const SettingsMenu = ({ onClose }: SettingsMenuProps) => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [startDay, setStartDay] = useState<"sunday" | "monday">("sunday");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [eventDisplayMode, setEventDisplayMode] = useState<"dots" | "text" | "box" | "color">("dots");
  const { toast } = useToast();

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const settings = await response.json();
        
        if (settings) {
          // Apply theme to state and document
          const currentTheme = settings.theme || 'dark';
          setTheme(currentTheme);
          document.documentElement.className = currentTheme === 'dark' ? 'dark' : 'light';
          
          setStartDay(settings.startOfWeek || 'sunday');
          setTimeFormat(settings.timeFormat || '12h');
          setEventDisplayMode(settings.eventDisplayMode || 'dots');
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
        // Use defaults if there's an error
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const settingsData = {
        theme,
        startOfWeek: startDay,
        timeFormat,
        eventDisplayMode
      };
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Apply theme class to document
      document.documentElement.className = theme === 'dark' ? 'dark' : 'light';
      
      toast({
        title: "Settings updated",
        duration: 3000, // Auto-dismiss after 3 seconds
        description: "Your calendar preferences have been updated.",
      });
    } catch (error) {
      console.error("Failed to save settings", error);
      toast({
        title: "Failed to save settings",
        duration: 3000,
        description: "There was an error updating your preferences.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      variants={settingsVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div 
        className="bg-card border border-secondary rounded-xl shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Noir Calendar</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-secondary transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MoonStar className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Theme</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-lg border border-secondary">
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${theme === 'dark' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setTheme('dark')}
              >
                <MoonStar className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${theme === 'light' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Start Week On</Label>
            </div>
            <Select value={startDay} onValueChange={(value: "sunday" | "monday") => setStartDay(value)}>
              <SelectTrigger className="w-full bg-background border border-secondary rounded-lg p-2">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Time Format</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-lg border border-secondary">
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${timeFormat === '12h' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setTimeFormat('12h')}
              >
                12-hour
              </Button>
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${timeFormat === '24h' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setTimeFormat('24h')}
              >
                24-hour
              </Button>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Event Display Style</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-lg border border-secondary">
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${eventDisplayMode === 'dots' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setEventDisplayMode('dots')}
              >
                <Circle className="h-4 w-4 mr-2" />
                Dots
              </Button>
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${eventDisplayMode === 'text' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setEventDisplayMode('text')}
              >
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${eventDisplayMode === 'box' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setEventDisplayMode('box')}
              >
                <SquareCheck className="h-4 w-4 mr-2" />
                Box
              </Button>
              <Button 
                type="button"
                variant="ghost"
                className={`rounded-lg py-2 px-4 ${eventDisplayMode === 'color' ? 'bg-secondary text-white' : 'text-muted-foreground'}`}
                onClick={() => setEventDisplayMode('color')}
              >
                <Palette className="h-4 w-4 mr-2" />
                Color
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-1 ml-1">
            {eventDisplayMode === 'dots' && 'Simple dots showing the event colors'}
            {eventDisplayMode === 'text' && 'Event titles with color indicators'}
            {eventDisplayMode === 'box' && 'Colorful boxes with event titles'}
            {eventDisplayMode === 'color' && 'Horizontal color bars for events'}
          </div>

          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <div className="flex gap-2 items-start">
              <Info className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Changes to settings will be applied to all your devices using Noir Calendar.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2">
          <Button 
            className="flex-1 bg-background border border-secondary rounded-lg py-2 text-foreground hover:bg-secondary transition-all duration-300"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-white rounded-lg py-2 text-black hover:bg-white/80 transition-all duration-300"
            onClick={() => {
              saveSettings();
              onClose();
            }}
          >
            Save
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsMenu;
