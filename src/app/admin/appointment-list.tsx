"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  bookingProfessionals,
  bookingServices,
  bookingTimes,
  getSaoPauloDate,
  type BookingProfessional,
  type BookingService,
} from "@/lib/booking-options";
import type { AppointmentRecord } from "@/lib/appointments.server";

type AppointmentDraft = Pick<AppointmentRecord,
  "service" | "appointment_date" | "appointment_time" | "professional" | "customer_name" | "customer_phone" | "status"
>;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00.000Z`));
}

function statusLabel(status: string): string {
  if (status === "confirmed") return "Confirmado";
  if (status === "pending_confirmation") return "Aguardando confirmação";
  return status;
}

function statusClass(status: string): string {
  if (status === "confirmed") return "status-confirmado";
  if (status === "pending_confirmation") return "status-pending-confirmation";
  return "";
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const match = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `+55 (${match[1]}) ${match[2]}-${match[3]}` : phone;
}

function appointmentLabel(appointment: AppointmentRecord): string {
  return `${appointment.customer_name}, ${formatDate(appointment.appointment_date)} às ${appointment.appointment_time}`;
}

export default function AppointmentList({
  appointments,
  showProfessionalFilter,
}: {
  appointments: AppointmentRecord[];
  showProfessionalFilter: boolean;
}) {
  const [professionalFilter, setProfessionalFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const [appointmentItems, setAppointmentItems] = useState(appointments);
  const [editDraft, setEditDraft] = useState<AppointmentDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");
  const filteredAppointments = professionalFilter
    ? appointmentItems.filter((appointment) => appointment.professional === professionalFilter)
    : appointmentItems;

  useEffect(() => {
    if (!selectedAppointment) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAppointment(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAppointment]);

  const whatsappNumber = selectedAppointment?.customer_phone.replace(/\D/g, "") || "";
  const whatsappMessage = selectedAppointment
    ? `Olá, ${selectedAppointment.customer_name}! Aqui é da Santino's Barbearia sobre seu agendamento de ${selectedAppointment.service} em ${formatDate(selectedAppointment.appointment_date)} às ${selectedAppointment.appointment_time}.`
    : "";
  const whatsappUrl = /^55\d{10,11}$/.test(whatsappNumber)
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    : "";

  function openAppointment(appointment: AppointmentRecord) {
    setSelectedAppointment(appointment);
    setEditDraft(null);
    setIsEditing(false);
    setConfirmDelete(false);
    setActionError("");
  }

  function beginEditing() {
    if (!selectedAppointment) return;
    setEditDraft({
      service: selectedAppointment.service,
      appointment_date: selectedAppointment.appointment_date,
      appointment_time: selectedAppointment.appointment_time,
      professional: selectedAppointment.professional,
      customer_name: selectedAppointment.customer_name,
      customer_phone: selectedAppointment.customer_phone,
      status: selectedAppointment.status,
    });
    setActionError("");
    setIsEditing(true);
  }

  function updateDraft<Key extends keyof AppointmentDraft>(key: Key, value: AppointmentDraft[Key]) {
    setEditDraft((current) => current ? { ...current, [key]: value } : current);
  }

  async function saveAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAppointment || !editDraft) return;
    setActionError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: editDraft.service,
          date: editDraft.appointment_date,
          time: editDraft.appointment_time,
          professional: editDraft.professional,
          customerName: editDraft.customer_name,
          customerPhone: editDraft.customer_phone,
          status: editDraft.status,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar as alterações.");
      const updatedAppointment = payload.appointment as AppointmentRecord;
      setAppointmentItems((items) => items.map((item) => item.id === updatedAppointment.id ? updatedAppointment : item));
      setSelectedAppointment(updatedAppointment);
      setEditDraft(null);
      setIsEditing(false);
      setConfirmDelete(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAppointment() {
    if (!selectedAppointment) return;
    setActionError("");
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, { method: "DELETE" });
      const payload = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(payload?.error || "Não foi possível excluir o agendamento.");
      setAppointmentItems((items) => items.filter((item) => item.id !== selectedAppointment.id));
      setSelectedAppointment(null);
      setEditDraft(null);
      setIsEditing(false);
      setConfirmDelete(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível excluir o agendamento.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleAppointmentKeyDown(event: React.KeyboardEvent<HTMLElement>, appointment: AppointmentRecord) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAppointment(appointment);
    }
  }

  return (
    <>
      {showProfessionalFilter && (
        <div className="admin-filter-row">
          <label className="admin-filter">
            <span>Filtrar por barbeiro</span>
            <select value={professionalFilter} onChange={(event) => setProfessionalFilter(event.target.value)}>
              <option value="">Todos os barbeiros</option>
              {bookingProfessionals.map((professional) => <option key={professional} value={professional}>{professional}</option>)}
            </select>
          </label>
          <span className="admin-filter-count">{filteredAppointments.length} agendamento(s)</span>
        </div>
      )}

      {filteredAppointments.length === 0 ? (
        <p className="admin-empty">
          {appointmentItems.length === 0
            ? "Nenhum agendamento encontrado para este período."
            : `Nenhum agendamento para ${professionalFilter}.`}
        </p>
      ) : (
        <>
          <div className="table-wrap admin-appointments-desktop">
            <table>
              <thead><tr><th>Data</th><th>Horário</th><th>Cliente</th><th>WhatsApp</th><th>Serviço</th><th>Profissional</th><th>Status</th></tr></thead>
              <tbody>{filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="appointment-table-row"
                  tabIndex={0}
                  aria-label={`Abrir agendamento de ${appointmentLabel(appointment)}`}
                  onClick={() => openAppointment(appointment)}
                  onKeyDown={(event) => handleAppointmentKeyDown(event, appointment)}
                >
                  <td>{formatDate(appointment.appointment_date)}</td>
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.customer_name}</td>
                  <td>{formatPhone(appointment.customer_phone)}</td>
                  <td>{appointment.service}</td>
                  <td>{appointment.professional}</td>
                  <td><span className={`status ${statusClass(appointment.status)}`}>{statusLabel(appointment.status)}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="appointment-cards">
            {filteredAppointments.map((appointment) => (
              <article
                className="appointment-card"
                key={appointment.id}
                role="button"
                tabIndex={0}
                aria-label={`Abrir agendamento de ${appointmentLabel(appointment)}`}
                onClick={() => openAppointment(appointment)}
                onKeyDown={(event) => handleAppointmentKeyDown(event, appointment)}
              >
                <header>
                  <div><strong>{appointment.customer_name}</strong><span>{formatPhone(appointment.customer_phone)}</span></div>
                  <span className={`status ${statusClass(appointment.status)}`}>{statusLabel(appointment.status)}</span>
                </header>
                <dl>
                  <div><dt>Data</dt><dd>{formatDate(appointment.appointment_date)}</dd></div>
                  <div><dt>Horário</dt><dd>{appointment.appointment_time}</dd></div>
                  <div><dt>Serviço</dt><dd>{appointment.service}</dd></div>
                  <div><dt>Profissional</dt><dd>{appointment.professional}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      {selectedAppointment && (
        <div className="appointment-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedAppointment(null);
        }}>
          <section className="appointment-dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-dialog-title">
            <button className="appointment-dialog-close" type="button" aria-label="Fechar detalhes" onClick={() => setSelectedAppointment(null)}>×</button>
            <p className="panel-label">Detalhes do agendamento #{selectedAppointment.id}</p>
            <h2 id="appointment-dialog-title">{selectedAppointment.customer_name}</h2>
            {isEditing && editDraft ? (
              <form className="appointment-edit-form" onSubmit={saveAppointment}>
                <label>Nome do cliente
                  <input required minLength={2} maxLength={80} value={editDraft.customer_name} onChange={(event) => updateDraft("customer_name", event.target.value)} />
                </label>
                <label>WhatsApp do cliente
                  <input required inputMode="tel" value={editDraft.customer_phone} onChange={(event) => updateDraft("customer_phone", event.target.value)} />
                </label>
                <label>Serviço
                  <select required value={editDraft.service} onChange={(event) => updateDraft("service", event.target.value as BookingService)}>
                    {bookingServices.map((service) => <option key={service} value={service}>{service}</option>)}
                  </select>
                </label>
                <div className="appointment-edit-row">
                  <label>Data
                    <input required type="date" min={getSaoPauloDate()} value={editDraft.appointment_date} onChange={(event) => updateDraft("appointment_date", event.target.value)} />
                  </label>
                  <label>Horário
                    <select required value={editDraft.appointment_time} onChange={(event) => updateDraft("appointment_time", event.target.value)}>
                      {bookingTimes.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </label>
                </div>
                <label>Profissional
                  <select required value={editDraft.professional} onChange={(event) => updateDraft("professional", event.target.value as BookingProfessional)}>
                    {bookingProfessionals.map((professional) => <option key={professional} value={professional}>{professional}</option>)}
                  </select>
                </label>
                <label>Status
                  <select required value={editDraft.status} onChange={(event) => updateDraft("status", event.target.value)}>
                    <option value="pending_confirmation">Aguardando confirmação</option>
                    <option value="confirmed">Confirmado</option>
                  </select>
                </label>
                {actionError && <p className="appointment-action-error" role="alert">{actionError}</p>}
                <div className="appointment-dialog-actions">
                  <button className="admin-button secondary" type="button" disabled={isSaving} onClick={() => { setIsEditing(false); setEditDraft(null); setActionError(""); }}>Cancelar edição</button>
                  <button className="admin-button primary" type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar alterações"}</button>
                </div>
              </form>
            ) : (
              <>
                <span className={`status ${statusClass(selectedAppointment.status)}`}>{statusLabel(selectedAppointment.status)}</span>
                <dl className="appointment-dialog-details">
                  <div><dt>Data</dt><dd>{formatDate(selectedAppointment.appointment_date)}</dd></div>
                  <div><dt>Horário</dt><dd>{selectedAppointment.appointment_time}</dd></div>
                  <div><dt>Serviço</dt><dd>{selectedAppointment.service}</dd></div>
                  <div><dt>Profissional</dt><dd>{selectedAppointment.professional}</dd></div>
                  <div><dt>WhatsApp</dt><dd>{formatPhone(selectedAppointment.customer_phone)}</dd></div>
                </dl>
                {actionError && <p className="appointment-action-error" role="alert">{actionError}</p>}
                {confirmDelete ? (
                  <div className="appointment-delete-confirm" role="alertdialog" aria-label="Confirmar exclusão">
                    <p>Excluir este agendamento permanentemente?</p>
                    <div className="appointment-dialog-actions">
                      <button className="admin-button secondary" type="button" disabled={isDeleting} onClick={() => setConfirmDelete(false)}>Manter agendamento</button>
                      <button className="admin-button danger" type="button" disabled={isDeleting} onClick={removeAppointment}>{isDeleting ? "Excluindo..." : "Confirmar exclusão"}</button>
                    </div>
                  </div>
                ) : (
                  <div className="appointment-dialog-actions">
                    <button className="admin-button secondary" type="button" onClick={beginEditing}>Editar</button>
                    <button className="admin-button danger" type="button" onClick={() => { setConfirmDelete(true); setActionError(""); }}>Excluir</button>
                    {whatsappUrl ? (
                      <a className="admin-button primary appointment-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
                        Chamar no WhatsApp <span aria-hidden="true">↗</span>
                      </a>
                    ) : <p className="admin-empty">O telefone cadastrado não é válido para abrir o WhatsApp.</p>}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}