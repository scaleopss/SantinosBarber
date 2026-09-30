import Link from "next/link";
import type { AppointmentRecord } from "@/lib/appointments.server";
import AppointmentList from "./appointment-list";

export function AppointmentTable({ appointments, showProfessionalFilter = false }: { appointments: AppointmentRecord[]; showProfessionalFilter?: boolean }) {
  return <AppointmentList appointments={appointments} showProfessionalFilter={showProfessionalFilter} />;
}

export function AdminSectionFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="admin-main">
      <header className="admin-topbar">
        <div><p className="admin-overline">Painel administrativo</p><h1>{title}</h1></div>
        <Link className="admin-button secondary admin-back-link" href="/admin">Voltar ao dashboard</Link>
      </header>
      <p className="admin-section-description">{description}</p>
      {children}
    </main>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return <div className="admin-empty-state"><strong>Nenhum dado cadastrado</strong><p>{message}</p></div>;
}