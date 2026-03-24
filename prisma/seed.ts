import {
  PrismaClient,
  PublishStatus,
  TranslationStatus,
  UserRole,
} from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../src/lib/auth/password";
import { PRODUCT_GALLERY_FALLBACKS } from "../src/lib/product-visuals";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:/tmp/sztaxs-web-dev.db",
});
const prisma = new PrismaClient({ adapter });

type ProductSeed = {
  slug: string;
  nameZh: string;
  nameEn: string;
  summaryZh: string;
  summaryEn: string;
  bannerUrl?: string;
  galleryImages?: string[];
  sections: {
    sectionType: string;
    titleZh: string;
    titleEn: string;
    descriptionZh: string;
    descriptionEn: string;
    imageUrl?: string;
    items: {
      titleZh?: string;
      titleEn?: string;
      descriptionZh: string;
      descriptionEn: string;
      iconUrl?: string;
    }[];
  }[];
};

const PRODUCT_OVERRIDES: Record<string, ProductSeed> = {
  "yunpiaotong-foundation": {
    slug: "yunpiaotong-foundation",
    nameZh: "云票通平台（生成式低代码底座）",
    nameEn: "YPT Platform (Generative Low-code Foundation)",
    summaryZh:
      "以微服务+微前端架构支撑企业快速搭建税务应用，通过可视化编排、报表引擎与生成式能力提升复杂场景交付效率。",
    summaryEn:
      "A microservice and micro-frontend architecture for rapid tax application delivery with visual orchestration and generative low-code capabilities.",
    bannerUrl: "/uploads/ppt2025/image140.png",
    sections: [
      {
        sectionType: "capability",
        titleZh: "生成式底座能力",
        titleEn: "Generative Foundation Capabilities",
        descriptionZh: "提供逻辑编排、表单设计、报表配置、接口维护与驾驶舱设计能力。",
        descriptionEn:
          "Covers orchestration, form design, reporting, API maintenance, and dashboard capabilities.",
        items: [
          {
            titleZh: "逻辑编排与流程装配",
            titleEn: "Logic Orchestration",
            descriptionZh: "通过可视化配置快速完成数据模型、流程编排、规则发布与页面装配，支撑事前、事中、事后监控。",
            descriptionEn:
              "Build models, orchestrations, and rule releases visually to support before, during, and after-event monitoring.",
          },
          {
            titleZh: "表单与报表引擎",
            titleEn: "Forms and Reports",
            descriptionZh: "通过拖拽与配置构建基础表单、高级单据、报表和数据大屏，兼顾填报、分析与展示。",
            descriptionEn:
              "Create forms, advanced documents, reports, and dashboards through drag-and-configure workflows.",
          },
          {
            titleZh: "模板与服务配置",
            titleEn: "Templates and Services",
            descriptionZh: "支持系统模板、服务配置与接口维护管理，便于跨项目能力复用和标准化交付。",
            descriptionEn:
              "Supports reusable templates, service configuration, and API maintenance for standardized cross-project delivery.",
          },
        ],
      },
      {
        sectionType: "architecture",
        titleZh: "技术架构与开发模式",
        titleEn: "Architecture and Delivery Model",
        descriptionZh: "以 SpringCloud 微服务与微前端技术为基础，兼容集团客户复杂交付环境。",
        descriptionEn:
          "Built on SpringCloud microservices and micro-frontends to fit large enterprise delivery complexity.",
        items: [
          {
            titleZh: "微服务分布式架构",
            titleEn: "Microservice Architecture",
            descriptionZh: "通过服务拆分提升系统扩展性与独立演进能力，适合多组织、多模块并行建设。",
            descriptionEn:
              "Service decomposition improves extensibility and independent evolution across multiple modules.",
          },
          {
            titleZh: "云端+本地混合开发",
            titleEn: "Hybrid Dev Model",
            descriptionZh: "支持云端与本地开发协同，适配本地化部署、私有云和集团分层建设场景。",
            descriptionEn:
              "Supports cloud and local collaboration for on-prem, private cloud, and layered enterprise delivery.",
          },
          {
            titleZh: "通用数据连接器",
            titleEn: "Universal Connectors",
            descriptionZh: "通过通用连接器打通外部数据与业务流程，降低接口接入门槛。",
            descriptionEn:
              "Universal connectors integrate external data into business flows and reduce integration cost.",
          },
        ],
      },
      {
        sectionType: "efficiency",
        titleZh: "交付效率与AI能力",
        titleEn: "Delivery Efficiency and AI",
        descriptionZh: "聚焦快速开发、应用复用和生成式能力，让业务与技术协同交付。",
        descriptionEn:
          "Focused on rapid delivery, reuse, and generative capability to improve business-technology collaboration.",
        items: [
          {
            titleZh: "生成式智能体",
            titleEn: "Generative Agent",
            descriptionZh: "根据语音、文本和需求文档生成平台应用原型，缩短需求到落地的路径。",
            descriptionEn:
              "Generates application prototypes from voice, text, and requirement documents to shorten delivery cycles.",
          },
          {
            titleZh: "应用市场复用",
            titleEn: "Application Marketplace",
            descriptionZh: "将原子功能组装成场景化应用，沉淀可复用能力资产，提升项目复用率。",
            descriptionEn:
              "Assembles atomic capabilities into scenario-based apps and improves asset reuse across projects.",
          },
          {
            titleZh: "业务人员可参与搭建",
            titleEn: "Business-friendly Build",
            descriptionZh: "通过低代码和可视化配置降低技术门槛，让业务团队可直接参与应用设计。",
            descriptionEn:
              "Low-code visual configuration lowers technical barriers so business teams can participate directly.",
          },
        ],
      },
    ],
  },
  "supply-chain-invoice-collaboration": {
    slug: "supply-chain-invoice-collaboration",
    nameZh: "供应链票据协同与进销项管理",
    nameEn: "Supply Chain Invoice Collaboration",
    summaryZh:
      "覆盖销项开票、进项归集、查验认证、交付归档与票单匹配，打通业财票协同链路，适配多业务、多场景开票。",
    summaryEn:
      "Covers output invoicing, input aggregation, validation, delivery, archiving, and invoice-order matching.",
    bannerUrl: "/uploads/ppt2025/image221.png",
    sections: [
      {
        sectionType: "output",
        titleZh: "销项发票全流程管理",
        titleEn: "Output Invoice Lifecycle",
        descriptionZh: "覆盖开票信息采集、自动预制、发票开具、交付、归档与账票对比。",
        descriptionEn:
          "Covers data intake, pre-build, issuance, delivery, archiving, and invoice-to-book comparison.",
        items: [
          {
            titleZh: "多场景开票",
            titleEn: "Multi-scenario Issuance",
            descriptionZh: "支持无订单开票、预开票、订单直连开票、扫码开票等模式，并兼容税控票与数电票。",
            descriptionEn:
              "Supports no-order, pre-invoice, direct order, and QR-based issuance across traditional and digital invoices.",
          },
          {
            titleZh: "自动回写与核销",
            titleEn: "Automatic Callback",
            descriptionZh: "开票完成后自动回写发票信息并关联业务单据、对账单与预开票记录。",
            descriptionEn:
              "Automatically writes back invoice data and links it with orders, reconciliation records, and pre-invoice items.",
          },
          {
            titleZh: "多渠道交付",
            titleEn: "Multi-channel Delivery",
            descriptionZh: "支持邮箱、静态/动态二维码、短信等多渠道交付，并支持预览、版式生成、下载与打印。",
            descriptionEn:
              "Supports email, QR, and SMS delivery with preview, format generation, download, and print capabilities.",
          },
        ],
      },
      {
        sectionType: "control",
        titleZh: "规则与风控体系",
        titleEn: "Rules and Risk Control",
        descriptionZh: "通过企业规则、税局规则与发票要素规则三层前置校验降低发票风险。",
        descriptionEn:
          "Combines enterprise, authority, and invoice-element rules to reduce invoicing risk before issuance.",
        items: [
          {
            titleZh: "多级规则配置",
            titleEn: "Multi-level Rule Configuration",
            descriptionZh: "支持备注规则、商品名称规则、单价规则、数量规则、行排序规则、合并拆分规则等多级配置。",
            descriptionEn:
              "Supports remark, product naming, pricing, quantity, line sorting, merge, and split rule configurations.",
          },
          {
            titleZh: "风险识别与校验",
            titleEn: "Risk Inspection",
            descriptionZh: "支持抬头风险识别、业务单据与金额管控、频繁红冲预警、票单合规性校验等监控。",
            descriptionEn:
              "Includes title risk detection, amount control, repeated red-letter alerts, and invoice-order compliance checks.",
          },
          {
            titleZh: "双通道稳定性保障",
            titleEn: "Dual-channel Stability",
            descriptionZh: "支持乐企直连与数电 RPA 双通道无感切换，保障高峰期业务连续性。",
            descriptionEn:
              "Supports seamless switching between Leqi direct access and digital-invoice RPA channels for peak stability.",
          },
        ],
      },
      {
        sectionType: "input",
        titleZh: "进项发票归集与认证",
        titleEn: "Input Invoice Aggregation",
        descriptionZh: "覆盖采集、查重、查验、勾选认证、异常处理与归档全生命周期。",
        descriptionEn:
          "Covers the full lifecycle of collection, deduplication, validation, certification, exception handling, and archiving.",
        items: [
          {
            titleZh: "多源采集",
            titleEn: "Multi-source Collection",
            descriptionZh: "支持接口归集、邮箱归集、源文件上传、扫码采集、手工录入等多种方式。",
            descriptionEn:
              "Supports API ingestion, email collection, source file upload, scanning, and manual entry.",
          },
          {
            titleZh: "合规与真伪校验",
            titleEn: "Compliance Validation",
            descriptionZh: "支持黑名单、敏感词、敏感单价、真伪查验、重复查询与购方抬头校验。",
            descriptionEn:
              "Validates blacklists, sensitive words, unit prices, authenticity, duplicates, and buyer title consistency.",
          },
          {
            titleZh: "勾选认证与统计",
            titleEn: "Certification and Analytics",
            descriptionZh: "支持批量抵扣、退税勾选、签名申请、认证清单与进项统计分析。",
            descriptionEn:
              "Supports batch certification, rebate selection, signing, certification lists, and input invoice analytics.",
          },
        ],
      },
    ],
  },
  "tax-risk-governance": {
    slug: "tax-risk-governance",
    nameZh: "税务风险管理",
    nameEn: "Tax Risk Governance",
    summaryZh:
      "构建“识别-预警-处置-复盘”闭环，结合集团规则、税局要求和数据模型实现持续风险防范与治理。",
    summaryEn:
      "Builds a detect-alert-resolve-review loop using enterprise rules, authority requirements, and data models.",
    bannerUrl: "/uploads/ppt2025/image357.png",
    sections: [
      {
        sectionType: "risk",
        titleZh: "风险识别体系",
        titleEn: "Risk Identification Framework",
        descriptionZh: "以规则+模型双引擎识别涉税异常，支持多组织、多税区分层治理。",
        descriptionEn:
          "Uses dual rule-and-model engines to detect tax anomalies across entities and regions.",
        items: [
          {
            titleZh: "指标模型扩展",
            titleEn: "Extensible Indicators",
            descriptionZh: "支持 400+ 风险指标模型扩展，可配置阈值、触发逻辑、适用组织和责任归属。",
            descriptionEn:
              "Extensible with 400+ indicators and configurable thresholds, triggers, scope, and ownership.",
          },
          {
            titleZh: "规则分层治理",
            titleEn: "Layered Rules",
            descriptionZh: "兼顾企业规则、税局监管规则和业务合规要求，提升模型识别准确性。",
            descriptionEn:
              "Combines enterprise rules, authority supervision, and business compliance requirements.",
          },
          {
            titleZh: "穿透式风险分析",
            titleEn: "Drill-down Analysis",
            descriptionZh: "风险事项支持穿透查看关联发票、申报表、业务单据和责任人，便于快速定位问题。",
            descriptionEn:
              "Risk events support drill-down to invoices, returns, business documents, and owners for quick diagnosis.",
          },
        ],
      },
      {
        sectionType: "warning",
        titleZh: "预警与闭环处置",
        titleEn: "Alerts and Closed-loop Handling",
        descriptionZh: "通过预警、整改、反馈和复盘形成持续治理闭环。",
        descriptionEn:
          "Turns alerts, remediation, feedback, and review into a continuous governance loop.",
        items: [
          {
            titleZh: "实时预警",
            titleEn: "Real-time Alerts",
            descriptionZh: "支持基于阈值、规则命中和异常行为的实时风险提示，并可推送到责任岗位。",
            descriptionEn:
              "Provides real-time alerts based on thresholds, rule hits, and anomalous behavior with role-based routing.",
          },
          {
            titleZh: "整改清单",
            titleEn: "Remediation List",
            descriptionZh: "自动生成风险报告与整改事项清单，推动部门协同处理与进度跟踪。",
            descriptionEn:
              "Generates risk reports and remediation lists to coordinate cross-team follow-up and progress tracking.",
          },
          {
            titleZh: "复盘沉淀",
            titleEn: "Review and Learning",
            descriptionZh: "将典型风险案例沉淀为规则和知识，持续优化后续识别和治理策略。",
            descriptionEn:
              "Converts typical cases into reusable rules and knowledge to continuously improve governance strategy.",
          },
        ],
      },
    ],
  },
  "leqi-access-platform": {
    slug: "leqi-access-platform",
    nameZh: "乐企一站式接入服务平台",
    nameEn: "One-stop Leqi Access Platform",
    summaryZh:
      "兼容原有税控接口与电子底账能力，快速完成企业系统到乐企平台的能力接入、升级托管与运维监控。",
    summaryEn:
      "Compatible with legacy tax-control and invoice interfaces for fast enterprise integration with the Leqi platform.",
    bannerUrl: "/uploads/ppt2025/image302.png",
    sections: [
      {
        sectionType: "integration",
        titleZh: "接入能力",
        titleEn: "Integration Capabilities",
        descriptionZh: "覆盖 7 大能力 43 项业务功能对接与接口兼容封装能力。",
        descriptionEn:
          "Covers seven capability groups and 43 business functions with compatibility-oriented integration packaging.",
        items: [
          {
            titleZh: "7 大能力对接",
            titleEn: "Seven Capability Groups",
            descriptionZh: "覆盖开票、用票、数据查询、申报、缴款、接入管控和服务中心等核心能力群。",
            descriptionEn:
              "Covers issuance, usage, data query, filing, payment, access governance, and service center capabilities.",
          },
          {
            titleZh: "兼容原系统接口",
            titleEn: "Legacy Compatibility",
            descriptionZh: "最大程度兼容原有税控销项接口和电子底账进项接口，降低企业改造成本。",
            descriptionEn:
              "Maintains compatibility with existing invoicing and input-invoice interfaces to reduce transformation cost.",
          },
          {
            titleZh: "屏蔽乐企变动",
            titleEn: "Change Shielding",
            descriptionZh: "通过接口封装和规则适配，屏蔽乐企数据、接口和规则变动对业务系统的影响。",
            descriptionEn:
              "Shields business systems from Leqi data, API, and rule changes through encapsulation and adaptation.",
          },
        ],
      },
      {
        sectionType: "operation",
        titleZh: "运维与升级",
        titleEn: "Operations and Upgrades",
        descriptionZh: "通过脚本化可编程能力和模拟测试环境实现快速迭代。",
        descriptionEn:
          "Enables rapid evolution via scriptable extensions and sandbox simulation environments.",
        items: [
          {
            titleZh: "脚本化可编程更新",
            titleEn: "Scriptable Updates",
            descriptionZh: "通过规则脚本实现服务更新和功能映射，支持不停机升级与快速能力扩展。",
            descriptionEn:
              "Rule scripts enable service updates and function mapping without downtime.",
          },
          {
            titleZh: "模拟测试环境",
            titleEn: "Simulation Environment",
            descriptionZh: "提供长期可用的联调与升级测试环境，帮助企业在税局测试窗口内快速通过验证。",
            descriptionEn:
              "Provides persistent simulation environments to accelerate testing and release readiness.",
          },
          {
            titleZh: "后台运维中心",
            titleEn: "Back-office Operations",
            descriptionZh: "支持企业信息管理、请求响应查询、发票池管理、交易流水排查和服务监控统计。",
            descriptionEn:
              "Includes tenant management, request tracing, invoice pool operations, transaction logs, and monitoring metrics.",
          },
        ],
      },
      {
        sectionType: "deployment",
        titleZh: "部署与安全可信",
        titleEn: "Deployment and Trust",
        descriptionZh: "支持 SaaS、公有云、私有云和本地化部署，兼容信创底层环境。",
        descriptionEn:
          "Supports SaaS, public cloud, private cloud, and on-prem deployments with trusted domestic stack support.",
        items: [
          {
            titleZh: "多部署模式",
            titleEn: "Multiple Deployment Modes",
            descriptionZh: "支持托管部署、本地化部署、二进制部署和镜像化部署，并可提供 K8s 编排文件。",
            descriptionEn:
              "Supports managed, on-prem, binary, and image-based deployments with optional Kubernetes manifests.",
          },
          {
            titleZh: "无感升级",
            titleEn: "Seamless Upgrade",
            descriptionZh: "实时同步税局升级，支持向前向后兼容，降低企业接口升级维护成本。",
            descriptionEn:
              "Synchronizes authority-side upgrades with forward and backward compatibility to reduce maintenance effort.",
          },
          {
            titleZh: "信创兼容",
            titleEn: "Domestic Compatibility",
            descriptionZh: "产品全系列兼容信创底层环境，并可获得原厂技术支持与持续维护。",
            descriptionEn:
              "The full product line supports domestic trusted infrastructure with original-vendor support.",
          },
        ],
      },
    ],
  },
  "smart-tax-filing": {
    slug: "smart-tax-filing",
    nameZh: "智能纳税申报管理平台",
    nameEn: "Smart Tax Filing Platform",
    summaryZh:
      "实现自动取数、自动算税、申报表生成、一键申报、缴款与凭证归集，覆盖全国化申报作业中台场景。",
    summaryEn:
      "Automates data collection, calculation, return generation, filing, payment, and voucher collection at scale.",
    bannerUrl: "/uploads/ppt2025/image327.png",
    sections: [
      {
        sectionType: "filing",
        titleZh: "全流程申报",
        titleEn: "End-to-end Filing",
        descriptionZh: "覆盖“取数-算税-校验-申报-缴款-归档”全生命周期。",
        descriptionEn:
          "Covers the full lifecycle from data collection and tax calculation to filing, payment, and archiving.",
        items: [
          {
            titleZh: "自动取数与算税",
            titleEn: "Automated Data and Calculation",
            descriptionZh: "自动汇聚业务、财务、发票和税务数据，完成税额计算、辅助账处理和表单预填。",
            descriptionEn:
              "Aggregates business, finance, invoice, and tax data for calculation, auxiliary accounting, and pre-filled returns.",
          },
          {
            titleZh: "一键申报与缴款",
            titleEn: "One-click Filing and Payment",
            descriptionZh: "支持申报提交、缴款处理、完税凭证下载和申报归档，减少人工操作链路。",
            descriptionEn:
              "Supports filing submission, payment processing, tax voucher download, and filing archiving.",
          },
          {
            titleZh: "往期与当期管理",
            titleEn: "Current and Historical Filing",
            descriptionZh: "支持当期/往期申报数据获取、申报表下载与历史留痕，便于追溯与复核。",
            descriptionEn:
              "Supports current and historical filing retrieval, return downloads, and full traceability.",
          },
        ],
      },
      {
        sectionType: "coverage",
        titleZh: "覆盖范围与适配能力",
        titleEn: "Coverage and Adaptation",
        descriptionZh: "支持全国化税区、多税种和多通道申报适配，满足集团与区域化企业作业要求。",
        descriptionEn:
          "Supports nationwide regions, multiple tax types, and multiple filing channels for enterprise-scale operations.",
        items: [
          {
            titleZh: "36 税区直连",
            titleEn: "36-region Direct Filing",
            descriptionZh: "支持全国 36 个税区直连申报，兼容乐企申报与各地电子税局接口能力。",
            descriptionEn:
              "Supports direct filing across 36 tax regions with both Leqi and e-tax bureau compatibility.",
          },
          {
            titleZh: "18+10 税种能力",
            titleEn: "18+10 Tax Coverage",
            descriptionZh: "支持 18 个实体税种及 10+ 附加税费种，自动适配地区化差异规则。",
            descriptionEn:
              "Supports 18 primary tax types and 10+ surcharges with localized rule adaptation.",
          },
          {
            titleZh: "双通道申报",
            titleEn: "Dual Filing Channels",
            descriptionZh: "结合标准化 API 与 RPA 通道，兼顾申报稳定性、准确性和覆盖范围。",
            descriptionEn:
              "Combines standardized APIs and RPA channels to balance filing stability, accuracy, and coverage.",
          },
        ],
      },
      {
        sectionType: "efficiency",
        titleZh: "申报时效与管控",
        titleEn: "Efficiency and Control",
        descriptionZh: "通过批量化、提醒和异常处理机制大幅提升申报准确率与作业效率。",
        descriptionEn:
          "Improves timeliness and accuracy through batch processing, reminders, and exception handling.",
        items: [
          {
            titleZh: "批量作业",
            titleEn: "Batch Operations",
            descriptionZh: "支持集团多主体集中申报、批量校验与统一作业编排，减少重复劳动。",
            descriptionEn:
              "Supports centralized multi-entity filing, batch validation, and unified job orchestration.",
          },
          {
            titleZh: "提醒与预警",
            titleEn: "Reminder and Alerts",
            descriptionZh: "支持截止日期提醒、风险预警和异常提示，保障申报节奏与合规性。",
            descriptionEn:
              "Provides deadline reminders, risk alerts, and anomaly prompts for better filing governance.",
          },
          {
            titleZh: "可追溯留痕",
            titleEn: "Traceable Audit Trail",
            descriptionZh: "关键申报动作、规则变化和结果状态均可追溯，便于复核和审计。",
            descriptionEn:
              "Tracks key filing actions, rule changes, and result states for review and audit.",
          },
        ],
      },
    ],
  },
  "individual-income-tax-platform": {
    slug: "individual-income-tax-platform",
    nameZh: "个税申报管理平台",
    nameEn: "Individual Income Tax Filing Platform",
    summaryZh:
      "打通人员信息、工资数据与局端申报通道，实现个税智能计算、一键申报、专项附加扣除同步和缴款闭环。",
    summaryEn:
      "Connects personnel, payroll, and authority channels for intelligent IIT calculation, filing, and payment closure.",
    bannerUrl: "/uploads/ppt2025/image342.png",
    sections: [
      {
        sectionType: "iit",
        titleZh: "个税模块亮点",
        titleEn: "IIT Highlights",
        descriptionZh: "支持多所得项目自动汇总、算税与缴款联动。",
        descriptionEn:
          "Supports multi-income aggregation, automatic IIT calculation, and payment linkage.",
        items: [
          {
            titleZh: "工资表自动映射",
            titleEn: "Payroll Auto Mapping",
            descriptionZh: "个性化工资表无需改造即可自动映射到申报口径，减少人工整理和模板维护。",
            descriptionEn:
              "Personalized payroll files can be auto-mapped without rebuilding templates.",
          },
          {
            titleZh: "专项附加扣除同步",
            titleEn: "Deduction Synchronization",
            descriptionZh: "专项附加扣除、人员主数据与任职信息动态同步，保证申报数据一致性。",
            descriptionEn:
              "Synchronizes special deductions and personnel master data to keep filings consistent.",
          },
          {
            titleZh: "批量申报与缴款",
            titleEn: "Batch Filing and Payment",
            descriptionZh: "支持批量申报、缴款任务闭环处理和异常回执跟踪，适配人员规模化场景。",
            descriptionEn:
              "Supports batch filing, payment task closure, and exception receipt tracking for workforce-scale scenarios.",
          },
        ],
      },
      {
        sectionType: "compliance",
        titleZh: "个税合规与体验",
        titleEn: "Compliance and Experience",
        descriptionZh: "兼顾申报准确性、财务效率与员工体验。",
        descriptionEn:
          "Balances filing accuracy, finance efficiency, and employee experience.",
        items: [
          {
            titleZh: "局端通道打通",
            titleEn: "Authority Channel Access",
            descriptionZh: "打通人员、工资和税局通道，实现算税、申报、缴款的一体化作业。",
            descriptionEn:
              "Connects people, payroll, and tax authority channels into one workflow.",
          },
          {
            titleZh: "减少人工操作",
            titleEn: "Reduced Manual Work",
            descriptionZh: "通过自动计算和规则校验减少人工校对、重复录入和事后返工。",
            descriptionEn:
              "Reduces manual reconciliation, duplicate entry, and post-filing rework through automation.",
          },
          {
            titleZh: "异常闭环处理",
            titleEn: "Closed-loop Exception Handling",
            descriptionZh: "对申报失败、缴款失败、人员异常等情况形成统一处理与留痕机制。",
            descriptionEn:
              "Creates unified workflows and audit trails for filing failures, payment failures, and personnel exceptions.",
          },
        ],
      },
    ],
  },
  "electronic-accounting-archive": {
    slug: "electronic-accounting-archive",
    nameZh: "电子会计档案管理平台",
    nameEn: "Electronic Accounting Archive Platform",
    summaryZh:
      "围绕采集、整理、保管、利用、检索、统计全链路构建纸电一体档案体系，解决数电发票时代档案复杂度上升问题。",
    summaryEn:
      "Builds a paper-digital archive lifecycle from collection to analytics for the digital-invoice era.",
    bannerUrl: "/uploads/ppt2025/image706.jpeg",
    sections: [
      {
        sectionType: "collection",
        titleZh: "档案采集与归档集成",
        titleEn: "Collection and Archiving Integration",
        descriptionZh: "与 OA、智能财务、ERP、采购、合同、银企支付等系统打通，实现零代码归档集成。",
        descriptionEn:
          "Connects OA, smart finance, ERP, procurement, contract, and banking systems for low-code archive integration.",
        items: [
          {
            titleZh: "多系统采集",
            titleEn: "Multi-system Intake",
            descriptionZh: "支持从电子税务局、OA 审批、智能财务、ERP、合同和银企支付系统采集电子档案。",
            descriptionEn:
              "Collects archive data from e-tax systems, OA, smart finance, ERP, contracts, and bank-payment systems.",
          },
          {
            titleZh: "零代码接口平台",
            titleEn: "Low-code Interface Platform",
            descriptionZh: "提供标准接口平台实现零代码归档集成，显著降低接口开发难度与周期。",
            descriptionEn:
              "Provides standard interfaces for zero-code archive integration and shortens implementation cycles.",
          },
          {
            titleZh: "四性检测前置",
            titleEn: "Pre-check of Four Qualities",
            descriptionZh: "归档前完成真实性、完整性、可用性和安全性检测，避免人为失误造成档案问题。",
            descriptionEn:
              "Checks authenticity, integrity, usability, and security before filing to reduce archive defects.",
          },
        ],
      },
      {
        sectionType: "governance",
        titleZh: "整理、保管与利用",
        titleEn: "Arrangement, Storage, and Usage",
        descriptionZh: "覆盖电子与纸质档案协同管理，支持集团统一出口和全流程借阅利用。",
        descriptionEn:
          "Covers coordinated management of digital and physical archives with unified group-level usage.",
        items: [
          {
            titleZh: "集团统一管理",
            titleEn: "Group-level Governance",
            descriptionZh: "支持集团化集中管理、统一档案利用出口和审计账号访问，促进共享与决策支持。",
            descriptionEn:
              "Supports centralized group management, unified archive usage, and audit-account access.",
          },
          {
            titleZh: "纸电一体保管",
            titleEn: "Paper-Digital Coordination",
            descriptionZh: "电子档案可自动立卷归档，并通过 RFID 或条码与纸质档案关联，支持 2D/3D 库房视图。",
            descriptionEn:
              "Digital archives are automatically filed and linked with physical archives using RFID or barcodes with 2D/3D storage views.",
          },
          {
            titleZh: "借阅与移动利用",
            titleEn: "Borrowing and Mobile Usage",
            descriptionZh: "支持借阅申请、审批、出入库、催还和移动端检索/扫码，形成全流程利用闭环。",
            descriptionEn:
              "Supports borrowing request, approval, check-in/out, reminders, and mobile retrieval/scanning.",
          },
        ],
      },
      {
        sectionType: "security",
        titleZh: "检索分析与安全控制",
        titleEn: "Search, Analytics, and Security",
        descriptionZh: "以全文检索、OCR、权限和密级控制支撑大规模档案使用体验与安全治理。",
        descriptionEn:
          "Combines full-text search, OCR, permissions, and classification controls for scalable archive governance.",
        items: [
          {
            titleZh: "全文检索能力",
            titleEn: "Full-text Search",
            descriptionZh: "应用 Elasticsearch 和 OCR 识别实现全文检索，支持十亿级数据快速查询与结构化穿透。",
            descriptionEn:
              "Uses Elasticsearch and OCR for full-text retrieval and drill-down across billion-scale data.",
          },
          {
            titleZh: "多维统计分析",
            titleEn: "Multi-dimensional Analytics",
            descriptionZh: "支持全宗概览、分类、时间序列、文件格式等多维分析，满足档案运营决策需要。",
            descriptionEn:
              "Supports analysis by fonds, category, time sequence, and file format for archive operation decisions.",
          },
          {
            titleZh: "权限与密级管理",
            titleEn: "Permissions and Classification",
            descriptionZh: "支持字段权限、数据权限、秘密级别、水印脱敏、日志留痕和安全传输控制。",
            descriptionEn:
              "Supports field/data permissions, classification levels, watermarks, desensitization, logging, and secure transfer.",
          },
        ],
      },
    ],
  },
  "export-tax-rebate-platform": {
    slug: "export-tax-rebate-platform",
    nameZh: "出口退税管理平台",
    nameEn: "Export Tax Rebate Platform",
    summaryZh:
      "集关务、票管、退税申报与风险防控于一体，支持报关单、收入、发票、收汇到申报的端到端协同。",
    summaryEn:
      "Integrates customs, invoicing, rebate filing, and risk control across the export rebate lifecycle.",
    bannerUrl: "/uploads/ppt2025/image733.png",
    sections: [
      {
        sectionType: "integration",
        titleZh: "数据接入与业务总览",
        titleEn: "Data Intake and Business Overview",
        descriptionZh: "整合报关单、物流、收入、收汇、发票等多源数据，构建出口退税统一作业底盘。",
        descriptionEn:
          "Integrates declarations, logistics, revenue, receipts, and invoices into one operating platform.",
        items: [
          {
            titleZh: "多源数据采集",
            titleEn: "Multi-source Data Intake",
            descriptionZh: "支持从内部 ERP、销售、物流、核算系统及电子口岸/单一窗口采集关务与财务数据。",
            descriptionEn:
              "Collects customs and finance data from ERP, sales, logistics, accounting, and national portals.",
          },
          {
            titleZh: "规则配置中心",
            titleEn: "Rule Configuration Center",
            descriptionZh: "支持汇率维护、商品编码、视同自产、业务类型和备查文档规则统一配置。",
            descriptionEn:
              "Provides unified rule setup for exchange rate, commodity code, self-produced rules, business type, and document requirements.",
          },
          {
            titleZh: "业务总览跟踪",
            titleEn: "Business Overview Tracking",
            descriptionZh: "统一跟踪报关单、交货单、销售订单、收入单与收汇情况，及时发现差异。",
            descriptionEn:
              "Tracks declarations, delivery notes, sales orders, revenue, and receipt status in one overview.",
          },
        ],
      },
      {
        sectionType: "process",
        titleZh: "端到端退税流程",
        titleEn: "End-to-end Rebate Flow",
        descriptionZh: "覆盖关单与收入核销、发票核销、收汇登记、模拟申报和正式申报。",
        descriptionEn:
          "Covers declaration-income reconciliation, invoice matching, receipt registration, simulation, and formal filing.",
        items: [
          {
            titleZh: "核销链路",
            titleEn: "Reconciliation Chain",
            descriptionZh: "支持关单与收入核销、发票与关单核销、收汇核销，形成完整底稿准备链路。",
            descriptionEn:
              "Supports declaration-income, invoice-declaration, and receipt reconciliation for filing draft preparation.",
          },
          {
            titleZh: "模拟到正式申报",
            titleEn: "Simulation to Formal Filing",
            descriptionZh: "支持模拟申报、疑点处理、正式申报和增值税申报联动，降低退税申报风险。",
            descriptionEn:
              "Supports simulation filing, issue handling, formal filing, and VAT linkage to reduce rebate risk.",
          },
          {
            titleZh: "单证备案归档",
            titleEn: "Documentation and Filing",
            descriptionZh: "统一管理报关单、出口销售发票、运输合同、提单、箱单等单证附件。",
            descriptionEn:
              "Manages declaration, export invoice, transport insurance, bill of lading, and packing list attachments.",
          },
        ],
      },
      {
        sectionType: "value",
        titleZh: "管理价值与合规控制",
        titleEn: "Management Value and Compliance",
        descriptionZh: "在降本增效、集中管理和合规控制三个层面提升出口退税管理能力。",
        descriptionEn:
          "Improves export rebate operations through efficiency, centralization, and compliance control.",
        items: [
          {
            titleZh: "降本增效",
            titleEn: "Efficiency Gains",
            descriptionZh: "实现在线协同、关单自动获取、税务认定和金额核对，降低沟通和人工处理成本。",
            descriptionEn:
              "Enables online collaboration, automatic declaration retrieval, tax recognition, and amount verification.",
          },
          {
            titleZh: "集中管理",
            titleEn: "Centralized Governance",
            descriptionZh: "集中申报、集中备案、集中信息管理，为后续税务分析与风险管控建立基础。",
            descriptionEn:
              "Centralizes filing, documentation, and information management for future tax analysis and control.",
          },
          {
            titleZh: "规则内置合规",
            titleEn: "Built-in Compliance",
            descriptionZh: "利用内置规则降低税务风险，并自动识别收入与报关单差异确保申报合规。",
            descriptionEn:
              "Uses built-in rules to reduce tax risk and automatically checks declaration-income differences.",
          },
        ],
      },
    ],
  },
  "global-tax-intelligence-platform": {
    slug: "global-tax-intelligence-platform",
    nameZh: "海外全球税务数智化平台",
    nameEn: "Global Tax Intelligence Platform",
    summaryZh:
      "面向跨国与出海企业，围绕全球间接税、直接税与政策知识库构建一体化数智平台，覆盖开票、计税、申报、归档与风险预警全流程。",
    summaryEn:
      "An integrated platform for multinational and overseas businesses covering global indirect tax, direct tax, and policy intelligence across invoicing, calculation, filing, archiving, and risk alerts.",
    bannerUrl: "/uploads/ppt-overseas/image2.png",
    sections: [
      {
        sectionType: "indirect-tax",
        titleZh: "全球间接税与电票全生命周期管理",
        titleEn: "Global Indirect Tax and E-invoice Lifecycle",
        descriptionZh:
          "覆盖多区域开票、智能计税、汇率换算、AI识别与归档追溯，适配跨境电商与多国家/地区发票管理场景。",
        descriptionEn:
          "Covers multi-region invoicing, intelligent tax calculation, FX conversion, AI extraction, and archive traceability for cross-border invoice operations.",
        items: [
          {
            titleZh: "18 个主流国家/地区开票覆盖",
            titleEn: "Coverage Across 18 Major Regions",
            descriptionZh:
              "支持 18 个主流国家/地区税务规则，部分地区可直连当地税局 API，并具备 PEPPOL 接入能力，满足跨境发票无缝传输需求。",
            descriptionEn:
              "Supports tax rules across 18 major countries or regions, with direct authority API access in selected markets and PEPPOL-based cross-border invoice exchange.",
          },
          {
            titleZh: "智能计税与汇率换算",
            titleEn: "Intelligent Tax and FX Conversion",
            descriptionZh:
              "内置各国间接税计税模块，自动适配税制差异、实时同步全球汇率，支持多币种金额换算与复杂税额计算。",
            descriptionEn:
              "Built-in indirect-tax engines adapt to country-specific rules, synchronize exchange rates in real time, and support multi-currency tax calculations.",
          },
          {
            titleZh: "AI 识别、校验与归档",
            titleEn: "AI Extraction, Validation, and Archiving",
            descriptionZh:
              "结合 OCR 与税务大模型提取多语言、非标票据核心要素，自动完成合规校验、标签分类、标准化底稿与资料归档。",
            descriptionEn:
              "Combines OCR and tax LLM capability to extract multilingual invoice data, validate compliance, classify records, and produce standardized drafts and archives.",
          },
        ],
      },
      {
        sectionType: "direct-tax",
        titleZh: "全球直接税合规计税与申报",
        titleEn: "Global Direct Tax Compliance and Filing",
        descriptionZh:
          "围绕企业所得税、预提税、转让定价、常设机构与税收协定应用，打通数据归集、税基核算、申报流转与审计留痕。",
        descriptionEn:
          "Supports CIT, withholding tax, transfer pricing, permanent establishment risk, and treaty application from data intake through filing and audit traceability.",
        items: [
          {
            titleZh: "全球规则库与税收协定匹配",
            titleEn: "Global Rule and Treaty Library",
            descriptionZh:
              "内置全球直接税规则与数千份税收协定，由税务专家持续维护，支持优惠资格判断、双重征税规避与属地合规测算。",
            descriptionEn:
              "A tax-expert-maintained global direct-tax and treaty library supports incentive qualification, double-taxation avoidance, and local compliance calculation.",
          },
          {
            titleZh: "复杂场景核算与专项管理",
            titleEn: "Complex Calculations and Special Topics",
            descriptionZh:
              "自动完成税基核算、纳税调整与跨境专项台账，覆盖转让定价、境外投资、预提税与常设机构风险识别等复杂场景。",
            descriptionEn:
              "Automates tax-base calculation, adjustments, and cross-border ledgers for transfer pricing, overseas investment, withholding tax, and PE risk scenarios.",
          },
          {
            titleZh: "申报底稿、流转与归档闭环",
            titleEn: "Draft, Filing Flow, and Archive Closure",
            descriptionZh:
              "支持 1:1 适配各国官方申报表、自动填充数据、一键导出申报文件，并将全流程数据留痕归档，满足审计与监管要求。",
            descriptionEn:
              "Matches official filing forms country by country, pre-fills returns, exports filing packages, and keeps full audit trails for compliance and audit review.",
          },
        ],
      },
      {
        sectionType: "knowledge-base",
        titleZh: "全球财税知识库与政策响应",
        titleEn: "Global Tax Knowledge Base and Policy Response",
        descriptionZh:
          "通过自动知识采集引擎、多语言翻译与智能问答能力，实现全球政策分钟级感知、风险提示与知识闭环。",
        descriptionEn:
          "Combines automated collection, multilingual translation, and intelligent Q&A for near-real-time policy awareness and actionable tax insight.",
        items: [
          {
            titleZh: "200+ 国家/地区政策自动采集",
            titleEn: "Automated Collection Across 200+ Jurisdictions",
            descriptionZh:
              "7×24 小时持续抓取全球财税政策，通过 NLP 与 OCR 结构化入库，实现分钟级更新与属地监管动态跟踪。",
            descriptionEn:
              "Collects global tax policy updates 24/7 with NLP and OCR structuring for minute-level ingestion and jurisdiction tracking.",
          },
          {
            titleZh: "30+ 语言智能检索与问答",
            titleEn: "Search and Q&A in 30+ Languages",
            descriptionZh:
              "支持多语种自然语言问答、专业术语校准与本地化解读，帮助跨境团队快速定位政策原文、案例与实操指南。",
            descriptionEn:
              "Supports multilingual natural-language search, terminology normalization, and local interpretation for rapid access to policy texts, cases, and practice guidance.",
          },
          {
            titleZh: "新政推送与主动风控",
            titleEn: "Policy Push and Proactive Risk Control",
            descriptionZh:
              "支持按行业、区域与业务场景定制推送规则，结合交易与税务数据识别潜在影响，推动企业从被动响应走向主动预判。",
            descriptionEn:
              "Delivers targeted alerts by industry, region, and scenario while combining transaction and tax data to identify emerging risks proactively.",
          },
        ],
      },
    ],
  },
  "full-ticket-pass": {
    slug: "full-ticket-pass",
    nameZh: "全票通（电商开票）",
    nameEn: "FullTicket (E-commerce Invoicing)",
    summaryZh:
      "面向多平台、多店铺、多订单形态电商场景，提供订单同步、自动开票、交付回传和联用开票能力。",
    summaryEn:
      "Designed for multi-platform and multi-store commerce with automated invoicing, callbacks, and delivery.",
    bannerUrl: "/uploads/ppt2025/image569.png",
    sections: [
      {
        sectionType: "scenario",
        titleZh: "典型场景",
        titleEn: "Typical Scenarios",
        descriptionZh: "适配天猫、京东等多平台多店铺业务，解决促销高峰期间的开票压力与人工错误。",
        descriptionEn:
          "Fits platforms like Tmall and JD to handle peak promotion invoicing loads with fewer manual errors.",
        items: [
          {
            titleZh: "多店铺统一管理",
            titleEn: "Unified Multi-store Management",
            descriptionZh: "支持多平台多店铺订单统一归集、批量处理和状态回传，提升电商财务协同效率。",
            descriptionEn:
              "Unifies multi-store order collection, batch processing, and callback handling for better finance collaboration.",
          },
          {
            titleZh: "高峰期自动开票",
            titleEn: "Peak-time Automation",
            descriptionZh: "适应大促期间订单量暴增场景，减少手工开票和重复校对压力。",
            descriptionEn:
              "Handles promotional peak workloads with less manual issuance and repeated verification.",
          },
          {
            titleZh: "支付即开票 / 联用开票",
            titleEn: "Payment-triggered Issuance",
            descriptionZh: "支持支付即开票、乐企联用开票等创新模式，拓展业务场景能力。",
            descriptionEn:
              "Supports payment-triggered invoicing and Leqi joint-use invoicing to expand business scenarios.",
          },
        ],
      },
      {
        sectionType: "operation",
        titleZh: "自动化与交付能力",
        titleEn: "Automation and Delivery",
        descriptionZh: "围绕订单、发票和交付构建自动化链路，减少运营环节摩擦。",
        descriptionEn:
          "Builds an automated chain across orders, invoices, and delivery to reduce operational friction.",
        items: [
          {
            titleZh: "订单同步与待开票管理",
            titleEn: "Order Sync and Pending Queue",
            descriptionZh: "自动同步订单与对账单，生成待开票池，支持预开票和后续核销。",
            descriptionEn:
              "Synchronizes orders and reconciliation records into a pending invoice queue with pre-invoice support.",
          },
          {
            titleZh: "自动回传",
            titleEn: "Automatic Callback",
            descriptionZh: "开票完成后自动回传订单、业务系统和财务系统，保持数据一致性。",
            descriptionEn:
              "Writes results back to order, business, and finance systems automatically after issuance.",
          },
          {
            titleZh: "多渠道交付",
            titleEn: "Multi-channel Delivery",
            descriptionZh: "支持邮件、下载和电子票据交付，兼顾消费者体验和商家履约效率。",
            descriptionEn:
              "Supports email, download, and electronic delivery to balance customer experience and merchant efficiency.",
          },
        ],
      },
    ],
  },
  "tax-data-service-platform": {
    slug: "tax-data-service-platform",
    nameZh: "数据服务平台",
    nameEn: "Tax Data Service Platform",
    summaryZh:
      "提供发票、申报、财务、工商等多源数据服务，支撑贷前、贷中、贷后风控和经营分析等场景。",
    summaryEn:
      "Delivers invoice, filing, financial, and enterprise data services for credit, risk, and operational scenarios.",
    bannerUrl: "/uploads/ppt2025/image748.png",
    sections: [
      {
        sectionType: "data",
        titleZh: "数据能力",
        titleEn: "Data Capabilities",
        descriptionZh: "围绕业、财、税、票多维数据构建标准化数据能力目录，满足金融与产业平台消费需求。",
        descriptionEn:
          "Provides standardized data capability catalogs across business, finance, tax, and invoice domains.",
        items: [
          {
            titleZh: "企业基础与经营数据",
            titleEn: "Enterprise Base Data",
            descriptionZh: "支持纳税人基本信息、总分机构、经营信息、法定代表人与主要人员等数据获取。",
            descriptionEn:
              "Provides taxpayer profiles, entity hierarchy, operating information, and key personnel data.",
          },
          {
            titleZh: "票税财数据目录",
            titleEn: "Invoice-Tax-Finance Catalog",
            descriptionZh: "支持进销项发票、财务报表、申报历史、缴款信息、完税证明和信用类信息查询下载。",
            descriptionEn:
              "Supports querying invoices, financial reports, filing history, payment records, certificates, and credit data.",
          },
          {
            titleZh: "政策法规与税费认定",
            titleEn: "Policy and Tax Recognition",
            descriptionZh: "支持税费种认定、申报清册和政策法规数据服务，为风控和分析提供背景支撑。",
            descriptionEn:
              "Includes tax recognition, filing catalogs, and policy data to support analytics and risk control.",
          },
        ],
      },
      {
        sectionType: "channel",
        titleZh: "通道与对接",
        titleEn: "Channels and Integration",
        descriptionZh: "覆盖电子税局接口、RPA 通道与乐企联动，并支持多种数据交付方式。",
        descriptionEn:
          "Combines e-tax APIs, RPA channels, and Leqi integration for stable and scalable data acquisition.",
        items: [
          {
            titleZh: "平台 / 插件 / 接口交付",
            titleEn: "Platform / Plugin / API Delivery",
            descriptionZh: "支持平台、插件、接口等多种形态接入，可与合作方业务、信贷、风控系统组合使用。",
            descriptionEn:
              "Supports platform, plugin, and API delivery models for integration with business, credit, and risk systems.",
          },
          {
            titleZh: "多通道数据获取",
            titleEn: "Multi-channel Data Access",
            descriptionZh: "提供 36 省市电子税局通道，并支持个税申报、出口退税和相关接口能力。",
            descriptionEn:
              "Provides access across 36 regions plus IIT filing and export rebate-related interface capabilities.",
          },
          {
            titleZh: "任务编排与回传",
            titleEn: "Task Orchestration and Callback",
            descriptionZh: "支持发起采集任务、明细查询、结果下载和对接回传，适配银行、征信、园区监管场景。",
            descriptionEn:
              "Supports task initiation, query, download, and callback for banking, credit, and regulatory scenarios.",
          },
        ],
      },
      {
        sectionType: "scenario",
        titleZh: "应用场景",
        titleEn: "Application Scenarios",
        descriptionZh: "用于真实贸易背景审查、经营状况洞察和供应链金融场景。",
        descriptionEn:
          "Designed for trade-authenticity review, operational insight, and supply-chain finance scenarios.",
        items: [
          {
            titleZh: "贷前 / 贷中 / 贷后风控",
            titleEn: "Credit Lifecycle Risk",
            descriptionZh: "为金融机构提供授信背景真实性审查、经营状况评估和持续监测所需数据能力。",
            descriptionEn:
              "Supports authenticity review, business assessment, and continuous monitoring across the credit lifecycle.",
          },
          {
            titleZh: "数据导出与格式化交付",
            titleEn: "Export and Formatted Delivery",
            descriptionZh: "支持 Excel、格式化数据、PDF/OFD 等多种输出格式，便于业务系统消费。",
            descriptionEn:
              "Supports Excel, structured data, and PDF/OFD outputs for downstream business consumption.",
          },
          {
            titleZh: "系统对接 / 非对接两种模式",
            titleEn: "Integrated and Standalone Modes",
            descriptionZh: "既支持平台内发起采集和查询，也支持回传到银行系统平台的集成模式。",
            descriptionEn:
              "Supports both standalone task operation and integrated callback to banking or partner platforms.",
          },
        ],
      },
    ],
  },
  "open-api-ecosystem": {
    slug: "open-api-ecosystem",
    nameZh: "开放生态接口中心",
    nameEn: "Open API Ecosystem Hub",
    summaryZh:
      "统一开放进项、销项、申报、个税、出口退税与数据服务接口，支撑生态联动、任务追踪和平台化运营。",
    summaryEn:
      "Provides unified open APIs for invoices, filing, IIT, export rebate, and data services with platform operations.",
    bannerUrl: "/uploads/ppt2025/image584.png",
    sections: [
      {
        sectionType: "api",
        titleZh: "开放能力目录",
        titleEn: "Open Capability Catalog",
        descriptionZh: "按业务域提供标准化 API，便于合作方快速接入和持续扩展。",
        descriptionEn:
          "Standardized business-domain APIs for rapid partner integration and continuous expansion.",
        items: [
          {
            titleZh: "票税核心接口族",
            titleEn: "Core Tax API Families",
            descriptionZh: "提供《进项发票》《销项发票》《纳税申报》《个税申报》《出口退税》《数据服务》接口体系。",
            descriptionEn:
              "Includes API suites for input invoices, output invoices, tax filing, IIT filing, export rebate, and data services.",
          },
          {
            titleZh: "标准化接入规范",
            titleEn: "Standardized Integration",
            descriptionZh: "按业务域提供统一鉴权、请求规范、回调结构和错误码，降低合作方接入难度。",
            descriptionEn:
              "Provides unified authentication, request standards, callbacks, and error conventions for partners.",
          },
          {
            titleZh: "持续扩展能力",
            titleEn: "Continuous Expansion",
            descriptionZh: "支持围绕合作生态逐步扩展新接口、新任务和新业务域，适合平台化演进。",
            descriptionEn:
              "Supports continuous expansion of new APIs, tasks, and domains for ecosystem platform evolution.",
          },
        ],
      },
      {
        sectionType: "operation",
        titleZh: "平台化运营支撑",
        titleEn: "Platform Operations Support",
        descriptionZh: "在开放能力之外，提供任务、监控、回调和统计能力，支撑稳定运营。",
        descriptionEn:
          "Adds tasks, monitoring, callbacks, and metrics on top of APIs to support stable operations.",
        items: [
          {
            titleZh: "任务追踪",
            titleEn: "Task Tracking",
            descriptionZh: "支持异步任务发起、状态追踪、结果拉取和异常重试，适配长链路业务调用。",
            descriptionEn:
              "Supports async task launch, status tracking, result retrieval, and retries for long-running flows.",
          },
          {
            titleZh: "结果回调",
            titleEn: "Result Callback",
            descriptionZh: "支持回调通知与结果订阅，便于合作平台形成自动化闭环处理。",
            descriptionEn:
              "Supports callbacks and result subscription for automated partner-side workflows.",
          },
          {
            titleZh: "监控统计",
            titleEn: "Monitoring and Metrics",
            descriptionZh: "提供调用量、成功率、错误分布和通道状态统计，满足平台运营与SLA管理。",
            descriptionEn:
              "Provides usage, success rate, error distribution, and channel status metrics for SLA management.",
          },
        ],
      },
    ],
  },
};

