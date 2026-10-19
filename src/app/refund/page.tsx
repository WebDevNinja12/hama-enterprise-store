import Link from "next/link";

export const metadata = {
  title: "Refund Policy | HAMA ENTERPRISE NG",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-[var(--heading)]">
        Refund & Returns Policy
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Last updated: October 2026 · HAMA ENTERPRISE NG
      </p>
      <div className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            1. Eligibility
          </h2>
          <p>
            You may request a return or refund for eligible products within 7
            days of delivery if the item is unused, in original packaging, and
            not listed as final sale. Defective or incorrect items should be
            reported within 48 hours of delivery with photos where possible.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            2. How to request
          </h2>
          <p>
            Email{" "}
            <a
              href="mailto:support@hamaenterprise.ng"
              className="text-cyan-400 hover:underline"
            >
              support@hamaenterprise.ng
            </a>{" "}
            with your order number, phone number, reason, and supporting images.
            Approved returns will include return instructions.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            3. Refunds
          </h2>
          <p>
            After we receive and inspect a returned item, refunds are processed
            to the original payment method where possible, or via bank transfer.
            Processing may take 5–14 business days depending on your bank.
            Shipping fees are non-refundable unless the return is due to our
            error.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            4. Non-returnable items
          </h2>
          <p>
            Items damaged by misuse, missing parts or packaging, or marked as
            clearance / final sale may not be eligible for return.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            5. Cancelled orders
          </h2>
          <p>
            If you cancel before shipment and payment was collected, we will
            refund according to the payment method used. Bank-transfer orders
            that were never confirmed may simply be declined with no charge.
          </p>
        </section>
      </div>
      <p className="mt-10">
        <Link href="/" className="text-sm text-cyan-400 hover:underline">
          ← Back to store
        </Link>
      </p>
    </div>
  );
}
