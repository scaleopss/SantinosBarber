import {
  bookingProfessionals,
  bookingServices,
  bookingTimes,
  getSaoPauloDate,
  getSaoPauloTime,
  isBookableDate,
  normalizeBrazilianPhone,
} from "@/lib/booking-options";
import { deleteAppointment, getAppointments, updateAppointment, type AppointmentUpdate } from "@/lib/appointments.server";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return Response.json({ error: "Agendamento inválido." }, { status: 400 });

  let body: Partial<AppointmentUpdate>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Os dados do agendamento são inválidos." }, { status: 400 });
  }

  if (!bookingServices.includes(body.service as (typeof bookingServices)[number])
    || !bookingProfessionals.includes(body.professional as (typeof bookingProfessionals)[number])
    || !bookingTimes.includes(body.time as (typeof bookingTimes)[number])
    || !body.date
    || !isBookableDate(body.date, getSaoPauloDate())
    || typeof body.customerName !== "string"
    || body.customerName.trim().length < 2
    || body.customerName.trim().length > 80
    || typeof body.customerPhone !== "string"
    || (body.status !== "pending_confirmation" && body.status !== "confirmed")) {
    return Response.json({ error: "Confira os dados do agendamento." }, { status: 400 });
  }

  const appointmentDate = body.date as string;
  const appointmentTime = body.time as string;
  if (appointmentDate === getSaoPauloDate() && appointmentTime <= getSaoPauloTime()) {
    return Response.json({ error: "Não é possível mover o agendamento para um horário que já passou." }, { status: 400 });
  }

  const customerPhone = normalizeBrazilianPhone(body.customerPhone);
  if (!customerPhone) return Response.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 });

  const appointment: AppointmentUpdate = {
    service: body.service as string,
    date: appointmentDate,
    time: appointmentTime,
    professional: body.professional as string,
    customerName: body.customerName.trim(),
    customerPhone,
    status: body.status,
  };
  const result = updateAppointment(id, appointment);
  if (result === "not_found") return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
  if (result === "conflict") return Response.json({ error: "Esse profissional já tem uma reserva nesse horário." }, { status: 409 });

  const updatedAppointment = getAppointments().find((item) => item.id === id);
  return Response.json({ appointment: updatedAppointment });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return Response.json({ error: "Agendamento inválido." }, { status: 400 });
  if (!deleteAppointment(id)) return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
  return new Response(null, { status: 204 });
}