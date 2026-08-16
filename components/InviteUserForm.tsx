"use client";

import { useActionState } from "react";
import { inviteUser, type InviteState } from "@/app/admin/actions";

const initialState: InviteState = undefined;

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(inviteUser, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700">
          초대할 팀원 이메일
        </label>
        <div className="flex gap-2">
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="teammate@airpass.co.kr"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "전송 중..." : "초대"}
          </button>
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}
    </form>
  );
}
