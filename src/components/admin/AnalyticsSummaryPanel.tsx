"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsSummary } from "@/lib/analytics-summary";

type CountRow = { key: string; count: number };

function shanghaiToday(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(date);
}

function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function CountTable({ title, rows, keyLabel }: { title: string; rows: CountRow[]; keyLabel: string }) {
  return (
    <div className="admin-card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>该周期内没有数据</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>{keyLabel}</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.key}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AnalyticsSummaryPanel() {
  const [from, setFrom] = useState(shanghaiToday(-29));
  const [to, setTo] = useState(shanghaiToday());
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async (rangeFrom: string, rangeTo: string) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/analytics/summary?from=${rangeFrom}&to=${rangeTo}`, {
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "统计数据加载失败");
      }
      setSummary(json.data as AnalyticsSummary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "统计数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(shanghaiToday(-29), shanghaiToday());
  }, [load]);

  const metrics = summary
    ? [
        {
          label: "相关入口点击率",
          value: percent(summary.relatedEntry.clickRate),
          detail: `点击 ${summary.relatedEntry.clicks} ／ 曝光 ${summary.relatedEntry.impressions}（会话×文章）`,
        },
        {
          label: "产品到预约点击率",
          value: percent(summary.productToBooking.clickRate),
          detail: `点击 ${summary.productToBooking.bookingClickSessions} ／ 浏览 ${summary.productToBooking.productSessions}（会话）`,
        },
        {
          label: "成功提交数",
          value: String(summary.appointments.successfulSubmissions),
          detail: `原始提交 ${summary.appointments.rawSubmissions}，去重联系方式 ${summary.appointments.distinctContacts}`,
        },
        {
          label: "人工确认有效线索数",
          value: String(summary.appointments.validLeads),
          detail: "销售标为有效，同一公司计一条",
        },
        {
          label: "查看原文点击率",
          value: percent(summary.relatedEntry.sourceClickRate),
          detail: `点击 ${summary.relatedEntry.sourceClicks} ／ 新闻详情 ${summary.visits.newsDetailViews}（会话×文章）`,
        },
        {
          label: "会话与页面曝光",
          value: `${summary.visits.sessions} ／ ${summary.visits.pageViews}`,
          detail: `看到预约表单的会话 ${summary.form.viewSessions}，提交失败 ${summary.form.submitFailEvents} 次`,
        },
      ]
    : [];

  return (
    <>
      <div className="admin-card">
        <div className="appointment-admin-head">
          <h2>访问与预约统计</h2>
          <div className="appointment-admin-actions">
            <a className="appointment-export-link" href={`/api/admin/analytics/summary?from=${from}&to=${to}&format=csv`}>
              导出聚合 CSV
            </a>
          </div>
        </div>
        <p style={{ color: "var(--muted)", marginBottom: 10 }}>
          日期按北京时间，起止日都包含在内。比例的分子和分母取同一周期；数据只有聚合数量，不含公司名、联系人和联系方式。已识别的机器人不计入。
        </p>
        {message ? <div className="notice">{message}</div> : null}
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void load(from, to);
          }}
        >
          <label>
            起始日
            <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            结束日
            <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
          </label>
          <div className="appointment-admin-actions">
            <button type="submit" disabled={loading}>
              {loading ? "加载中..." : "查询"}
            </button>
          </div>
        </form>
      </div>

      {summary ? (
        <>
          <div className="admin-card">
            <h2>
              核心指标（{summary.range.from} 起，至 {to}）
            </h2>
            <div className="grid">
              {metrics.map((metric) => (
                <article className="card" key={metric.label}>
                  <h3>{metric.label}</h3>
                  <p>{metric.value}</p>
                  <small style={{ color: "var(--muted)" }}>{metric.detail}</small>
                </article>
              ))}
            </div>
            <p style={{ color: "var(--muted)", marginTop: 12 }}>
              预约记录中有来源链路的占比：{percent(summary.appointments.attributionFillRate)}；标记为重复{" "}
              {summary.appointments.duplicateFlagged} 条，标记为突发 {summary.appointments.burstFlagged} 条。样本偏少时请看绝对数，不要只看比例。
            </p>
          </div>

          <CountTable title="页面曝光排名（前 20）" rows={summary.visits.topPages} keyLabel="页面路径" />
          <CountTable title="会话的设备类别" rows={summary.visits.byDevice} keyLabel="设备" />
          <CountTable title="预约的复核状态" rows={summary.appointments.byStatus} keyLabel="状态" />
          <CountTable title="成功提交的咨询方向" rows={summary.appointments.byTopic} keyLabel="咨询方向" />
          <CountTable title="成功提交的来源文章" rows={summary.appointments.byArticle} keyLabel="文章" />
          <CountTable title="成功提交前最近浏览的产品" rows={summary.appointments.byProduct} keyLabel="产品页" />
          <CountTable title="成功提交使用的预约入口" rows={summary.appointments.byEntry} keyLabel="入口" />
          <CountTable title="成功提交的外部来源" rows={summary.appointments.byReferrer} keyLabel="来源域名" />
        </>
      ) : null}
    </>
  );
}
