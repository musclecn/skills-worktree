import Image from "next/image";
import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import type { AppLocale } from "@/lib/types";

/**
 * AIGC 一级栏目：AI 短剧与视频内容生产。
 * 文案只描述公司自有的制作能力与流程，不点名第三方平台或模型；
 * 作品展示区由 AIGC_SHOWCASE 驱动，为空时整块不显示（作品公开前需确认版权与发布授权）。
 */

export const AIGC_PATH = "/aigc";

type Bilingual = { zh: string; en: string };

const AIGC_MODULES: {
  anchor: string;
  title: Bilingual;
  summary: Bilingual;
  highlights: { zh: string[]; en: string[] };
  image: string;
}[] = [
  {
    anchor: "aigc-short-drama",
    title: { zh: "AI 短剧制作", en: "AI Short Drama Production" },
    summary: {
      zh: "从剧本出发拆解场次与分镜，先锁定人物、场景和道具的主参考图，再逐镜生成动态画面，最后完成对白配音、字幕与混音，交付竖屏成片。",
      en: "We break the script into scenes and storyboards, lock master references for characters, sets and props, generate each shot, then finish dialogue, subtitles and mixing for a vertical-format episode.",
    },
    highlights: {
      zh: ["剧本拆解与分镜", "角色与场景一致性", "1080×1920 竖屏交付"],
      en: ["Script breakdown & storyboards", "Consistent characters & sets", "1080×1920 vertical delivery"],
    },
    image: "/aigc/aigc-short-drama.svg",
  },
  {
    anchor: "aigc-video-generation",
    title: { zh: "AI 视频生成", en: "AI Video Generation" },
    summary: {
      zh: "以参考图、首尾帧和对白音频生成镜头，人物口型随台词开合；不合格的镜头可以单独重拍、局部返修，适用于短剧、广告和产品演示视频。",
      en: "Shots are generated from reference images, first and last frames and dialogue audio, with lip movement following the lines. Individual shots can be regenerated or fixed, for short dramas, ads and product demos.",
    },
    highlights: {
      zh: ["参考图生成视频", "对白驱动口型", "按镜头重拍返修"],
      en: ["Reference-to-video", "Dialogue-driven lip sync", "Per-shot regeneration"],
    },
    image: "/aigc/aigc-video-generation.svg",
  },
  {
    anchor: "aigc-quality-review",
    title: { zh: "成片质量评审", en: "Episode Quality Review" },
    summary: {
      zh: "每一集成片按同一套标准逐项打分，由两轮相互独立的审核复核结论，问题单直接驱动返修，只复审改动部分，让批量制作的每一集都达到交付要求。",
      en: "Every episode is scored against the same criteria and checked by two independent review rounds. Issue lists drive the fixes and only changed parts are re-reviewed, so every episode in a batch meets the delivery bar.",
    },
    highlights: {
      zh: ["统一评分标准", "两轮独立审核", "问题单驱动返修"],
      en: ["Unified scoring criteria", "Two independent reviews", "Issue-driven revisions"],
    },
    image: "/aigc/aigc-quality-review.svg",
  },
];

const REVIEW_DIMENSIONS: Bilingual[] = [
  { zh: "剧情与剧本还原", en: "Story & script fidelity" },
  { zh: "画质", en: "Image quality" },
  { zh: "角色与场景一致性", en: "Character & set consistency" },
  { zh: "口型与对白", en: "Lip sync & dialogue" },
  { zh: "穿帮与连戏", en: "Continuity & errors" },
  { zh: "背景音乐与声音", en: "Music & sound" },
  { zh: "字幕与成片规格", en: "Subtitles & specs" },
];

