import { SimpleCrudManager } from "@/components/admin/SimpleCrudManager";

export default function AdminSolutionsPage() {
  return (
    <SimpleCrudManager
      title="解决方案管理"
      endpoint="/api/admin/solutions"
      fields={[
        { key: "slug", label: "slug" },
        { key: "titleZh", label: "标题（中文）" },
        { key: "titleEn", label: "标题（英文）" },
        { key: "summaryZh", label: "简介（中文）", type: "textarea" },
        { key: "summaryEn", label: "简介（英文）", type: "textarea" },
        { key: "coverUrl", label: "封面 URL" },
        { key: "sortOrder", label: "排序", type: "number" },
        { key: "publishStatus", label: "发布状态", type: "select", options: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
        { key: "translationStatus", label: "翻译状态", type: "select", options: ["DRAFT", "MACHINE_TRANSLATED", "REVIEWED"] },
      ]}
      defaults={{ sortOrder: 0, publishStatus: "PUBLISHED", translationStatus: "REVIEWED" }}
    />
  );
}
