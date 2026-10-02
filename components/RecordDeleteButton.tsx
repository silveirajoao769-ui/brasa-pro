"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TableName =
  | "service_packages"
  | "service_package_items"
  | "team_members"
  | "event_team_assignments"
  | "event_tasks"
  | "event_payments"
  | "event_costs";

export default function RecordDeleteButton({
  table,
  id,
  confirmText,
  redirectTo,
  label = "Excluir",
  disabled = false,
}: {
  table: TableName;
  id: string;
  confirmText: string;
  redirectTo?: string;
  label?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (disabled || !window.confirm(confirmText)) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      window.alert(error.message || "Não foi possível excluir.");
      setLoading(false);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      className="record-delete-button"
      type="button"
      disabled={loading || disabled}
      onClick={remove}
    >
      {loading ? "Excluindo..." : label}
    </button>
  );
}
