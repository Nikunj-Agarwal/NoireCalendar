import { 
  type CalendarSettings, 
  type Event,
  type InsertEvent,
  type DbEvent,
  events,
  settings,
  CalendarSetting,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Settings methods
  getSettings(userId?: number): Promise<CalendarSettings>;
  updateSettings(newSettings: Partial<CalendarSettings>, userId?: number): Promise<CalendarSettings>;
  
  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(userId?: number): Promise<Event[]>;
  getEventsByDateRange(start: Date, end: Date, userId?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private defaultUserId = 1; // Default user ID for demo purposes
  
  // Settings methods
  async getSettings(userId = this.defaultUserId): Promise<CalendarSettings> {
    // Try to get user settings
    const userSettings = await db.select().from(settings).where(eq(settings.userId, userId));
    
    if (userSettings.length > 0) {
      const setting = userSettings[0];
      return {
        theme: setting.theme as "dark" | "light",
        startOfWeek: setting.startOfWeek as "sunday" | "monday",
        timeFormat: setting.timeFormat as "12h" | "24h",
        eventDisplayMode: (setting.eventDisplayMode || "dots") as "dots" | "text" | "box" | "color"
      };
    }
    
    // Return default settings if not found
    return {
      theme: "dark",
      startOfWeek: "sunday",
      timeFormat: "12h",
      eventDisplayMode: "dots",
    };
  }

  async updateSettings(newSettings: Partial<CalendarSettings>, userId = this.defaultUserId): Promise<CalendarSettings> {
    // Check if settings exist for this user
    const existingSettings = await db.select().from(settings).where(eq(settings.userId, userId));
    
    if (existingSettings.length > 0) {
      // Update existing settings
      const [updated] = await db.update(settings)
        .set({
          theme: newSettings.theme || existingSettings[0].theme,
          startOfWeek: newSettings.startOfWeek || existingSettings[0].startOfWeek,
          timeFormat: newSettings.timeFormat || existingSettings[0].timeFormat,
          eventDisplayMode: newSettings.eventDisplayMode || existingSettings[0].eventDisplayMode || "dots",
        })
        .where(eq(settings.userId, userId))
        .returning();
      
      return {
        theme: updated.theme as "dark" | "light",
        startOfWeek: updated.startOfWeek as "sunday" | "monday",
        timeFormat: updated.timeFormat as "12h" | "24h",
        eventDisplayMode: (updated.eventDisplayMode || "dots") as "dots" | "text" | "box" | "color"
      };
    } else {
      // Create new settings
      const [created] = await db.insert(settings)
        .values({
          userId,
          theme: newSettings.theme || "dark",
          startOfWeek: newSettings.startOfWeek || "sunday",
          timeFormat: newSettings.timeFormat || "12h",
          eventDisplayMode: newSettings.eventDisplayMode || "dots",
        })
        .returning();
      
      return {
        theme: created.theme as "dark" | "light",
        startOfWeek: created.startOfWeek as "sunday" | "monday",
        timeFormat: created.timeFormat as "12h" | "24h",
        eventDisplayMode: (created.eventDisplayMode || "dots") as "dots" | "text" | "box" | "color"
      };
    }
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    
    if (!event) return undefined;
    
    return this.mapDbEventToEvent(event);
  }
  
  async getEvents(userId = this.defaultUserId): Promise<Event[]> {
    const dbEvents = await db.select()
      .from(events)
      .where(eq(events.userId, userId))
      .orderBy(desc(events.startDate));
    
    return dbEvents.map(this.mapDbEventToEvent);
  }
  
  async getEventsByDateRange(start: Date, end: Date, userId = this.defaultUserId): Promise<Event[]> {
    const dbEvents = await db.select()
      .from(events)
      .where(
        and(
          eq(events.userId, userId),
          gte(events.startDate, start),
          lte(events.endDate, end)
        )
      )
      .orderBy(events.startDate);
    
    return dbEvents.map(this.mapDbEventToEvent);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events)
      .values({
        userId: event.userId || this.defaultUserId,
        title: event.title,
        description: event.description || null,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay || false,
        color: event.color || "#3498db",
        location: event.location || null,
        notifications: event.notifications || false,
      })
      .returning();
    
    return this.mapDbEventToEvent(created);
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    // First check if event exists
    const existing = await this.getEvent(id);
    
    if (!existing) return undefined;
    
    const [updated] = await db.update(events)
      .set({
        title: event.title !== undefined ? event.title : existing.title,
        description: event.description !== undefined ? event.description : existing.description,
        startDate: event.startDate || existing.startDate,
        endDate: event.endDate || existing.endDate,
        allDay: event.allDay !== undefined ? event.allDay : existing.allDay,
        color: event.color || existing.color,
        location: event.location !== undefined ? event.location : existing.location,
        notifications: event.notifications !== undefined ? event.notifications : existing.notifications,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    return this.mapDbEventToEvent(updated);
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });
    
    return result.length > 0;
  }
  
  // Helper method to map database event to domain event
  private mapDbEventToEvent(dbEvent: DbEvent): Event {
    if (dbEvent.userId === null) {
      throw new Error("Event has no user ID");
    }
    
    return {
      id: dbEvent.id,
      userId: dbEvent.userId,
      title: dbEvent.title,
      description: dbEvent.description ?? undefined,
      startDate: dbEvent.startDate,
      endDate: dbEvent.endDate,
      allDay: dbEvent.allDay,
      color: dbEvent.color ?? "#3498db",
      location: dbEvent.location ?? undefined,
      notifications: dbEvent.notifications ?? false,
      createdAt: dbEvent.createdAt ?? undefined,
      updatedAt: dbEvent.updatedAt ?? undefined,
    };
  }
  
  // Initialize database with default user if needed
  async initializeDatabase() {
    // Check if default user exists
    const defaultUser = await db.select().from(users).where(eq(users.id, this.defaultUserId));
    
    if (defaultUser.length === 0) {
      // Create default user
      await db.insert(users)
        .values({
          id: this.defaultUserId,
          username: "default",
          password: "defaultpassword", // In a real app, this would be hashed
        })
        .onConflictDoNothing();
      
      // Create default settings
      await this.updateSettings({
        theme: "dark",
        startOfWeek: "sunday",
        timeFormat: "12h",
      });
    }
  }
}

export const storage = new DatabaseStorage();
