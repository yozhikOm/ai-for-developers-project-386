import { useEffect, useState } from "react";

type HealthStatus = "loading" | "ok" | "error";

const statusText: Record<HealthStatus, string> = {
  loading: "проверяем…",
  ok: "ok",
  error: "недоступен",
};

// Каркасная заглушка: проверяет связку фронтенд ↔ backend end-to-end
export function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main>
      <h1>Календарь звонков</h1>
      <p>Статус API: {statusText[status]}</p>
    </main>
  );
}
