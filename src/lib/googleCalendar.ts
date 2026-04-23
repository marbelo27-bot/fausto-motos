import { google, calendar_v3 } from 'googleapis';
import type { Client, Motorcycle, ServiceOrder } from './types';

// Initialize Google Calendar client
// NOTE: You need to set up Google Cloud credentials and share the calendar with the service account
// or use OAuth2. For simplicity, this example uses an API key (which has limited functionality)
// For full access, use OAuth2 or a service account.

let calendar: calendar_v3.Calendar | null = null;

export function initGoogleCalendar(auth: any) {
  calendar = google.calendar({ version: 'v3', auth });
}

/**
 * Creates a Google Calendar event for a service order
 * @param order The service order
 * @param client The client details
 * @param motorcycle The motorcycle details
 * @param nextServiceDate The date of the next service (ISO string)
 */
export async function createServiceCalendarEvent(
  order: ServiceOrder,
  client: Client,
  motorcycle: Motorcycle,
  nextServiceDate: string
): Promise<string | null> {
  if (!calendar) {
    console.error('Google Calendar not initialized. Call initGoogleCalendar first.');
    return null;
  }

  const event: calendar_v3.Schema$Event = {
    summary: `SERVICE: ${motorcycle.brand} ${motorcycle.model} - ${motorcycle.plate} (${client.fullName})`,
    description: `
Orden de Servicio: #${order.id}
Cliente: ${client.fullName}
Tel: ${client.phone}
Moto: ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year}) - Pat: ${motorcycle.plate}

Trabajos realizados:
${order.performedServices.map(s => `- ${s}`).join('\n')}

Repuestos utilizados:
${order.parts.map(p => `- ${p.description} (x${p.quantity})`).join('\n')}

Mano de obra: $${order.laborCost.toLocaleString('es-AR')}
Repuestos: $${order.partsCost.toLocaleString('es-AR')}
Total: $${order.totalCost.toLocaleString('es-AR')}

Observaciones: ${order.notes || 'Ninguna'}
`,
    start: {
      dateTime: nextServiceDate,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      // Assuming service duration of 2 hours
      dateTime: new Date(new Date(nextServiceDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 48 * 60 }, // 48 hours
        { method: 'popup', minutes: 60 }, // 1 hour
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary', // or your specific calendar ID
      requestBody: event,
    });
    return response.data.id ?? null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

/**
 * Updates an existing Google Calendar event for a service order
 * @param eventId The Google Calendar event ID
 * @param order The service order
 * @param client The client details
 * @param motorcycle The motorcycle details
 * @param nextServiceDate The date of the next service (ISO string)
 */
export async function updateServiceCalendarEvent(
  eventId: string,
  order: ServiceOrder,
  client: Client,
  motorcycle: Motorcycle,
  nextServiceDate: string
): Promise<boolean> {
  if (!calendar) {
    console.error('Google Calendar not initialized. Call initGoogleCalendar first.');
    return false;
  }

  // First, get the existing event
  try {
    const getResponse = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });
    const event = getResponse.data;

    // Update the event
    event.summary = `SERVICE: ${motorcycle.brand} ${motorcycle.model} - ${motorcycle.plate} (${client.fullName})`;
    event.description = `
Orden de Servicio: #${order.id}
Cliente: ${client.fullName}
Tel: ${client.phone}
Moto: ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year}) - Pat: ${motorcycle.plate}

Trabajos realizados:
${order.performedServices.map(s => `- ${s}`).join('\n')}

Repuestos utilizados:
${order.parts.map(p => `- ${p.description} (x${p.quantity})`).join('\n')}

Mano de obra: $${order.laborCost.toLocaleString('es-AR')}
Repuestos: $${order.partsCost.toLocaleString('es-AR')}
Total: $${order.totalCost.toLocaleString('es-AR')}

Observaciones: ${order.notes || 'Ninguna'}
`;
    event.start = {
      dateTime: nextServiceDate,
      timeZone: 'America/Argentina/Buenos_Aires',
    };
    event.end = {
      dateTime: new Date(new Date(nextServiceDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    };

    await calendar.events.update({
      calendarId: 'primary',
      eventId: event.id!,
      requestBody: event,
    });
    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
}

/**
 * Deletes a Google Calendar event for a service order
 * @param eventId The Google Calendar event ID
 */
export async function deleteServiceCalendarEvent(eventId: string): Promise<boolean> {
  if (!calendar) {
    console.error('Google Calendar not initialized. Call initGoogleCalendar first.');
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}