async function seedUsers() {
  const adminPassword = await hashPassword("Admin@12345");
  const editorPassword = await hashPassword("Editor@12345");

  await prisma.user.upsert({
    where: { email: "admin@sztaxs.com" },
    update: {
      name: "系统管理员",
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
    },
    create: {
      name: "系统管理员",
      email: "admin@sztaxs.com",
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@sztaxs.com" },
    update: {
      name: "内容编辑",
      role: UserRole.EDITOR,
      passwordHash: editorPassword,
    },
    create: {
      name: "内容编辑",
      email: "editor@sztaxs.com",
      role: UserRole.EDITOR,
      passwordHash: editorPassword,
    },
  });
}

async function seedSite() {
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {
      companyNameZh: "苏州泰可思数据科技有限公司",
      companyNameEn: "Suzhou Taxs Data Technology Co., Ltd.",
      phone: "(0512)62880577",
      fax: "(0512)62880577",
      email: "service@sztaxs.com",
      addressZh: "江苏省苏州市工业园区圆融大厦1709（圆融街）",
      addressEn: "Room 1709, Yuanrong Building, SIP, Suzhou, Jiangsu, China",
      icpRecord: "苏ICP备18061422号-1",
      copyrightZh: "版权所有 苏州泰可思数据科技有限公司",
      copyrightEn: "Copyright © Suzhou Taxs Data Technology Co., Ltd.",
      homeHeroTitleZh: "企业税务数字一体化管理平台",
      homeHeroTitleEn: "Enterprise Digital Tax Integration Platform",
      homeHeroSubtitleZh:
        "基于生成式低代码底座与乐企+API双通道能力，覆盖票、税、财、档全流程场景。",
      homeHeroSubtitleEn:
        "Built on a generative low-code foundation and dual-channel Leqi+API capabilities for end-to-end invoice, tax, finance, and archive operations.",
      homeHeroImageUrl:
        "/uploads/certs/taxs-high-tech-cert-2023-blue.png,/uploads/certs/taxs-software-enterprise-cert-2024-blue.png,/uploads/certs/taxs-high-tech-cert.png",
      homeProductSectionTitleZh: "财税服务产品与能力全景",
      homeProductSectionTitleEn: "Main Products",
      homeProductSectionSubtitleZh: null,
      homeProductSectionSubtitleEn: null,
      homeSolutionSectionTitleZh: "解决方案缩略展示",
      homeSolutionSectionTitleEn: "Solution Preview",
      homeSolutionSectionSubtitleZh: "聚焦典型行业场景的方案概要",
      homeSolutionSectionSubtitleEn: "Snapshot of industry-focused solution tracks",
      homeProductImage1: "/uploads/ppt2025/image140.png",
      homeProductImage2: "/uploads/ppt2025/image141.png",
      homeProductImage3: "/uploads/ppt2025/image142.png",
      homeProductImage4: "/uploads/ppt2025/image146.png",
      homeSolutionImage1: "/uploads/ppt2025/image148.png",
      homeSolutionImage2: "/uploads/ppt2025/image569.png",
      homeSolutionImage3: "/uploads/ppt2025/image220.png",
      homeAboutTitleZh: "懂业务的财税科技团队",
      homeAboutTitleEn: "A Tax-Tech Team with Deep Domain Expertise",
      homeAboutContentZh:
        "泰可思成立于2018年，核心成员深耕财税行业二十余年，具备双软、高新、等保三级等资质，累计31项软件著作权。",
      homeAboutContentEn:
        "Founded in 2018, Taxs is led by a team with over 20 years in tax technology and holds major certifications including dual-software enterprise, high-tech enterprise, MLPS Level 3, and 31 software copyrights.",
      homeContactTitleZh: "联系我们",
      homeContactTitleEn: "Contact Us",
      footerBuilderZh: "网站建设：苏州泰可思数据科技有限公司",
      footerBuilderEn: "Website Powered by Suzhou Taxs Data Technology Co., Ltd.",
      translationStatus: TranslationStatus.REVIEWED,
    },
    create: {
      id: 1,
      companyNameZh: "苏州泰可思数据科技有限公司",
      companyNameEn: "Suzhou Taxs Data Technology Co., Ltd.",
      phone: "(0512)62880577",
      fax: "(0512)62880577",
      email: "service@sztaxs.com",
      addressZh: "江苏省苏州市工业园区圆融大厦1709（圆融街）",
      addressEn: "Room 1709, Yuanrong Building, SIP, Suzhou, Jiangsu, China",
      icpRecord: "苏ICP备18061422号-1",
      copyrightZh: "版权所有 苏州泰可思数据科技有限公司",
      copyrightEn: "Copyright © Suzhou Taxs Data Technology Co., Ltd.",
      homeHeroTitleZh: "企业税务数字一体化管理平台",
      homeHeroTitleEn: "Enterprise Digital Tax Integration Platform",
      homeHeroSubtitleZh:
        "基于生成式低代码底座与乐企+API双通道能力，覆盖票、税、财、档全流程场景。",
      homeHeroSubtitleEn:
        "Built on a generative low-code foundation and dual-channel Leqi+API capabilities for end-to-end invoice, tax, finance, and archive operations.",
      homeHeroImageUrl:
        "/uploads/certs/taxs-high-tech-cert-2023-blue.png,/uploads/certs/taxs-software-enterprise-cert-2024-blue.png,/uploads/certs/taxs-high-tech-cert.png",
      homeProductSectionTitleZh: "财税服务产品与能力全景",
      homeProductSectionTitleEn: "Main Products",
      homeProductSectionSubtitleZh: null,
      homeProductSectionSubtitleEn: null,
      homeSolutionSectionTitleZh: "解决方案缩略展示",
      homeSolutionSectionTitleEn: "Solution Preview",
      homeSolutionSectionSubtitleZh: "聚焦典型行业场景的方案概要",
      homeSolutionSectionSubtitleEn: "Snapshot of industry-focused solution tracks",
      homeProductImage1: "/uploads/ppt2025/image140.png",
      homeProductImage2: "/uploads/ppt2025/image141.png",
      homeProductImage3: "/uploads/ppt2025/image142.png",
      homeProductImage4: "/uploads/ppt2025/image146.png",
      homeSolutionImage1: "/uploads/ppt2025/image148.png",
      homeSolutionImage2: "/uploads/ppt2025/image569.png",
      homeSolutionImage3: "/uploads/ppt2025/image220.png",
      homeAboutTitleZh: "懂业务的财税科技团队",
      homeAboutTitleEn: "A Tax-Tech Team with Deep Domain Expertise",
      homeAboutContentZh:
        "泰可思成立于2018年，核心成员深耕财税行业二十余年，具备双软、高新、等保三级等资质，累计31项软件著作权。",
      homeAboutContentEn:
        "Founded in 2018, Taxs is led by a team with over 20 years in tax technology and holds major certifications including dual-software enterprise, high-tech enterprise, MLPS Level 3, and 31 software copyrights.",
      homeContactTitleZh: "联系我们",
      homeContactTitleEn: "Contact Us",
      footerBuilderZh: "网站建设：苏州泰可思数据科技有限公司",
      footerBuilderEn: "Website Powered by Suzhou Taxs Data Technology Co., Ltd.",
      translationStatus: TranslationStatus.REVIEWED,
    },
  });
}

