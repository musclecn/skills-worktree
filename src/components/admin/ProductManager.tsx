"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type CategoryRecord = {
  id: string;
  nameZh: string;
  slug: string;
};

type ProductItemRecord = {
  titleZh?: string | null;
  titleEn?: string | null;
  descriptionZh: string;
  descriptionEn: string;
  iconUrl?: string | null;
  sortOrder?: number;
};

type ProductSectionRecord = {
  id?: string;
  sectionType: string;
  titleZh: string;
  titleEn: string;
  descriptionZh?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  items: ProductItemRecord[];
};

type ProductRecord = {
  id: string;
  categoryId: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  summaryZh?: string | null;
  summaryEn?: string | null;
  bannerUrl?: string | null;
  galleryImages?: string[] | null;
  sortOrder: number;
  publishStatus: string;
  translationStatus: string;
  sections: ProductSectionRecord[];
};

type ProductSectionForm = {
  sectionType: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  imageUrl: string;
  itemsJson: string;
};

type ProductFormState = {
  categoryId: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  summaryZh: string;
  summaryEn: string;
  bannerUrl: string;
  galleryImages: string[];
  sortOrder: number;
  publishStatus: string;
  translationStatus: string;
  sections: ProductSectionForm[];
};

function createEmptySection(): ProductSectionForm {
  return {
    sectionType: "feature",
    titleZh: "",
    titleEn: "",
    descriptionZh: "",
    descriptionEn: "",
    imageUrl: "",
    itemsJson: "[]",
  };
}

function createEmptyForm(categoryId = ""): ProductFormState {
  return {
    categoryId,
    slug: "",
    nameZh: "",
    nameEn: "",
    summaryZh: "",
    summaryEn: "",
    bannerUrl: "",
    galleryImages: [],
    sortOrder: 0,
    publishStatus: "PUBLISHED",
    translationStatus: "REVIEWED",
    sections: [],
  };
}

async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/admin/media", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "上传失败");
  }

  return String(json.data?.url ?? "");
}

function MediaUrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="product-admin-media-field">
      <label>
        {label}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <div className="product-admin-media-actions">
        <label className="secondary product-admin-upload">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void handleFileChange(e.target.files?.[0] || null)}
          />
          {uploading ? "上传中..." : "上传图片"}
        </label>
        {value ? (
          <button className="secondary" type="button" onClick={() => onChange("")}>
            清空
          </button>
        ) : null}
      </div>
      {value ? (
        <div className="product-admin-image-preview">
          <Image alt={label} src={value} width={640} height={360} />
        </div>
      ) : null}
    </div>
  );
}

