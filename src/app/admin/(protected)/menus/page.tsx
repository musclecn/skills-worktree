import { SimpleCrudManager } from "@/components/admin/SimpleCrudManager";

export default function AdminMenusPage() {
  return (
    <SimpleCrudManager
      title="菜单管理"
      endpoint="/api/admin/menus"
      fields={[
        { key: "menuKey", label: "菜单键" },
        { key: "labelZh", label: "中文名称" },
        { key: "labelEn", label: "英文名称" },
        { key: "path", label: "路径" },
        { key: "sortOrder", label: "排序", type: "number" },
        { key: "visible", label: "显示(1/0)", type: "number" },
      ]}
      defaults={{ sortOrder: 0, visible: 1 }}
    />
  );
}
