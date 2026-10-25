import type { StudyStatus } from "@/types/study";

const LABELS: Record<StudyStatus, string> = {
  planned: "예정",
  in_progress: "진행 중",
  completed: "완료",
};

export function StatusBadge({ status }: { status: StudyStatus }) {
  return <span className={`status-badge status-${status}`}><i />{LABELS[status]}</span>;
}
