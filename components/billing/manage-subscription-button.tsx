"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { openSubscriptionPortal } from "../../app/subscribe/actions";

export function ManageSubscriptionButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="manage-subscription">
      <Button
        type="button"
        variant="subtle"
        color="gray"
        size="sm"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await openSubscriptionPortal();
          setBusy(false);
          if ("ok" in result && result.ok) {
            window.open(result.url, "_blank", "noopener,noreferrer");
            return;
          }
          setError(
            "error" in result && result.error
              ? result.error
              : "Could not open the customer portal.",
          );
        }}
      >
        Manage subscription
      </Button>
      {error ? (
        <span className="manage-subscription-error">{error}</span>
      ) : null}
    </div>
  );
}
