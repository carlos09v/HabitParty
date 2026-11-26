import { connection, NextResponse } from "next/server";
import {
  API_BASE_URL,
  buildServerForwardHeaders,
  refreshServerAccessToken,
} from "@/api/server";
import { getDateFormat, getTimeFormat } from "@/utils/cookies";
import {
  buildHistoryBackendParams,
  normalizeHistoryQuery,
} from "@/utils/historyUtils";

export async function GET(request: Request) {
  await connection();
  try {
    const forwardHeaders = await buildServerForwardHeaders();
    if (!forwardHeaders.has("Authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incomingUrl = new URL(request.url);
    const normalizedQuery = normalizeHistoryQuery({
      tab: incomingUrl.searchParams.get("tab") ?? undefined,
      period: incomingUrl.searchParams.get("period") ?? undefined,
      from: incomingUrl.searchParams.get("from") ?? undefined,
      to: incomingUrl.searchParams.get("to") ?? undefined,
      search: incomingUrl.searchParams.get("search") ?? undefined,
      direction: incomingUrl.searchParams.get("direction") ?? undefined,
      sort: incomingUrl.searchParams.get("sort") ?? undefined,
    });

    const upstreamParams = buildHistoryBackendParams(normalizedQuery);

    const [dateFormat, timeFormat] = await Promise.all([
      getDateFormat(),
      getTimeFormat(),
    ]);
    upstreamParams.set("dateFormat", dateFormat);
    upstreamParams.set("timeFormat", timeFormat);

    const qs = upstreamParams.toString();
    const upstreamUrl = `${API_BASE_URL}/transactions/export${qs ? `?${qs}` : ""}`;

    let upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: forwardHeaders,
      cache: "no-store",
    });

    // Se o access token em cookie expirou, tenta renovar via refresh token uma única vez
    if (upstreamResponse.status === 401) {
      const refreshedToken = await refreshServerAccessToken();
      if (refreshedToken) {
        forwardHeaders.set("Authorization", `Bearer ${refreshedToken}`);
        upstreamResponse = await fetch(upstreamUrl, {
          method: "GET",
          headers: forwardHeaders,
          cache: "no-store",
        });
      }
    }

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      let errorMessage = "Failed to export CSV";
      try {
        const errBody = await upstreamResponse.json();
        if (errBody?.message) {
          errorMessage = String(errBody.message);
        }
      } catch {
        // Ignora caso o upstream não retorne JSON
      }
      return NextResponse.json(
        { error: errorMessage },
        {
          status: upstreamResponse.ok ? 502 : upstreamResponse.status || 500,
        },
      );
    }

    const contentDisposition =
      upstreamResponse.headers.get("content-disposition") ||
      'attachment; filename="statement.csv"';
    const maxRowsHeader = upstreamResponse.headers.get("x-export-max-rows");

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": contentDisposition,
      "Cache-Control": "no-store",
    };
    if (maxRowsHeader) {
      responseHeaders["X-Export-Max-Rows"] = maxRowsHeader;
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[ApiRoute:TransactionsExport]", err);
    return NextResponse.json(
      { error: "Unexpected error exporting CSV" },
      { status: 500 },
    );
  }
}
