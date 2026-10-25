"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useStudyStore } from "@/stores/study-store";
import { STUDY_AREAS, type Difficulty, type StudyArea, type StudyItem, type StudyStatus } from "@/types/study";

export function StudyItemDialog({ item, defaultDate, onClose }: { item?: StudyItem; defaultDate: string; onClose: () => void }) {
  const addItem = useStudyStore((state) => state.addItem);
  const updateItem = useStudyStore((state) => state.updateItem);
  const addManualSession = useStudyStore((state) => state.addManualSession);
  const [title, setTitle] = useState(item?.title ?? "");
  const [area, setArea] = useState<StudyArea>(item?.area ?? "Kubernetes 기초");
  const [description, setDescription] = useState(item?.description ?? "");
  const [scheduledDate, setScheduledDate] = useState(item?.scheduledDate ?? defaultDate);
  const [estimatedMinutes, setEstimatedMinutes] = useState(item?.estimatedMinutes ?? 90);
  const [status, setStatus] = useState<StudyStatus>(item?.status ?? "planned");
  const [difficulty, setDifficulty] = useState<Difficulty>(item?.difficulty ?? "medium");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [actualToAdd, setActualToAdd] = useState(0);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title" onSubmit={(event) => {
        event.preventDefault();
        const draft = { title: title.trim(), area, description: description.trim(), scheduledDate, estimatedMinutes, status, difficulty, notes: notes.trim() };
        if (item) {
          updateItem(item.id, draft);
          if (actualToAdd > 0) addManualSession(item.id, scheduledDate, actualToAdd);
        } else {
          const id = addItem(draft);
          if (actualToAdd > 0) addManualSession(id, scheduledDate, actualToAdd);
        }
        onClose();
      }}>
        <div className="dialog-header"><div><span className="eyebrow">STUDY ITEM</span><h2 id="item-dialog-title">{item ? "학습 항목 수정" : "새 학습 항목"}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="닫기"><X size={18} /></button></div>
        <div className="form-grid">
          <label className="field span-2"><span>제목</span><input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: Pod 라이프사이클 실습" required autoFocus /></label>
          <label className="field"><span>학습 영역</span><select className="field-input" value={area} onChange={(event) => setArea(event.target.value as StudyArea)}>{STUDY_AREAS.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="field"><span>예정일</span><input className="field-input" type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} required /></label>
          <label className="field"><span>예상 시간 (분)</span><input className="field-input" type="number" min={0} max={1440} value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(Number(event.target.value))} required /></label>
          <label className="field"><span>실제 시간 추가 (분)</span><input className="field-input" type="number" min={0} max={1440} value={actualToAdd} onChange={(event) => setActualToAdd(Number(event.target.value))} /><small>기존 {item?.actualMinutes ?? 0}분 · 입력 값만 추가됩니다.</small></label>
          <label className="field"><span>상태</span><select className="field-input" value={status} onChange={(event) => setStatus(event.target.value as StudyStatus)}><option value="planned">예정</option><option value="in_progress">진행 중</option><option value="completed">완료</option></select></label>
          <label className="field"><span>난이도</span><select className="field-input" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}><option value="easy">쉬움</option><option value="medium">보통</option><option value="hard">어려움</option></select></label>
          <label className="field span-2"><span>설명</span><textarea className="field-input" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="학습 목표와 실습 방법을 적어두세요." /></label>
          <label className="field span-2"><span>메모</span><textarea className="field-input" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="오답, 참고 링크, 다시 볼 내용을 기록하세요." /></label>
        </div>
        <div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose}>취소</button><button type="submit" className="button primary">{item ? "변경 저장" : "항목 추가"}</button></div>
      </form>
    </div>
  );
}
