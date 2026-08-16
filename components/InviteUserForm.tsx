"use client";

import { useActionState } from "react";
import { inviteUser, type InviteState } from "@/app/admin/actions";

const initialState: InviteState = undefined;

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(inviteUser, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          초대할 팀원 이메일
        </label>
        <div className="flex gap-2">
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="teammate@airpass.co.kr"
            className="flex-1 rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "전송 중..." : "초대"}
          </button>
        </div>
      </div>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      {state?.success && <p className="text-sm text-semantic-success">{state.success}</p>}
    </form>
  );
}
