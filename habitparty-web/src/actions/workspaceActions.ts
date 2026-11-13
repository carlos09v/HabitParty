"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { type ActionResponse, getErrorMessage } from "@/actions/types";
import type { components } from "@/api/schema";
import { serverApi } from "@/api/server";

type CreateWorkspaceDTO = components["schemas"]["CreateWorkspaceDTO"];
type UpdateWorkspaceDTO = components["schemas"]["UpdateWorkspaceDTO"];
type WorkspaceResponseDTO = components["schemas"]["WorkspaceResponseDTO"];

/**
 * Cria um novo Workspace
 */
export async function createWorkspaceAction(
  payload: CreateWorkspaceDTO,
): Promise<ActionResponse<WorkspaceResponseDTO>> {
  const t = await getTranslations("onboarding.workspaceActions");
  try {
    const { data, error } = await serverApi.POST("/workspaces", {
      body: payload,
    });

    if (error || !data) {
      console.error("[WorkspaceAction:Create] Erro retornado pela API:", error);
      return {
        success: false,
        error: getErrorMessage(error, t("createError")),
      };
    }

    const createdWorkspace = data as WorkspaceResponseDTO;

    if (createdWorkspace.id) {
      const cookieStore = await cookies();
      cookieStore.set("activeWorkspaceId", createdWorkspace.id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    updateTag("workspaces");

    return { success: true, data: createdWorkspace };
  } catch (err) {
    console.error("[WorkspaceAction:Create]", err);
    return {
      success: false,
      error: t("serverError"),
    };
  }
}

/**
 * Atualiza um Workspace existente
 */
export async function updateWorkspaceAction(
  workspaceId: string,
  payload: UpdateWorkspaceDTO,
): Promise<ActionResponse<WorkspaceResponseDTO>> {
  const t = await getTranslations("onboarding.workspaceActions");
  try {
    const { data, error } = await serverApi.PUT("/workspaces/{workspaceId}", {
      params: {
        path: { workspaceId },
      },
      body: payload,
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("updateError")),
      };
    }

    updateTag("workspaces");

    return { success: true, data: data as WorkspaceResponseDTO };
  } catch (err) {
    console.error("[WorkspaceAction:Update]", err);
    return { success: false, error: t("serverError") };
  }
}

/**
 * Exclui um Workspace
 */
export async function deleteWorkspaceAction(
  id: string,
): Promise<ActionResponse> {
  const t = await getTranslations("onboarding.workspaceActions");
  try {
    const { error } = await serverApi.DELETE("/workspaces/{id}", {
      params: {
        path: { id },
      },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("deleteError")),
      };
    }

    updateTag("workspaces");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[WorkspaceAction:Delete]", err);
    return { success: false, error: t("serverError") };
  }
}
