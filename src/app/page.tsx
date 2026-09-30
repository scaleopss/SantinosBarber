"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BookingProfessional } from "@/lib/booking-options";
import BookingFlow from "./booking-flow";

const services = [
  ["Corte de cabelo", "Precisão, acabamento e personalidade.", "a partir de R$ 55"],
  ["Barba", "Toalha quente e desenho impecável.", "a partir de R$ 45"],
  ["Cabelo + barba", "O ritual completo Santino's.", "a partir de R$ 90"],
  ["Cabelo e barba express", "Seu cuidado, no seu tempo.", "a partir de R$ 75"],
  ["Camuflagem", "Naturalidade para cabelo ou barba.", "a partir de R$ 65"],
  ["Platinado", "Transformação com técnica e cuidado.", "consulte"],
];

const plans = [
  { name: "Essencial", eyebrow: "Para manter o ritmo", detail: "Seu corte sempre em dia.", benefits: ["1 corte por mês", "Prioridade no agendamento", "10% em serviços extras"], featured: false },
  { name: "Premium", eyebrow: "O mais escolhido", detail: "Cuidado completo, sem pensar duas vezes.", benefits: ["2 cortes por mês", "1 barba por mês", "Prioridade no agendamento"], featured: true },
  { name: "Exclusivo", eyebrow: "Para quem exige mais", detail: "Uma rotina feita sob medida.", benefits: ["Serviços personalizados", "Horário reservado", "Benefícios exclusivos"], featured: false },
];

