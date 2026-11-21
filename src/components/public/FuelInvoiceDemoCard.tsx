/* eslint-disable @next/next/no-html-link-for-pages -- This route serves standalone HTML rather than an RSC page. */
import type { AppLocale } from "@/lib/types";
import styles from "./FuelInvoiceDemoCard.module.css";

export function FuelInvoiceDemoCard({ locale }: { locale: AppLocale }) {
  const zh = locale === "zh";
  const steps = zh
    ? ["加油支付", "默认个人开票", "短信 / 邮箱收票", "自助换开企业抬头"]
    : ["Fuel payment", "Personal invoice", "SMS / email delivery", "Business invoice reissue"];

  return (
    <section id="fuel-invoice-scenario" className={styles.card} aria-labelledby="fuel-invoice-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{zh ? "开票场景 · 在线演示" : "INVOICING SCENARIO · LIVE DEMO"}</p>
        <h2 id="fuel-invoice-title">{zh ? "加油站交易即开票" : "Fuel Station Payment-to-Invoice"}</h2>
        <p className={styles.description}>
          {zh
            ? "支付完成后先开个人发票，用户收到短信或邮箱链接，再按需自助换开企业抬头。从加油支付到新票下载，完整体验一次开票流程。"
            : "Start with a personal invoice after payment, then follow an SMS or email link to reissue it with a business title. Try the complete flow from payment to invoice download."}
        </p>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>
          ))}
        </ol>
        <div className={styles.actions}>
          <a href="/solutions/fuel-invoice-demo" className={styles.button}>
            {zh ? "立即体验开票流程" : "Try the Invoicing Demo"}<span aria-hidden="true">↗</span>
          </a>
          <span className={styles.note}>{zh ? "手机 / 电脑均可体验 · 模拟演示" : "Mobile & desktop · Chinese demo"}</span>
        </div>
      </div>
      <div className={styles.art} aria-hidden="true">
        <div className={styles.receipt}>
          <div className={styles.receiptTop}><span>电子发票</span><b>已开具</b></div>
          <p className={styles.receiptLabel}>加油交易</p>
          <p className={styles.amount}><small>¥</small> 300.00</p>
          <div className={styles.rule} />
          <div className={styles.invoiceRow}><span>原票抬头</span><strong>个人</strong></div>
          <div className={styles.invoiceRow}><span>换开抬头</span><strong>企业</strong></div>
          <div className={styles.stamp}>✓ 换开完成</div>
        </div>
        <div className={styles.caption}>一笔交易 · 开票与换开衔接</div>
      </div>
    </section>
  );
}
