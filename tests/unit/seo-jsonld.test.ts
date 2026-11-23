import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd } from "@/lib/seo";

describe("organization JSON-LD", () => {
  it("describes the company with contact details", () => {
    const json = JSON.parse(
      buildOrganizationJsonLd("zh", {
        companyName: "苏州泰可思数据科技有限公司",
        phone: "(0512)62880577",
        email: "service@sztaxs.com",
        address: "江苏省苏州工业园区",
        logoUrl: "/brand/taxs-logo.svg",
      }),
    );
    expect(json).toMatchObject({
      "@type": "Organization",
      name: "苏州泰可思数据科技有限公司",
      telephone: "(0512)62880577",
      email: "service@sztaxs.com",
      address: { "@type": "PostalAddress", streetAddress: "江苏省苏州工业园区", addressCountry: "CN" },
    });
    expect(json.logo).toMatch(/\/brand\/taxs-logo\.svg$/);
  });

  it("escapes angle brackets so content cannot break out of the script tag", () => {
    const output = buildOrganizationJsonLd("en", { companyName: "</script><script>alert(1)</script>" });
    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
    expect(JSON.parse(output).name).toBe("</script><script>alert(1)</script>");
  });
});
