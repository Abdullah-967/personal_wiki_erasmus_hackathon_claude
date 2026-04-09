export type RelationshipType =
  | "related_to"
  | "prerequisite_for"
  | "extends"
  | "contradicts"
  | "example_of"
  | "similar_to";

export interface WikiPage {
  id: string;
  user_id: string;
  title: string;
  aliases: string[];
  summary: string;
  body: string;
  key_points: string[];
  examples: string[];
  created_at: string;
  updated_at: string;
}

export interface PageLink {
  id: string;
  user_id: string;
  source_page_id: string;
  target_page_id: string;
  relationship_type: RelationshipType;
  relationship_reason: string;
  created_at: string;
}

export interface Source {
  id: string;
  user_id: string;
  page_id: string | null;
  source_type: string;
  source_name: string;
  uploaded_at: string;
  excerpt: string;
  file_reference: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

type DBRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

// Adds the index signature Supabase generics require, without modifying the
// exported interfaces that the rest of the app uses directly.
type Indexed<T> = T & { [key: string]: unknown };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Indexed<Profile>;
        Insert: Indexed<Omit<Profile, "created_at">>;
        Update: Indexed<Partial<Profile>>;
        Relationships: DBRelationship[];
      };
      wiki_pages: {
        Row: Indexed<WikiPage>;
        Insert: Indexed<Omit<WikiPage, "id" | "created_at" | "updated_at">>;
        Update: Indexed<
          Partial<Omit<WikiPage, "id" | "user_id" | "created_at">>
        >;
        Relationships: DBRelationship[];
      };
      page_links: {
        Row: Indexed<PageLink>;
        Insert: Indexed<Omit<PageLink, "id" | "created_at">>;
        Update: Indexed<Partial<PageLink>>;
        Relationships: DBRelationship[];
      };
      sources: {
        Row: Indexed<Source>;
        Insert: Indexed<Omit<Source, "id" | "uploaded_at">>;
        Update: Indexed<Partial<Source>>;
        Relationships: DBRelationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
