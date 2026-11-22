"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  APPOINTMENT_TOPICS,
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
  isReviewStatus,
  normalizeCompany,
  topicLabel,
} from "@/lib/appointment";

type AppointmentRecord = {
  id: string;
  companyName: string;
  contactName: string;
  contactInfo: string;
  sourcePage?: string | null;
  notes?: string | null;
  topic?: string | null;
  locale?: string | null;
  landingPath?: string | null;
  referrerHost?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  prevPath?: string | null;
  articleSlug?: string | null;
  productPath?: string | null;
  entryId?: string | null;
  deviceClass?: string | null;
  contactKey?: string | null;
  reviewStatus: string;
  anomalyFlags?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const FLAG_LABELS: Record<string, string> = {
  DUPLICATE_24H: "24 小时内重复",
  BURST: "突发提交",
};

function statusLabel(value: string) {
  return isReviewStatus(value) ? REVIEW_STATUS_LABELS[value] : value;
}

function flagLabels(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .filter(Boolean)
    .map((flag) => FLAG_LABELS[flag] ?? flag)
    .join("、");
}

type AppointmentFormState = {
  companyName: string;
  contactName: string;
  contactInfo: string;
  sourcePage: string;
  notes: string;
  topic: string;
  reviewStatus: string;
};

function createEmptyForm(): AppointmentFormState {
  return {
    companyName: "",
    contactName: "",
    contactInfo: "",
    sourcePage: "",
    notes: "",
    topic: "",
    reviewStatus: "PENDING",
  };
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("zh-CN", { hour12: false });
}

export function AppointmentManager() {
  const [items, setItems] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentFormState>(createEmptyForm());
  const [statusFilter, setStatusFilter] = useState("ALL");

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const visibleItems = useMemo(() => {
    if (statusFilter === "ALL") return items;
    if (statusFilter === "FLAGGED") return items.filter((item) => item.anomalyFlags);
    return items.filter((item) => item.reviewStatus === statusFilter);
  }, [items, statusFilter]);

  // 汇总只算数量：原始提交、去重联系方式、人工确认有效线索（同一公司计一条）。
  const totals = useMemo(() => {
    const contacts = new Set(items.map((item) => item.contactKey || `row:${item.id}`));
    const validCompanies = new Set(
      items.filter((item) => item.reviewStatus === "VALID").map((item) => normalizeCompany(item.companyName)),
    );
    return {
      raw: items.length,
      contacts: contacts.size,
      valid: validCompanies.size,
      pending: items.filter((item) => item.reviewStatus === "PENDING").length,
      flagged: items.filter((item) => item.anomalyFlags).length,
    };
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/appointments", { credentials: "include" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "预约数据加载失败");
      }
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "预约数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function bind<K extends keyof AppointmentFormState>(key: K, value: AppointmentFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setEditingId(null);
    setForm(createEmptyForm());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/appointments/${editingId}` : "/api/admin/appointments";

    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "预约保存失败");
      }
      setMessage(editingId ? "预约记录已更新" : "预约记录已新增");
      reset();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "预约保存失败");
    }
  }

  function edit(item: AppointmentRecord) {
    setEditingId(item.id);
    setForm({
      companyName: item.companyName,
      contactName: item.contactName,
      contactInfo: item.contactInfo,
      sourcePage: item.sourcePage ?? "",
      notes: item.notes ?? "",
      topic: item.topic ?? "",
      reviewStatus: item.reviewStatus || "PENDING",
    });
  }

  /** 列表里直接改复核状态，不必进入编辑表单。 */
  async function review(item: AppointmentRecord, reviewStatus: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/appointments/${item.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: item.companyName,
          contactName: item.contactName,
          contactInfo: item.contactInfo,
          sourcePage: item.sourcePage ?? "",
          notes: item.notes ?? "",
          topic: item.topic ?? "",
          reviewStatus,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "复核状态更新失败");
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "复核状态更新失败");
    }
  }

  async function remove(id: string) {
    if (!confirm("确认删除该预约记录？")) return;

    setMessage("");
    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "删除失败");
      }
      setMessage("删除成功");
      if (selectedId === id) {
        setSelectedId(null);
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  return (
    <>
      <div className="admin-card">
        <div className="appointment-admin-head">
          <h2>预约管理</h2>
          <div className="appointment-admin-actions">
            <button className="secondary" type="button" onClick={() => void load()}>
              刷新
            </button>
            {/* 下载接口不是页面，必须走普通链接触发文件下载 */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="appointment-export-link" href="/api/admin/appointments/export">
              导出 CSV
            </a>
          </div>
        </div>
        <p style={{ color: "var(--muted)", marginBottom: 10 }}>
          原始提交 {totals.raw} 条，去重联系方式 {totals.contacts} 个，人工确认有效线索 {totals.valid} 条；待核 {totals.pending} 条，带异常标记{" "}
          {totals.flagged} 条。
        </p>
        {message ? <div className="notice">{message}</div> : null}

        <form className="form-grid full" onSubmit={submit}>
          <div className="form-grid">
            <label>
              公司名称
              <input
                required
                type="text"
                value={form.companyName}
                onChange={(event) => bind("companyName", event.target.value)}
              />
            </label>
            <label>
              联系人
              <input
                required
                type="text"
                value={form.contactName}
                onChange={(event) => bind("contactName", event.target.value)}
              />
            </label>
            <label>
              联系方式
              <input
                required
                type="text"
                value={form.contactInfo}
                onChange={(event) => bind("contactInfo", event.target.value)}
              />
            </label>
            <label>
              来源页面
              <input
                type="text"
                value={form.sourcePage}
                onChange={(event) => bind("sourcePage", event.target.value)}
              />
            </label>
            <label>
              咨询方向
              <select value={form.topic} onChange={(event) => bind("topic", event.target.value)}>
                <option value="">未选择</option>
                {APPOINTMENT_TOPICS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.zh}
                  </option>
                ))}
              </select>
            </label>
            <label>
              复核状态
              <select value={form.reviewStatus} onChange={(event) => bind("reviewStatus", event.target.value)}>
                {REVIEW_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {REVIEW_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            备注
            <textarea value={form.notes} onChange={(event) => bind("notes", event.target.value)} />
          </label>

          <div className="appointment-admin-actions">
            <button type="submit">{editingId ? "更新预约" : "新增预约"}</button>
            <button className="secondary" type="button" onClick={reset}>
              重置
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <div className="appointment-admin-head">
          <h2>预约列表</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            筛选
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">全部</option>
              <option value="FLAGGED">带异常标记</option>
              {REVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {REVIEW_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>公司名称</th>
                <th>联系人</th>
                <th>联系方式</th>
                <th>咨询方向</th>
                <th>复核状态</th>
                <th>异常标记</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>加载中...</td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={8}>暂无预约数据</td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.companyName}</td>
                    <td>{item.contactName}</td>
                    <td>{item.contactInfo}</td>
                    <td>{topicLabel(item.topic) || "-"}</td>
                    <td>
                      <select
                        aria-label={`${item.companyName} 的复核状态`}
                        value={item.reviewStatus}
                        onChange={(event) => void review(item, event.target.value)}
                      >
                        {REVIEW_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {REVIEW_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{flagLabels(item.anomalyFlags) || "-"}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <div className="appointment-row-actions">
                        <button className="secondary" type="button" onClick={() => setSelectedId(item.id)}>
                          查看
                        </button>
                        <button className="secondary" type="button" onClick={() => edit(item)}>
                          编辑
                        </button>
                        <button className="warn" type="button" onClick={() => void remove(item.id)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="admin-card">
          <h2>预约详情</h2>
          <div className="appointment-detail-grid">
            <article>
              <h3>公司名称</h3>
              <p>{selected.companyName}</p>
            </article>
            <article>
              <h3>联系人</h3>
              <p>{selected.contactName}</p>
            </article>
            <article>
              <h3>联系方式</h3>
              <p>{selected.contactInfo}</p>
            </article>
            <article>
              <h3>来源页面</h3>
              <p>{selected.sourcePage || "-"}</p>
            </article>
            <article>
              <h3>咨询方向</h3>
              <p>{topicLabel(selected.topic) || "-"}</p>
            </article>
            <article>
              <h3>复核状态</h3>
              <p>
                {statusLabel(selected.reviewStatus)}
                {selected.reviewedAt ? `（${formatDateTime(selected.reviewedAt)}）` : ""}
              </p>
            </article>
            <article>
              <h3>异常标记</h3>
              <p>{flagLabels(selected.anomalyFlags) || "-"}</p>
            </article>
            <article>
              <h3>外部来源</h3>
              <p>
                {selected.referrerHost || "-"}
                {selected.utmSource ? `（${selected.utmSource}${selected.utmCampaign ? ` / ${selected.utmCampaign}` : ""}）` : ""}
              </p>
            </article>
            <article>
              <h3>落地页</h3>
              <p>{selected.landingPath || "-"}</p>
            </article>
            <article>
              <h3>来源文章</h3>
              <p>{selected.articleSlug || "-"}</p>
            </article>
            <article>
              <h3>最近浏览的产品</h3>
              <p>{selected.productPath || "-"}</p>
            </article>
            <article>
              <h3>上一页与预约入口</h3>
              <p>
                {selected.prevPath || "-"} ／ {selected.entryId || "-"}
              </p>
            </article>
            <article>
              <h3>语言与设备</h3>
              <p>
                {selected.locale === "en" ? "英文" : selected.locale === "zh" ? "中文" : "-"} ／ {selected.deviceClass || "-"}
              </p>
            </article>
            <article>
              <h3>提交时间</h3>
              <p>{formatDateTime(selected.createdAt)}</p>
            </article>
            <article>
              <h3>更新时间</h3>
              <p>{formatDateTime(selected.updatedAt)}</p>
            </article>
          </div>
          <article className="appointment-notes">
            <h3>备注</h3>
            <p>{selected.notes || "-"}</p>
          </article>
        </div>
      ) : null}
    </>
  );
}
