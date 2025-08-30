export default function BillingPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Billing</h1>
      <p className="mb-4">Upgrade to Pro for unlimited analyses.</p>
      <button className="px-4 py-2 bg-green-600 text-white rounded" disabled>
        Upgrade to Pro
      </button>
    </div>
  );
}
