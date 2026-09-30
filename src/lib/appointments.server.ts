import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { formatBookingDate } from "./booking-options";

type SqliteStatement = {
  all(...values: (string | number)[]): unknown[];
  run(...values: (string | number)[]): { lastInsertRowid: number | bigint; changes: number | bigint };
};

export type AppointmentRecord = {
  id: number;
  service: string;
  appointment_date: string;
  appointment_time: string;
  professional: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  created_at: string;
};

export type AppointmentUpdate = {
  service: string;
  date: string;
  time: string;
  professional: string;
  customerName: string;
  customerPhone: string;
  status: "pending_confirmation" | "confirmed";
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
};

type SqliteModule = {
  DatabaseSync: new (path: string) => SqliteDatabase;
};

const require = createRequire(resolve(process.cwd(), "package.json"));
const { DatabaseSync } = require("node:sqlite") as SqliteModule;

function openDatabase(): SqliteDatabase {
  const databasePath = join(process.cwd(), "data", "appointments.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA busy_timeout = 5000;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      professional TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      whatsapp_consent_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_confirmation',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (appointment_date, appointment_time, professional)
    );
  `);
  return database;
}

export function getReservedAppointments(date: string): { time: string; professional: string }[] {
  const database = openDatabase();
  try {
    return database.prepare(
      "SELECT appointment_time AS time, professional FROM appointments WHERE appointment_date = ?",
    ).all(date) as { time: string; professional: string }[];
  } finally {
    database.close();
  }
}

export function createAppointment(booking: {
  service: string;
  date: string;
  time: string;
  professional: string;
  customerName: string;
  customerPhone: string;
}): number | null {
  const database = openDatabase();
  try {
    const result = database.prepare(`
      INSERT INTO appointments (
        service, appointment_date, appointment_time, professional,
        customer_name, customer_phone, whatsapp_consent_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      booking.service,
      booking.date,
      booking.time,
      booking.professional,
      booking.customerName,
      booking.customerPhone,
    );
    return Number(result.lastInsertRowid);
  } catch (error) {
    if ((error as { code?: string }).code?.startsWith("SQLITE_CONSTRAINT")) return null;
    throw error;
  } finally {
    database.close();
  }
}

export function updateAppointmentStatus(id: number, status: string): void {
  const database = openDatabase();
  try {
    database.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
  } finally {
    database.close();
  }
}

export async function sendWhatsAppConfirmation(booking: {
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  professional: string;
}): Promise<boolean> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_CONFIRMATION_TEMPLATE;
  if (!accessToken || !phoneNumberId || !templateName) return false;

  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: booking.customerPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: booking.customerName },
            { type: "text", text: booking.service },
            { type: "text", text: formatBookingDate(booking.date) },
            { type: "text", text: booking.time },
            { type: "text", text: booking.professional },
          ],
        }],
      },
    }),
  });

  if (!response.ok) {
    console.error("WhatsApp confirmation failed:", response.status, await response.text());
    return false;
  }
  return true;
}

export function getAppointments(): AppointmentRecord[] {
  const database = openDatabase();
  try {
    const rows = database.prepare(`
      SELECT id, service, appointment_date, appointment_time, professional,
        customer_name, customer_phone, status, created_at
      FROM appointments
      ORDER BY appointment_date, appointment_time, id
    `).all() as AppointmentRecord[];
    return rows.map((row) => ({
      id: row.id,
      service: row.service,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      professional: row.professional,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      status: row.status,
      created_at: row.created_at,
    }));
  } finally {
    database.close();
  }
}

export function updateAppointment(id: number, appointment: AppointmentUpdate): "updated" | "not_found" | "conflict" {
  const database = openDatabase();
  try {
    const existing = database.prepare("SELECT id FROM appointments WHERE id = ?").all(id);
    if (existing.length === 0) return "not_found";

    const result = database.prepare(`
      UPDATE appointments SET
        service = ?, appointment_date = ?, appointment_time = ?, professional = ?,
        customer_name = ?, customer_phone = ?, status = ?
      WHERE id = ?
    `).run(
      appointment.service,
      appointment.date,
      appointment.time,
      appointment.professional,
      appointment.customerName,
      appointment.customerPhone,
      appointment.status,
      id,
    );
    return result.changes > 0 ? "updated" : "not_found";
  } catch (error) {
    if ((error as { code?: string }).code?.startsWith("SQLITE_CONSTRAINT")) return "conflict";
    throw error;
  } finally {
    database.close();
  }
}

export function deleteAppointment(id: number): boolean {
  const database = openDatabase();
  try {
    const result = database.prepare("DELETE FROM appointments WHERE id = ?").run(id);
    return result.changes > 0;
  } finally {
    database.close();
  }
}