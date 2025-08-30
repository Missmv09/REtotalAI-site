import Link from 'next/link';

async function fetchDeals() {
  const res = await fetch('/api/deals', { cache: 'no-store' });
  return res.json();
}

export default async function DealsPage() {
  const deals = await fetchDeals();
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Saved Deals</h1>
      <div className="space-y-3">
        {deals.map((d: any) => (
          <div key={d.id} className="rounded-xl border p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.title}</div>
              <div className="text-sm opacity-70">
                {`Purchase $${Number(d.purchasePrice).toLocaleString()} · Rehab $${Number(d.rehabCost).toLocaleString()} · ARV $${Number(d.arv ?? 0).toLocaleString()}`}
              </div>
            </div>
            <Link href={`/tools/deal-analyzer?id=${d.id}`} className="px-4 py-2 rounded-lg border">Open</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
