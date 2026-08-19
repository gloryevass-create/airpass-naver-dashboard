import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">비밀번호 재설정</h1>
        <p className="mt-1 text-sm text-ink-mute">
          가입한 이메일 주소를 입력하면 재설정 링크를 보내드립니다.
        </p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
