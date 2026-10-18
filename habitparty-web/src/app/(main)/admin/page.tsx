import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getAdminOverviewAction,
  listAdminUsersAction,
} from "@/actions/adminActions";
import { serverApi } from "@/api/server";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { getCompactMode } from "@/utils/cookies";

export const metadata: Metadata = {
  title: "Painel Administrativo | HabitParty",
  description:
    "Monitoramento de recursos, cotas do Resend e controle de usuários.",
};

export default async function AdminPage() {
  const isCompact = await getCompactMode();
  const { data: user } = await serverApi.GET("/users/me");

  // Trava de segurança: Se não for ADMIN, redireciona imediatamente
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [overviewRes, usersRes] = await Promise.all([
    getAdminOverviewAction(),
    listAdminUsersAction("", "ALL", 0, 15),
  ]);

  const overview = overviewRes.success ? overviewRes.data || null : null;
  const users = usersRes.success && usersRes.data ? usersRes.data.content : [];
  const totalPages =
    usersRes.success && usersRes.data ? usersRes.data.totalPages : 0;
  const totalElements =
    usersRes.success && usersRes.data ? usersRes.data.totalElements : 0;

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="max-w-7xl mx-auto w-full">
        <AdminDashboardView
          initialOverview={overview}
          initialUsers={users}
          initialTotalPages={totalPages}
          initialTotalElements={totalElements}
        />
      </div>
    </PageWrapper>
  );
}
