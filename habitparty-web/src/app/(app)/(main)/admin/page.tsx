import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  resolveAdminUserFilter,
} from "@/constants/admin";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getAdminOverview, getAdminUsers } from "@/services/adminService";
import { getCurrentUser } from "@/services/userService";
import { getDateFormat } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface AdminPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    page?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [user, resolvedParams, dateFormat] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getDateFormat(),
  ]);

  // Trava de segurança: Se não for ADMIN, redireciona imediatamente
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const search = (resolvedParams.search ?? "").trim();
  const filter = resolveAdminUserFilter(resolvedParams.filter);
  const parsedPage1Based = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page0Based =
    Number.isFinite(parsedPage1Based) && parsedPage1Based > 1
      ? parsedPage1Based - 1
      : 0;

  const [overview, usersPage] = await Promise.all([
    getAdminOverview(),
    getAdminUsers({
      search,
      filter,
      page: page0Based,
      size: ADMIN_DEFAULT_PAGE_SIZE,
    }),
  ]);

  const users = usersPage?.content ?? [];
  const totalPages = usersPage?.totalPages ?? 0;
  const totalElements = usersPage?.totalElements ?? 0;

  return (
    <ScopedIntlProvider scope="admin">
      <PageWrapper>
        <div className="max-w-7xl mx-auto w-full">
          <AdminDashboardView
            overviewCards={
              overview ? (
                <AdminOverviewCards
                  overview={overview}
                  dateFormat={dateFormat}
                  userTimeZone={user.timezone}
                />
              ) : null
            }
            users={users}
            totalPages={totalPages}
            totalElements={totalElements}
            currentPage={page0Based}
            search={search}
            filter={filter}
          />
        </div>
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
