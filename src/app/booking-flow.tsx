"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  bookingProfessionals,
  bookingServices,
  type BookingProfessional,
  type BookingService,
} from "@/lib/booking-options";

type AvailableSlot = {
  time: string;
  professionals: string[];
};

type BookingResult = {
  appointmentId: number;
  confirmationSent: boolean;
};

const professionalRoles: Record<BookingProfessional, string> = {
  Santino: "Barbeiro especialista",
  Lucas: "Barba e acabamento",
  Mateus: "Corte premium",
};

function getNextBusinessDays(): { value: string; label: string; weekday: string }[] {
  const days: { value: string; label: string; weekday: string }[] = [];
  const date = new Date();
  date.setHours(12, 0, 0, 0);

  for (let offset = 0; days.length < 18; offset += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    if (candidate.getDay() === 0) continue;

    days.push({
      value: `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(candidate.getDate()).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(candidate),
      weekday: offset === 0
        ? "Hoje"
        : new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(candidate).replace(".", ""),
    });
  }

  return days;
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export default function BookingFlow({
  onClose,
  initialProfessional = "",
}: {
  onClose: () => void;
  initialProfessional?: BookingProfessional | "";
}) {
  const [dates] = useState(getNextBusinessDays);
  const [step, setStep] = useState(1);
  const [service, setService] = useState<BookingService | "">("");
  const [date, setDate] = useState(dates[0]?.value || "");
  const [time, setTime] = useState("");
  const [professional, setProfessional] = useState<BookingProfessional | "">(initialProfessional);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();

    fetch(`/api/appointments?date=${date}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível consultar os horários.");
        setSlots(payload.slots as AvailableSlot[]);
        setAvailabilityError("");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAvailabilityError(error instanceof Error ? error.message : "Não foi possível consultar os horários.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });

    return () => controller.abort();
  }, [date, availabilityVersion]);

  const availableProfessionals = slots.find((slot) => slot.time === time)?.professionals || [];
  const manualWhatsAppMessage = [
    `Olá! Solicitei o agendamento #${result?.appointmentId} na Santino's Barbearia.`,
    `Serviço: ${service}`,
    `Data: ${date ? formatLongDate(date) : ""}`,
    `Horário: ${time}`,
    `Profissional: ${professional}`,
    `Nome: ${customerName}`,
    `WhatsApp: ${customerPhone}`,
  ].join("\n");
  const manualWhatsAppUrl = `https://wa.me/5514997696510?text=${encodeURIComponent(manualWhatsAppMessage)}`;

  function goToStep(nextStep: number) {
    setBookingError("");
    setStep(nextStep);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          date,
          time,
          professional,
          customerName,
          customerPhone,
          whatsappConsent,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setTime("");
          setProfessional("");
          setAvailabilityError(payload.error || "Esse horário acabou de ser reservado. Escolha outro.");
          setLoadingSlots(true);
          setAvailabilityVersion((version) => version + 1);
          setStep(2);
          return;
        }
        throw new Error(payload.error || "Não foi possível concluir o agendamento.");
      }
      setResult(payload as BookingResult);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Não foi possível concluir o agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop booking-flow-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="booking-modal booking-flow" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar agendamento">×</button>
        {result ? (
          <div className="booking-result">
            <p className="modal-kicker">AGENDAMENTO #{result.appointmentId}</p>
            <h2 id="booking-title">Pedido<br /><em>registrado.</em></h2>
            <p className="modal-description">
              {result.confirmationSent
                ? `Enviamos a confirmação para ${customerPhone}.`
                : "Seu horário foi reservado, mas a confirmação automática ainda não está configurada."}
            </p>
            <dl className="booking-summary">
              <div><dt>Serviço</dt><dd>{service}</dd></div>
              <div><dt>Data e horário</dt><dd>{formatLongDate(date)} · {time}</dd></div>
              <div><dt>Profissional</dt><dd>{professional}</dd></div>
            </dl>
            {!result.confirmationSent && (
              <a className="button button-dark booking-submit" href={manualWhatsAppUrl} target="_blank" rel="noreferrer">
                Enviar pedido pelo WhatsApp <span>↗</span>
              </a>
            )}
            <button className="booking-text-button" type="button" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="booking-flow-progress">ETAPA 0{step} <span>/ 04</span></div>
            <h2 id="booking-title">Reserve seu<br /><em>momento.</em></h2>

            {step === 1 && (
              <div className="booking-step">
                <p className="modal-description">Qual serviço você gostaria?</p>
                <div className="booking-option-grid">
                  {bookingServices.map((option) => (
                    <button
                      key={option}
                      className={`booking-option ${service === option ? "selected" : ""}`}
                      type="button"
                      aria-pressed={service === option}
                      onClick={() => setService(option)}
                    >
                      {option}<span>{service === option ? "✓" : "↗"}</span>
                    </button>
                  ))}
                </div>
                <button className="button button-dark booking-submit" type="button" disabled={!service} onClick={() => goToStep(2)}>
                  Escolher data e horário <span>→</span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="booking-step">
                <p className="modal-description">Selecione um dia e um horário disponível.</p>
                <div className="booking-date-list">
                  {dates.map((option) => (
                    <button
                      key={option.value}
                      className={`booking-date ${date === option.value ? "selected" : ""}`}
                      type="button"
                      aria-pressed={date === option.value}
                      onClick={() => {
                        setDate(option.value);
                        setTime("");
                        setProfessional("");
                        setAvailabilityError("");
                        setLoadingSlots(true);
                      }}
                    >
                      <span>{option.weekday}</span><strong>{option.label}</strong>
                    </button>
                  ))}
                </div>
                {loadingSlots ? <p className="booking-feedback">Consultando disponibilidade...</p> : null}
                {availabilityError ? <p className="booking-error" role="alert">{availabilityError}</p> : null}
                {!loadingSlots && !availabilityError && slots.length === 0 && <p className="booking-feedback">Não há horários disponíveis nessa data.</p>}
                {!loadingSlots && slots.length > 0 && (
                  <div className="booking-time-grid">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`booking-time ${time === slot.time ? "selected" : ""}`}
                        type="button"
                        aria-pressed={time === slot.time}
                        onClick={() => {
                          setTime(slot.time);
                          setProfessional(initialProfessional && slot.professionals.includes(initialProfessional) ? initialProfessional : "");
                        }}
                      >{slot.time}</button>
                    ))}
                  </div>
                )}
                <div className="booking-step-actions">
                  <button className="booking-text-button" type="button" onClick={() => goToStep(1)}>Voltar</button>
                  <button className="button button-dark booking-submit" type="button" disabled={!time || loadingSlots} onClick={() => goToStep(3)}>
                    Escolher profissional <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="booking-step">
                <p className="modal-description">Quem você prefere para {time}?</p>
                <div className="booking-professional-list">
                  {bookingProfessionals.filter((name) => availableProfessionals.includes(name)).map((name) => (
                    <button
                      key={name}
                      className={`booking-professional ${professional === name ? "selected" : ""}`}
                      type="button"
                      aria-pressed={professional === name}
                      onClick={() => setProfessional(name)}
                    >
                      <span className="booking-avatar">{name.slice(0, 1)}</span>
                      <span className="booking-professional-copy"><strong>{name}</strong><small>{professionalRoles[name]}</small></span>
                      <span className="booking-choice-mark">{professional === name ? "✓" : "＋"}</span>
                    </button>
                  ))}
                </div>
                <div className="booking-step-actions">
                  <button className="booking-text-button" type="button" onClick={() => goToStep(2)}>Voltar</button>
                  <button className="button button-dark booking-submit" type="button" disabled={!professional} onClick={() => goToStep(4)}>
                    Informar meus dados <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <form className="booking-step" onSubmit={submitBooking}>
                <p className="modal-description">Informe seus dados para reservar esse horário.</p>
                <div className="booking-summary compact">
                  <div><dt>Serviço</dt><dd>{service}</dd></div>
                  <div><dt>Data e horário</dt><dd>{formatLongDate(date)} · {time}</dd></div>
                  <div><dt>Profissional</dt><dd>{professional}</dd></div>
                </div>
                <label className="booking-field">Seu nome
                  <input autoComplete="name" minLength={2} maxLength={80} required value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="booking-field">WhatsApp com DDD
                  <input autoComplete="tel" inputMode="tel" type="tel" minLength={10} maxLength={20} placeholder="(14) 99999-9999" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                </label>
                <label className="booking-consent">
                  <input type="checkbox" checked={whatsappConsent} onChange={(event) => setWhatsappConsent(event.target.checked)} />
                  <span>Autorizo o envio da confirmação deste agendamento para este número via WhatsApp.</span>
                </label>
                {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
                <div className="booking-step-actions">
                  <button className="booking-text-button" type="button" onClick={() => goToStep(3)}>Voltar</button>
                  <button className="button button-dark booking-submit" type="submit" disabled={submitting || !whatsappConsent}>
                    {submitting ? "Reservando..." : "Confirmar agendamento"} <span>↗</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}