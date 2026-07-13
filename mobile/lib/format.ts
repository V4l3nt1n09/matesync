export function formatCreneau(scheduledAt: string | null): string {
  if (!scheduledAt) return "Maintenant";
  return new Date(scheduledAt).toLocaleString("fr-FR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
