import { bookingProfessionals, bookingServices, bookingTimes, getSaoPauloDate, getSaoPauloTime } from "./booking-options";
import { getAppointments, type AppointmentRecord } from "./appointments.server";

export type AdminClient = {
  name: string;
  phone: string;
  appointmentCount: number;
  latestAppointment: AppointmentRecord;
};

export function getAdminData() {
  const today = getSaoPauloDate();
  const now = getSaoPauloTime();
  const appointments = getAppointments();
  const appointmentsToday = appointments.filter((appointment) => appointment.appointment_date === today);
  const upcomingAppointments = appointments.filter((appointment) =>
    appointment.appointment_date > today
    || (appointment.appointment_date === today && appointment.appointment_time > now),
  );

  const clientsByPhone = new Map<string, AdminClient>();
  for (const appointment of appointments) {
    const existingClient = clientsByPhone.get(appointment.customer_phone);
    if (existingClient) {
      existingClient.appointmentCount += 1;
      existingClient.latestAppointment = appointment;
    } else {
      clientsByPhone.set(appointment.customer_phone, {
        name: appointment.customer_name,
        phone: appointment.customer_phone,
        appointmentCount: 1,
        latestAppointment: appointment,
      });
    }
  }

  const clients = [...clientsByPhone.values()].sort((left, right) =>
    right.latestAppointment.appointment_date.localeCompare(left.latestAppointment.appointment_date)
    || right.latestAppointment.appointment_time.localeCompare(left.latestAppointment.appointment_time),
  );
  const serviceCounts = new Map<string, number>();
  for (const appointment of appointments) {
    serviceCounts.set(appointment.service, (serviceCounts.get(appointment.service) || 0) + 1);
  }
  const services = bookingServices
    .map((name) => ({ name, count: serviceCounts.get(name) || 0 }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  const totalServices = services.reduce((total, service) => total + service.count, 0);
  const busiestCount = services[0]?.count || 0;
  const mostBookedServices = services.filter((service) => service.count > 0).map((service) => ({
    ...service,
    percentage: Math.round((service.count / totalServices) * 100),
    relativeWidth: Math.round((service.count / busiestCount) * 100),
  }));

  const bookedSlotsToday = new Set(
    appointmentsToday.map((appointment) => `${appointment.appointment_time}|${appointment.professional}`),
  );
  const availableSlotsToday = bookingTimes.reduce((count, time) => {
    if (time <= now) return count;
    return count + bookingProfessionals.filter((professional) =>
      !bookedSlotsToday.has(`${time}|${professional}`),
    ).length;
  }, 0);

  const professionals = bookingProfessionals.map((name) => ({
    name,
    todayCount: appointmentsToday.filter((appointment) => appointment.professional === name).length,
    upcomingCount: upcomingAppointments.filter((appointment) => appointment.professional === name).length,
    nextAppointment: upcomingAppointments.find((appointment) => appointment.professional === name),
  }));

  return {
    today,
    now,
    appointments,
    appointmentsToday,
    upcomingAppointments,
    clients,
    services,
    mostBookedServices,
    professionals,
    availableSlotsToday,
  };
}

export function formatAdminDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function appointmentStatusLabel(status: string): string {
  if (status === "confirmed") return "Confirmado";
  if (status === "pending_confirmation") return "Aguardando confirmação";
  return status;
}