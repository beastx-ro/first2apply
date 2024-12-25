"use client";

import { ResetPasswordCard } from "@/components/resetPasswordCard";
import { useToast } from "@/components/ui/use-toast";
import { useError } from "@/hooks/error";
import { useSession } from "@/hooks/session";
import { changePassword } from "@/lib/electronMainSdk";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Component used to render the reset password page.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { login } = useSession();
  const { toast } = useToast();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async ({ password }: { password: string }) => {
    try {
      setIsSubmitting(true);
      const user = await changePassword({ password });
      login(user);
      toast({
        title: "Password changed",
        description:
          "Your password has been changed successfully, you can use it to login next time.",
        variant: "success",
      });
      router.push("/");
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <ResetPasswordCard
        onChangePassword={handlePasswordChange}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