async function seedMenus() {
  const menus = [
    { menuKey: "home", labelZh: "网站首页", labelEn: "Home", path: "/", sortOrder: 1 },
    {
      menuKey: "products",
      labelZh: "产品中心",
      labelEn: "Products",
      path: "/products",
      sortOrder: 2,
    },
    {
      menuKey: "solutions",
      labelZh: "解决方案",
      labelEn: "Solutions",
      path: "/solutions",
      sortOrder: 3,
    },
    {
      menuKey: "news",
      labelZh: "新闻动态",
      labelEn: "News",
      path: "/news",
      sortOrder: 4,
    },
    {
      menuKey: "about",
      labelZh: "关于我们",
      labelEn: "About",
      path: "/about",
      sortOrder: 5,
    },
    {
      menuKey: "contact",
      labelZh: "联系我们",
      labelEn: "Contact",
      path: "/contact",
      sortOrder: 6,
    },
  ];

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { menuKey: menu.menuKey },
      update: { ...menu, visible: true },
      create: { ...menu, visible: true },
    });
  }
}

async function seedPages() {
  await prisma.page.upsert({
    where: { slug: "about" },
    update: {
      pageKey: "about",
      titleZh: "关于泰可思",
      titleEn: "About Taxs",
      summaryZh: "以企业税务数字一体化为核心，持续构建可配置、可扩展的财税平台能力。",
      summaryEn:
        "Focused on enterprise tax integration with configurable and extensible digital platforms.",
      contentZh:
        "泰可思成立于2018年8月，核心团队来自航信、百旺、用友等财税与互联网企业，深耕财税行业二十余年。\n\n公司围绕“票税财档资”构建产品矩阵，覆盖云票通、全票通、乐企接入、纳税申报、个税申报、税务风险、电子会计档案、出口退税与数据服务平台。\n\n公司已获得双软企业、高新技术企业、等保三级等认证，累计31项软件著作权，并服务全国200+城市政务及产业客户。",
      contentEn:
        "Founded in August 2018, Taxs is led by experts from leading tax-tech and internet companies, with over two decades of industry experience.\n\nOur portfolio spans invoice-tax-finance-archive integration, including YPT platform, FullTicket, Leqi access, tax filing, IIT filing, tax risk control, e-accounting archives, export tax rebate, and data services.\n\nTaxs holds key certifications such as dual-software enterprise, national high-tech enterprise, and MLPS Level 3, with 31 software copyrights and delivery experience across 200+ cities.",
      publishStatus: PublishStatus.PUBLISHED,
      translationStatus: TranslationStatus.REVIEWED,
    },
    create: {
      pageKey: "about",
      slug: "about",
      titleZh: "关于泰可思",
      titleEn: "About Taxs",
      summaryZh: "以企业税务数字一体化为核心，持续构建可配置、可扩展的财税平台能力。",
      summaryEn:
        "Focused on enterprise tax integration with configurable and extensible digital platforms.",
      contentZh:
        "泰可思成立于2018年8月，核心团队来自航信、百旺、用友等财税与互联网企业，深耕财税行业二十余年。\n\n公司围绕“票税财档资”构建产品矩阵，覆盖云票通、全票通、乐企接入、纳税申报、个税申报、税务风险、电子会计档案、出口退税与数据服务平台。\n\n公司已获得双软企业、高新技术企业、等保三级等认证，累计31项软件著作权，并服务全国200+城市政务及产业客户。",
      contentEn:
        "Founded in August 2018, Taxs is led by experts from leading tax-tech and internet companies, with over two decades of industry experience.\n\nOur portfolio spans invoice-tax-finance-archive integration, including YPT platform, FullTicket, Leqi access, tax filing, IIT filing, tax risk control, e-accounting archives, export tax rebate, and data services.\n\nTaxs holds key certifications such as dual-software enterprise, national high-tech enterprise, and MLPS Level 3, with 31 software copyrights and delivery experience across 200+ cities.",
      publishStatus: PublishStatus.PUBLISHED,
      translationStatus: TranslationStatus.REVIEWED,
    },
  });

  await prisma.page.upsert({
    where: { slug: "contact" },
    update: {
      pageKey: "contact",
      titleZh: "联系我们",
      titleEn: "Contact Us",
      summaryZh: "欢迎联系泰可思，获取产品演示、项目咨询与生态合作支持。",
      summaryEn: "Contact Taxs for product demos, project consultation, and ecosystem collaboration.",
      contentZh:
        "服务热线：(0512)62880577\n邮箱：service@sztaxs.com\n地址：江苏省苏州市工业园区圆融大厦1709（圆融街）\n\n服务范围：\n1. 企业税务数字一体化平台咨询\n2. 乐企接入与申报能力建设\n3. 电子会计档案与出口退税解决方案",
      contentEn:
        "Hotline: (0512)62880577\nEmail: service@sztaxs.com\nAddress: Room 1709, Yuanrong Building, SIP, Suzhou, Jiangsu, China\n\nService Scope:\n1. Enterprise tax digital integration consulting\n2. Leqi access and filing capability enablement\n3. E-accounting archive and export tax rebate solutions",
      publishStatus: PublishStatus.PUBLISHED,
      translationStatus: TranslationStatus.REVIEWED,
    },
    create: {
      pageKey: "contact",
      slug: "contact",
      titleZh: "联系我们",
      titleEn: "Contact Us",
      summaryZh: "欢迎联系泰可思，获取产品演示、项目咨询与生态合作支持。",
      summaryEn: "Contact Taxs for product demos, project consultation, and ecosystem collaboration.",
      contentZh:
        "服务热线：(0512)62880577\n邮箱：service@sztaxs.com\n地址：江苏省苏州市工业园区圆融大厦1709（圆融街）\n\n服务范围：\n1. 企业税务数字一体化平台咨询\n2. 乐企接入与申报能力建设\n3. 电子会计档案与出口退税解决方案",
      contentEn:
        "Hotline: (0512)62880577\nEmail: service@sztaxs.com\nAddress: Room 1709, Yuanrong Building, SIP, Suzhou, Jiangsu, China\n\nService Scope:\n1. Enterprise tax digital integration consulting\n2. Leqi access and filing capability enablement\n3. E-accounting archive and export tax rebate solutions",
      publishStatus: PublishStatus.PUBLISHED,
      translationStatus: TranslationStatus.REVIEWED,
    },
  });
}

