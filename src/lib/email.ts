import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

async function getTransporter() {
  const settings = await prisma.$queryRaw<{ key: string; value: string }[]>`
    SELECT key, value FROM Setting WHERE key IN ('gmailUser', 'gmailPass')
  `;
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const user = map["gmailUser"] ?? "";
  const pass = map["gmailPass"] ?? "";

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function send(to: string, subject: string, html: string) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  const gmailSettings = await prisma.$queryRaw<{ key: string; value: string }[]>`
    SELECT key, value FROM Setting WHERE key = 'gmailUser'
  `;
  const from = `Calista Tennis Courts <${gmailSettings[0]?.value ?? "no-reply@calistatennis.com"}>`;
  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error("Gmail send error:", err);
  }
}

export async function sendBookingConfirmation(
  email: string,
  name: string,
  date: string,
  time: string,
  courtName: string,
  reference: string,
  totalPrice: number
) {
  const subject = "Your Booking Request – Calista Tennis Courts";
  const html = `
    <div style="font-family:sans-serif;color:#1A3626;max-width:560px;margin:0 auto;padding:32px;border:1px solid #e5e7eb">
      <h2 style="font-family:serif;font-size:26px;margin-bottom:8px">Booking Request Received</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your reservation request at Calista Tennis Courts. Our team will review and confirm your booking shortly.</p>
      <div style="background:#FDFCF0;padding:20px;margin:24px 0;border:1px solid #1A362615;border-radius:4px">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#6B7280;padding:4px 0">Date</td><td style="font-weight:600">${date}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Time</td><td style="font-weight:600">${time} (60 min)</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Court</td><td style="font-weight:600">${courtName}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Total</td><td style="font-weight:600">€${totalPrice.toFixed(2)}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Reference</td><td style="font-weight:600;letter-spacing:2px">CTC-${reference}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#6B7280">Cancellations within 24 hours of booking time are subject to full charge.</p>
      <p>We look forward to welcoming you.<br/><strong>Calista Tennis Courts</strong></p>
    </div>
  `;
  await send(email, subject, html);
}

export async function sendCancellationNotice(
  email: string,
  name: string,
  date: string,
  time: string,
  courtName: string
) {
  const subject = "Booking Cancelled – Calista Tennis Courts";
  const html = `
    <div style="font-family:sans-serif;color:#1A3626;max-width:560px;margin:0 auto;padding:32px;border:1px solid #e5e7eb">
      <h2 style="font-family:serif;font-size:26px;color:#991b1b">Booking Cancelled</h2>
      <p>Dear ${name},</p>
      <p>Your reservation on <strong>${date}</strong> at <strong>${time}</strong> for <strong>${courtName}</strong> has been cancelled.</p>
      <p>To rebook, please visit our website.</p>
      <p>Warm regards,<br/><strong>Calista Tennis Courts</strong></p>
    </div>
  `;
  await send(email, subject, html);
}

export async function sendStatusChangeEmail(
  email: string,
  name: string,
  date: string,
  time: string,
  courtName: string,
  newStatus: string
) {
  const configs: Record<string, { subject: string; heading: string; color: string; body: string }> = {
    confirmed: {
      subject: "Booking Confirmed – Calista Tennis Courts",
      heading: "Your Booking is Confirmed!",
      color: "#15803d",
      body: "Great news! Your court reservation has been reviewed and confirmed by our team.",
    },
    cancelled: {
      subject: "Booking Cancelled – Calista Tennis Courts",
      heading: "Booking Cancelled",
      color: "#991b1b",
      body: "Your court reservation has been cancelled. If you have any questions, please contact us.",
    },
    completed: {
      subject: "Thank You for Visiting – Calista Tennis Courts",
      heading: "We Hope to See You Again!",
      color: "#1A3626",
      body: "Your session has been marked as completed. Thank you for choosing Calista Tennis Courts — we hope you enjoyed your game!",
    },
    pending: {
      subject: "Booking Under Review – Calista Tennis Courts",
      heading: "Booking Under Review",
      color: "#92400e",
      body: "Your booking is currently under review by our team. We will confirm it shortly.",
    },
  };

  const cfg = configs[newStatus];
  if (!cfg) return;

  const html = `
    <div style="font-family:sans-serif;color:#1A3626;max-width:560px;margin:0 auto;padding:32px;border:1px solid #e5e7eb">
      <h2 style="font-family:serif;font-size:26px;color:${cfg.color}">${cfg.heading}</h2>
      <p>Dear ${name},</p>
      <p>${cfg.body}</p>
      <div style="background:#FDFCF0;padding:20px;margin:24px 0;border:1px solid #1A362615;border-radius:4px">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#6B7280;padding:4px 0">Date</td><td style="font-weight:600">${date}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Time</td><td style="font-weight:600">${time}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Court</td><td style="font-weight:600">${courtName}</td></tr>
        </table>
      </div>
      <p>Warm regards,<br/><strong>Calista Tennis Courts</strong></p>
    </div>
  `;
  await send(email, cfg.subject, html);
}

export async function sendReminderEmail(
  email: string,
  name: string,
  date: string,
  time: string,
  courtName: string
) {
  const subject = "Reminder: Your Booking Tomorrow – Calista Tennis Courts";
  const html = `
    <div style="font-family:sans-serif;color:#1A3626;max-width:560px;margin:0 auto;padding:32px;border:1px solid #e5e7eb">
      <h2 style="font-family:serif;font-size:26px">See You Tomorrow!</h2>
      <p>Dear ${name},</p>
      <p>A friendly reminder about your upcoming reservation at Calista Tennis Courts.</p>
      <div style="background:#FDFCF0;padding:20px;margin:24px 0;border:1px solid #1A362615;border-radius:4px">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#6B7280;padding:4px 0">Date</td><td style="font-weight:600">${date}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Time</td><td style="font-weight:600">${time}</td></tr>
          <tr><td style="color:#6B7280;padding:4px 0">Court</td><td style="font-weight:600">${courtName}</td></tr>
        </table>
      </div>
      <p>We look forward to seeing you.<br/><strong>Calista Tennis Courts</strong></p>
    </div>
  `;
  await send(email, subject, html);
}
