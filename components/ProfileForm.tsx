"use client";

import { useActionState } from "react";
import { updateOwnProfile, type UpdateProfileState } from "@/app/dashboard/actions/profile";

const initialState: UpdateProfileState = undefined;

export function ProfileForm({
  name,
  companyEmail,
  title,
  googleEmail,
}: {
  name: string | null;
  companyEmail: string;
  title: string;
  googleEmail: string;
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-mute">이름</label>
          <input
            type="text"
            value={name ?? "-"}
            disabled
            className="rounded-sm border border-hairline bg-background px-3 py-2 text-sm text-ink-mute"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-mute">회사메일</label>
          <input
            type="text"
            value={companyEmail}
            disabled
            className="rounded-sm border border-hairline bg-background px-3 py-2 text-sm text-ink-mute"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-xs text-ink-mute">
            직급
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={title}
            placeholder="예: 팀장"
            className="rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="googleEmail" className="text-xs text-ink-mute">
            구글메일
          </label>
          <input
            id="googleEmail"
            name="googleEmail"
            type="email"
            defaultValue={googleEmail}
            placeholder="example@gmail.com"
            className="rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
      </div>
      <p className="text-xs text-ink-mute">이름·회사메일·역할은 관리자만 변경할 수 있습니다.</p>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      {state?.success && <p className="text-sm text-semantic-success">저장되었습니다.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
