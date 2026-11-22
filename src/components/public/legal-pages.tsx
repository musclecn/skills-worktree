import Link from "next/link";
import { getSiteData } from "@/lib/data";
import type { AppLocale } from "@/lib/types";

// Export Sales Reconciliation 产品页及其隐私政策、服务条款（SP-API 开发者审核配套）
export const ESR_APP_NAME = "Taxs Export Sales Reconciliation";
export const ESR_PRODUCT_PATH = "/en/export-sales-reconciliation";
export const ESR_APP_NAME_ZH = `${ESR_APP_NAME}（出口销售再核算）`;
export const ESR_PRODUCT_SUMMARY = "Reconcile export customs declarations with actual marketplace sales for exporters selling through overseas fulfillment centers.";
export const ESR_LAST_UPDATED = "October 23, 2026";
// 隐私政策单独记录更新日期：2026-11-21 补充官网访问统计说明，服务条款未变。
export const PRIVACY_LAST_UPDATED = "November 21, 2026";
const PRIVACY_LAST_UPDATED_ZH = "2026年11月21日";

const FALLBACK_COMPANY = "Suzhou Taxs Data Technology Co., Ltd.";
const FALLBACK_EMAIL = "service@sztaxs.com";

async function getCompanyContact(locale: AppLocale = "en") {
  const site = await getSiteData(locale);
  return {
    company: locale === "zh" ? "苏州泰可思数据科技有限公司" : site?.companyName || FALLBACK_COMPANY,
    email: site?.email || FALLBACK_EMAIL,
    phone: site?.phone || "",
    address: site?.address || "",
  };
}

function ContactLine({ contact, locale = "en" }: { contact: Awaited<ReturnType<typeof getCompanyContact>>; locale?: AppLocale }) {
  return (
    <p>
      {contact.company}
      {contact.address ? <> · {contact.address}</> : null}
      <br />
      {locale === "zh" ? "电子邮箱：" : "Email: "}<a href={`mailto:${contact.email}`}>{contact.email}</a>
      {contact.phone ? <> · {locale === "zh" ? "电话：" : "Phone: "}{contact.phone}</> : null}
    </p>
  );
}

function LegalLinks({ locale = "en" }: { locale?: AppLocale }) {
  return (
    <p className="legal-links">
      <Link href={ESR_PRODUCT_PATH}>{locale === "zh" ? ESR_APP_NAME_ZH : ESR_APP_NAME}</Link>
      <Link href={locale === "zh" ? "/privacy" : "/en/privacy"}>{locale === "zh" ? "隐私政策" : "Privacy Policy"}</Link>
      <Link href={locale === "zh" ? "/terms" : "/en/terms"}>{locale === "zh" ? "服务条款" : "Terms of Service"}</Link>
    </p>
  );
}

