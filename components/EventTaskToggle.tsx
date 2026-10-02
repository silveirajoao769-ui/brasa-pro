"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EventTaskToggle({
  taskId,
  completed,
}: {
  taskId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();

    await supabase.rpc("set_event_task_completion", {
      p_task_id: taskId,
      p_completed: !completed,
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      className={completed ? "agenda-task-check done" : "agenda-task-check"}
      type="button"
      aria-label={completed ? "Reabrir tarefa" : "Concluir tarefa"}
      disabled={loading}
      onClick={toggle}
    >
      {loading ? "…" : completed ? "✓" : ""}
    </button>
  );
}