const PROCESS_STEPS: { title: Bilingual; detail: Bilingual }[] = [
  {
    title: { zh: "需求与剧本", en: "Brief & script" },
    detail: { zh: "确认题材、集数与单集时长，整理或改编剧本。", en: "Agree on genre, episode count and length; prepare or adapt the script." },
  },
  {
    title: { zh: "分镜与主参考图", en: "Storyboard & references" },
    detail: { zh: "拆解场次和镜头，锁定人物、场景与道具形象。", en: "Break down scenes and shots; lock the look of characters, sets and props." },
  },
  {
    title: { zh: "样片确认", en: "Pilot approval" },
    detail: { zh: "先出一集样片，确认画风、节奏和配音后再批量制作。", en: "Produce a pilot episode to confirm style, pacing and voices before scaling up." },
  },
  {
    title: { zh: "批量生成与剪辑", en: "Generation & editing" },
    detail: { zh: "逐镜生成动态画面，完成剪辑、对白、字幕与混音。", en: "Generate every shot, then edit, voice, subtitle and mix." },
  },
  {
    title: { zh: "评审与交付", en: "Review & delivery" },
    detail: { zh: "两轮评审、按问题单返修，人工确认后交付成片。", en: "Two review rounds and issue-driven fixes, delivered after human sign-off." },
  },
];

/**
 * 公开作品：均为 AI 生成的测试样片（负责人 2026-11-23 确认可公开，不点名制作平台）。
 * 视频与封面放在服务器上传目录 /website2026/sztaxs-web/public/uploads/aigc/（数据盘挂载，不进镜像和代码仓库），
 * 网页版统一转码为 720×1280 H.264 并开启快速起播。为空时不显示作品区。
 */
const AIGC_SHOWCASE: {
  slug: string;
  title: Bilingual;
  episode: Bilingual;
  genre: Bilingual;
  durationSec: number;
  summary: Bilingual;
}[] = [
  {
    slug: "hexi-ep01",
    title: { zh: "和熹传", en: "He Xi Zhuan" },
    episode: { zh: "第一集《凤隐南阳》", en: "Ep. 1 · Phoenix in Nanyang" },
    genre: { zh: "古装宫廷", en: "Historical palace" },
    durationSec: 120,
    summary: {
      zh: "从邓绥出生讲到太子聘书送抵邓府，一纸婚约埋下宫廷风波。",
      en: "From Deng Sui's birth to the crown prince's betrothal letter reaching the Deng family, a marriage that sets the palace in motion.",
    },
  },
  {
    slug: "hexi-ep02",
    title: { zh: "和熹传", en: "He Xi Zhuan" },
    episode: { zh: "第二集《命运转折》", en: "Ep. 2 · A Turn of Fate" },
    genre: { zh: "古装宫廷", en: "Historical palace" },
    durationSec: 120,
    summary: {
      zh: "窦皇后设下巫蛊之局，宋贵人百口莫辩，后宫格局由此改写。",
      en: "Empress Dou stages a witchcraft plot, Consort Song cannot clear her name, and the balance of the inner palace shifts.",
    },
  },
  {
    slug: "houhai-ep01",
    title: { zh: "穿过后海是我家", en: "Home Beyond Houhai" },
    episode: { zh: "第一集《玻璃墙后的估价》", en: "Ep. 1 · The Appraisal Behind the Glass" },
    genre: { zh: "都市情感", en: "Urban drama" },
    durationSec: 120,
    summary: {
      zh: "家族资金链断裂，乔莞尔向干妈借两个亿被婉拒，转身才发现“新项目”只是借口。",
      en: "With the family business out of cash, Qiao Wan'er asks her godmother for a 200-million loan, is turned down, and learns the “new project” was only an excuse.",
    },
  },
  {
    slug: "dujie-ep01",
    title: { zh: "请勿高考时渡劫", en: "No Ascension Before the Gaokao" },
    episode: { zh: "第一集《同桌说她穿越了》", en: "Ep. 1 · My Deskmate Says She Time-Traveled" },
    genre: { zh: "校园喜剧", en: "Campus comedy" },
    durationSec: 86,
    summary: {
      zh: "开学前一天，同桌说自己穿越成了万年女帝，回来第一件事却是借作业抄。",
      en: "The day before school starts, his deskmate claims she lived ten thousand years as an empress, and her first request back is to copy his homework.",
    },
  },
  {
    slug: "fenjia-ep01",
    title: { zh: "分家那天，我把钥匙交了", en: "The Day We Split, I Gave Up the Keys" },
    episode: { zh: "第一集《交钥匙》", en: "Ep. 1 · Handing Over the Keys" },
    genre: { zh: "家庭现实", en: "Family drama" },
    durationSec: 78,
    summary: {
      zh: "分家时她交出家门钥匙，却拒绝签字放弃自己投进家族公司的三十万。",
      en: "When the family splits, she hands over the house keys but refuses to sign away the 300,000 she invested in the family company.",
    },
  },
  {
    slug: "jirou-ep01",
    title: { zh: "我在古代练肌肉", en: "Bodybuilding in Ancient Times" },
    episode: { zh: "第一集《退婚》", en: "Ep. 1 · Broken Engagement" },
    genre: { zh: "穿越 · 动漫风格", en: "Time travel · Anime style" },
    durationSec: 95,
    summary: {
      zh: "健美冠军穿越成将军府瘦弱庶子，当众被退婚后，靠一个月苦练在擂台翻盘。",
      en: "A bodybuilding champion wakes up as a frail son of a general's house, is publicly jilted, and turns the tables in the ring after a month of training.",
    },
  },
];

