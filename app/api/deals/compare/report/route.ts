export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { renderCompareReportHTML } from "@/lib/report/CompareReportTemplate";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const mode = url.searchParams.get("mode") ?? "Balanced";

  const origin = process.env.SITE_URL || url.origin;
  const deals = await Promise.all(
    ids.map(id => fetch(`${origin}/api/deals/${id}`, { cache: "no-store" }).then(r=>r.json()))
  );

  const html = renderCompareReportHTML({ deals, mode });

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format:"Letter", printBackground:true, margin:{ top:"0.5in", right:"0.5in", bottom:"0.6in", left:"0.5in" } });
  await browser.close();

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=compare.pdf",
    },
  });
}