async function upsertProductWithSections(categoryId: string, sortOrder: number, product: ProductSeed) {
  const seed = PRODUCT_OVERRIDES[product.slug] ?? product;
  const fallbackGallery = seed.galleryImages ?? PRODUCT_GALLERY_FALLBACKS[seed.slug] ?? [];
  const bannerUrl = seed.bannerUrl ?? fallbackGallery[0] ?? null;
  const record = await prisma.product.upsert({
    where: { slug: seed.slug },
    update: {
      categoryId,
      nameZh: seed.nameZh,
      nameEn: seed.nameEn,
      summaryZh: seed.summaryZh,
      summaryEn: seed.summaryEn,
      bannerUrl,
      galleryImages: fallbackGallery.length > 0 ? fallbackGallery : [],
      sortOrder,
      publishStatus: PublishStatus.PUBLISHED,
      translationStatus: TranslationStatus.REVIEWED,
    },
    create: {
      categoryId,
      slug: seed.slug,
      nameZh: seed.nameZh,
      nameEn: seed.nameEn,
      summaryZh: seed.summaryZh,
      summaryEn: seed.summaryEn,
      bannerUrl,
      galleryImages: fallbackGallery.length > 0 ? fallbackGallery : [],
      sortOrder,
      publishStatus: PublishStatus.PUBLISHED,
      translationStatus: TranslationStatus.REVIEWED,
    },
  });

  await prisma.productSectionItem.deleteMany({
    where: { section: { productId: record.id } },
  });
  await prisma.productSection.deleteMany({ where: { productId: record.id } });

  for (let i = 0; i < seed.sections.length; i += 1) {
    const section = seed.sections[i];
    const createdSection = await prisma.productSection.create({
      data: {
        productId: record.id,
        sectionType: section.sectionType,
        titleZh: section.titleZh,
        titleEn: section.titleEn,
        descriptionZh: section.descriptionZh,
        descriptionEn: section.descriptionEn,
        imageUrl: section.imageUrl ?? fallbackGallery[i + 1] ?? fallbackGallery[i] ?? null,
        sortOrder: i,
        translationStatus: TranslationStatus.REVIEWED,
      },
    });

    if (section.items.length > 0) {
      await prisma.productSectionItem.createMany({
        data: section.items.map((item, index) => ({
          sectionId: createdSection.id,
          titleZh: item.titleZh ?? null,
          titleEn: item.titleEn ?? null,
          descriptionZh: item.descriptionZh,
          descriptionEn: item.descriptionEn,
          iconUrl: item.iconUrl ?? null,
          sortOrder: index,
          translationStatus: TranslationStatus.REVIEWED,
        })),
      });
    }
  }
}

