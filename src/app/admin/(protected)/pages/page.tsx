import { SimpleCrudManager } from "@/components/admin/SimpleCrudManager";

export default function AdminPagesPage() {
  return (
    <SimpleCrudManager
      title="页面管理（about/contact）"
      endpoint="/api/admin/pages"
      fields={[
        { key: "pageKey", label: "页面键（about/contact）" },
        { key: "slug", label: "slug" },
        { key: "titleZh", label: "标题（中文）" },
        { key: "titleEn", label: "标题（英文）" },
        { key: "summaryZh", label: "摘要（中文）", type: "textarea" },
        { key: "summaryEn", label: "摘要（英文）", type: "textarea" },
        { key: "contentZh", label: "正文（中文）", type: "textarea" },
        { key: "contentEn", label: "正文（英文）", type: "textarea" },
        { key: "publishStatus", label: "发布状态", type: "select", options: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
        { key: "translationStatus", label: "翻译状态", type: "select", options: ["DRAFT", "MACHINE_TRANSLATED", "REVIEWED"] },
        { key: "blocks", label: "区块JSON", type: "textarea", json: true },
      ]}
      defaults={{ publishStatus: "PUBLISHED", translationStatus: "REVIEWED", blocks: "" }}
    />
  );
}
