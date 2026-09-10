export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  deleted_at: string | null;
}

export interface BaseEntityWithoutDelete {
  id: string;
  created_at: string;
  updated_at: string;
}
