import Link from "next/link";

export const metadata = {
  title: "Terms of Service | HAMA ENTERPRISE NG",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-[var(--heading)]">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Last updated: October 2026 · HAMA ENTERPRISE NG (RC: 8827959)
      </p>
      <div className="prose-invert space-y-6 text-sm leading-relaxed text-[var(--muted)]">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            1. Agreement
          </h2>
          <p>
            By using the HAMA ENTERPRISE NG online store, creating an account, or
            placing an order, you agree to these Terms of Service. If you do not
            agree, please do not use the store.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            2. Products & pricing
          </h2>
          <p>
            Product descriptions, images, and prices are shown in good faith.
            We may correct errors and update prices without prior notice.
            Orders are confirmed only after we accept them and (where
            applicable) payment is verified.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            3. Accounts
          </h2>
          <p>
            You must provide accurate information and keep your login secure.
            You are responsible for activity under your account. Checkout
            requires a registered customer account.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            4. Orders & payment
          </h2>
          <p>
            Available payment methods include card, bank transfer, and other
            options shown at checkout. Bank-transfer orders remain pending until
            payment is confirmed by our team. We may cancel orders that cannot
            be fulfilled or that fail payment verification.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            5. Shipping
          </h2>
          <p>
            We deliver within Nigeria according to the shipping rates shown at
            checkout (by state). Free shipping applies to eligible orders at or
            above the published threshold. Delivery times are estimates and may
            vary by location and carrier.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            6. Limitation of liability
          </h2>
          <p>
            To the fullest extent permitted by law, HAMA ENTERPRISE NG is not
            liable for indirect or consequential losses arising from use of the
            store or products, except where liability cannot be excluded under
            Nigerian law.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            7. Contact
          </h2>
          <p>
            Questions about these terms:{" "}
            <a
              href="mailto:support@hamaenterprise.ng"
              className="text-cyan-400 hover:underline"
            >
              support@hamaenterprise.ng
            </a>
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
