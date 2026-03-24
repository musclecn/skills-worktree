"use client";

import { FormEvent, useEffect, useState } from "react";

type SiteForm = Record<string, string>;

const keys = [
  "companyNameZh",
  "companyNameEn",
  "phone",
  "fax",
  "email",
  "addressZh",
  "addressEn",
  "icpRecord",
  "copyrightZh",
  "copyrightEn",
  "logoUrl",
  "footerBuilderZh",
  "footerBuilderEn",
  "homeHeroTitleZh",
  "homeHeroTitleEn",
  "homeHeroSubtitleZh",
  "homeHeroSubtitleEn",
  "homeHeroImageUrl",
  "homeProductSectionTitleZh",
  "homeProductSectionTitleEn",
  "homeProductSectionSubtitleZh",
  "homeProductSectionSubtitleEn",
  "homeSolutionSectionTitleZh",
  "homeSolutionSectionTitleEn",
  "homeSolutionSectionSubtitleZh",
  "homeSolutionSectionSubtitleEn",
  "homeProductImage1",
  "homeProductImage2",
  "homeProductImage3",
  "homeProductImage4",
  "homeSolutionImage1",
  "homeSolutionImage2",
  "homeSolutionImage3",
  "homeAboutTitleZh",
  "homeAboutTitleEn",
  "homeAboutContentZh",
  "homeAboutContentEn",
  "homeContactTitleZh",
  "homeContactTitleEn",
] as const;

export function SiteSettingsEditor() {
  const [form, setForm] = useState<SiteForm>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/site-settings", { credentials: "include" });
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      const next: SiteForm = {};
      keys.forEach((key) => {
        next[key] = String(json.data[key] ?? "");
      });
      setForm(next);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setMessage(json.message || "保存失败");
      return;
    }
    setMessage("保存成功");
  }

  if (loading) {
    return <div className="admin-card">加载中...</div>;
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>站点配置</h2>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        {keys.map((key) => (
          <label key={key}>
            {key}
            <input value={form[key] || ""} onChange={(e) => setField(key, e.target.value)} />
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button type="submit">保存配置</button>
        <button className="secondary" type="button" onClick={() => void load()}>
          重新加载
        </button>
      </div>
    </form>
  );
}
