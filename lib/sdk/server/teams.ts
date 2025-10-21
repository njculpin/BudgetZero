import type { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";
import type {
  ApiResponse,
  DbClient,
  PaginatedResponse,
  PaginationParams,
} from "../shared/types";
import { calculatePagination, failure, success } from "../shared/utils";

// Teams CRUD
export async function createTeam(
  client: DbClient,
  data: TablesInsert<"teams">,
): Promise<ApiResponse<Tables<"teams">>> {
  try {
    const { data: team, error } = await client
      .from("teams")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(team);
  } catch (error) {
    return failure(error);
  }
}

export async function getTeamById(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"teams">>> {
  try {
    const { data, error } = await client
      .from("teams")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateTeam(
  client: DbClient,
  id: string,
  data: TablesUpdate<"teams">,
): Promise<ApiResponse<Tables<"teams">>> {
  try {
    const { data: team, error } = await client
      .from("teams")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(team);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteTeam(
  client: DbClient,
  id: string,
): Promise<ApiResponse<Tables<"teams">>> {
  try {
    const { data, error } = await client
      .from("teams")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function hardDeleteTeam(
  client: DbClient,
  id: string,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client.from("teams").delete().eq("id", id);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

// Team Users CRUD
export async function addTeamUser(
  client: DbClient,
  data: TablesInsert<"team_users">,
): Promise<ApiResponse<Tables<"team_users">>> {
  try {
    const { data: teamUser, error } = await client
      .from("team_users")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(teamUser);
  } catch (error) {
    return failure(error);
  }
}

export async function getTeamUsers(
  client: DbClient,
  teamId: string,
): Promise<ApiResponse<Tables<"team_users">[]>> {
  try {
    const { data, error } = await client
      .from("team_users")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function getUserTeams(
  client: DbClient,
  userId: string,
): Promise<ApiResponse<Tables<"teams">[]>> {
  try {
    const { data, error } = await client
      .from("team_users")
      .select("teams(*)")
      .eq("user_id", userId)
      .limit(10);

    if (error) return failure(error);

    const teams = data
      ?.map((item) => {
        const team = item.teams;
        if (team && !Array.isArray(team)) {
          return team as Tables<"teams">;
        }
        return null;
      })
      .filter((team): team is Tables<"teams"> => team !== null);

    return success(teams ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateTeamUser(
  client: DbClient,
  id: number,
  data: TablesUpdate<"team_users">,
): Promise<ApiResponse<Tables<"team_users">>> {
  try {
    const { data: teamUser, error } = await client
      .from("team_users")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(teamUser);
  } catch (error) {
    return failure(error);
  }
}

export async function removeTeamUser(
  client: DbClient,
  id: number,
): Promise<ApiResponse<void>> {
  try {
    const { error } = await client.from("team_users").delete().eq("id", id);

    if (error) return failure(error);
    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

// Team Channels CRUD
export async function createTeamChannel(
  client: DbClient,
  data: TablesInsert<"team_channels">,
): Promise<ApiResponse<Tables<"team_channels">>> {
  try {
    const { data: channel, error } = await client
      .from("team_channels")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(channel);
  } catch (error) {
    return failure(error);
  }
}

export async function getTeamChannels(
  client: DbClient,
  teamId: string,
): Promise<ApiResponse<Tables<"team_channels">[]>> {
  try {
    const { data, error } = await client
      .from("team_channels")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function updateTeamChannel(
  client: DbClient,
  id: number,
  data: TablesUpdate<"team_channels">,
): Promise<ApiResponse<Tables<"team_channels">>> {
  try {
    const { data: channel, error } = await client
      .from("team_channels")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(channel);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteTeamChannel(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"team_channels">>> {
  try {
    const { data, error } = await client
      .from("team_channels")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Team Chat Messages CRUD
export async function createTeamChatMessage(
  client: DbClient,
  data: TablesInsert<"team_chat_messages">,
): Promise<ApiResponse<Tables<"team_chat_messages">>> {
  try {
    const { data: message, error } = await client
      .from("team_chat_messages")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(message);
  } catch (error) {
    return failure(error);
  }
}

export async function getTeamChatMessages(
  client: DbClient,
  channelId: number,
  params?: PaginationParams,
): Promise<ApiResponse<PaginatedResponse<Tables<"team_chat_messages">>>> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from("team_chat_messages")
      .select("*", { count: "exact" })
      .eq("channel_id", channelId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return failure(error);

    return success({
      data: data ?? [],
      pagination: calculatePagination(count ?? 0, page, limit),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateTeamChatMessage(
  client: DbClient,
  id: number,
  data: TablesUpdate<"team_chat_messages">,
): Promise<ApiResponse<Tables<"team_chat_messages">>> {
  try {
    const { data: message, error } = await client
      .from("team_chat_messages")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(message);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteTeamChatMessage(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"team_chat_messages">>> {
  try {
    const { data, error } = await client
      .from("team_chat_messages")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Team Chat Message Attachments CRUD
export async function createTeamChatMessageAttachment(
  client: DbClient,
  data: TablesInsert<"team_chat_message_attachments">,
): Promise<ApiResponse<Tables<"team_chat_message_attachments">>> {
  try {
    const { data: attachment, error } = await client
      .from("team_chat_message_attachments")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(attachment);
  } catch (error) {
    return failure(error);
  }
}

export async function getTeamChatMessageAttachments(
  client: DbClient,
  messageId: number,
): Promise<ApiResponse<Tables<"team_chat_message_attachments">[]>> {
  try {
    const { data, error } = await client
      .from("team_chat_message_attachments")
      .select("*")
      .eq("chat_message_id", messageId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteTeamChatMessageAttachment(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"team_chat_message_attachments">>> {
  try {
    const { data, error } = await client
      .from("team_chat_message_attachments")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

// Team Chat Message Reactions CRUD
export async function createTeamChatMessageReaction(
  client: DbClient,
  data: TablesInsert<"team_chat_message_reactions">,
): Promise<ApiResponse<Tables<"team_chat_message_reactions">>> {
  try {
    const { data: reaction, error } = await client
      .from("team_chat_message_reactions")
      .insert(data)
      .select()
      .single();

    if (error) return failure(error);
    return success(reaction);
  } catch (error) {
    return failure(error);
  }
}

export async function getTeamChatMessageReactions(
  client: DbClient,
  messageId: number,
): Promise<ApiResponse<Tables<"team_chat_message_reactions">[]>> {
  try {
    const { data, error } = await client
      .from("team_chat_message_reactions")
      .select("*")
      .eq("chat_message_id", messageId)
      .eq("is_deleted", false);

    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteTeamChatMessageReaction(
  client: DbClient,
  id: number,
): Promise<ApiResponse<Tables<"team_chat_message_reactions">>> {
  try {
    const { data, error } = await client
      .from("team_chat_message_reactions")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}
