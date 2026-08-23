import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMaterialEmailLogs } from "@/lib/queries/materialEmailLogs";
import { isGoogleDriveConfigured, listMaterialFiles } from "@/lib/googleDriveMaterials";
import { isMaterialEmailConfigured } from "@/lib/materialEmail";
import { MaterialEmailForm } from "@/components/dashboard/MaterialEmailForm";
import { NavIcon } from "@/components/icons/NavIcon";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
      <h2 className="mb-2 font-semibold">자료메일발송 설정이 아직 끝나지 않았습니다</h2>
      <p className="mb-2">다음 환경변수가 설정돼야 이 기능을 쓸 수 있습니다:</p>
      <ul className="mb-2 list-disc pl-5">
        {missing.map((m) => (
          <li key={m}>
            <code className="rounded bg-amber-100 px-1 py-0.5">{m}</code>
          </li>
        ))}
      </ul>
      <p>자세한 발급·설정 절차는 README.md를 참고하세요.</p>
    </div>
  );
}

export default async function MaterialEmailPage() {
  const { supabase } = await requireAuthedClient();

  const missing = [
    ...(isGoogleDriveConfigured
      ? []
      : ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "GOOGLE_DRIVE_MATERIALS_FOLDER_ID"]),
    ...(isMaterialEmailConfigured ? [] : ["RESEND_API_KEY", "MATERIAL_EMAIL_FROM"]),
  ];

  const logs = await getMaterialEmailLogs(supabase);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="paperclip" className="h-5 w-5" />
          자료메일발송
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          구글드라이브 자료 폴더에서 보낼 자료를 골라 안내 내용과 함께 이메일로 보냅니다. 자료는 실제
          첨부가 아니라 공유 링크로 전달됩니다.
        </p>
      </div>

      {missing.length > 0 ? (
        <SetupNotice missing={missing} />
      ) : (
        <MaterialEmailForm files={await listMaterialFiles()} />
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
          <NavIcon name="history" className="h-4 w-4" />
          최근 발송 이력
        </h2>
        <div className="flex flex-col gap-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-sm border border-hairline bg-canvas-cream p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink">{l.subject}</span>
                <span className="text-xs text-ink-mute">
                  {l.senderEmail} · {formatDateTime(l.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-mute">받는 사람: {l.recipientEmails.join(", ")}</p>
              {l.fileNames.length > 0 && (
                <p className="mt-1 text-xs text-ink-mute">자료: {l.fileNames.join(", ")}</p>
              )}
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-ink-mute">아직 발송 이력이 없습니다.</p>}
        </div>
      </div>
    </main>
  );
}
