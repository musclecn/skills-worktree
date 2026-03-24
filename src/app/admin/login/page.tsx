"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@sztaxs.com");
  const [password, setPassword] = useState("Admin@12345");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      setMessage(data.message || "登录失败");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="container" style={{ paddingTop: 80 }}>
      <form className="admin-card" onSubmit={submit} style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2>后台登录</h2>
        {message ? <div className="notice">{message}</div> : null}
        <div className="form-grid full">
          <label>
            邮箱
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      </form>
    </div>
  );
}
