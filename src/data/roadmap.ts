import { addDays } from "@/lib/date";
import { IDLE_TIMER } from "@/lib/timer";
import type { AppSettings, PersistedStudyData, StudyArea, StudyItem } from "@/types/study";

export const DEFAULT_SETTINGS: AppSettings = {
  studyStartDate: "2026-10-26",
  examDate: "2027-01-30",
  weeklyTargetMinutes: 690,
  totalTargetMinutes: 9660,
  timezone: "Asia/Seoul",
  theme: "dark",
  restDays: [3],
};

export interface RoadmapWeek {
  week: number;
  title: string;
  area: StudyArea;
  topics: string[];
  outcome: string;
}

export const ROADMAP_WEEKS: RoadmapWeek[] = [
  { week: 1, title: "클러스터와 Pod 기초", area: "Kubernetes 기초", topics: ["컨테이너 오케스트레이션", "Pod 라이프사이클", "Namespace", "kubectl 기본 명령", "YAML 구조"], outcome: "Pod를 선언형으로 생성하고 조회·수정·삭제할 수 있다." },
  { week: 2, title: "워크로드 컨트롤러", area: "Kubernetes 기초", topics: ["ReplicaSet", "Deployment", "롤링 업데이트", "롤백", "Label과 Selector"], outcome: "Deployment 배포 전략을 명령어와 YAML로 운영한다." },
  { week: 3, title: "Service와 기본 연결", area: "Kubernetes 기초", topics: ["ClusterIP", "NodePort", "Service 디스커버리", "kubectl expose", "YAML 종합 연습"], outcome: "워크로드를 Service로 노출하고 연결 문제를 진단한다." },
  { week: 4, title: "스케줄링과 구성", area: "Workloads", topics: ["NodeSelector", "Affinity", "Taint와 Toleration", "ConfigMap", "Secret"], outcome: "Pod 배치 조건과 애플리케이션 구성을 안전하게 관리한다." },
  { week: 5, title: "영구 스토리지", area: "Storage", topics: ["Volume", "PersistentVolume", "PersistentVolumeClaim", "StorageClass", "볼륨 장애 점검"], outcome: "PV/PVC 바인딩을 구성하고 Pending 원인을 찾는다." },
  { week: 6, title: "클러스터 네트워킹", area: "Networking", topics: ["CoreDNS", "NetworkPolicy", "Ingress", "Gateway API", "네트워크 경로 추적"], outcome: "DNS와 트래픽 정책을 구성하고 네트워크 장애를 분리한다." },
  { week: 7, title: "클러스터 부트스트랩", area: "Cluster Architecture", topics: ["Control Plane 구성요소", "kubeadm init", "kubeadm join", "Static Pod", "클러스터 업그레이드"], outcome: "kubeadm 기반 클러스터의 생성과 업그레이드 흐름을 설명한다." },
  { week: 8, title: "etcd, 보안과 인증서", area: "Security", topics: ["etcd 스냅샷", "etcd 복원", "RBAC", "ServiceAccount", "인증서 점검"], outcome: "etcd를 백업·복원하고 최소 권한 RBAC을 작성한다." },
  { week: 9, title: "패키징과 노드 운영", area: "Cluster Architecture", topics: ["Helm", "Kustomize", "Cordon과 Drain", "Node 유지보수", "리소스 관리"], outcome: "애플리케이션 구성을 패키징하고 노드를 안전하게 정비한다." },
  { week: 10, title: "워크로드 트러블슈팅", area: "Troubleshooting", topics: ["CrashLoopBackOff", "ImagePullBackOff", "Pending Pod", "Probe 실패", "로그와 이벤트 분석"], outcome: "이벤트·로그·상태를 근거로 Pod 장애를 빠르게 복구한다." },
  { week: 11, title: "노드와 DNS 장애", area: "Troubleshooting", topics: ["Node NotReady", "kubelet 장애", "CoreDNS 장애", "인증서 만료", "시스템 로그 분석"], outcome: "노드 및 DNS 장애의 관찰 지점을 알고 복구한다." },
  { week: 12, title: "네트워크 종합 장애 분석", area: "Troubleshooting", topics: ["Service Endpoint", "CNI 장애", "NetworkPolicy 차단", "Ingress 장애", "복합 장애 시나리오"], outcome: "계층별 체크리스트로 네트워크 장애를 제한 시간 안에 해결한다." },
  { week: 13, title: "Killer.sh 1차 실전", area: "실전 모의고사", topics: ["Killer.sh 세션 1", "오답 원인 분류", "명령어 반복", "북마크 최적화", "시간 배분"], outcome: "첫 모의고사의 취약 영역과 시간 손실 구간을 수치화한다." },
  { week: 14, title: "최종 모의고사와 시험 준비", area: "실전 모의고사", topics: ["Killer.sh 세션 2", "고빈도 오답 복습", "명령어 속도 훈련", "시험 시간 관리", "최종 체크리스트"], outcome: "실전 루틴을 확정하고 제한 시간 내 모의고사를 완주한다." },
];

