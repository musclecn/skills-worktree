"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ShortVideoRecord = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  posterUrl?: string;
  size: number;
  updatedAt: string;
};

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("zh-CN", { hour12: false });
}

export function ShortVideoManager() {
  const [videos, setVideos] = useState<ShortVideoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editingTitles, setEditingTitles] = useState<Record<string, string>>({});
  const [savingFileName, setSavingFileName] = useState<string | null>(null);

  const totalSize = useMemo(() => videos.reduce((sum, video) => sum + video.size, 0), [videos]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/short-videos", { credentials: "include" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "视频列表加载失败");
      }
      const data = Array.isArray(json.data) ? json.data : [];
      setVideos(data);
      setEditingTitles(Object.fromEntries(data.map((video: ShortVideoRecord) => [video.fileName, video.title])));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "视频列表加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!uploadFile) {
      setMessage("请先选择视频文件");
      return;
    }

    setSavingFileName("__uploading__");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      const response = await fetch("/api/admin/short-videos", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "视频上传失败");
      }
      setMessage("视频已上传，前台短视频栏目会自动显示");
      setUploadTitle("");
      setUploadFile(null);
      setFileInputKey((value) => value + 1);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "视频上传失败");
    } finally {
      setSavingFileName(null);
    }
  }

  async function saveTitle(video: ShortVideoRecord) {
    const nextTitle = (editingTitles[video.fileName] || "").trim();
    if (!nextTitle) {
      setMessage("视频标题不能为空");
      return;
    }

    setSavingFileName(video.fileName);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/short-videos/${encodeURIComponent(video.fileName)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "视频标题更新失败");
      }
      setMessage("视频标题已更新");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "视频标题更新失败");
    } finally {
      setSavingFileName(null);
    }
  }

  async function remove(video: ShortVideoRecord) {
    if (!confirm(`确认删除视频「${video.title}」？删除后前台将不再显示。`)) return;

    setSavingFileName(video.fileName);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/short-videos/${encodeURIComponent(video.fileName)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "视频删除失败");
      }
      setMessage("视频已删除");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "视频删除失败");
    } finally {
      setSavingFileName(null);
    }
  }

  return (
    <>
      <div className="admin-card">
        <div className="short-video-admin-head">
          <div>
            <div className="badge">短视频栏目</div>
            <h2>视频管理</h2>
            <p>上传、预览、修改标题或删除前台“视频介绍”栏目中的短视频。</p>
          </div>
          <button className="secondary" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "刷新中..." : "刷新列表"}
          </button>
        </div>
        {message ? <div className="notice">{message}</div> : null}
        <div className="short-video-admin-stats">
          <span>当前视频：{videos.length} 条</span>
          <span>占用空间：{formatFileSize(totalSize)}</span>
        </div>
      </div>

      <div className="admin-card">
        <h2>上传新视频</h2>
        <form className="short-video-admin-upload" onSubmit={upload}>
          <label>
            展示标题
            <input
              type="text"
              maxLength={80}
              placeholder="例如：泰可思 AI 财税分析智能体产品介绍"
              value={uploadTitle}
              onChange={(event) => setUploadTitle(event.target.value)}
            />
          </label>
          <label>
            视频文件
            <input
              key={fileInputKey}
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              type="file"
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            />
          </label>
          <button type="submit" disabled={savingFileName === "__uploading__"}>
            {savingFileName === "__uploading__" ? "上传中..." : "上传视频"}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h2>视频列表</h2>
        {loading ? <p className="short-video-admin-empty">加载中...</p> : null}
        {!loading && videos.length === 0 ? <p className="short-video-admin-empty">暂无短视频</p> : null}
        <div className="short-video-admin-grid">
          {videos.map((video, index) => {
            const isSaving = savingFileName === video.fileName;
            return (
              <article className="short-video-admin-card" key={video.fileName}>
                <div className="short-video-admin-preview">
                  <video src={video.url} poster={video.posterUrl} controls preload="metadata" />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="short-video-admin-body">
                  <label>
                    视频标题
                    <input
                      type="text"
                      maxLength={80}
                      value={editingTitles[video.fileName] || ""}
                      onChange={(event) =>
                        setEditingTitles((current) => ({ ...current, [video.fileName]: event.target.value }))
                      }
                    />
                  </label>
                  <div className="short-video-admin-meta">
                    <span>{video.fileName}</span>
                    <span>{formatDateTime(video.updatedAt)}</span>
                    <span>{formatFileSize(video.size)}</span>
                  </div>
                  <div className="short-video-admin-actions">
                    <button type="button" onClick={() => void saveTitle(video)} disabled={isSaving}>
                      {isSaving ? "保存中..." : "保存标题"}
                    </button>
                    <a href={video.url} target="_blank" rel="noreferrer">
                      打开视频
                    </a>
                    <button className="warn" type="button" onClick={() => void remove(video)} disabled={isSaving}>
                      删除
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
