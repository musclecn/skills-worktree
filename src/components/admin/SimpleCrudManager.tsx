"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  options?: string[];
  placeholder?: string;
  json?: boolean;
};

type Props = {
  title: string;
  endpoint: string;
  fields: Field[];
  defaults?: Record<string, unknown>;
};

export function SimpleCrudManager({ title, endpoint, fields, defaults = {} }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
    }),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(endpoint, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "加载失败");
      }
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  function bindField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setEditingId(null);
    setForm(defaults);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const url = editingId ? `${endpoint}/${editingId}` : endpoint;
    const method = editingId ? "PUT" : "POST";
    const payload = { ...form };

    for (const field of fields) {
      if (!field.json) continue;
      const raw = payload[field.key];
      if (typeof raw !== "string" || raw.trim() === "") {
        payload[field.key] = null;
        continue;
      }
      try {
        payload[field.key] = JSON.parse(raw);
      } catch {
        setMessage(`${field.label} 不是合法 JSON`);
        return;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "保存失败");
      }
      setMessage("保存成功");
      reset();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  }

  async function remove(id: string) {
    if (!confirm("确认删除该记录？")) return;
    setMessage("");
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "删除失败");
      }
      setMessage("删除成功");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  function edit(item: Record<string, unknown>) {
    const next: Record<string, unknown> = {};
    for (const field of fields) {
      next[field.key] = item[field.key] ?? "";
    }
    setEditingId(String(item.id ?? ""));
    setForm(next);
  }

  return (
    <div className="admin-card">
      <h2>{title}</h2>
      {message ? <div className="notice">{message}</div> : null}

      <form className="form-grid" onSubmit={submit}>
        {fields.map((field) => {
          const value = form[field.key];
          const stringValue = value === null || value === undefined ? "" : String(value);

          if (field.type === "textarea") {
            return (
              <label key={field.key} style={{ gridColumn: "1 / -1" }}>
                {field.label}
                <textarea
                  value={stringValue}
                  placeholder={field.placeholder}
                  onChange={(e) => bindField(field.key, e.target.value)}
                />
              </label>
            );
          }

          if (field.type === "select") {
            return (
              <label key={field.key}>
                {field.label}
                <select
                  value={stringValue}
                  onChange={(e) => bindField(field.key, e.target.value)}
                >
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.key}>
              {field.label}
              <input
                type={field.type === "number" ? "number" : "text"}
                value={stringValue}
                placeholder={field.placeholder}
                onChange={(e) =>
                  bindField(
                    field.key,
                    field.type === "number" ? Number(e.target.value || 0) : e.target.value,
                  )
                }
              />
            </label>
          );
        })}

        <div style={{ display: "flex", gap: 8, gridColumn: "1 / -1" }}>
          <button type="submit">{editingId ? "更新" : "新增"}</button>
          <button className="secondary" type="button" onClick={reset}>
            重置
          </button>
          <button className="secondary" type="button" onClick={() => void load()}>
            刷新
          </button>
        </div>
      </form>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              {fields.slice(0, 4).map((field) => (
                <th key={field.key}>{field.label}</th>
              ))}
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>加载中...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>暂无数据</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={String(item.id)}>
                  <td>{String(item.id).slice(0, 10)}</td>
                  {fields.slice(0, 4).map((field) => (
                    <td key={field.key}>{String(item[field.key] ?? "")}</td>
                  ))}
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="secondary" type="button" onClick={() => edit(item)}>
                      编辑
                    </button>
                    <button className="warn" type="button" onClick={() => void remove(String(item.id))}>
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
