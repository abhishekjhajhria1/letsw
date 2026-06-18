import { requireUser } from "@/lib/auth";
import { ChangePassword, DeleteAccount } from "./SettingsForms";
import ReminderSettings from "./ReminderSettings";
import NotifyToggle from "@/app/ui/NotifyToggle";

export default async function SettingsPage() {
  const me = await requireUser();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          @{me.username} · {me.email}
        </p>
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Notifications</h2>
        <NotifyToggle />
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Daily reminder</h2>
        <ReminderSettings enabled={me.reminderEnabled} time={me.reminderTime ?? ""} />
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Change password</h2>
        <ChangePassword />
      </section>

      <section className="card" style={{ borderColor: "var(--danger)" }}>
        <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--danger)" }}>
          Danger zone
        </h2>
        <DeleteAccount username={me.username} />
      </section>
    </div>
  );
}
