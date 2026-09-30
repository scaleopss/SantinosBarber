import {
  bookingProfessionals,
  bookingServices,
  bookingTimes,
  getSaoPauloDate,
  getSaoPauloTime,
  isBookableDate,
  normalizeBrazilianPhone,
  type BookingRequest,
} from "@/lib/booking-options";
import {
  createAppointment,
  getReservedAppointments,
  sendWhatsAppConfirmation,
  updateAppointmentStatus,
} from "@/lib/appointments.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") || "";
  const today = getSaoPauloDate();
  if (!isBookableDate(date, today)) {
    return Response.json({ error: "Escolha um dia futuro de segunda a sábado." }, { status: 400 });
  }

  const reserved = getReservedAppointments(date);
  const currentTime = date === today ? getSaoPauloTime() : "00:00";
  const slots = bookingTimes
    .filter((time) => time > currentTime)
    .map((time) => ({
      time,
      professionals: bookingProfessionals.filter((professional) =>
        !reserved.some((appointment) => appointment.time === time && appointment.professional === professional),
      ),
    }))
    .filter((slot) => slot.professionals.length > 0);

  return Response.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let booking: Partial<BookingRequest>;
  try {
    booking = await request.json();
  } catch {
    return Response.json({ error: "Os dados do agendamento são inválidos." }, { status: 400 });
  }

  const today = getSaoPauloDate();
  if (!bookingServices.includes(booking.service as (typeof bookingServices)[number])
    || !bookingProfessionals.includes(booking.professional as (typeof bookingProfessionals)[number])
    || !bookingTimes.includes(booking.time as (typeof bookingTimes)[number])
    || !booking.date
    || !isBookableDate(booking.date, today)
    || typeof booking.customerName !== "string"
    || booking.customerName.trim().length < 2
    || typeof booking.customerPhone !== "string"
    || !booking.whatsappConsent) {
    return Response.json({ error: "Confira os dados e autorize o envio da confirmação pelo WhatsApp." }, { status: 400 });
  }

  const normalizedPhone = normalizeBrazilianPhone(booking.customerPhone);
  if (!normalizedPhone) {
    return Response.json({ error: "Informe um número de celular válido com DDD." }, { status: 400 });
  }

  const appointmentDate = booking.date as string;
  const appointmentTime = booking.time as (typeof bookingTimes)[number];
  const reserved = getReservedAppointments(appointmentDate);
  if (appointmentDate === today && appointmentTime <= getSaoPauloTime()) {
    return Response.json({ error: "Esse horário já passou. Escolha outro." }, { status: 409 });
  }
  if (reserved.some((appointment) => appointment.time === appointmentTime && appointment.professional === booking.professional)) {
    return Response.json({ error: "Esse horário acabou de ser reservado. Escolha outro." }, { status: 409 });
  }

  const normalizedBooking = {
    service: booking.service as string,
    date: appointmentDate,
    time: appointmentTime,
    professional: booking.professional as string,
    customerName: booking.customerName.trim(),
    customerPhone: normalizedPhone,
  };
  const appointmentId = createAppointment(normalizedBooking);
  if (!appointmentId) {
    return Response.json({ error: "Esse horário acabou de ser reservado. Escolha outro." }, { status: 409 });
  }

  let confirmationSent = false;
  try {
    confirmationSent = await sendWhatsAppConfirmation(normalizedBooking);
  } catch (error) {
    console.error("Could not send WhatsApp confirmation:", error);
  }

  updateAppointmentStatus(appointmentId, confirmationSent ? "confirmed" : "pending_confirmation");
  return Response.json({ appointmentId, confirmationSent }, { status: 201 });
}