"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getAttribution, newSubmissionId, trackEvent } from "@/lib/analytics-client";
import { APPOINTMENT_TOPICS, classifyContact, topicFromPath } from "@/lib/appointment";
import { localizePath } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";

type AppointmentFormState = {
  companyName: string;
  contactName: string;
  contactInfo: string;
  topic: string;
  /** 蜜罐字段：对访客隐藏，正常提交时始终为空。 */
  website: string;
};

type Feedback = { kind: "success" | "error"; text: string } | null;

function createEmptyForm(topic = ""): AppointmentFormState {
  return {
    companyName: "",
    contactName: "",
    contactInfo: "",
    topic,
    website: "",
  };
}

export function AppointmentForm({ locale }: { locale: AppLocale }) {
  const [form, setForm] = useState<AppointmentFormState>(createEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  // 同一次提交的重试共用一个编号，服务端据此只保留一条。
  const submissionIdRef = useRef("");
  const topicTouchedRef = useRef(false);

  const text = useMemo(
    () =>
      locale === "zh"
        ? {
            title: "预约表单",
            subtitle: "请留下企业信息，我们会在 1 个工作日内与您联系。",
            companyName: "公司名称",
            contactName: "联系人",
            contactInfo: "手机号",
            contactHint: "没有手机号也可以填写电话或邮箱。",
            topic: "咨询方向（选填）",
            topicPlaceholder: "请选择",
            submit: "提交预约",
            submitting: "提交中...",
            success: "预约已提交，我们会在 1 个工作日内与您联系。",
            error: "提交失败，请稍后重试，或直接拨打服务热线。",
            network: "网络连接异常，预约尚未提交。请检查网络后重试，已填写的内容不会丢失。",
            invalidContact: "请填写正确的手机号，或填写电话、邮箱",
            placeholderCompany: "请输入公司全称",
            placeholderContact: "请输入联系人姓名",
            placeholderInfo: "请输入手机号",
            privacyBefore: "提交即表示您同意我们按",
            privacyLink: "隐私政策",
            privacyAfter: "使用以上信息与您联系。",
          }
        : {
            title: "Book a Consultation",
            subtitle: "Leave your company details and we will contact you within one business day.",
            companyName: "Company Name",
            contactName: "Contact Person",
            contactInfo: "Phone or Email",
            contactHint: "A mobile number, landline, or work email all work.",
            topic: "Topic (optional)",
            topicPlaceholder: "Select a topic",
            submit: "Submit",
            submitting: "Submitting...",
            success: "Request submitted. We will contact you within one business day.",
            error: "Submission failed. Please try again later or call our service line.",
            network: "Network error. Your request has not been sent. Please check your connection and try again; what you entered is kept.",
            invalidContact: "Please enter a valid phone number or email address.",
            placeholderCompany: "Company legal name",
            placeholderContact: "Contact person",
            placeholderInfo: "Phone number or email",
            privacyBefore: "By submitting, you agree that we may use this information to contact you as described in our ",
            privacyLink: "Privacy Policy",
            privacyAfter: ".",
          },
    [locale],
  );

  // 按访客最近看过的产品预选咨询方向，访客可以改，也可以清空。
  useEffect(() => {
    const suggested = topicFromPath(getAttribution().productPath);
    if (suggested && !topicTouchedRef.current) {
      setForm((prev) => (prev.topic ? prev : { ...prev, topic: suggested }));
    }
  }, []);

  // 提交结果出现后把焦点移到提示上，键盘和读屏用户能立即知道结果。
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  function bind<K extends keyof AppointmentFormState>(key: K, value: AppointmentFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (classifyContact(form.contactInfo) === "other") {
      setFeedback({ kind: "error", text: text.invalidContact });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    if (!submissionIdRef.current) {
      submissionIdRef.current = newSubmissionId();
    }

    try {
      let response: Response;
      try {
        response = await fetch("/api/public/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            locale,
            sourcePage: window.location.pathname,
            submissionId: submissionIdRef.current,
            ...getAttribution(),
          }),
        });
      } catch {
        // fetch 自身抛错说明请求没有到达服务器，给出可读提示并保留已填内容。
        throw new Error(text.network);
      }

      const json = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || text.error);
      }

      trackEvent({ type: "form_submit_ok", entryId: form.topic || null });
      setFeedback({ kind: "success", text: text.success });
      setForm(createEmptyForm());
      submissionIdRef.current = "";
      topicTouchedRef.current = false;
    } catch (error) {
      trackEvent({ type: "form_submit_fail" });
      setFeedback({ kind: "error", text: error instanceof Error && error.message ? error.message : text.error });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="detail-block motion-reveal appointment-form-block"
      id="appointment-form"
      data-track-impression="form_view"
      data-track-id="appointment-form"
    >
      <div className="appointment-form-head">
        <p className="eyebrow">{locale === "zh" ? "在线预约" : "Appointment"}</p>
        <h2>{text.title}</h2>
        <p>{text.subtitle}</p>
      </div>

      {/* 成功用 status（礼貌播报），失败用 alert（立即播报）；两者样式不同。 */}
      <div
        ref={feedbackRef}
        tabIndex={-1}
        className={feedback ? `notice appointment-feedback is-${feedback.kind}` : "appointment-feedback"}
        role={feedback?.kind === "error" ? "alert" : "status"}
        aria-live={feedback?.kind === "error" ? "assertive" : "polite"}
      >
        {feedback?.text}
      </div>

      <form className="appointment-form-grid" onSubmit={submit} noValidate={false}>
        <label>
          {text.companyName}
          <input
            type="text"
            name="organization"
            autoComplete="organization"
            required
            maxLength={120}
            value={form.companyName}
            placeholder={text.placeholderCompany}
            onChange={(event) => bind("companyName", event.target.value)}
          />
        </label>
        <label>
          {text.contactName}
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            value={form.contactName}
            placeholder={text.placeholderContact}
            onChange={(event) => bind("contactName", event.target.value)}
          />
        </label>
        <label>
          {text.contactInfo}
          <input
            type="text"
            name="contact"
            autoComplete={locale === "zh" ? "tel" : "email"}
            inputMode={locale === "zh" ? "tel" : "email"}
            required
            maxLength={120}
            value={form.contactInfo}
            placeholder={text.placeholderInfo}
            aria-describedby="appointment-contact-hint"
            onChange={(event) => bind("contactInfo", event.target.value)}
          />
          <small id="appointment-contact-hint">{text.contactHint}</small>
        </label>
        <label>
          {text.topic}
          <select
            name="topic"
            value={form.topic}
            onChange={(event) => {
              topicTouchedRef.current = true;
              bind("topic", event.target.value);
            }}
          >
            <option value="">{text.topicPlaceholder}</option>
            {APPOINTMENT_TOPICS.map((item) => (
              <option key={item.key} value={item.key}>
                {item[locale]}
              </option>
            ))}
          </select>
        </label>

        <div className="appointment-honeypot" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => bind("website", event.target.value)}
            />
          </label>
        </div>

        <div className="appointment-form-actions">
          <button disabled={submitting} type="submit">
            {submitting ? text.submitting : text.submit}
          </button>
          <p className="appointment-privacy">
            {text.privacyBefore}
            <Link href={localizePath(locale, "/privacy")}>{text.privacyLink}</Link>
            {text.privacyAfter}
          </p>
        </div>
      </form>
    </section>
  );
}
