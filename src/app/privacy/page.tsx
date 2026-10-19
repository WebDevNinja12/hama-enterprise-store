import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | HAMA ENTERPRISE NG",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-[var(--heading)]">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Last updated: October 2026 · HAMA ENTERPRISE NG
      </p>
      <div className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            1. Information we collect
          </h2>
          <p>
            When you register or checkout we may collect your name, email,
            phone number, shipping address, and order history. If you sign in
            with Google, we receive basic profile information (name and email)
            from Google according to your Google settings.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            2. How we use it
          </h2>
          <p>
            We use your data to process orders, deliver products, send order and
            security emails (OTP, password reset), improve the store, and
            prevent fraud. We do not sell your personal information.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            3. Cookies & sessions
          </h2>
          <p>
            We use small secure cookies for login sessions, security (CSRF),
            and basic site function. Session cookies hold only identifiers, not
            your password or full profile image.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            4. Sharing
          </h2>
          <p>
            We may share data with payment processors, delivery partners, and
            infrastructure providers (e.g. hosting, email) solely to operate the
            store. We may disclose information if required by law.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            5. Your choices
          </h2>
          <p>
            You may update your profile, delete your account from the account
            page, or contact us to request access or correction of your data
            where applicable under Nigerian law.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--heading)]">
            6. Contact
          </h2>
          <p>
            Privacy questions:{" "}
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
