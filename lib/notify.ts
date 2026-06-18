import "server-only";
import { prisma } from "./db";
import { sendPush } from "./push";

type NotifyInput = {
  type: string;
  title: string;
  body?: string;
  url?: string;
};

// create an in-app notification and fire a web push. never throws.
export async function notify(userId: string, input: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        url: input.url ?? "/app",
      },
    });
    await sendPush(userId, input);
  } catch {
    // notifications are best-effort; don't fail the action that triggered them
  }
}
