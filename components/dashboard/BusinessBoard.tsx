"use client";

import { useMemo, useState } from "react";
import type { BusinessProject } from "@/lib/queries/businessProjects";

const STAGES = ["①영업진행", "②사업제안", "③제안서작성", "④사업수행", "⑤사업완료"];

// 완료 계열(그룹) 상태 — 기본값은 Notion 보드 뷰와 동일하게 진행 중인 항목만 보여준다.
const TERMINAL_STATUSES = new Set(["완료", "실패", "보류"]);

const STATUS_DOT: Record<string, string> = {
  "진행 중": "bg-link-blue",
  "시작 전": "bg-ink-mute",
  완료: "bg-semantic-success",
  보류: "bg-semantic-error",
  실패: "bg-ink-mute",
};

function formatDate(value: string | null, isDatetime: boolean): string | null {
  if (!value) return null;
  const d = new Date(value);
  const datePart = d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (!isDatetime) return datePart;
  const timePart = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

function ProjectCard({ project }: { project: BusinessProject }) {
  const date = formatDate(project.submissionDate, project.submissionDateIsDatetime);
  const dotColor = (project.status && STATUS_DOT[project.status]) || "bg-ink-mute";

  return (
    <a
      href={project.notionUrl}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-1 rounded-lg border border-hairline bg-background p-2 text-xs hover:border-primary"
    >
      <span className="truncate font-medium text-ink" title={project.title}>
        {project.title}
      </span>
      {project.status && (
        <span className="flex items-center gap-1.5 text-ink-mute">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          {project.status}
        </span>
      )}
      {date && <span className="truncate text-ink-mute">{date}</span>}
      {project.orgName && (
        <span className="truncate text-ink-mute" title={project.orgName}>
          {project.orgName}
        </span>
      )}
    </a>
  );
}

export function BusinessBoard({ projects }: { projects: BusinessProject[] }) {
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(
    () => (showAll ? projects : projects.filter((p) => !p.status || !TERMINAL_STATUSES.has(p.status))),
    [projects, showAll]
  );

  const byStage = useMemo(() => {
    const map = new Map<string, BusinessProject[]>();
    for (const stage of STAGES) map.set(stage, []);
    const etc: BusinessProject[] = [];
    for (const p of visible) {
      if (p.stage && map.has(p.stage)) {
        map.get(p.stage)!.push(p);
      } else {
        etc.push(p);
      }
    }
    if (etc.length > 0) map.set("미분류", etc);
    return map;
  }, [visible]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit items-center gap-2 text-xs text-ink-mute">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          className="h-3.5 w-3.5"
        />
        완료·보류 포함
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from(byStage.entries()).map(([stage, items]) => (
          <div key={stage} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-1.5 rounded-sm bg-canvas-cream px-2 py-1.5 text-xs font-semibold text-ink">
              <span className="truncate">{stage}</span>
              <span className="shrink-0 font-normal text-ink-mute">{items.length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-hairline p-2 text-center text-xs text-ink-mute">
                  없음
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
