"use client";

import { useEffect, useState } from "react";

type Asset = {
  id: string;
  url: string;
  originalName: string;
  createdAt: string;
};

export function MediaManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const res = await fetch("/api/admin/media", { credentials: "include" });
    const json = await res.json();
    if (res.ok && json.success) {
      setAssets(json.data || []);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function upload() {
    if (!file) {
      setMessage("请先选择文件");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/media", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setMessage(json.message || "上传失败");
      return;
    }
    setMessage("上传成功");
    setFile(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("确认删除此媒体？")) return;
    const res = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setMessage(json.message || "删除失败");
      return;
    }
    setMessage("删除成功");
    await load();
  }

  return (
    <div className="admin-card">
      <h2>媒体库</h2>
      {message ? <div className="notice">{message}</div> : null}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="button" onClick={() => void upload()}>
          上传文件
        </button>
      </div>

      <div className="grid">
        {assets.map((asset) => (
          <article className="card" key={asset.id}>
            <p style={{ fontSize: 13 }}>{asset.originalName}</p>
            <a href={asset.url} target="_blank" rel="noreferrer">
              {asset.url}
            </a>
            <div style={{ marginTop: 8 }}>
              <button className="warn" type="button" onClick={() => void remove(asset.id)}>
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