async function seedProducts() {
  await prisma.productCategory.deleteMany();

  const categories = [
    {
      slug: "tax-integration-core",
      nameZh: "企业税务一体化核心平台",
      nameEn: "Enterprise Tax Integration Core",
      descriptionZh: "围绕“票税财档资”协同构建可配置、可扩展的数字化底座。",
      descriptionEn:
        "A configurable and extensible digital foundation for integrated invoice-tax-finance-archive workflows.",
      products: [
        {
          slug: "yunpiaotong-foundation",
          nameZh: "云票通平台（生成式低代码底座）",
          nameEn: "YPT Platform (Generative Low-code Foundation)",
          summaryZh: "以微服务+微前端架构支撑企业快速搭建税务应用，实现低代码生成式开发。",
          summaryEn:
            "A microservice and micro-frontend architecture enabling rapid tax application delivery with generative low-code development.",
          sections: [
            {
              sectionType: "capability",
              titleZh: "底座能力",
              titleEn: "Foundation Capabilities",
              descriptionZh: "提供逻辑编排、报表配置、接口维护、看板与表单设计”能力集。",
              descriptionEn:
                "Aligned with PPT capabilities including logic orchestration, report configuration, API maintenance, dashboards, and form design.",
              items: [
                {
                  descriptionZh: "通过可视化配置快速完成数据模型、流程编排、规则发布与页面装配。",
                  descriptionEn:
                    "Build data models, process orchestration, rule release, and page assembly through visual configuration.",
                },
                {
                  descriptionZh: "支持云端与本地混合开发模式，便于集团化企业分层建设和持续迭代。",
                  descriptionEn:
                    "Supports hybrid cloud and on-prem development to fit layered group deployment and continuous iteration.",
                },
              ],
            },
            {
              sectionType: "advantage",
              titleZh: "技术亮点",
              titleEn: "Technical Highlights",
              descriptionZh: "聚焦快速开发、应用复用和运维可持续性。",
              descriptionEn: "Focused on rapid delivery, reusable assets, and long-term maintainability.",
              items: [
                {
                  descriptionZh: "提供列表引擎、表单引擎、智能报表与智能助手，缩短业务上线周期。",
                  descriptionEn:
                    "Includes list engine, form engine, smart reporting, and assistant capabilities to shorten go-live cycles.",
                },
                {
                  descriptionZh: "支持原子能力市场化复用，提升跨项目的交付一致性与质量。",
                  descriptionEn:
                    "Enables reusable atomic capabilities across projects to improve delivery consistency and quality.",
                },
              ],
            },
          ],
        },
        {
          slug: "supply-chain-invoice-collaboration",
          nameZh: "供应链票据协同与进销项管理",
          nameEn: "Supply Chain Invoice Collaboration",
          summaryZh: "覆盖销项开票、进项归集、查验认证与票单匹配，打通业财票协同链路。",
          summaryEn:
            "Covers output invoicing, input aggregation, validation, and invoice-order matching for end-to-end collaboration.",
          sections: [
            {
              sectionType: "workflow",
              titleZh: "业务流程",
              titleEn: "Business Workflow",
              descriptionZh: "支持开票申请、规则校验、自动开票、回写与交付全流程自动化。",
              descriptionEn:
                "Supports end-to-end automation from invoice request and validation to issuance, callback, and delivery.",
              items: [
                {
                  descriptionZh: "支持无订单、预开票、订单直连等多场景开票，并兼容纸电票与数电票。",
                  descriptionEn:
                    "Supports no-order, pre-invoice, and order-connected invoicing across both traditional and digital invoices.",
                },
                {
                  descriptionZh: "支持邮件、二维码、短信等多渠道发票交付与状态追踪。",
                  descriptionEn:
                    "Provides multi-channel invoice delivery via email, QR code, and SMS with status tracking.",
                },
              ],
            },
            {
              sectionType: "control",
              titleZh: "合规管控",
              titleEn: "Compliance Control",
              descriptionZh: "通过规则前置与数据核验降低虚开、错开、重复开票风险。",
              descriptionEn: "Reduce fraudulent, incorrect, and duplicate invoicing risks through pre-rules and data checks.",
              items: [
                {
                  descriptionZh: "提供发票真伪查验、重复票识别、敏感词与黑名单校验能力。",
                  descriptionEn:
                    "Includes authenticity checks, duplicate detection, sensitive-word filters, and blacklist validation.",
                },
                {
                  descriptionZh: "支持乐企直连与非乐企RPA双通道无感切换，保障高峰期连续开票。",
                  descriptionEn:
                    "Supports seamless switching between Leqi direct access and non-Leqi RPA channels for peak stability.",
                },
              ],
            },
          ],
        },
        {
          slug: "tax-risk-governance",
          nameZh: "税务风险管理",
          nameEn: "Tax Risk Governance",
          summaryZh: "构建“识别-预警-处置-复盘”闭环，支撑集团化风险防范与治理。",
          summaryEn:
            "Builds a closed loop of detect-alert-resolve-review for enterprise-level tax risk governance.",
          sections: [
            {
              sectionType: "risk",
              titleZh: "风险识别体系",
              titleEn: "Risk Identification Framework",
              descriptionZh: "以规则+模型双引擎识别涉税异常，支持多组织分层管理。",
              descriptionEn:
                "Uses rule and model dual engines to detect tax anomalies with multi-entity layered governance.",
              items: [
                {
                  descriptionZh: "支持400+风险指标模型扩展，可配置阈值、触发逻辑与责任归属。",
                  descriptionEn:
                    "Extensible with 400+ risk indicators and configurable thresholds, triggers, and ownership.",
                },
                {
                  descriptionZh: "自动输出风险报告与整改清单，推动风险事项闭环跟踪。",
                  descriptionEn:
                    "Automatically generates risk reports and remediation lists for closed-loop tracking.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "leqi-and-filing",
      nameZh: "乐企接入与申报平台",
      nameEn: "Leqi Access and Filing Platform",
      descriptionZh: "打通乐企能力接入、全税种申报与个税申报，形成统一税务作业中台。",
      descriptionEn:
        "Unifies Leqi access, full-tax filing, and IIT filing into a standardized enterprise tax operation hub.",
      products: [
        {
          slug: "leqi-access-platform",
          nameZh: "乐企一站式接入服务平台",
          nameEn: "One-stop Leqi Access Platform",
          summaryZh: "兼容原有税控接口，快速完成企业系统到乐企平台的能力接入与升级托管。",
          summaryEn:
            "Compatible with existing tax-control interfaces to accelerate enterprise integration with the Leqi platform.",
          sections: [
            {
              sectionType: "integration",
              titleZh: "接入能力",
              titleEn: "Integration Capabilities",
              descriptionZh: "提供7大能力43项业务功能对接”与接口封装能力。",
              descriptionEn:
                "Aligned with PPT capabilities on integrating seven major capability groups and 43 business functions.",
              items: [
                {
                  descriptionZh: "屏蔽乐企数据、接口与规则变动影响，降低业务系统改造成本。",
                  descriptionEn:
                    "Shields business systems from Leqi data, API, and rule changes to reduce maintenance costs.",
                },
                {
                  descriptionZh: "支持托管部署、本地化部署及镜像化交付，适配不同IT治理要求。",
                  descriptionEn:
                    "Supports managed cloud, on-prem, and image-based deployment for diverse IT governance requirements.",
                },
              ],
            },
            {
              sectionType: "operation",
              titleZh: "运维与升级",
              titleEn: "Operations and Upgrades",
              descriptionZh: "通过脚本化可编程能力和模拟测试环境实现快速迭代。",
              descriptionEn:
                "Enables rapid evolution via scriptable extensions and sandbox simulation environments.",
              items: [
                {
                  descriptionZh: "提供接口请求与响应追踪、企业接入管理、发票池统一管理能力。",
                  descriptionEn:
                    "Provides request/response tracing, tenant access management, and unified invoice pool operations.",
                },
                {
                  descriptionZh: "实时同步税局升级变更，支持向前向后兼容与无感升级。",
                  descriptionEn:
                    "Synchronizes tax authority changes in real time with backward and forward compatible upgrades.",
                },
              ],
            },
          ],
        },
        {
          slug: "smart-tax-filing",
          nameZh: "智能纳税申报管理平台",
          nameEn: "Smart Tax Filing Platform",
          summaryZh: "实现自动取数、自动算税、申报表生成、一键申报、缴款与凭证归集。",
          summaryEn:
            "Delivers automated data collection, tax calculation, return generation, one-click filing, payment, and voucher collection.",
          sections: [
            {
              sectionType: "filing",
              titleZh: "全流程申报",
              titleEn: "End-to-end Filing",
              descriptionZh: "覆盖“取数-算税-校验-申报-缴款-归档”全生命周期。",
              descriptionEn:
                "Covers the full lifecycle from data collection and tax calculation to filing, payment, and archiving.",
              items: [
                {
                  descriptionZh: "支持全国36税区直连申报，兼容乐企申报与各电子税局接口能力。",
                  descriptionEn:
                    "Supports direct filing in 36 tax regions and is compatible with both Leqi and e-tax bureau interfaces.",
                },
                {
                  descriptionZh: "支持18个实体税种及10+附加税费种，自动匹配地区差异化规则。",
                  descriptionEn:
                    "Supports 18 major tax types and 10+ surcharges with automatic adaptation to regional filing rules.",
                },
              ],
            },
            {
              sectionType: "efficiency",
              titleZh: "申报效率",
              titleEn: "Filing Efficiency",
              descriptionZh: "通过批量化与标准化 API 通道大幅提升作业时效与准确率。",
              descriptionEn:
                "Improves speed and accuracy through batch workflows and standardized API channels.",
              items: [
                {
                  descriptionZh: "支持当期/往期申报数据获取、申报表下载与完税凭证归档。",
                  descriptionEn:
                    "Supports current/historical filing retrieval, return downloads, and tax voucher archiving.",
                },
                {
                  descriptionZh: "支持申报截止提醒、风险预警与异常提示，保障申报合规。",
                  descriptionEn:
                    "Provides filing deadline reminders, risk alerts, and anomaly hints for compliance assurance.",
                },
              ],
            },
          ],
        },
        {
          slug: "individual-income-tax-platform",
          nameZh: "个税申报管理平台",
          nameEn: "Individual Income Tax Filing Platform",
          summaryZh: "打通人员信息、工资数据与局端申报通道，实现个税智能计算与一键申报。",
          summaryEn:
            "Connects personnel, payroll, and authority channels for intelligent IIT calculation and one-click filing.",
          sections: [
            {
              sectionType: "iit",
              titleZh: "个税模块亮点",
              titleEn: "IIT Highlights",
              descriptionZh: "支持多所得项目自动汇总、算税与缴款联动。",
              descriptionEn: "Supports multi-income aggregation, automatic IIT calculation, and payment linkage.",
              items: [
                {
                  descriptionZh: "个性化工资表无需改造即可自动映射，减少人工填报操作。",
                  descriptionEn:
                    "Personalized payroll formats can be auto-mapped without template reconstruction.",
                },
                {
                  descriptionZh: "专项附加扣除动态同步，支持批量申报与缴款任务闭环处理。",
                  descriptionEn:
                    "Synchronizes special deduction updates and supports batch filing with closed-loop payment tasks.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "specialized-business-modules",
      nameZh: "专项业务平台",
      nameEn: "Specialized Business Modules",
      descriptionZh: "聚焦电子会计档案、出口退税与海外税务合规等高复杂财税场景，提供专项治理能力。",
      descriptionEn:
        "Focused modules for high-complexity tax scenarios including e-accounting archives, export tax rebates, and overseas tax compliance.",
      products: [
        {
          slug: "electronic-accounting-archive",
          nameZh: "电子会计档案管理平台",
          nameEn: "Electronic Accounting Archive Platform",
          summaryZh: "围绕采集、整理、保管、利用、检索、统计全链路构建纸电一体档案体系。",
          summaryEn:
            "Builds a paper-digital integrated archive lifecycle from collection and arrangement to storage, usage, search, and analytics.",
          sections: [
            {
              sectionType: "compliance",
              titleZh: "政策与合规",
              titleEn: "Policy and Compliance",
              descriptionZh: "对齐财政部、税务总局及档案局电子会计凭证管理要求。",
              descriptionEn: "Aligns with national archive and e-voucher compliance requirements.",
              items: [
                {
                  descriptionZh: "支持电子凭证归集、四性检测、立卷归档与借阅审批闭环管理。",
                  descriptionEn:
                    "Supports e-voucher aggregation, four-quality checks, filing, and controlled borrowing workflows.",
                },
                {
                  descriptionZh: "通过全文检索与OCR识别提升档案检索效率，支持千毫秒级检索体验。",
                  descriptionEn:
                    "Provides OCR-enhanced full-text search for fast archive retrieval at sub-second-level experience.",
                },
              ],
            },
            {
              sectionType: "security",
              titleZh: "安全与权限",
              titleEn: "Security and Permissions",
              descriptionZh: "支持密级管理、字段权限、数据权限与水印脱敏控制。",
              descriptionEn:
                "Supports classified security levels, field/data permissions, and watermark/desensitization controls.",
              items: [
                {
                  descriptionZh: "支持集团统一档案出口与多级组织权限治理，满足审计与监管要求。",
                  descriptionEn:
                    "Supports group-level archive governance with multi-tier permissions for audit and regulation needs.",
                },
              ],
            },
          ],
        },
        {
          slug: "export-tax-rebate-platform",
          nameZh: "出口退税管理平台",
          nameEn: "Export Tax Rebate Platform",
          summaryZh: "集关务、票管、退税申报与风险防控于一体，支持出口退税端到端协同。",
          summaryEn:
            "An integrated platform for customs, invoicing, rebate filing, and risk control across the export rebate lifecycle.",
          sections: [
            {
              sectionType: "process",
              titleZh: "端到端流程",
              titleEn: "End-to-end Process",
              descriptionZh: "覆盖关单与收入核销、收汇核销、模拟申报、正式申报与备案管理。",
              descriptionEn:
                "Covers declaration-income reconciliation, receipt reconciliation, simulation filing, formal filing, and documentation.",
              items: [
                {
                  descriptionZh: "支持报关单、发票、收汇、收入等多源数据自动采集与关联核对。",
                  descriptionEn:
                    "Supports automated ingestion and reconciliation of declarations, invoices, receipts, and revenue data.",
                },
                {
                  descriptionZh: "支持申报底稿生成、疑点处理与单证归档，提升退税申报效率与准确性。",
                  descriptionEn:
                    "Supports draft preparation, issue handling, and document archiving to improve rebate efficiency and accuracy.",
                },
              ],
            },
          ],
        },
        {
          slug: "full-ticket-pass",
          nameZh: "全票通（电商开票）",
          nameEn: "FullTicket (E-commerce Invoicing)",
          summaryZh: "面向多平台多店铺电商场景，提供订单同步、自动开票、回传与交付能力。",
          summaryEn:
            "Designed for multi-platform e-commerce with order sync, automated invoicing, callback, and delivery.",
          sections: [
            {
              sectionType: "scenario",
              titleZh: "典型场景",
              titleEn: "Typical Scenarios",
              descriptionZh: "适配天猫、京东等平台，解决促销高峰期间的开票压力与人工错误。",
              descriptionEn:
                "Fits platforms like Tmall and JD to handle peak promotion invoicing loads with fewer manual errors.",
              items: [
                {
                  descriptionZh: "多店铺统一管理，批量开票与自动回传，提升财务作业效率。",
                  descriptionEn:
                    "Unifies multi-store operations with batch invoicing and automatic callbacks for finance efficiency.",
                },
                {
                  descriptionZh: "支持支付即开票、联用开票等创新业务模式，扩展业务场景能力。",
                  descriptionEn:
                    "Supports payment-triggered and joint-use invoicing models to extend business scenarios.",
                },
              ],
            },
          ],
        },
        {
          slug: "global-tax-intelligence-platform",
          nameZh: "海外全球税务数智化平台",
          nameEn: "Global Tax Intelligence Platform",
          summaryZh: "面向跨国与出海企业，提供全球间接税、直接税与政策知识库一体化能力。",
          summaryEn:
            "An integrated platform for multinational businesses covering global indirect tax, direct tax, and policy intelligence.",
          sections: [
            {
              sectionType: "indirect-tax",
              titleZh: "全球间接税与电票管理",
              titleEn: "Global Indirect Tax and E-invoice",
              descriptionZh: "覆盖跨境开票、智能计税、汇率换算、AI识别与票据归档。",
              descriptionEn:
                "Covers cross-border invoicing, intelligent tax calculation, FX conversion, AI extraction, and archiving.",
              items: [
                {
                  descriptionZh: "支持多国家/地区开票规则适配与跨境电票流转。",
                  descriptionEn:
                    "Supports multi-jurisdiction invoicing rules and cross-border e-invoice circulation.",
                },
              ],
            },
            {
              sectionType: "direct-tax",
              titleZh: "全球直接税合规与核算",
              titleEn: "Global Direct Tax Compliance",
              descriptionZh: "围绕企业所得税、预提税、税收协定与专项风险构建自动化作业闭环。",
              descriptionEn:
                "Builds an automated workflow for CIT, withholding tax, treaty application, and special tax risks.",
              items: [
                {
                  descriptionZh: "支持税基核算、申报底稿生成、申报流转与审计留痕。",
                  descriptionEn:
                    "Supports tax-base calculation, filing drafts, workflow routing, and audit traceability.",
                },
              ],
            },
            {
              sectionType: "knowledge-base",
              titleZh: "全球财税知识库",
              titleEn: "Global Tax Knowledge Base",
              descriptionZh: "通过自动采集、多语言检索与新政推送支撑全球政策响应。",
              descriptionEn:
                "Supports global policy response through automated collection, multilingual search, and policy alerts.",
              items: [
                {
                  descriptionZh: "支持全球政策分钟级感知与主动风控提示。",
                  descriptionEn:
                    "Enables minute-level policy awareness and proactive risk notifications.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "data-services-and-ecosystem",
      nameZh: "数据服务与生态接口",
      nameEn: "Data Services and Ecosystem APIs",
      descriptionZh: "向金融、银行、征信与产业平台提供业财税票多维数据与标准化接口能力。",
      descriptionEn:
        "Provides multi-dimensional business-finance-tax-invoice data and standardized APIs for financial ecosystems.",
      products: [
        {
          slug: "tax-data-service-platform",
          nameZh: "数据服务平台",
          nameEn: "Tax Data Service Platform",
          summaryZh: "提供发票、申报、财务、工商等多源数据服务，支撑贷前贷中贷后风控场景。",
          summaryEn:
            "Delivers invoice, filing, financial, and enterprise data services for pre-loan, in-loan, and post-loan risk scenarios.",
          sections: [
            {
              sectionType: "data",
              titleZh: "数据能力",
              titleEn: "Data Capabilities",
              descriptionZh: "支持平台、插件、接口等多形态交付，满足多角色数据消费需求。",
              descriptionEn:
                "Supports platform, plugin, and API delivery forms for diversified data consumption roles.",
              items: [
                {
                  descriptionZh: "支持企业基础信息、进销项发票、财务报表、申报历史等数据查询与下载。",
                  descriptionEn:
                    "Supports querying and exporting enterprise profiles, input/output invoices, financial statements, and filing history.",
                },
                {
                  descriptionZh: "可按任务编排数据采集与回传，适配银行、征信、园区监管等业务。",
                  descriptionEn:
                    "Enables task-based data collection and callback to support banking, credit, and regulatory use cases.",
                },
              ],
            },
            {
              sectionType: "channel",
              titleZh: "通道与对接",
              titleEn: "Channels and Integration",
              descriptionZh: "覆盖电子税局接口、RPA通道与乐企联动，提升数据获取稳定性。",
              descriptionEn:
                "Combines e-tax APIs, RPA channels, and Leqi integration for stable and scalable data acquisition.",
              items: [
                {
                  descriptionZh: "提供36个省市电子税局申报服务通道，并支持个税与退税相关接口能力。",
                  descriptionEn:
                    "Provides filing channels across 36 regions and supports IIT and export rebate interface services.",
                },
              ],
            },
          ],
        },
        {
          slug: "open-api-ecosystem",
          nameZh: "开放生态接口中心",
          nameEn: "Open API Ecosystem Hub",
          summaryZh: "统一开放进项、销项、申报、个税、出口退税与数据服务接口，支撑生态联动。",
          summaryEn:
            "Provides unified open APIs for input/output invoices, filing, IIT, export rebate, and data services.",
          sections: [
            {
              sectionType: "api",
              titleZh: "开放能力目录",
              titleEn: "Open Capability Catalog",
              descriptionZh: "按业务域提供标准化 API，便于合作方快速接入和持续扩展。",
              descriptionEn:
                "Standardized business-domain APIs for rapid partner integration and continuous expansion.",
              items: [
                {
                  descriptionZh: "提供《进项发票》《销项发票》《纳税申报》《个税申报》《出口退税》《数据服务》接口体系。",
                  descriptionEn:
                    "Includes API suites for input invoices, output invoices, tax filing, IIT filing, export rebate, and data services.",
                },
                {
                  descriptionZh: "支持鉴权、任务追踪、结果回调与监控统计，满足平台化运营需求。",
                  descriptionEn:
                    "Supports authentication, task tracking, result callbacks, and monitoring metrics for platform operations.",
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  for (let i = 0; i < categories.length; i += 1) {
    const category = categories[i];
    const categoryRecord = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {
        nameZh: category.nameZh,
        nameEn: category.nameEn,
        descriptionZh: category.descriptionZh,
        descriptionEn: category.descriptionEn,
        sortOrder: i,
        publishStatus: PublishStatus.PUBLISHED,
        translationStatus: TranslationStatus.REVIEWED,
      },
      create: {
        slug: category.slug,
        nameZh: category.nameZh,
        nameEn: category.nameEn,
        descriptionZh: category.descriptionZh,
        descriptionEn: category.descriptionEn,
        sortOrder: i,
        publishStatus: PublishStatus.PUBLISHED,
        translationStatus: TranslationStatus.REVIEWED,
      },
    });

    for (let j = 0; j < category.products.length; j += 1) {
      await upsertProductWithSections(categoryRecord.id, j, category.products[j]);
    }
  }
}

async function seedSolutions() {
  await prisma.solution.deleteMany();

  const solutions = [
    {
      slug: "group-tax-digitalization",
      titleZh: "集团企业税务数字一体化方案",
      titleEn: "Group Tax Digital Integration",
      summaryZh: "面向多组织、多税号集团企业，构建票税财档一体化治理与共享运营体系。",
      summaryEn:
        "Designed for multi-entity groups to build integrated governance and shared operations across invoice, tax, finance, and archives.",
      painPoints: [
        {
          titleZh: "组织与税区复杂",
          titleEn: "Complex Entity and Region Landscape",
          descriptionZh: "集团下属公司多、税区差异大，手工申报口径难统一。",
          descriptionEn:
            "Large groups face inconsistent filing standards across entities and regions with manual processes.",
        },
        {
          titleZh: "数据链路割裂",
          titleEn: "Fragmented Data Chain",
          descriptionZh: "业务、财务、发票、税务系统割裂，风险识别与追责滞后。",
          descriptionEn:
            "Business, finance, invoice, and tax systems are disconnected, causing delayed risk visibility and accountability.",
        },
      ],
      advantages: [
        {
          titleZh: "统一税务作业中台",
          titleEn: "Unified Tax Operations Hub",
          descriptionZh: "通过统一平台实现开票、申报、风险、归档等核心流程标准化。",
          descriptionEn:
            "Standardizes invoicing, filing, risk governance, and archiving through one platform.",
        },
        {
          titleZh: "全链路可追踪",
          titleEn: "Traceable End-to-end Process",
          descriptionZh: "形成“取数-算税-申报-缴款-归档-预警”闭环，提升集团治理透明度。",
          descriptionEn:
            "Creates a full loop from data collection to alerting, improving transparency in group tax governance.",
        },
      ],
    },
    {
      slug: "ecommerce-fullticket-solution",
      titleZh: "全票通电商开票解决方案",
      titleEn: "FullTicket E-commerce Invoicing",
      summaryZh: "针对多平台、多店铺订单开票场景，提供自动化、批量化、可追溯的开票能力。",
      summaryEn:
        "Provides automated, batch, and traceable invoicing for multi-platform and multi-store e-commerce operations.",
      painPoints: [
        {
          titleZh: "高峰期开票压力大",
          titleEn: "Peak-time Invoicing Pressure",
          descriptionZh: "促销活动期间订单暴增，人工开票效率低且易出错。",
          descriptionEn:
            "Promotional peaks create large invoice volumes, making manual processing slow and error-prone.",
        },
        {
          titleZh: "多平台重复操作",
          titleEn: "Repeated Multi-platform Operations",
          descriptionZh: "不同平台后台反复切换，发票回传与对账链路不稳定。",
          descriptionEn:
            "Frequent switching across platform consoles causes unstable callback and reconciliation flows.",
        },
      ],
      advantages: [
        {
          titleZh: "统一中台批量开票",
          titleEn: "Unified Batch Invoicing Hub",
          descriptionZh: "统一接入订单，支持自动/批量开票、回传与多渠道发票交付。",
          descriptionEn:
            "Unifies order intake with automated and batch invoicing, callback, and multi-channel delivery.",
        },
        {
          titleZh: "双通道保障连续性",
          titleEn: "Dual-channel Continuity",
          descriptionZh: "支持乐企与RPA双通道切换，保障高峰期持续稳定开票。",
          descriptionEn:
            "Ensures continuity through seamless switching between Leqi and RPA channels during peak periods.",
        },
      ],
    },
    {
      slug: "leqi-access-solution",
      titleZh: "乐企一站式接入解决方案",
      titleEn: "One-stop Leqi Access Solution",
      summaryZh: "帮助企业快速接入乐企平台，兼容原有系统并降低升级维护成本。",
      summaryEn:
        "Helps enterprises rapidly connect to Leqi with compatibility for existing systems and lower maintenance cost.",
      painPoints: [
        {
          titleZh: "接口变更频繁",
          titleEn: "Frequent Interface Changes",
          descriptionZh: "乐企能力升级快，企业需反复改造原系统接口与规则。",
          descriptionEn:
            "Rapid Leqi updates force repeated interface and rule adjustments in enterprise systems.",
        },
        {
          titleZh: "接入周期长",
          titleEn: "Long Integration Cycle",
          descriptionZh: "缺乏统一接入框架，联调与测试成本高，项目上线慢。",
          descriptionEn:
            "Without a unified integration framework, joint testing costs are high and go-live cycles are long.",
        },
      ],
      advantages: [
        {
          titleZh: "接口封装与兼容",
          titleEn: "API Encapsulation and Compatibility",
          descriptionZh: "封装乐企接口并兼容税控接口，支持无感升级与脚本化扩展。",
          descriptionEn:
            "Encapsulates Leqi APIs while preserving legacy compatibility with scriptable extension support.",
        },
        {
          titleZh: "接入管控可视化",
          titleEn: "Visualized Integration Governance",
          descriptionZh: "提供企业接入管理、交易追踪、模拟测试与监控统计能力。",
          descriptionEn:
            "Provides tenant onboarding control, transaction tracing, sandbox testing, and monitoring analytics.",
        },
      ],
    },
    {
      slug: "e-archive-compliance",
      titleZh: "电子会计档案合规解决方案",
      titleEn: "E-accounting Archive Compliance",
      summaryZh: "满足电子凭证归档政策要求，实现档案采集、四性检测、检索利用一体化。",
      summaryEn:
        "Meets e-voucher archiving policy requirements with integrated collection, quality checks, and archive utilization.",
      painPoints: [
        {
          titleZh: "纸电并行管理低效",
          titleEn: "Inefficient Paper-Digital Parallel Management",
          descriptionZh: "纸质与电子档案割裂，检索困难、占用空间大、监管风险高。",
          descriptionEn:
            "Paper and digital archives are disconnected, causing poor searchability, high storage costs, and governance risks.",
        },
      ],
      advantages: [
        {
          titleZh: "纸电一体全生命周期",
          titleEn: "Unified Full-lifecycle Archive Management",
          descriptionZh: "实现采集、整理、保管、借阅、统计全过程数字化留痕。",
          descriptionEn:
            "Digitally tracks the entire lifecycle from collection and organization to storage and lending.",
        },
        {
          titleZh: "全文检索与权限治理",
          titleEn: "Full-text Search and Permission Governance",
          descriptionZh: "基于OCR与全文检索提升利用效率，并支持密级与字段权限控制。",
          descriptionEn:
            "Improves archive usability with OCR and full-text search while enforcing classified and field-level permissions.",
        },
      ],
    },
    {
      slug: "export-rebate-solution",
      titleZh: "出口退税一体化解决方案",
      titleEn: "Integrated Export Tax Rebate",
      summaryZh: "覆盖关单、发票、收汇、申报及风控，构建出口退税端到端协同链路。",
      summaryEn:
        "Covers declarations, invoices, settlements, filing, and risk control in an end-to-end export rebate workflow.",
      painPoints: [
        {
          titleZh: "跨系统数据对账复杂",
          titleEn: "Complex Cross-system Reconciliation",
          descriptionZh: "关务、财务、税务数据分散，核销和申报准备周期长。",
          descriptionEn:
            "Customs, finance, and tax data are fragmented, leading to long reconciliation and filing preparation cycles.",
        },
      ],
      advantages: [
        {
          titleZh: "自动核销与模拟申报",
          titleEn: "Automated Reconciliation and Simulation",
          descriptionZh: "支持关单/收入/收汇自动核销和模拟申报，提前识别疑点。",
          descriptionEn:
            "Automates declaration-revenue-settlement reconciliation and simulation filing to identify issues early.",
        },
        {
          titleZh: "申报归档一体化",
          titleEn: "Integrated Filing and Archiving",
          descriptionZh: "支持正式申报、单证备案与资料归档，提升合规与效率。",
          descriptionEn:
            "Supports formal filing, document filing, and archival integration to improve compliance and efficiency.",
        },
      ],
    },
  ];

  for (let i = 0; i < solutions.length; i += 1) {
    const solution = solutions[i];

    const record = await prisma.solution.upsert({
      where: { slug: solution.slug },
      update: {
        titleZh: solution.titleZh,
        titleEn: solution.titleEn,
        summaryZh: solution.summaryZh,
        summaryEn: solution.summaryEn,
        sortOrder: i,
        publishStatus: PublishStatus.PUBLISHED,
        translationStatus: TranslationStatus.REVIEWED,
      },
      create: {
        slug: solution.slug,
        titleZh: solution.titleZh,
        titleEn: solution.titleEn,
        summaryZh: solution.summaryZh,
        summaryEn: solution.summaryEn,
        sortOrder: i,
        publishStatus: PublishStatus.PUBLISHED,
        translationStatus: TranslationStatus.REVIEWED,
      },
    });

    await prisma.solutionPainPoint.deleteMany({ where: { solutionId: record.id } });
    await prisma.solutionAdvantage.deleteMany({ where: { solutionId: record.id } });

    await prisma.solutionPainPoint.createMany({
      data: solution.painPoints.map((item, index) => ({
        solutionId: record.id,
        titleZh: item.titleZh,
        titleEn: item.titleEn,
        descriptionZh: item.descriptionZh,
        descriptionEn: item.descriptionEn,
        sortOrder: index,
      })),
    });

    await prisma.solutionAdvantage.createMany({
      data: solution.advantages.map((item, index) => ({
        solutionId: record.id,
        titleZh: item.titleZh,
        titleEn: item.titleEn,
        descriptionZh: item.descriptionZh,
        descriptionEn: item.descriptionEn,
        sortOrder: index,
      })),
    });

    await prisma.solutionArchitectureBlock.deleteMany({ where: { solutionId: record.id } });
    await prisma.solutionArchitectureBlock.create({
      data: {
        solutionId: record.id,
        titleZh: `${solution.titleZh} 架构图`,
        titleEn: `${solution.titleEn} Architecture`,
        descriptionZh: "可在后台上传架构图并扩展说明。",
        descriptionEn: "Upload architecture diagrams and extend descriptions in admin panel.",
        sortOrder: 0,
      },
    });
  }
}

async function seedNews() {
  await prisma.newsPost.deleteMany();

  const items = [
    {
      slug: "yunpiaotong-generative-upgrade",
      titleZh: "云票通生成式低代码底座发布新版本",
      titleEn: "YPT Generative Low-code Core Upgrade",
      summaryZh: "新增逻辑编排、报表配置与接口治理能力，提升复杂场景交付效率。",
      summaryEn:
        "Introduces enhanced orchestration, reporting configuration, and API governance for complex scenario delivery.",
      contentZh:
        "本次版本围绕“可配置、可复用、可扩展”进行能力增强，新增逻辑编排优化、应用模板复用、复杂报表配置和服务治理能力。针对集团企业多组织场景，平台支持更高效的流程配置与跨系统联动，缩短项目上线周期。",
      contentEn:
        "This release strengthens the platform around configurability, reusability, and extensibility, including upgraded orchestration, template reuse, advanced reporting, and service governance. It improves cross-system collaboration for multi-entity groups and shortens implementation timelines.",
      publishedAt: "2026-03-15T09:00:00.000Z",
    },
    {
      slug: "national-filing-paas-capability",
      titleZh: "全国申报PaaS能力升级，覆盖36税区申报链路",
      titleEn: "National Filing PaaS Expanded to 36 Regions",
      summaryZh: "支持18个实体税种及10+附加税费种，兼容乐企与电子税局双路径申报。",
      summaryEn:
        "Supports 18 primary tax categories and 10+ surcharges, with dual compatibility across Leqi and e-tax bureau channels.",
      contentZh:
        "平台进一步完善“自动取数-自动算税-申报表生成-一键申报-凭证归集”全流程能力。通过统一 API 报文标准，降低地区差异化申报规则适配成本，支持历史申报查询、完税凭证下载和多税种批量申报。",
      contentEn:
        "The platform now delivers a full lifecycle from automated data intake and tax calculation to one-click filing and voucher consolidation. A unified API schema reduces adaptation cost for regional rule differences, while enabling historical filing retrieval, voucher download, and batch filing.",
      publishedAt: "2026-03-10T09:00:00.000Z",
    },
    {
      slug: "archive-and-export-solution-launch",
      titleZh: "电子会计档案与出口退税专项方案发布",
      titleEn: "Launch of E-archive and Export Rebate Solutions",
      summaryZh: "聚焦档案合规与退税效率，形成专项业务端到端能力体系。",
      summaryEn:
        "Focused on archive compliance and rebate efficiency with end-to-end specialized capability modules.",
      contentZh:
        "新发布的专项方案覆盖电子会计档案采集、四性检测、全文检索、权限治理，以及出口退税的关单核销、模拟申报和正式申报流程。通过平台化方式，帮助企业在合规要求提升背景下构建标准化、可追溯的业务流程。",
      contentEn:
        "The newly launched modules cover e-accounting archive collection, quality checks, full-text search, access governance, and export rebate workflows from declaration reconciliation to formal filing. The platformized approach helps enterprises build standardized and traceable processes under rising compliance requirements.",
      publishedAt: "2026-02-26T09:00:00.000Z",
    },
  ];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    await prisma.newsPost.create({
      data: {
        slug: item.slug,
        titleZh: item.titleZh,
        titleEn: item.titleEn,
        summaryZh: item.summaryZh,
        summaryEn: item.summaryEn,
        contentZh: item.contentZh,
        contentEn: item.contentEn,
        publishStatus: PublishStatus.PUBLISHED,
        sortOrder: i,
        publishedAt: new Date(item.publishedAt),
      },
    });
  }
}

async function seedSeoMeta() {
  const metas = [
    {
      pageKey: "home",
      locale: "zh",
      title: "泰可思数科 | 企业税务数字一体化管理平台",
      description:
        "泰可思提供云票通、乐企接入、纳税申报、个税申报、税务风险、电子会计档案与出口退税等企业级财税产品能力。",
      keywords: "泰可思,云票通,乐企接入,纳税申报,个税申报,税务风险,电子会计档案,出口退税",
    },
    {
      pageKey: "home",
      locale: "en",
      title: "Taxs | Enterprise Digital Tax Integration Platform",
      description:
        "Taxs delivers enterprise tax capabilities including YPT platform, Leqi integration, filing automation, IIT filing, risk governance, e-archive, and export rebate.",
      keywords: "Taxs,YPT,Leqi integration,tax filing,IIT filing,e-archive,export rebate",
    },
  ];

  for (const meta of metas) {
    await prisma.seoMeta.upsert({
      where: {
        pageKey_locale: {
          pageKey: meta.pageKey,
          locale: meta.locale,
        },
      },
      update: {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
      },
      create: meta,
    });
  }
}

async function main() {
  await seedUsers();
  await seedSite();
  await seedMenus();
  await seedPages();
  await seedProducts();
  await seedSolutions();
  await seedNews();
  await seedSeoMeta();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