const team: { name: BookingProfessional; role: string; image: string }[] = [
  { name: "Santino", role: "Barbeiro especialista", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85" },
  { name: "Lucas", role: "Barba e acabamento", image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85" },
  { name: "Mateus", role: "Corte premium", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingFlowOpen, setBookingFlowOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedBookingProfessional, setSelectedBookingProfessional] = useState<BookingProfessional | "">("");
  const openBooking = () => {
    setSelectedBookingProfessional("");
    setBookingFlowOpen(true);
  };
  const openProfessionalBooking = (professional: BookingProfessional) => {
    setSelectedBookingProfessional(professional);
    setBookingFlowOpen(true);
  };
  const whatsapp = "https://wa.me/5514997696510?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20um%20hor%C3%A1rio%20na%20Santino's%20Barbearia.";

  return <main>
    {bookingFlowOpen && <BookingFlow initialProfessional={selectedBookingProfessional} onClose={() => setBookingFlowOpen(false)} />}
    <header className={`site-header ${menuOpen ? "menu-is-open" : ""}`}>
      <a href="#inicio" className="brand" onClick={() => setMenuOpen(false)}><span><Image src="/santinos-perfil.png" alt="" width={40} height={40} /></span><strong>SANTINO&apos;S</strong><small>BARBEARIA</small></a>
      <button className="menu-toggle" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}><i /><i /><i /></button>
      <nav className="main-nav">{[["Início", "inicio"], ["Serviços", "servicos"], ["Assinaturas", "assinaturas"], ["A barbearia", "sobre"], ["Galeria", "galeria"], ["Contato", "contato"]].map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav>
      <div className="header-actions"><a href={whatsapp} target="_blank" rel="noreferrer" className="whatsapp-link">WhatsApp <span>↗</span></a><Link href="/admin" className="button admin-link">Painel admin</Link><button className="button button-light" onClick={openBooking}>Agendar horário <span>↗</span></button></div>
    </header>

    <section className="hero" id="inicio"><div className="hero-image" /><div className="hero-content"><p className="kicker">ESTILO, PRECISÃO E PRESENÇA</p><h1>Seu estilo.<br /><em>Sua rotina.</em><br />Do seu jeito.</h1><p className="hero-copy">Uma experiência de barbearia pensada para quem valoriza tempo, estilo e constância.</p><div className="hero-actions"><button className="button button-light" onClick={openBooking}>Agendar horário <span>↗</span></button><a className="text-link" href="#assinaturas">Conhecer assinaturas <span>↓</span></a></div></div><div className="hero-meta"><span>Centro · Ourinhos / SP</span><span>01 — 06</span></div><a href="#servicos" className="scroll-cue">Role para explorar <span>↓</span></a></section>

    <section className="statement section-pad"><div className="section-label">01 / A EXPERIÊNCIA</div><div className="statement-copy"><h2>Mais do que um corte.<br /><em>Um ritual para você.</em></h2><p>Um espaço para desacelerar, cuidar da imagem e sair pronto para o que vem. No Shopping Cinemarti, em Ourinhos.</p><a href="#sobre" className="text-link dark-link">Conheça a barbearia <span>↗</span></a></div></section>

    <section className="services section-pad" id="servicos"><div className="section-head"><div><div className="section-label">02 / SERVIÇOS</div><h2>O essencial, <em>bem feito.</em></h2></div><p>Do clássico ao autoral, cada serviço é pensado para encaixar na sua rotina e revelar o seu melhor.</p></div><div className="service-grid">{services.map(([name, description, price], index) => <button className="service-item" key={name} onClick={openBooking}><span className="service-number">0{index + 1}</span><span><strong>{name}</strong><small>{description}</small></span><b>{price}</b><i>↗</i></button>)}</div><a href="#contato" className="text-link dark-link all-services">Ver todos os serviços <span>↗</span></a></section>

    <section className="membership" id="assinaturas"><div className="membership-intro"><div className="section-label">03 / ASSINATURAS</div><h2>Tenha a Santino&apos;s<br /><em>na sua rotina.</em></h2><p>Escolha o plano que combina com seu ritmo e mantenha seu corte e cuidado sempre em dia.</p><a href="#contato" className="text-link">Tire suas dúvidas <span>↗</span></a></div><div className="plans">{plans.map((plan) => <article className={`plan ${plan.featured ? "featured" : ""}`} key={plan.name}><div><span className="plan-tag">{plan.eyebrow}</span><h3>{plan.name}</h3><p>{plan.detail}</p></div><ul>{plan.benefits.map((benefit) => <li key={benefit}><span>+</span>{benefit}</li>)}</ul><button className="plan-cta" onClick={() => { setSelectedPlan(plan.name); setBookingOpen(true); }}>Quero este plano <span>↗</span></button></article>)}</div></section>

    <section className="team section-pad" id="profissionais"><div className="section-head"><div><div className="section-label">04 / PROFISSIONAIS</div><h2>Quem cuida<br /><em>do seu estilo.</em></h2></div><p>Profissionais que entendem que o detalhe muda tudo.</p></div><div className="team-grid">{team.map((person) => <article className="person" key={person.name}><div className="person-image" style={{ backgroundImage: `url(${person.image})` }} /><div><div><h3>{person.name}</h3><p>{person.role}</p></div><button onClick={() => openProfessionalBooking(person.name)}>Agendar <span>↗</span></button></div></article>)}</div></section>

    <section className="editorial section-pad" id="sobre"><div className="editorial-image" /><div className="editorial-copy"><div className="section-label">05 / A BARBEARIA</div><h2>Seu tempo.<br /><em>Seu espaço.</em></h2><p>Atendimento atento, ambiente preciso e a tranquilidade de saber que você está no lugar certo. A Santino&apos;s fica no Shopping Cinemarti, no Centro de Ourinhos.</p><div className="address"><span>R. Arlíndo Luz, 290<br />Centro · Ourinhos / SP<br />19900-010</span><a href="https://maps.app.goo.gl/dX9iKF61ERZwhawA6" target="_blank" rel="noreferrer" className="text-link dark-link map-link">Como chegar <span>↗</span></a></div></div></section>

    <section className="gallery section-pad" id="galeria"><div className="section-head"><div><div className="section-label">06 / GALERIA</div><h2>Feito para<br /><em>ser vivido.</em></h2></div><p>Uma atmosfera com personalidade, do primeiro olhar ao último detalhe.</p></div><div className="gallery-grid"><div className="gallery-image gallery-one" /><div className="gallery-image gallery-two" /><div className="gallery-image gallery-three" /><div className="gallery-image gallery-four" /></div></section>

    <section className="reviews section-pad"><div className="review-score"><span>5,0</span><div>★★★★★<small>280 avaliações</small></div></div><blockquote>&ldquo;Ambiente top, ótimos profissionais. Sempre saio satisfeito.&rdquo;</blockquote><p className="review-note">Avaliações reais, de quem já viveu a experiência Santino&apos;s.</p></section>
    <section className="contact" id="contato"><div><div className="section-label">07 / CONTATO</div><h2>Vamos cuidar<br /><em>do seu estilo?</em></h2><p>Segunda a sábado, em horários configuráveis.</p></div><div className="contact-details"><a href="tel:+5514997696510" className="contact-phone">(14) 99769-6510</a><span>R. Arlíndo Luz, 290<br />Shopping Cinemarti · Ourinhos / SP</span><div><button className="button button-light" onClick={openBooking}>Agendar horário <span>↗</span></button><a href={whatsapp} target="_blank" rel="noreferrer" className="button button-outline">Falar no WhatsApp <span>↗</span></a></div></div></section>
    <footer><a href="#inicio" className="brand"><span><Image src="/santinos-perfil.png" alt="" width={40} height={40} /></span><strong>SANTINO&apos;S</strong><small>BARBEARIA</small></a><div className="footer-links"><a href="#servicos">Serviços</a><a href="#assinaturas">Assinaturas</a><a href="#profissionais">Profissionais</a><a href="#contato">Contato</a><Link href="/admin">Admin</Link></div><p>Santino&apos;s Barbearia © 2026</p></footer><a className="floating-whatsapp" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.85L2.4 22l5.3-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.08-1.12l-.3-.18-3.14.83.84-3.06-.2-.31A8 8 0 1 1 12 19.8Zm4.4-5.98c-.24-.12-1.43-.7-1.65-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.5.16.1.22.16.46.28Z" fill="currentColor"/></svg></a>

    {bookingOpen && <div className="modal-backdrop" onClick={() => setBookingOpen(false)}><div className="booking-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setBookingOpen(false)}>×</button><div className="modal-kicker">AGENDAMENTO {selectedPlan ? "· ASSINATURA" : `· 0${step} / 03`}</div>{selectedPlan ? <><h2>Comece pelo<br /><em>{selectedPlan}.</em></h2><p className="modal-description">Deixe seu WhatsApp e a equipe Santino&apos;s entra em contato para ativar seu plano.</p><input placeholder="Seu nome" /><input placeholder="Seu WhatsApp" /><button className="button button-dark" onClick={() => setBookingOpen(false)}>Enviar interesse <span>↗</span></button></> : <><h2>Reserve seu<br /><em>momento.</em></h2>{step === 1 && <div className="modal-step"><p className="modal-description">Escolha um serviço para começar.</p><div className="choice-list">{services.slice(0, 4).map(([name]) => <button className={selectedService === name ? "selected" : ""} key={name} onClick={() => setSelectedService(name)}>{name}<span>↗</span></button>)}</div><button className="button button-dark" disabled={!selectedService} onClick={() => setStep(2)}>Continuar <span>→</span></button></div>}{step === 2 && <div className="modal-step"><p className="modal-description">Agora escolha o melhor dia e horário.</p><div className="date-row"><button className="selected">Hoje<small>24 SET</small></button><button>Amanhã<small>25 SET</small></button><button>Sábado<small>26 SET</small></button></div><div className="time-grid">{["09:00", "10:30", "13:00", "14:30", "16:00", "17:30"].map((time) => <button key={time}>{time}</button>)}</div><button className="button button-dark" onClick={() => setStep(3)}>Continuar <span>→</span></button></div>}{step === 3 && <div className="modal-step"><p className="modal-description">Só mais um detalhe. Seus dados ficam seguros com a gente.</p><input placeholder="Seu nome" /><input placeholder="Seu WhatsApp" /><input placeholder="E-mail (opcional)" /><button className="button button-dark" onClick={() => setBookingOpen(false)}>Confirmar agendamento <span>↗</span></button></div>}</>}</div></div>}
  </main>;
}