export function ProductManager() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(createEmptyForm());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.nameZh })),
    [categories],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products", { credentials: "include" }),
        fetch("/api/admin/product-categories", { credentials: "include" }),
      ]);
      const [productsJson, categoriesJson] = await Promise.all([productsRes.json(), categoriesRes.json()]);

      if (!productsRes.ok || !productsJson.success) {
        throw new Error(productsJson.message || "产品加载失败");
      }
      if (!categoriesRes.ok || !categoriesJson.success) {
        throw new Error(categoriesJson.message || "分类加载失败");
      }

      setProducts(Array.isArray(productsJson.data) ? productsJson.data : []);
      setCategories(Array.isArray(categoriesJson.data) ? categoriesJson.data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form.categoryId && categories[0]) {
      setForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  function bind<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setEditingId(null);
    setForm(createEmptyForm(categories[0]?.id ?? ""));
  }

  function edit(product: ProductRecord) {
    setEditingId(product.id);
    setForm({
      categoryId: product.categoryId,
      slug: product.slug,
      nameZh: product.nameZh,
      nameEn: product.nameEn,
      summaryZh: product.summaryZh ?? "",
      summaryEn: product.summaryEn ?? "",
      bannerUrl: product.bannerUrl ?? "",
      galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages.filter(Boolean) : [],
      sortOrder: product.sortOrder ?? 0,
      publishStatus: product.publishStatus ?? "PUBLISHED",
      translationStatus: product.translationStatus ?? "REVIEWED",
      sections: (product.sections ?? []).map((section) => ({
        sectionType: section.sectionType ?? "feature",
        titleZh: section.titleZh ?? "",
        titleEn: section.titleEn ?? "",
        descriptionZh: section.descriptionZh ?? "",
        descriptionEn: section.descriptionEn ?? "",
        imageUrl: section.imageUrl ?? "",
        itemsJson: JSON.stringify(section.items ?? [], null, 2),
      })),
    });
  }

  async function remove(id: string) {
    if (!confirm("确认删除该产品？")) return;
    setMessage("");

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "删除失败");
      }
      setMessage("删除成功");
      await load();
      if (editingId === id) {
        reset();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    let parsedSections: ProductSectionRecord[] = [];
    try {
      parsedSections = form.sections.map((section, index) => ({
        sectionType: section.sectionType,
        titleZh: section.titleZh,
        titleEn: section.titleEn,
        descriptionZh: section.descriptionZh,
        descriptionEn: section.descriptionEn,
        imageUrl: section.imageUrl || null,
        sortOrder: index,
        items: section.itemsJson.trim() ? JSON.parse(section.itemsJson) : [],
      }));
    } catch {
      setMessage("某个功能区块的 Items JSON 不是合法格式");
      return;
    }

    const payload = {
      ...form,
      bannerUrl: form.bannerUrl || null,
      galleryImages: form.galleryImages.map((item) => item.trim()).filter(Boolean),
      sections: parsedSections,
    };

    const endpoint = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "保存失败");
      }
      setMessage("保存成功");
      reset();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  }

  function updateGalleryImage(index: number, value: string) {
    bind(
      "galleryImages",
      form.galleryImages.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.galleryImages.length) return;
    const nextImages = [...form.galleryImages];
    [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
    bind("galleryImages", nextImages);
  }

  function updateSection(index: number, patch: Partial<ProductSectionForm>) {
    bind(
      "sections",
      form.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section,
      ),
    );
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.sections.length) return;
    const sections = [...form.sections];
    [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
    bind("sections", sections);
  }

  return (
    <div className="product-admin-layout">
      <div className="admin-card">
        <h2>产品管理</h2>
        {message ? <div className="notice">{message}</div> : null}

        <form className="form-grid full" onSubmit={submit}>
          <label>
            产品分类
            <select value={form.categoryId} onChange={(e) => bind("categoryId", e.target.value)}>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            slug
            <input type="text" value={form.slug} onChange={(e) => bind("slug", e.target.value)} />
          </label>
          <label>
            产品名（中文）
            <input type="text" value={form.nameZh} onChange={(e) => bind("nameZh", e.target.value)} />
          </label>
          <label>
            产品名（英文）
            <input type="text" value={form.nameEn} onChange={(e) => bind("nameEn", e.target.value)} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            简介（中文）
            <textarea value={form.summaryZh} onChange={(e) => bind("summaryZh", e.target.value)} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            简介（英文）
            <textarea value={form.summaryEn} onChange={(e) => bind("summaryEn", e.target.value)} />
          </label>

          <MediaUrlField label="主 Banner 图" value={form.bannerUrl} onChange={(value) => bind("bannerUrl", value)} />

          <label>
            排序
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => bind("sortOrder", Number(e.target.value || 0))}
            />
          </label>
          <label>
            发布状态
            <select value={form.publishStatus} onChange={(e) => bind("publishStatus", e.target.value)}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label>
            翻译状态
            <select
              value={form.translationStatus}
              onChange={(e) => bind("translationStatus", e.target.value)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="MACHINE_TRANSLATED">MACHINE_TRANSLATED</option>
              <option value="REVIEWED">REVIEWED</option>
            </select>
          </label>

          <div className="product-admin-block">
            <div className="product-admin-block-head">
              <div>
                <h3>产品图库</h3>
                <p>支持上传、排序。前台优先读取这里的图片。</p>
              </div>
              <button
                className="secondary"
                type="button"
                onClick={() => bind("galleryImages", [...form.galleryImages, ""])}
              >
                新增图片
              </button>
            </div>

            <div className="product-admin-stack">
              {form.galleryImages.length === 0 ? (
                <p className="product-admin-empty">暂无图库图片</p>
              ) : (
                form.galleryImages.map((image, index) => (
                  <div className="product-admin-nested-card" key={`${image}-${index}`}>
                    <div className="product-admin-row">
                      <strong>图片 {index + 1}</strong>
                      <div className="product-admin-actions">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => moveGalleryImage(index, -1)}
                        >
                          上移
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => moveGalleryImage(index, 1)}
                        >
                          下移
                        </button>
                        <button
                          className="warn"
                          type="button"
                          onClick={() =>
                            bind(
                              "galleryImages",
                              form.galleryImages.filter((_, imageIndex) => imageIndex !== index),
                            )
                          }
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <MediaUrlField
                      label={`图库 URL ${index + 1}`}
                      value={image}
                      onChange={(value) => updateGalleryImage(index, value)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="product-admin-block">
            <div className="product-admin-block-head">
              <div>
                <h3>内容章节</h3>
                <p>每个章节可单独配置 sectionImageUrl，并按页面顺序排序。</p>
              </div>
              <button
                className="secondary"
                type="button"
                onClick={() => bind("sections", [...form.sections, createEmptySection()])}
              >
                新增章节
              </button>
            </div>

            <div className="product-admin-stack">
              {form.sections.length === 0 ? (
                <p className="product-admin-empty">暂无章节</p>
              ) : (
                form.sections.map((section, index) => (
                  <section className="product-admin-nested-card" key={`${section.titleZh}-${index}`}>
                    <div className="product-admin-row">
                      <strong>章节 {index + 1}</strong>
                      <div className="product-admin-actions">
                        <button className="secondary" type="button" onClick={() => moveSection(index, -1)}>
                          上移
                        </button>
                        <button className="secondary" type="button" onClick={() => moveSection(index, 1)}>
                          下移
                        </button>
                        <button
                          className="warn"
                          type="button"
                          onClick={() =>
                            bind(
                              "sections",
                              form.sections.filter((_, sectionIndex) => sectionIndex !== index),
                            )
                          }
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <div className="form-grid">
                      <label>
                        sectionType
                        <input
                          type="text"
                          value={section.sectionType}
                          onChange={(e) => updateSection(index, { sectionType: e.target.value })}
                        />
                      </label>
                      <label>
                        标题（中文）
                        <input
                          type="text"
                          value={section.titleZh}
                          onChange={(e) => updateSection(index, { titleZh: e.target.value })}
                        />
                      </label>
                      <label>
                        标题（英文）
                        <input
                          type="text"
                          value={section.titleEn}
                          onChange={(e) => updateSection(index, { titleEn: e.target.value })}
                        />
                      </label>
                    </div>

                    <label style={{ display: "block", marginTop: 12 }}>
                      描述（中文）
                      <textarea
                        value={section.descriptionZh}
                        onChange={(e) => updateSection(index, { descriptionZh: e.target.value })}
                      />
                    </label>
                    <label style={{ display: "block", marginTop: 12 }}>
                      描述（英文）
                      <textarea
                        value={section.descriptionEn}
                        onChange={(e) => updateSection(index, { descriptionEn: e.target.value })}
                      />
                    </label>

                    <MediaUrlField
                      label="章节图片 sectionImageUrl"
                      value={section.imageUrl}
                      onChange={(value) => updateSection(index, { imageUrl: value })}
                    />

                    <label style={{ display: "block", marginTop: 12 }}>
                      Items JSON
                      <textarea
                        value={section.itemsJson}
                        onChange={(e) => updateSection(index, { itemsJson: e.target.value })}
                      />
                    </label>
                  </section>
                ))
              )}
            </div>
          </div>

          <div className="product-admin-submit-bar">
            <button type="submit">{editingId ? "更新产品" : "新增产品"}</button>
            <button className="secondary" type="button" onClick={reset}>
              重置
            </button>
            <button className="secondary" type="button" onClick={() => void load()}>
              刷新
            </button>
            <a className="ghost-link" href="/admin/media">
              打开媒体库
            </a>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>产品列表</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>产品</th>
                <th>slug</th>
                <th>分类</th>
                <th>图库</th>
                <th>章节</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>加载中...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6}>暂无数据</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.nameZh}</td>
                    <td>{product.slug}</td>
                    <td>{categories.find((item) => item.id === product.categoryId)?.nameZh ?? "-"}</td>
                    <td>{Array.isArray(product.galleryImages) ? product.galleryImages.length : 0}</td>
                    <td>{product.sections?.length ?? 0}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="secondary" type="button" onClick={() => edit(product)}>
                        编辑
                      </button>
                      <button className="warn" type="button" onClick={() => void remove(product.id)}>
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
    </div>
  );
}
