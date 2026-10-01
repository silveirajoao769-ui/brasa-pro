"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm("Excluir este cliente?")) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      window.alert("Não foi possível excluir o cliente.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <button className="icon-danger-button" onClick={remove} disabled={loading} type="button">
      {loading ? "..." : "×"}
    </button>
  );
}
