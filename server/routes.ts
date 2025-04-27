import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { calendarSettingsSchema, eventSchema, insertEventSchema } from "@shared/schema";
import { z } from "zod";

// Initialize database with default user and settings
async function initializeDatabase() {
  if (storage instanceof Object && 'initializeDatabase' in storage) {
    await (storage as any).initializeDatabase();
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initializeDatabase();
  
  // API routes
  
  // Get user calendar settings
  app.get("/api/settings", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const settings = await storage.getSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error getting settings:", error);
      res.status(500).json({ error: "Failed to retrieve settings" });
    }
  });

  // Update user calendar settings
  app.post("/api/settings", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const updatedSettings = await storage.updateSettings(req.body, userId);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  
  // Event routes
  
  // Get all events
  app.get("/api/events", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Check if we should filter by date range
      if (req.query.start && req.query.end) {
        const startDate = new Date(req.query.start as string);
        const endDate = new Date(req.query.end as string);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }
        
        const events = await storage.getEventsByDateRange(startDate, endDate, userId);
        return res.json(events);
      }
      
      const events = await storage.getEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).json({ error: "Failed to retrieve events" });
    }
  });
  
  // Get a specific event
  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error getting event:", error);
      res.status(500).json({ error: "Failed to retrieve event" });
    }
  });
  
  // Create a new event
  app.post("/api/events", async (req, res) => {
    try {
      // Validate request body
      const parsedBody = insertEventSchema.safeParse({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      });
      
      if (!parsedBody.success) {
        return res.status(400).json({ error: "Invalid event data", details: parsedBody.error });
      }
      
      const event = await storage.createEvent(parsedBody.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  
  // Update an event
  app.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      // Process dates if present
      const bodyWithDates = { ...req.body };
      if (bodyWithDates.startDate) bodyWithDates.startDate = new Date(bodyWithDates.startDate);
      if (bodyWithDates.endDate) bodyWithDates.endDate = new Date(bodyWithDates.endDate);
      
      const updatedEvent = await storage.updateEvent(id, bodyWithDates);
      
      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  
  // Delete an event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const success = await storage.deleteEvent(id);
      
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
