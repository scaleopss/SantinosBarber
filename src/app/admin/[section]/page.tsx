import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminData, formatAdminDate } from "@/lib/admin-data.server";
import { bookingTimes } from "@/lib/booking-options";
import AdminShell from "../admin-shell";
import { AdminEmptyState, AdminSectionFrame, AppointmentTable } from "../admin-data-views";
import { adminSections } from "../admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminSectionPage({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  if (!Object.prototype.hasOwnProperty.call(adminSections, section)) notFound();

  const sectionInfo = adminSections[section as keyof typeof adminSections];
  const data = getAdminData();
  const calendarAppointments = data.appointments.filter((appointment) => appointment.appointment_date >= data.today);
  const calendarDays = calendarAppointments.reduce<Record<string, typeof calendarAppointments>>((days, appointment) => {
    days[appointment.appointment_date] ||= [];
    days[appointment.appointment_date].push(appointment);
    return days;
  }, {});

  let content;
  if (section === "agendamentos") {
    content = <AppointmentTable appointments={[...data.appointments].reverse()} showProfessionalFilter />;
  } else if (section === "calendario") {
    content = Object.keys(calendarDays).length > 0 ? (
      <div className="admin-section-stack">
        {Object.entries(calendarDays).map(([date, appointments]) => (
          <section className="panel" key={date}>
            <div className="panel-header"><h2>{formatAdminDate(date)}</h2><span className="admin-record-count">{appointments.length} agendamento(s)</span></div>
            <AppointmentTable appointments={appointments} />
          </section>
        ))}
      </div>
    ) : <AdminEmptyState message="Os agendamentos futuros aparecerão aqui." />;
  } else if (section === "clientes") {
    content = data.clients.length > 0 ? (
      <div className="panel table-wrap"><table>
        <thead><tr><th>Cliente</th><th>WhatsApp</th><th>Agendamentos</th><th>Último agendamento</th></tr></thead>
        <tbody>{data.clients.map((client) => (
          <tr key={client.phone}>
            <td>{client.name}</td><td>{client.phone}</td><td>{client.appointmentCount}</td>
            <td>{formatAdminDate(client.latestAppointment.appointment_date)} · {client.latestAppointment.appointment_time}</td>
          </tr>
        ))}</tbody>
      </table></div>
    ) : <AdminEmptyState message="Os clientes são adicionados quando concluem um agendamento." />;
  } else if (section === "profissionais") {
    content = (
      <div className="admin-data-grid">
        {data.professionals.map((professional) => (
          <article className="panel" key={professional.name}>
            <div className="avatar">{professional.name.slice(0, 1)}</div>
            <h2 className="admin-card-title">{professional.name}</h2>
            <p className="admin-card-copy">{professional.todayCount} agendamento(s) hoje</p>
            <p className="admin-card-copy">{professional.upcomingCount} agendamento(s) futuro(s)</p>
            {professional.nextAppointment && <p className="admin-card-copy">Próximo: {formatAdminDate(professional.nextAppointment.appointment_date)} às {professional.nextAppointment.appointment_time}</p>}
          </article>
        ))}
      </div>
    );
  } else if (section === "servicos") {
    const total = data.services.reduce((count, service) => count + service.count, 0);
    content = total > 0 ? (
      <div className="panel progress-stack">
        {data.services.filter((service) => service.count > 0).map((service) => (
          <div className="progress-row" key={service.name}>
            <div className="progress-label"><span>{service.name}</span><strong>{service.count}</strong></div>
            <div className="progress-bar"><i style={{ width: `${Math.round(service.count / total * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    ) : <AdminEmptyState message="O ranking será calculado após os primeiros agendamentos." />;
  } else if (section === "horarios") {
    content = (
      <div className="panel">
        <p className="admin-card-copy">Vagas configuradas no momento</p>
        <div className="admin-time-list">{bookingTimes.map((time) => <span key={time}>{time}</span>)}</div>
        <p className="admin-card-copy">Os horários ocupados são removidos da disponibilidade conforme as reservas do banco.</p>
      </div>
    );
  } else {
    const emptyMessages: Record<string, string> = {
      assinaturas: "O site apresenta planos, mas ainda não há persistência de assinaturas ou pagamentos. Nenhum total fictício é exibido.",
      planos: "Os planos ainda são conteúdo fixo do site e não possuem cadastro administrativo conectado.",
      bloqueios: "Ainda não existe cadastro de bloqueios de agenda.",
      galeria: "Ainda não existe uma biblioteca de imagens administrável.",
      avaliacoes: "Ainda não há avaliações registradas no painel.",
      "conteudo-do-site": "O conteúdo do site ainda não possui edição administrativa.",
      configuracoes: "As configurações administrativas ainda não possuem dados persistidos.",
    };
    content = (
      <>
        <AdminEmptyState message={emptyMessages[section] || "Ainda não há dados cadastrados nesta seção."} />
        {section === "planos" && <Link className="admin-button secondary admin-inline-link" href="/#assinaturas">Ver planos no site público</Link>}
      </>
    );
  }

  return (
    <AdminShell activeHref={`/admin/${section}`}>
      <AdminSectionFrame title={sectionInfo.title} description={sectionInfo.description}>
        {content}
      </AdminSectionFrame>
    </AdminShell>
  );
}