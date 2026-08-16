export function SetupNotice() {
  return (
    <div className="max-w-md rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
      <h2 className="mb-2 font-semibold">Supabase 환경변수가 설정되지 않았습니다</h2>
      <p>
        <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>에{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>과{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>
        를 설정한 뒤 다시 시도하세요. 자세한 절차는 README.md를 참고하세요.
      </p>
    </div>
  );
}
