import net from "node:net";
import tls from "node:tls";
import { topicLabel } from "@/lib/appointment";

type AppointmentNotification = {
  id: string;
  createdAt: Date;
  companyName: string;
  contactName: string;
  contactInfo: string;
  sourcePage?: string | null;
  notes?: string | null;
  topic?: string | null;
  locale?: string | null;
  landingPath?: string | null;
  referrerHost?: string | null;
  prevPath?: string | null;
  articleSlug?: string | null;
  productPath?: string | null;
  entryId?: string | null;
};

type BurstAlert = {
  count: number;
  windowMinutes: number;
  detectedAt: Date;
};

/** 来源链路的一行摘要，写进通知邮件，方便销售判断线索从哪来。 */
function describeSourceChain(item: AppointmentNotification) {
  const parts = [
    item.referrerHost ? `外部来源 ${item.referrerHost}` : "",
    item.landingPath ? `落地页 ${item.landingPath}` : "",
    item.articleSlug ? `来源文章 ${item.articleSlug}` : "",
    item.productPath ? `最近产品 ${item.productPath}` : "",
    item.prevPath ? `上一页 ${item.prevPath}` : "",
    item.entryId ? `入口 ${item.entryId}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" → ") : "-";
}

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  to: string[];
  rejectUnauthorized: boolean;
};

type SmtpSocket = net.Socket | tls.TLSSocket;

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function parseRecipients(value: string) {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSmtpConfig(): SmtpConfig | null {
  const host = readEnv("SMTP_HOST", "ALIYUN_MAIL_HOST");
  const user = readEnv("SMTP_USER", "ALIYUN_MAIL_USER");
  const pass = readEnv("SMTP_PASS", "SMTP_PASSWORD", "ALIYUN_MAIL_PASSWORD");
  const from = readEnv("SMTP_FROM", "ALIYUN_MAIL_FROM") || user;
  const to = parseRecipients(readEnv("APPOINTMENT_NOTIFY_TO") || "szwmg@163.com");

  if (!host || !user || !pass || !from || to.length === 0) {
    return null;
  }

  const port = Number(readEnv("SMTP_PORT", "ALIYUN_MAIL_PORT")) || 465;
  return {
    host,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE ?? process.env.ALIYUN_MAIL_SECURE, port === 465),
    user,
    pass,
    from,
    fromName: readEnv("SMTP_FROM_NAME", "ALIYUN_MAIL_FROM_NAME") || "泰可思官网",
    to,
    rejectUnauthorized: parseBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
  };
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatShanghaiTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

function normalizeNewlines(value: string) {
  return value.replace(/\r?\n/g, "\r\n");
}

function dotStuff(value: string) {
  return normalizeNewlines(value).replace(/^\./gm, "..");
}

function base64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function buildAppointmentMessage(config: SmtpConfig, item: AppointmentNotification) {
  const subject = `官网预约通知：${item.companyName}`;
  const text = [
    "收到一条新的官网预约。",
    "",
    `公司名称：${item.companyName}`,
    `联系人：${item.contactName}`,
    `联系方式：${item.contactInfo}`,
    `咨询方向：${topicLabel(item.topic) || "-"}`,
    `来源链路：${describeSourceChain(item)}`,
    `页面语言：${item.locale === "en" ? "英文" : "中文"}`,
    `备注：${item.notes || "-"}`,
    `提交时间：${formatShanghaiTime(item.createdAt)}`,
    `预约ID：${item.id}`,
  ].join("\n");

  const rows = [
    ["公司名称", item.companyName],
    ["联系人", item.contactName],
    ["联系方式", item.contactInfo],
    ["咨询方向", topicLabel(item.topic) || "-"],
    ["来源链路", describeSourceChain(item)],
    ["页面语言", item.locale === "en" ? "英文" : "中文"],
    ["备注", item.notes || "-"],
    ["提交时间", formatShanghaiTime(item.createdAt)],
    ["预约ID", item.id],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f5f8fc;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#16345b;">
    <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #d8e4f2;border-radius:16px;overflow:hidden;">
      <div style="padding:22px 24px;background:#0a5ab5;color:#fff;">
        <div style="font-size:13px;opacity:.86;">泰可思官网预约通知</div>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">收到新的预约表单</h1>
      </div>
      <div style="padding:22px 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${htmlRows}
        </table>
        <p style="margin:18px 0 0;color:#60758e;font-size:13px;">请登录官网后台“预约管理”查看、修改或导出完整数据。</p>
      </div>
    </div>
  </body>
</html>`;

  const boundary = `----sztaxs-appointment-${Date.now().toString(36)}`;
  const fromName = encodeHeader(config.fromName);
  const toHeader = config.to.join(", ");

  return normalizeNewlines(
    [
      `From: ${fromName} <${config.from}>`,
      `To: ${toHeader}`,
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <appointment-${item.id}@sztaxs.com>`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64(text),
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64(html),
      `--${boundary}--`,
      "",
    ].join("\r\n"),
  );
}

class SmtpClient {
  private socket: SmtpSocket | null = null;
  private buffer = "";

  constructor(private config: SmtpConfig) {}

  private connectSocket() {
    return new Promise<SmtpSocket>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      const socket = this.config.secure
        ? tls.connect({
            host: this.config.host,
            port: this.config.port,
            servername: this.config.host,
            rejectUnauthorized: this.config.rejectUnauthorized,
          })
        : net.connect({ host: this.config.host, port: this.config.port });

      socket.once(this.config.secure ? "secureConnect" : "connect", () => {
        socket.off("error", onError);
        resolve(socket);
      });
      socket.once("error", onError);
    });
  }

  private readResponse() {
    return new Promise<{ code: number; text: string }>((resolve, reject) => {
      const socket = this.socket;
      if (!socket) {
        reject(new Error("SMTP socket is not connected"));
        return;
      }

      const cleanup = () => {
        socket.off("data", onData);
        socket.off("error", onError);
        socket.off("close", onClose);
      };
      const tryResolve = () => {
        const lines = this.buffer.split(/\r?\n/);
        const completeIndex = lines.findIndex((line) => /^\d{3} /.test(line));
        if (completeIndex === -1) return;

        const responseLines = lines.slice(0, completeIndex + 1);
        this.buffer = lines.slice(completeIndex + 1).join("\n");
        cleanup();
        resolve({
          code: Number(responseLines[completeIndex].slice(0, 3)),
          text: responseLines.join("\n"),
        });
      };
      const onData = (chunk: Buffer) => {
        this.buffer += chunk.toString("utf8");
        tryResolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = () => {
        cleanup();
        reject(new Error("SMTP connection closed unexpectedly"));
      };

      socket.on("data", onData);
      socket.once("error", onError);
      socket.once("close", onClose);
      tryResolve();
    });
  }

  private async expect(codes: number | number[]) {
    const expected = Array.isArray(codes) ? codes : [codes];
    const response = await this.readResponse();
    if (!expected.includes(response.code)) {
      throw new Error(`SMTP unexpected response ${response.code}: ${response.text}`);
    }
    return response;
  }

  private async write(command: string, expected: number | number[]) {
    this.socket?.write(`${command}\r\n`);
    return this.expect(expected);
  }

  async send(message: string) {
    this.socket = await this.connectSocket();
    await this.expect(220);
    await this.write("EHLO sztaxs.com", 250);

    if (!this.config.secure) {
      await this.write("STARTTLS", 220);
      this.socket = tls.connect({
        socket: this.socket,
        servername: this.config.host,
        rejectUnauthorized: this.config.rejectUnauthorized,
      });
      await new Promise<void>((resolve, reject) => {
        this.socket?.once("secureConnect", () => resolve());
        this.socket?.once("error", reject);
      });
      this.buffer = "";
      await this.write("EHLO sztaxs.com", 250);
    }

    await this.write("AUTH LOGIN", 334);
    await this.write(Buffer.from(this.config.user).toString("base64"), 334);
    await this.write(Buffer.from(this.config.pass).toString("base64"), 235);
    await this.write(`MAIL FROM:<${this.config.from}>`, 250);
    for (const recipient of this.config.to) {
      await this.write(`RCPT TO:<${recipient}>`, [250, 251]);
    }
    await this.write("DATA", 354);
    this.socket.write(`${dotStuff(message)}\r\n.\r\n`);
    await this.expect(250);
    await this.write("QUIT", 221).catch(() => undefined);
    this.socket.end();
  }
}

export async function sendAppointmentNotification(item: AppointmentNotification) {
  const config = getSmtpConfig();
  if (!config) {
    console.info("Appointment email notification skipped: SMTP is not configured");
    return { skipped: true };
  }

  const client = new SmtpClient(config);
  await client.send(buildAppointmentMessage(config, item));
  return { skipped: false };
}

function buildBurstAlertMessage(config: SmtpConfig, alert: BurstAlert) {
  const subject = `官网预约异常提醒：${alert.windowMinutes} 分钟内 ${alert.count} 条提交`;
  const text = [
    `官网预约表单在 ${alert.windowMinutes} 分钟内收到 ${alert.count} 条提交，已达到突发阈值。`,
    "",
    "这一批记录已在后台标记为“突发”，期间不再逐条发送通知。",
    "请登录官网后台“预约管理”复核：确认是否为测试、导入或恶意提交，并更新复核状态。",
    "",
    `发现时间：${formatShanghaiTime(alert.detectedAt)}`,
  ].join("\n");

  return normalizeNewlines(
    [
      `From: ${encodeHeader(config.fromName)} <${config.from}>`,
      `To: ${config.to.join(", ")}`,
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <appointment-burst-${alert.detectedAt.getTime()}@sztaxs.com>`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64(text),
      "",
    ].join("\r\n"),
  );
}

/** 突发提交告警：每次越过阈值只发一封，不含任何联系资料。 */
export async function sendAppointmentBurstAlert(alert: BurstAlert) {
  const config = getSmtpConfig();
  if (!config) {
    console.info("Appointment burst alert skipped: SMTP is not configured");
    return { skipped: true };
  }

  const client = new SmtpClient(config);
  await client.send(buildBurstAlertMessage(config, alert));
  return { skipped: false };
}