function formatDuration(seconds: number, zh: boolean) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (zh) return minutes > 0 ? `${minutes} 分${rest ? ` ${rest} 秒` : "钟"}` : `${rest} 秒`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function AIGCView({ locale }: { locale: AppLocale }) {
  const zh = locale === "zh";
  const t = (value: Bilingual) => (zh ? value.zh : value.en);

  return (
    <div className="container page-frame aigc-page">
      <section className="page-lead product-page-lead motion-reveal">
        <p className="eyebrow">AIGC</p>
        <h1>{zh ? "AI 短剧与视频内容生产" : "AI short drama and video production"}</h1>
        <p>
          {zh
            ? "从剧本拆解、分镜到动态镜头生成、配音字幕和成片评审，用 AI 完成竖屏短剧与营销视频的规模化制作。"
            : "From script breakdown and storyboards to shot generation, voice, subtitles and quality review, we use AI to produce vertical short dramas and marketing videos at scale."}
        </p>
      </section>

      <section className="product-hub motion-reveal">
        <aside className="product-tree">
          <div className="product-tree-card">
            <p className="eyebrow">{zh ? "栏目导航" : "Section Menu"}</p>
            <div className="product-tree-list">
              {AIGC_MODULES.map((module) => (
                <div key={module.anchor} className="product-tree-group">
                  <a className="product-tree-parent" href={`#${module.anchor}`}>
                    {t(module.title)}
                  </a>
                </div>
              ))}
              {AIGC_SHOWCASE.length > 0 ? (
                <div className="product-tree-group">
                  <a className="product-tree-parent" href="#aigc-showcase">
                    {zh ? "作品展示" : "Showcase"}
                  </a>
                </div>
              ) : null}
              <div className="product-tree-group">
                <a className="product-tree-parent" href="#aigc-process">
                  {zh ? "合作流程" : "How We Work"}
                </a>
              </div>
            </div>
          </div>
        </aside>

        <div className="product-hub-main">
          <section className="product-cluster ai-agent-cluster">
            <header className="product-cluster-head">
              <div>
                <h2>{zh ? "核心能力" : "Core Capabilities"}</h2>
              </div>
              <p>
                {zh
                  ? "制作、生成与评审三段衔接：先保证画面和人物前后一致，再用统一标准把关每一集的质量。"
                  : "Production, generation and review work as one chain: keep visuals and characters consistent, then hold every episode to one quality standard."}
              </p>
            </header>

            <div className="product-submenu ai-agent-submenu">
              {AIGC_MODULES.map((module, index) => (
                <article className="product-submenu-card ai-agent-card" key={module.anchor} id={module.anchor}>
                  <div className="ai-agent-media">
                    <Image
                      src={module.image}
                      alt={t(module.title)}
                      width={1600}
                      height={900}
                      unoptimized
                    />
                  </div>
                  <span className="product-submenu-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{t(module.title)}</h3>
                    <p>{t(module.summary)}</p>
                  </div>
                  <ul className="ai-agent-highlights">
                    {(zh ? module.highlights.zh : module.highlights.en).map((item) => (
                      <li key={`${module.anchor}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="product-cluster aigc-review-section">
            <header className="product-cluster-head">
              <div>
                <p className="eyebrow">{zh ? "质量标准" : "Quality Standard"}</p>
                <h2>{zh ? "每一集都按同一张评分表验收" : "Every episode passes the same scorecard"}</h2>
              </div>
              <p>
                {zh
                  ? "七个维度逐项打分，内容合规作为一票否决项单独把关；评分低于交付线的镜头进入返修。"
                  : "Seven dimensions are scored one by one, with content compliance as a separate pass/fail gate; shots below the delivery bar go back for revision."}
              </p>
            </header>
            <ul className="aigc-dimensions">
              {REVIEW_DIMENSIONS.map((item, index) => (
                <li key={item.zh}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {t(item)}
                </li>
              ))}
              <li className="is-gate">
                <span>{zh ? "闸门" : "Gate"}</span>
                {zh ? "内容合规（一票否决）" : "Content compliance (pass/fail)"}
              </li>
            </ul>
          </section>

          <section className="product-cluster aigc-process-section" id="aigc-process">
            <header className="product-cluster-head">
              <div>
                <p className="eyebrow">{zh ? "合作流程" : "How We Work"}</p>
                <h2>{zh ? "从一集样片开始" : "Start with one pilot episode"}</h2>
              </div>
              <p>
                {zh
                  ? "先用一集样片对齐画风、节奏和配音，再进入批量制作，降低整部剧返工的风险。"
                  : "A pilot aligns style, pacing and voices before batch production, reducing the risk of reworking a whole series."}
              </p>
            </header>
            <ol className="aigc-steps">
              {PROCESS_STEPS.map((step, index) => (
                <li key={step.title.zh}>
                  <span className="aigc-step-index">{index + 1}</span>
                  <div>
                    <h3>{t(step.title)}</h3>
                    <p>{t(step.detail)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {AIGC_SHOWCASE.length > 0 ? (
            <section className="product-cluster aigc-showcase-section" id="aigc-showcase">
              <header className="product-cluster-head">
                <div>
                  <p className="eyebrow">{zh ? "作品展示" : "Showcase"}</p>
                  <h2>{zh ? "AI 生成测试样片" : "AI-generated test episodes"}</h2>
                </div>
                <p>
                  {zh
                    ? "以下作品的画面、配音与字幕均由 AI 生成，是我们制作流程的测试样片，覆盖古装、都市、校园、家庭与动漫风格。"
                    : "The visuals, voices and subtitles below are AI-generated test episodes from our production workflow, spanning historical, urban, campus, family and anime styles."}
                </p>
              </header>
              <div className="aigc-showcase">
                {AIGC_SHOWCASE.map((item) => (
                  <article key={item.slug} className="aigc-showcase-card">
                    <div className="aigc-showcase-player">
                      <video
                        controls
                        preload="none"
                        playsInline
                        poster={`/uploads/aigc/${item.slug}.jpg`}
                        src={`/uploads/aigc/${item.slug}.mp4`}
                        aria-label={`${t(item.title)} ${t(item.episode)}`}
                      />
                      <span className="aigc-ai-badge">{zh ? "AI 生成 · 测试样片" : "AI-generated · Test"}</span>
                    </div>
                    <div className="aigc-showcase-meta">
                      <span>{t(item.genre)}</span>
                      <span>{formatDuration(item.durationSec, zh)}</span>
                    </div>
                    <h3>{t(item.title)}</h3>
                    <p className="aigc-showcase-episode">{t(item.episode)}</p>
                    <p>{t(item.summary)}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="product-bottom-cta motion-reveal">
            <p className="eyebrow">{zh ? "下一步" : "Next Step"}</p>
            <h2>{zh ? "想用 AI 制作短剧或营销视频？" : "Planning an AI short drama or marketing video?"}</h2>
            <p>
              {zh
                ? "留下需求和联系方式，我们会结合题材、集数和交付周期给出制作方案，并安排样片评估。"
                : "Leave your brief and contact details. We will propose a production plan based on genre, episode count and timeline, and arrange a pilot assessment."}
            </p>
            <div className="hero-actions">
              <Link
                className="cta-button"
                href={`${localizePath(locale, "/contact")}#appointment-form`}
                data-track="cta_click"
                data-track-id="aigc-bottom"
              >
                {zh ? "咨询 AIGC 制作" : "Discuss AIGC Production"}
              </Link>
              <Link className="ghost-link product-dark-link" href={localizePath(locale, "/ai-agent")}>
                {zh ? "了解 AI 财税智能体" : "Explore AI Tax Agent"}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
