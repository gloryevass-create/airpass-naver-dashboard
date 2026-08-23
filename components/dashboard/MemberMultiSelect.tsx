"use client";

import { useState } from "react";

/** 담당자류 필드를 자유 텍스트 대신 실제 팀원(profiles) 목록에서 고르게 하는 공용
 * 컴포넌트. 폼 제출 시 선택된 이름들이 같은 name으로 여러 개 제출되므로, 액션
 * 쪽에서는 formData.getAll(name)으로 받는다(기존 "쉼표로 구분" 텍스트 파싱 대체). */
export function MemberMultiSelect({
  name,
  label,
  members,
  defaultValue,
}: {
  name: string;
  label: string;
  members: string[];
  defaultValue: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValue));

  function toggle(member: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(member)) next.delete(member);
      else next.add(member);
      return next;
    });
  }

  return (
    <fieldset className="flex flex-col gap-1 text-xs text-ink-mute">
      <legend className="mb-1">{label}</legend>
      <div className="flex flex-wrap gap-1.5 rounded-sm border border-hairline bg-background px-2 py-2">
        {members.length === 0 && <span className="text-ink-mute">등록된 팀원이 없습니다.</span>}
        {members.map((m) => {
          const active = selected.has(m);
          return (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-hairline bg-canvas-cream text-ink-mute hover:border-primary hover:text-primary"
              }`}
            >
              <input
                type="checkbox"
                name={name}
                value={m}
                checked={active}
                onChange={() => toggle(m)}
                className="sr-only"
              />
              {m}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
