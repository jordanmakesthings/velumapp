import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export function useOneSignalInit(userId: string | undefined) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!userId || initialized.current) return;
    initialized.current = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId: "YOUR_ONESIGNAL_APP_ID",
        notifyButton: { enable: false },
      });

      // Request permission
      const permission = await OneSignal.Notifications.requestPermission();
      if (permission) {
        // Wait briefly for subscription to register
        await new Promise((r) => setTimeout(r, 1500));
        const playerId = OneSignal.User?.onesignalId;
        if (playerId) {
          await supabase
            .from("profiles")
            .update({ onesignal_player_id: playerId } as any)
            .eq("id", userId);
        }
      }
    });
  }, [userId]);
}