const DAILY_SCHEDULE = [
  { weekday: 1, minutes: 90, label: "이론 강의", method: "공식 문서와 강의로 핵심 개념을 정리하고 5줄 요약을 남깁니다." },
  { weekday: 2, minutes: 90, label: "kubectl 실습", method: "명령형 명령과 확인 명령을 반복하고 같은 결과를 YAML로 재현합니다." },
  { weekday: 4, minutes: 90, label: "YAML 및 클러스터 실습", method: "리소스 YAML을 직접 작성해 적용하고 describe 결과를 검증합니다." },
  { weekday: 5, minutes: 90, label: "트러블슈팅", method: "의도적으로 오류를 만든 뒤 이벤트와 로그만으로 원인을 추적합니다." },
  { weekday: 6, minutes: 240, label: "집중 실습", method: "여러 주제를 연결한 시나리오를 시간 제한과 함께 완주합니다." },
  { weekday: 0, minutes: 90, label: "복습 및 퀴즈", method: "이번 주 오답을 다시 풀고 핵심 명령어를 기억에서 작성합니다." },
] as const;

function topicForDay(topics: string[], dayIndex: number): string {
  if (dayIndex === 5) return topics.slice(-2).join(" · ");
  return topics[dayIndex % topics.length] ?? topics[0] ?? "주간 학습";
}

export function createRoadmapItems(settings = DEFAULT_SETTINGS): StudyItem[] {
  const items: StudyItem[] = [];
  const createdAt = `${settings.studyStartDate}T00:00:00.000+09:00`;
  for (const week of ROADMAP_WEEKS) {
    const weekStart = addDays(settings.studyStartDate, (week.week - 1) * 7);
    DAILY_SCHEDULE.forEach((schedule, dayIndex) => {
      const offset = schedule.weekday === 0 ? 6 : schedule.weekday - 1;
      const scheduledDate = addDays(weekStart, offset);
      if (scheduledDate > settings.examDate) return;
      const topic = topicForDay(week.topics, dayIndex);
      items.push({
        id: `seed-w${week.week}-d${schedule.weekday}`,
        title: `${schedule.label}: ${topic}`,
        area: week.area,
        description: `${schedule.method} 이번 주 목표: ${week.outcome}`,
        scheduledDate,
        estimatedMinutes: schedule.minutes,
        actualMinutes: 0,
        status: "planned",
        difficulty: week.week <= 3 ? "easy" : week.week <= 9 ? "medium" : "hard",
        notes: "",
        createdAt,
        updatedAt: createdAt,
      });
    });
  }
  return items;
}

export function createSeedData(): PersistedStudyData {
  return {
    schemaVersion: 1,
    items: createRoadmapItems(),
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
    timer: { ...IDLE_TIMER },
    seeded: true,
  };
}