export async function ExportReconciliationView() {
  const contact = await getCompanyContact();
  const features = [
    [
      "Sales data sync",
      "With the seller's authorization, retrieves orders, settlement reports and inbound shipment data from the seller account. Access is read-only: we never change listings, prices, orders or shipments.",
    ],
    [
      "SKU to customs mapping",
      "Maintain the mapping between SKUs and customs commodity codes, declared names and units, with version history.",
    ],
    [
      "Shipment to declaration linking",
      "Link each inbound shipment to the customs declaration lines it was exported under, and flag quantity differences.",
    ],
    [
      "Sales reconciliation reports",
      "Sold, refunded and unsold quantities and sales proceeds per declaration line, by period, in original currency.",
    ],
    [
      "Report upload",
      "Not ready to authorize API access yet? Upload reports exported from the seller account and get the same reconciliation.",
    ],
  ];
  const steps = [
    ["01", "Authorize", "The seller signs in to our portal and authorizes read-only access from its seller account."],
    ["02", "Sync", "Scheduled jobs retrieve orders, settlements and inbound shipments within published rate limits."],
    ["03", "Map and link", "Finance staff map SKUs to commodity codes and confirm shipment-to-declaration links."],
    ["04", "Reconcile", "Reconciliation reports are produced per declaration line for the seller's own tax filings."],
  ];

  return (
    <div className="container page-frame legal-page">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">Product</p>
        <h1>{ESR_APP_NAME}</h1>
        <p>
          Reconcile cross-border e-commerce exports with actual marketplace sales. {ESR_APP_NAME} is developed by{" "}
          {contact.company} for exporters in mainland China who sell through overseas fulfillment centers. It connects
          marketplace sales data with export customs declarations, so finance teams can reconcile export VAT refund
          claims against units actually sold.
        </p>
      </section>

      <section className="detail-block legal-body motion-reveal">
        <h2>What it does</h2>
        <div className="legal-card-grid">
          {features.map(([title, text]) => (
            <article key={title} className="legal-card">
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-block legal-body motion-reveal">
        <h2>How it works</h2>
        <div className="legal-card-grid">
          {steps.map(([no, title, text]) => (
            <article key={no} className="legal-card">
              <span className="legal-step-no">{no}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-block legal-body motion-reveal">
        <h2>Who it is for</h2>
        <p>
          Exporters registered in mainland China that sell on North America, Europe and Far East marketplaces, and their
          finance and tax teams. Typical users ship goods in bulk to fulfillment centers before the goods are sold and need
          to reconcile export refund claims with later sales.
        </p>

        <h2>Data and privacy</h2>
        <p>
          We only access the data needed for reconciliation: orders and order items, settlement and financial data, and
          inbound shipment and inventory data. We do not access buyer names, contact details, addresses or payment
          information. Data is encrypted in transit and at rest, isolated per customer, and deleted when the seller
          revokes authorization or ends the service. See our <Link href="/en/privacy">Privacy Policy</Link> and{" "}
          <Link href="/en/terms">Terms of Service</Link>.
        </p>
        <p>
          The service works with seller accounts on Amazon marketplaces through the Selling Partner API, only after the
          seller authorizes it. {ESR_APP_NAME} is an independent product of {contact.company} and is not affiliated with
          or endorsed by Amazon.
        </p>
      </section>

      <section className="detail-block legal-body motion-reveal" id="pricing">
        <h2>Pricing</h2>
        <p>
          Pricing is by quotation. The service is sold as an annual subscription per seller entity. The quote is based on:
        </p>
        <ul>
          <li>the number of marketplaces connected;</li>
          <li>monthly order volume;</li>
          <li>the number of customs declarations reconciled per year.</li>
        </ul>
        <p>
          The subscription includes data sync, SKU mapping, shipment-to-declaration linking, monthly reconciliation reports
          and support during business hours (UTC+8). Example: a seller entity with 2 marketplaces and fewer than 5,000
          orders per month is quoted one annual fee covering all of the above. There are no per-call charges. Contact us
          for a written quote.
        </p>
      </section>

      <section className="detail-block legal-body motion-reveal">
        <h2>Contact</h2>
        <ContactLine contact={contact} />
        <div className="hero-actions">
          <Link className="legal-button" href="/en/contact">
            Request a quote
          </Link>
        </div>
        <LegalLinks />
      </section>
    </div>
  );
}

export async function PrivacyPolicyView() {
  const contact = await getCompanyContact();

  return (
    <div className="container page-frame legal-page">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <Link className="legal-language-link" href="/privacy" lang="zh-CN">中文版</Link>
        <p>Last updated: {PRIVACY_LAST_UPDATED}</p>
      </section>

      <section className="detail-block legal-body motion-reveal">
        <p>
          {contact.company} (&quot;we&quot;, &quot;us&quot;) provides {ESR_APP_NAME} (the &quot;Service&quot;). This
          policy explains what data we collect through the Service, and how we use, store, protect, share and delete it.
        </p>

        <h2>1. Data we collect</h2>
        <p>
          <strong>a) Account data of our customers&apos; users</strong> – name, business email, phone number and login
          records of the people our customers authorize to use the Service.
        </p>
        <p>
          <strong>b) Marketplace seller data</strong> – when a seller authorizes the Service, we retrieve from the
          seller&apos;s marketplace account:
        </p>
        <ul>
          <li>orders and order items: order ID, SKU, ASIN, quantity, status, fulfillment channel, item amounts and currency;</li>
          <li>settlement reports and financial transactions: proceeds, refunds and fees;</li>
          <li>inbound shipments, shipment items, received quantities and inventory ledger data.</li>
        </ul>
        <p>
          <strong>c) Data customers upload</strong> – reports exported from their seller account, SKU master data, customs
          commodity codes and customs declaration data.
        </p>
        <p>
          <strong>We do not collect</strong> buyer names, email addresses, phone numbers, shipping addresses or payment
          information.
        </p>

        <h2>2. How we use data</h2>
        <p>
          Solely to provide the Service to the customer that owns the data: reconciling export customs declarations with
          actual sales, producing reconciliation reports, and supporting the customer&apos;s own accounting and tax filings.
          We do not sell data, use it for advertising or profiling, or combine one customer&apos;s data with another&apos;s.
        </p>

        <h2>3. Storage and location</h2>
        <p>
          Data is stored on cloud infrastructure located in mainland China. We do not transfer marketplace seller data to
          third countries. If this changes, we will update this policy and complete the procedures required by applicable
          law in advance.
        </p>

        <h2>4. Security</h2>
        <p>
          Data is encrypted in transit (TLS 1.2 or higher) and at rest. Access is limited to authorized personnel on a
          need-to-know basis, with unique accounts and multi-factor authentication. Authorization credentials are
          encrypted and kept in a key management service. We log and monitor access to the Service, and maintain an
          incident response plan. Each customer&apos;s data is logically isolated and visible only to users that customer
          authorizes.
        </p>

        <h2>5. Sharing</h2>
        <p>We share data only:</p>
        <ul>
          <li>with the customer that owns it and the users it authorizes;</li>
          <li>
            with service providers that host or operate the Service (such as our cloud hosting provider), under
            confidentiality and security obligations;
          </li>
          <li>when required by law or by a competent authority.</li>
        </ul>

        <h2>6. Retention and deletion</h2>
        <p>
          We keep marketplace seller data only while the customer&apos;s subscription is active and only as long as needed
          to produce its reconciliation reports. Customers keep their own copies of reports for their accounting and tax
          record-keeping. When a seller revokes authorization or the Service ends, we securely delete that seller&apos;s
          marketplace data within 30 days, unless the law requires us to keep it longer. Customers may request deletion at
          any time by contacting <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>

        <h2>7. Your rights</h2>
        <p>
          Users may access, correct or delete their account data, and withdraw consent, as provided by applicable law,
          including the Personal Information Protection Law of the People&apos;s Republic of China. Contact{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>

        <h2>8. Website analytics</h2>
        <p>
          Separately from the Service, our website (www1.sztaxs.com) uses first-party visit analytics. It records
          anonymous events such as page views, link clicks and booking-form submission results, linked only to a random
          session identifier that expires after 30 minutes of inactivity. It does not use cookies, does not include IP
          addresses or contact details, and does not use third-party analytics services. We use it only to improve the
          website&apos;s content and navigation.
        </p>

        <h2>9. Changes</h2>
        <p>
          We will post changes on this page and update the date above. Material changes will be notified to customers in
          advance.
        </p>

        <h2>10. Contact</h2>
        <ContactLine contact={contact} />
        <LegalLinks />
      </section>
    </div>
  );
}

export async function TermsOfServiceView() {
  const contact = await getCompanyContact();

  return (
    <div className="container page-frame legal-page">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <Link className="legal-language-link" href="/terms" lang="zh-CN">中文版</Link>
        <p>Last updated: {ESR_LAST_UPDATED}</p>
      </section>

      <section className="detail-block legal-body motion-reveal">
        <p>
          These terms apply to {ESR_APP_NAME} (the &quot;Service&quot;) provided by {contact.company} (&quot;we&quot;,
          &quot;us&quot;) to business customers (&quot;Customer&quot;).
        </p>

        <h2>1. The Service</h2>
        <p>
          The Service retrieves sales, settlement and shipment data that the Customer authorizes, and helps the Customer
          reconcile that data with its export customs declarations. The Service provides data and reports;{" "}
          <strong>it does not file tax returns or make tax determinations on the Customer&apos;s behalf.</strong>
        </p>

        <h2>2. Customer responsibilities</h2>
        <p>
          The Customer is responsible for the accuracy of data it provides (including SKU-to-commodity-code mappings and
          shipment-to-declaration links), for confirming reconciliation rules with its tax advisers and authorities, and for
          its own tax filings. The Customer is responsible for the users it authorizes and for keeping their login
          credentials secure.
        </p>

        <h2>3. Authorization</h2>
        <p>
          The Customer may revoke the Service&apos;s access to its marketplace account at any time in its seller account
          settings or by contacting us. Data will then be handled as described in the{" "}
          <Link href="/en/privacy">Privacy Policy</Link>.
        </p>

        <h2>4. Read-only access</h2>
        <p>
          The Service does not create or change listings, prices, orders or shipments in the Customer&apos;s marketplace
          account, and does not contact buyers.
        </p>

        <h2>5. Fees</h2>
        <p>
          Fees are set out in the quotation or order form agreed with the Customer, as described on the{" "}
          <Link href="/en/export-sales-reconciliation#pricing">pricing section</Link>. Unless otherwise agreed, fees are
          payable annually in advance and exclude applicable taxes.
        </p>

        <h2>6. Confidentiality and data protection</h2>
        <p>
          We process Customer data according to the <Link href="/en/privacy">Privacy Policy</Link> and only to provide the
          Service. Each party keeps the other party&apos;s non-public information confidential.
        </p>

        <h2>7. Availability</h2>
        <p>
          We aim to keep the Service available but do not guarantee uninterrupted access. Marketplace data availability
          depends on the marketplace&apos;s own services.
        </p>

        <h2>8. Liability</h2>
        <p>
          The Service supports, but does not replace, the Customer&apos;s own review of its tax filings. To the extent
          permitted by law, we are not liable for indirect or consequential losses, and our total liability under these
          terms is limited to the fees paid by the Customer for the Service in the 12 months before the claim arose.
        </p>

        <h2>9. Term and termination</h2>
        <p>
          The subscription term is set out in the order form. Either party may terminate for material breach that is not
          remedied within 30 days of written notice. On termination, the Customer&apos;s data is handled as described in
          the Privacy Policy.
        </p>

        <h2>10. Governing law</h2>
        <p>
          These terms are governed by the laws of the People&apos;s Republic of China. Disputes shall first be resolved
          through friendly negotiation; failing that, either party may bring the dispute to the competent people&apos;s
          court at our place of registration.
        </p>

        <h2>11. Contact</h2>
        <ContactLine contact={contact} />
        <LegalLinks />
      </section>
    </div>
  );
}

export async function ChinesePrivacyPolicyView() {
  const contact = await getCompanyContact("zh");

  return (
    <div className="container page-frame legal-page" lang="zh-CN">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">法律信息</p>
        <h1>隐私政策</h1>
        <Link className="legal-language-link" href="/en/privacy" lang="en">English version</Link>
        <p>最后更新：{PRIVACY_LAST_UPDATED_ZH}</p>
      </section>
      <section className="detail-block legal-body motion-reveal">
        <p>{contact.company}（以下简称“我们”）提供 {ESR_APP_NAME_ZH}（以下简称“本服务”）。本政策说明我们通过本服务收集哪些数据，以及如何使用、存储、保护、共享和删除这些数据。</p>

        <h2>1. 我们收集的数据</h2>
        <p><strong>a) 客户用户的账户数据</strong>——客户授权使用本服务的人员的姓名、工作邮箱、电话号码和登录记录。</p>
        <p><strong>b) 平台卖家数据</strong>——卖家授权本服务后，我们从卖家的平台账户获取：</p>
        <ul>
          <li>订单及订单明细：订单编号、SKU、ASIN、数量、状态、配送渠道、商品金额和币种；</li>
          <li>结算报告和财务交易：销售收入、退款和费用；</li>
          <li>入库货件、货件明细、接收数量和库存分类账数据。</li>
        </ul>
        <p><strong>c) 客户上传的数据</strong>——从卖家账户导出的报告、SKU 主数据、海关商品编码和报关数据。</p>
        <p><strong>我们不收集</strong>买家的姓名、电子邮箱、电话号码、收货地址或支付信息。</p>

        <h2>2. 我们如何使用数据</h2>
        <p>数据仅用于向拥有该数据的客户提供本服务：将出口报关数据与实际销售数据进行核对，生成核算报告，并支持客户自身的会计核算和纳税申报。我们不出售数据，不将其用于广告或用户画像，也不将不同客户的数据合并使用。</p>

        <h2>3. 存储及地点</h2>
        <p>数据存储在位于中国大陆的云基础设施上。我们不向第三国传输平台卖家数据。如有变化，我们将提前更新本政策并完成适用法律要求的程序。</p>

        <h2>4. 安全</h2>
        <p>数据在传输过程中（TLS 1.2 或更高版本）和静态存储时均经过加密。访问权限仅授予有必要知悉相关数据的授权人员，并采用独立账户和多因素身份验证。授权凭据经过加密并保存在密钥管理服务中。我们记录并监控对本服务的访问，并维护事件响应计划。各客户的数据在逻辑上相互隔离，仅对该客户授权的用户可见。</p>

        <h2>5. 共享</h2>
        <p>我们仅在以下情形共享数据：</p>
        <ul>
          <li>向拥有数据的客户及其授权用户共享；</li>
          <li>向托管或运营本服务的服务提供商（如我们的云托管服务商）共享，且该等服务提供商承担保密和安全义务；</li>
          <li>根据法律或有权机关的要求共享。</li>
        </ul>

        <h2>6. 留存和删除</h2>
        <p>我们仅在客户订阅有效期间，且仅在生成其核算报告所需的期限内保留平台卖家数据。客户自行保存报告副本，以满足其会计和税务档案留存要求。当卖家撤销授权或本服务终止时，我们将在 30 天内安全删除该卖家的平台数据，法律要求延长保留期限的除外。客户可随时联系 <a href={`mailto:${contact.email}`}>{contact.email}</a> 请求删除数据。</p>

        <h2>7. 您的权利</h2>
        <p>用户可依据适用法律（包括《中华人民共和国个人信息保护法》）访问、更正或删除其账户数据，以及撤回同意。请联系 <a href={`mailto:${contact.email}`}>{contact.email}</a>。</p>

        <h2>8. 官网访问统计</h2>
        <p>本服务之外，我们的官网（www1.sztaxs.com）使用自有的访问统计，记录页面浏览、链接点击和预约表单提交结果等匿名事件，仅关联一个随机生成、30 分钟无操作即失效的会话标识；不使用 Cookie，不包含 IP 地址或联系方式，也不使用第三方统计服务。统计数据仅用于改进官网内容和栏目入口。</p>

        <h2>9. 变更</h2>
        <p>我们将在本页面公布变更，并更新上方日期。重大变更将提前通知客户。</p>

        <h2>10. 联系方式</h2>
        <ContactLine contact={contact} locale="zh" />
        <LegalLinks locale="zh" />
      </section>
    </div>
  );
}

export async function ChineseTermsOfServiceView() {
  const contact = await getCompanyContact("zh");

  return (
    <div className="container page-frame legal-page" lang="zh-CN">
      <section className="page-lead motion-reveal">
        <p className="eyebrow">法律信息</p>
        <h1>服务条款</h1>
        <Link className="legal-language-link" href="/en/terms" lang="en">English version</Link>
        <p>最后更新：2026年10月23日</p>
      </section>
      <section className="detail-block legal-body motion-reveal">
        <p>本条款适用于由{contact.company}（以下简称“我们”）向企业客户（以下简称“客户”）提供的 {ESR_APP_NAME_ZH}（以下简称“本服务”）。</p>

        <h2>1. 本服务</h2>
        <p>本服务获取客户授权的销售、结算和货件数据，并帮助客户将这些数据与其出口报关数据进行核对。本服务提供数据和报告；<strong>不代表客户进行纳税申报或作出税务认定。</strong></p>

        <h2>2. 客户责任</h2>
        <p>客户负责确保其提供的数据准确（包括 SKU 与商品编码的映射关系、货件与报关单的关联关系），负责与其税务顾问及主管机关确认核算规则，并负责自身的纳税申报。客户对其授权用户负责，并负责保障该等用户登录凭据的安全。</p>

        <h2>3. 授权</h2>
        <p>客户可随时在卖家账户设置中，或通过联系我们，撤销本服务对其平台账户的访问权限。此后，数据将按照<Link href="/privacy">隐私政策</Link>所述方式处理。</p>

        <h2>4. 只读访问</h2>
        <p>本服务不在客户的平台账户中创建或更改商品信息、价格、订单或货件，也不联系买家。</p>

        <h2>5. 费用</h2>
        <p>费用以与客户约定的报价单或订单为准，具体说明见<Link href={`${ESR_PRODUCT_PATH}#pricing`}>价格部分</Link>。除非另有约定，费用按年预付，且不包含适用税费。</p>

        <h2>6. 保密和数据保护</h2>
        <p>我们按照<Link href="/privacy">隐私政策</Link>处理客户数据，且仅用于提供本服务。双方均对另一方的非公开信息承担保密义务。</p>

        <h2>7. 可用性</h2>
        <p>我们致力于保持本服务可用，但不保证访问不中断。平台数据的可用性取决于平台自身的服务。</p>

        <h2>8. 责任</h2>
        <p>本服务为客户自行审核其纳税申报提供支持，但不能替代该审核。在法律允许的范围内，我们不对间接损失或后果性损失承担责任；我们在本条款项下承担的责任总额，以客户在索赔事由发生前 12 个月内为本服务支付的费用为限。</p>

        <h2>9. 期限和终止</h2>
        <p>订阅期限在订单中约定。对于一方在收到书面通知后 30 天内未予纠正的重大违约，另一方可终止本服务。终止后，客户数据按照隐私政策所述方式处理。</p>

        <h2>10. 适用法律</h2>
        <p>本条款受中华人民共和国法律管辖。争议应首先通过友好协商解决；协商不成的，任何一方均可向我们注册地有管辖权的人民法院提起诉讼。</p>

        <h2>11. 联系方式</h2>
        <ContactLine contact={contact} locale="zh" />
        <LegalLinks locale="zh" />
      </section>
    </div>
  );
}
