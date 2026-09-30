import Link from "next/link";
import { formatAdminDate, getAdminData } from "@/lib/admin-data.server";
import AdminShell from "./admin-shell";
import { AppointmentTable } from "./admin-data-views";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const data = getAdminData();
  const pendingCount = data.appointments.filter((appointment) => appointment.status === "pending_confirmation").length;
  const stats = [
    { label: "Agendamentos hoje", value: data.appointmentsToday.length, note: "Reservas para hoje", href: "/admin/agendamentos" },
    { label: "Próximos agendamentos", value: data.upcomingAppointments.length, note: "A partir deste horário", href: "/admin/calendario" },
    { label: "Clientes com reserva", value: data.clients.length, note: "Telefones únicos", href: "/admin/clientes" },
    { label: "Aguardando confirmação", value: pendingCount, note: "WhatsApp pendente", href: "/admin/agendamentos" },
    { label: "Horários livres hoje", value: data.availableSlotsToday, note: "Vagas futuras da agenda", href: "/admin/horarios" },
    { label: "Reservas registradas", value: data.appointments.length, note: "Total no histórico", href: "/admin/agendamentos" },
  ];

  return (
    <AdminShell activeHref="/admin">
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-overline">Painel administrativo</p>
            <h1>Dashboard</h1>
          </div>
          <div className="admin-actions">
            <span className="admin-current-date">{formatAdminDate(data.today)}</span>
            <Link className="admin-button primary" href="/admin/agendamentos">Ver agendamentos</Link>
          </div>
        </header>

        <section className="kpi-grid">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="kpi-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </Link>
          ))}
        </section>

        <section className="admin-grid">
          <article className="panel panel-wide">
            <div className="panel-header">
              <div>
                <p className="panel-label">Agenda</p>
                <h2>Próximos agendamentos</h2>
              </div>
              <Link className="admin-button secondary" href="/admin/agendamentos">Ver tudo</Link>
            </div>
            <AppointmentTable appointments={data.upcomingAppointments.slice(0, 8)} />
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Clientes</p>
                <h2>Em destaque</h2>
              </div>
            </div>

            <div className="list-stack">
              {data.clients.slice(0, 5).map((client) => (
                <div key={client.phone} className="client-line">
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.phone}</span>
                  </div>
                  <div className="meta-box">
                    <small>{client.appointmentCount} agendamento(s)</small>
                    <b>{client.latestAppointment.appointment_date} · {client.latestAppointment.appointment_time}</b>
                  </div>
                </div>
              ))}
              {data.clients.length === 0 && <p className="admin-empty">Os clientes aparecerão após os primeiros agendamentos.</p>}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Serviços</p>
                <h2>Mais agendados</h2>
              </div>
            </div>

            <div className="progress-stack">
              {data.mostBookedServices.map((item) => (
                <div key={item.name} className="progress-row">
                  <div className="progress-label">
                    <span>{item.name}</span>
                    <strong>{item.count} · {item.percentage}%</strong>
                  </div>
                  <div className="progress-bar"><i style={{ width: `${item.relativeWidth}%` }} /></div>
                </div>
              ))}
              {data.mostBookedServices.length === 0 && <p className="admin-empty">Ainda não há serviços agendados.</p>}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Equipe</p>
                <h2>Profissionais</h2>
              </div>
            </div>

            <div className="person-list">
              {data.professionals.map((person) => (
                <div key={person.name} className="person-line">
                  <div className="avatar">{person.name.slice(0, 1)}</div>
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.todayCount} hoje · {person.upcomingCount} próximos</span>
                  </div>
                  <b>{person.nextAppointment?.appointment_time || "Sem próxima"}</b>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </AdminShell>
  );
}
