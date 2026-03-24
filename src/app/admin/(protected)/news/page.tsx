import { SimpleCrudManager } from "@/components/admin/SimpleCrudManager";

export default function AdminNewsPage() {
  return (
    <SimpleCrudManager
      title="新闻管理"
      endpoint="/api/admin/news"
      fields={[
        { key: "slug", label: "slug" },
        { key: "titleZh", label: "标题（中文）" },
        { key: "titleEn", label: "标题（英文）" },
        { key: "summaryZh", label: "摘要（中文）", type: "textarea" },
        { key: "summaryEn", label: "摘要（英文）", type: "textarea" },
        { key: "contentZh", label: "正文（中文）", type: "textarea" },
        { key: "contentEn", label: "正文（英文）", type: "textarea" },
        { key: "coverUrl", label: "封面 URL" },
        { key: "publishedAt", label: "发布时间(ISO)" },
        { key: "sortOrder", label: "排序", type: "number" },
        { key: "publishStatus", label: "发布状态", type: "select", options: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
        { key: "translationStatus", label: "翻译状态", type: "select", options: ["DRAFT", "MACHINE_TRANSLATED", "REVIEWED"] },
      ]}
      defaults={{
        sortOrder: 0,
        publishStatus: "PUBLISHED",
        translationStatus: "REVIEWED",
        publishedAt: new Date().toISOString(),
      }}
    />
  );
}
