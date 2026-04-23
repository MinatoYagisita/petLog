"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { PetSelector } from "@/components/features/pets/PetSelector";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { MED_STATUS_LABEL, MED_STATUS_COLOR, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface TodayLog {
  logId: string;
  medicationId: string;
  medicationName: string;
  scheduleId: string;
  scheduledTime: string;
  status: string;
  actualTime: string | null;
  note: string | null;
}

interface HealthRecord {
  id: string;
  weight: number | null;
  recordedAt: string;
}

interface Visit {
  id: string;
  hospitalName: string;
  nextVisitDate: string | null;
}

interface Trimming {
  id: string;
  salonName: string | null;
  scheduledDate: string;
  completedDate: string | null;
  nextScheduledDate: string | null;
}

interface MedicationAlert {
  id: string;
  name: string;
  stockCount: number;
  doseAmount: number;
  remainingDays: number;
}

const NEXT_STATUS: Record<string, string> = {
  pending: "done",
  delayed: "done",
};

const NEXT_LABEL: Record<string, string> = {
  pending: "投薬完了",
  delayed: "投薬完了",
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { activePet, loading: petLoading } = usePets();
  const [todayLogs, setTodayLogs] = useState<TodayLog[]>([]);
  const [latestRecord, setLatestRecord] = useState<HealthRecord | null>(null);
  const [nextVisit, setNextVisit] = useState<Visit | null>(null);
  const [nextTrimming, setNextTrimming] = useState<Trimming | null>(null);
  const [stockAlerts, setStockAlerts] = useState<MedicationAlert[]>([]);
  const [loadedPetId, setLoadedPetId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const loading = Boolean(activePet && loadedPetId !== activePet.id);

  useEffect(() => {
    if (!user || !activePet) return;

    let cancelled = false;
    const petId = activePet.id;

    Promise.all([
      api.get<TodayLog[]>(`/api/medication-logs/today?petId=${petId}`, user).catch(() => [] as TodayLog[]),
      api.get<HealthRecord[]>(`/api/health-records?petId=${petId}`, user).catch(() => [] as HealthRecord[]),
      api.get<Visit[]>(`/api/visits?petId=${petId}`, user).catch(() => [] as Visit[]),
      api.get<Trimming[]>(`/api/trimming?petId=${petId}`, user).catch(() => [] as Trimming[]),
      api.get<{ id: string; name: string; stockCount: number | null; doseAmount: number | null; schedules: unknown[] }[]>(`/api/medications?petId=${petId}`, user).catch(() => []),
    ]).then(([logs, records, visits, trimmings, meds]) => {
      if (!cancelled) {
        setTodayLogs(logs);
        setLatestRecord(records[0] ?? null);
        const upcoming = visits.find((v) => v.nextVisitDate && new Date(v.nextVisitDate) >= new Date());
        setNextVisit(upcoming ?? null);
        const now = new Date();
        const upcomingTrimming = trimmings
          .filter((t) => !t.completedDate && new Date(t.scheduledDate) >= now)
          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
          ?? trimmings.find((t) => t.nextScheduledDate && new Date(t.nextScheduledDate) >= now)
          ?? null;
        setNextTrimming(upcomingTrimming);
        const alerts = meds
          .filter((m) => m.stockCount != null && m.doseAmount != null && m.doseAmount > 0 && m.schedules.length > 0)
          .map((m) => ({
            id: m.id,
            name: m.name,
            stockCount: m.stockCount!,
            doseAmount: m.doseAmount!,
            remainingDays: Math.floor(m.stockCount! / (m.doseAmount! * m.schedules.length)),
          }))
          .filter((a) => a.remainingDays <= 7);
        setStockAlerts(alerts);
        setLoadedPetId(petId);
      }
    });

    return () => { cancelled = true; };
  }, [user, activePet?.id]);

  const refreshDashboard = useCallback(async () => {
    if (!user || !activePet) return;
    const petId = activePet.id;
    const [logs, records, visits, trimmings, meds] = await Promise.all([
      api.get<TodayLog[]>(`/api/medication-logs/today?petId=${petId}`, user).catch(() => [] as TodayLog[]),
      api.get<HealthRecord[]>(`/api/health-records?petId=${petId}`, user).catch(() => [] as HealthRecord[]),
      api.get<Visit[]>(`/api/visits?petId=${petId}`, user).catch(() => [] as Visit[]),
      api.get<Trimming[]>(`/api/trimming?petId=${petId}`, user).catch(() => [] as Trimming[]),
      api.get<{ id: string; name: string; stockCount: number | null; doseAmount: number | null; schedules: unknown[] }[]>(`/api/medications?petId=${petId}`, user).catch(() => []),
    ]);
    setTodayLogs(logs);
    setLatestRecord(records[0] ?? null);
    const upcoming = visits.find((v) => v.nextVisitDate && new Date(v.nextVisitDate) >= new Date());
    setNextVisit(upcoming ?? null);
    const now = new Date();
    const upcomingTrimming = trimmings
      .filter((t) => !t.completedDate && new Date(t.scheduledDate) >= now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
      ?? trimmings.find((t) => t.nextScheduledDate && new Date(t.nextScheduledDate) >= now)
      ?? null;
    setNextTrimming(upcomingTrimming);
    const alerts = meds
      .filter((m) => m.stockCount != null && m.doseAmount != null && m.doseAmount > 0 && m.schedules.length > 0)
      .map((m) => ({
        id: m.id,
        name: m.name,
        stockCount: m.stockCount!,
        doseAmount: m.doseAmount!,
        remainingDays: Math.floor(m.stockCount! / (m.doseAmount! * m.schedules.length)),
      }))
      .filter((a) => a.remainingDays <= 7);
    setStockAlerts(alerts);
    setLoadedPetId(petId);
  }, [user, activePet]);

  async function handleStatusUpdate(log: TodayLog) {
    if (!user) return;
    const nextStatus = NEXT_STATUS[log.status];
    if (!nextStatus) return;

    setUpdatingId(log.logId);
    try {
      await api.patch(`/api/medication-logs/${log.logId}`, user, { status: nextStatus });
      toast.success(`${log.medicationName} を記録しました`);
      await refreshDashboard();
    } catch {
      toast.error("更新できませんでした");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSkip(log: TodayLog) {
    if (!user) return;
    setUpdatingId(log.logId);
    try {
      await api.patch(`/api/medication-logs/${log.logId}`, user, { status: "skipped" });
      toast("スキップしました");
      await refreshDashboard();
    } catch {
      toast.error("更新できませんでした");
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingLogs = todayLogs.filter((l) => l.status === "pending" || l.status === "delayed");
  const doneLogs = todayLogs.filter((l) => l.status === "done" || l.status === "skipped");

  if (petLoading) return <PageSpinner />;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">ホーム</h1>
          <p className="text-xs text-text-secondary">{formatDate(new Date())}</p>
        </div>
        <button
          onClick={async () => { await logout(); router.replace("/login"); }}
          className="text-xs text-text-secondary px-2 py-1"
        >
          ログアウト
        </button>
      </div>

      <PetSelector />

      {!activePet ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-text-secondary text-sm">ペットを登録しましょう</p>
          <Link href="/pets/new" className="block mt-4">
            <Button>ペットを登録する</Button>
          </Link>
        </Card>
      ) : loading ? (
        <PageSpinner />
      ) : (
        <>
          {/* Stock alerts */}
          {stockAlerts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-base font-semibold text-text-primary">薬残量アラート</h2>
                <span className="bg-[#FEF3C7] text-[#92400E] text-xs font-bold px-2 py-0.5 rounded-full">
                  {stockAlerts.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {stockAlerts.map((a) => (
                  <Card key={a.id} className="flex items-center gap-3 bg-[#FFFBEB]">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">{a.name}</p>
                      <p className="text-xs text-[#92400E]">
                        残量 {a.stockCount} → 残り約 {a.remainingDays} 日分
                      </p>
                    </div>
                    <Link href={`/medications/${a.id}`} className="text-xs text-primary font-medium flex-shrink-0">
                      詳細 ›
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Pending medications — most important */}
          {pendingLogs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-base font-semibold text-text-primary">未実施の投薬</h2>
                <span className="bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingLogs.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {pendingLogs.map((log) => (
                  <Card key={log.logId} className="flex items-center gap-3 bg-[#FFF5F5]">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">{log.medicationName}</p>
                      <p className="text-xs text-text-secondary">{log.scheduledTime}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={updatingId === log.logId}
                        onClick={() => handleSkip(log)}
                        className="text-text-secondary"
                      >
                        スキップ
                      </Button>
                      <Button
                        size="sm"
                        loading={updatingId === log.logId}
                        onClick={() => handleStatusUpdate(log)}
                      >
                        {NEXT_LABEL[log.status] ?? "完了"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Today's completed */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              今日の投薬
              {todayLogs.length > 0 && (
                <span className="text-text-secondary font-normal text-sm ml-2">
                  {doneLogs.length}/{todayLogs.length} 完了
                </span>
              )}
            </h2>
            {todayLogs.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-text-secondary text-sm">今日の投薬はありません</p>
                <Link href="/medications/new" className="block mt-3">
                  <Button variant="secondary" size="sm">投薬を登録する</Button>
                </Link>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {todayLogs.map((log) => (
                  <Card key={log.logId} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{log.medicationName}</p>
                      <p className="text-xs text-text-secondary">{log.scheduledTime}</p>
                    </div>
                    <Badge className={MED_STATUS_COLOR[log.status] ?? ""}>
                      {MED_STATUS_LABEL[log.status] ?? log.status}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">クイック操作</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/health/new">
                <Card className="text-center py-4 cursor-pointer hover:border-primary transition-colors">
                  <div className="text-2xl mb-1">❤️</div>
                  <p className="text-sm font-medium text-text-primary">健康記録</p>
                </Card>
              </Link>
              <Link href="/visits/new">
                <Card className="text-center py-4 cursor-pointer hover:border-primary transition-colors">
                  <div className="text-2xl mb-1">🏥</div>
                  <p className="text-sm font-medium text-text-primary">通院登録</p>
                </Card>
              </Link>
              <Link href="/trimming/new">
                <Card className="text-center py-4 cursor-pointer hover:border-primary transition-colors">
                  <div className="text-2xl mb-1">✂️</div>
                  <p className="text-sm font-medium text-text-primary">サロン予約</p>
                </Card>
              </Link>
              <Link href="/medications/bulk">
                <Card className="text-center py-4 cursor-pointer hover:border-primary transition-colors">
                  <div className="text-2xl mb-1">💊</div>
                  <p className="text-sm font-medium text-text-primary">薬を登録</p>
                </Card>
              </Link>
            </div>
          </section>

          {/* Latest health record */}
          {latestRecord && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">最新の健康記録</h2>
              <Card className="flex items-center gap-3">
                <div className="text-2xl">⚖️</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {latestRecord.weight != null ? `${latestRecord.weight} kg` : "体重未記録"}
                  </p>
                  <p className="text-xs text-text-secondary">{formatDate(latestRecord.recordedAt)}</p>
                </div>
                <Link href="/health" className="ml-auto text-xs text-primary font-medium">
                  詳細 ›
                </Link>
              </Card>
            </section>
          )}

          {/* Next visit */}
          {nextVisit && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">次回通院予定</h2>
              <Card className="flex items-center gap-3">
                <div className="text-2xl">🏥</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{nextVisit.hospitalName}</p>
                  <p className="text-xs text-text-secondary">
                    {nextVisit.nextVisitDate ? formatDate(nextVisit.nextVisitDate) : ""}
                  </p>
                </div>
              </Card>
            </section>
          )}

          {/* Next trimming */}
          {nextTrimming && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">次回トリミング予定</h2>
              <Card className="flex items-center gap-3">
                <div className="text-2xl">✂️</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {nextTrimming.salonName ?? "サロン未設定"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(nextTrimming.nextScheduledDate ?? nextTrimming.scheduledDate)}
                  </p>
                </div>
                <Link href="/trimming" className="ml-auto text-xs text-primary font-medium">
                  詳細 ›
                </Link>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
