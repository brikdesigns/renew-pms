export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      checklist_items: {
        Row: {
          created_at: string
          equipment_id: string | null
          id: string
          label: string
          practice_id: string
          room_id: string | null
          sort_order: number
          supply_category_id: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          label: string
          practice_id: string
          room_id?: string | null
          sort_order?: number
          supply_category_id?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          id?: string
          label?: string
          practice_id?: string
          room_id?: string | null
          sort_order?: number
          supply_category_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_supply_category_id_fkey"
            columns: ["supply_category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          practice_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          practice_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_types_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          practice_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          practice_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          id: string
          metadata: Json | null
          practice_id: string | null
          resend_id: string | null
          sent_at: string
          status: string
          subject: string
          template: string | null
          to_email: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          practice_id?: string | null
          resend_id?: string | null
          sent_at?: string
          status?: string
          subject: string
          template?: string | null
          to_email: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          practice_id?: string | null
          resend_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          template?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          compliance_notes: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          equipment_category_id: string | null
          id: string
          is_active: boolean
          last_maintained_at: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance_due: string | null
          notes: string | null
          office_id: string
          practice_id: string
          purchase_date: string | null
          room_id: string | null
          serial_number: string | null
          status: string
          team_id: string | null
          updated_at: string
          vendor_id: string | null
          warranty_expiry: string | null
        }
        Insert: {
          compliance_notes?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          equipment_category_id?: string | null
          id?: string
          is_active?: boolean
          last_maintained_at?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance_due?: string | null
          notes?: string | null
          office_id: string
          practice_id: string
          purchase_date?: string | null
          room_id?: string | null
          serial_number?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          vendor_id?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          compliance_notes?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          equipment_category_id?: string | null
          id?: string
          is_active?: boolean
          last_maintained_at?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance_due?: string | null
          notes?: string | null
          office_id?: string
          practice_id?: string
          purchase_date?: string | null
          room_id?: string | null
          serial_number?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          vendor_id?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_equipment_category_id_fkey"
            columns: ["equipment_category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          practice_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          practice_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          practice_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          practice_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          practice_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          name: string
          phone: string | null
          practice_id: string
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name: string
          phone?: string | null
          practice_id: string
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string
          phone?: string | null
          practice_id?: string
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_members: {
        Row: {
          created_at: string
          employee_type: string
          id: string
          is_active: boolean
          joined_at: string
          office_days: string[]
          practice_id: string
          practice_role_id: string | null
          shift: string | null
          team_id: string | null
          trainual_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_type?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          office_days?: string[]
          practice_id: string
          practice_role_id?: string | null
          shift?: string | null
          team_id?: string | null
          trainual_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_type?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          office_days?: string[]
          practice_id?: string
          practice_role_id?: string | null
          shift?: string | null
          team_id?: string | null
          trainual_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_members_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_members_practice_role_id_fkey"
            columns: ["practice_role_id"]
            isOneToOne: false
            referencedRelation: "practice_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_role_types: {
        Row: {
          created_at: string
          default_system_role: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          practice_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_system_role?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          practice_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_system_role?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_role_types_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_role_types_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          integrations: Json
          logo_url: string | null
          name: string
          npi_number: string | null
          phone: string | null
          reseller_id: string | null
          settings: Json
          slug: string
          state: string | null
          status: string
          tax_id: string | null
          updated_at: string
          website_url: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          integrations?: Json
          logo_url?: string | null
          name: string
          npi_number?: string | null
          phone?: string | null
          reseller_id?: string | null
          settings?: Json
          slug: string
          state?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website_url?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          integrations?: Json
          logo_url?: string | null
          name?: string
          npi_number?: string | null
          phone?: string | null
          reseller_id?: string | null
          settings?: Json
          slug?: string
          state?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          system_role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          system_role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          system_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string | null
          equipment_id: string | null
          id: string
          is_under_warranty: boolean | null
          location_description: string | null
          notify_on_status_change: boolean
          notify_via: string[]
          parts_notes: string | null
          practice_id: string
          repair_tech_notes: string | null
          resolution_notes: string | null
          resolved_at: string | null
          room_id: string | null
          scheduled_repair_date: string | null
          status: string
          submitted_by: string
          title: string
          updated_at: string
          urgency: string
          vendor_contact_id: string | null
          vendor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          is_under_warranty?: boolean | null
          location_description?: string | null
          notify_on_status_change?: boolean
          notify_via?: string[]
          parts_notes?: string | null
          practice_id: string
          repair_tech_notes?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_id?: string | null
          scheduled_repair_date?: string | null
          status?: string
          submitted_by: string
          title: string
          updated_at?: string
          urgency?: string
          vendor_contact_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          is_under_warranty?: boolean | null
          location_description?: string | null
          notify_on_status_change?: boolean
          notify_via?: string[]
          parts_notes?: string | null
          practice_id?: string
          repair_tech_notes?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_id?: string | null
          scheduled_repair_date?: string | null
          status?: string
          submitted_by?: string
          title?: string
          updated_at?: string
          urgency?: string
          vendor_contact_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_vendor_contact_id_fkey"
            columns: ["vendor_contact_id"]
            isOneToOne: false
            referencedRelation: "vendor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_custom: boolean
          name: string
          office_id: string
          practice_id: string
          room_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_custom?: boolean
          name: string
          office_id: string
          practice_id: string
          room_type?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_custom?: boolean
          name?: string
          office_id?: string
          practice_id?: string
          room_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_events: {
        Row: {
          all_day: boolean
          assigned_department: string | null
          assigned_to: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          event_type: string
          id: string
          practice_id: string
          room_id: string | null
          rrule: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          assigned_department?: string | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at: string
          event_type?: string
          id?: string
          practice_id: string
          room_id?: string | null
          rrule?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          assigned_department?: string | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string
          event_type?: string
          id?: string
          practice_id?: string
          room_id?: string | null
          rrule?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_assigned_department_fkey"
            columns: ["assigned_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_categories: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          name: string
          practice_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          practice_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_categories_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_categories_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          practice_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          practice_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_categories_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          equipment_id: string | null
          id: string
          is_completed: boolean
          label: string
          practice_id: string
          room_id: string | null
          sort_order: number
          supply_category_id: string | null
          task_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          is_completed?: boolean
          label: string
          practice_id: string
          room_id?: string | null
          sort_order?: number
          supply_category_id?: string | null
          task_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          is_completed?: boolean
          label?: string
          practice_id?: string
          room_id?: string | null
          sort_order?: number
          supply_category_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_supply_category_id_fkey"
            columns: ["supply_category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          assigned_member_id: string | null
          assigned_role_id: string | null
          assignment_mode: string
          compliance_type_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          display_mode: string
          estimated_duration: number | null
          frequency: string | null
          id: string
          is_default: boolean
          name: string
          practice_id: string
          priority: string
          requires_approval: boolean
          room_id: string | null
          status: string
          task_category_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          assigned_member_id?: string | null
          assigned_role_id?: string | null
          assignment_mode?: string
          compliance_type_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          display_mode?: string
          estimated_duration?: number | null
          frequency?: string | null
          id?: string
          is_default?: boolean
          name: string
          practice_id: string
          priority?: string
          requires_approval?: boolean
          room_id?: string | null
          status?: string
          task_category_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          assigned_member_id?: string | null
          assigned_role_id?: string | null
          assignment_mode?: string
          compliance_type_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          display_mode?: string
          estimated_duration?: number | null
          frequency?: string | null
          id?: string
          is_default?: boolean
          name?: string
          practice_id?: string
          priority?: string
          requires_approval?: boolean
          room_id?: string | null
          status?: string
          task_category_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_assigned_member_id_fkey"
            columns: ["assigned_member_id"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_assigned_role_id_fkey"
            columns: ["assigned_role_id"]
            isOneToOne: false
            referencedRelation: "practice_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_compliance_type_id_fkey"
            columns: ["compliance_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_task_category_id_fkey"
            columns: ["task_category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          practice_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          practice_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_types_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_department: string | null
          assigned_role_id: string | null
          assigned_to: string | null
          completed_at: string | null
          compliance_type_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          frequency: string | null
          id: string
          practice_id: string
          priority: string
          room_id: string | null
          status: string
          supply_category_id: string | null
          task_category_id: string | null
          task_type_id: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_department?: string | null
          assigned_role_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          compliance_type_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          frequency?: string | null
          id?: string
          practice_id: string
          priority?: string
          room_id?: string | null
          status?: string
          supply_category_id?: string | null
          task_category_id?: string | null
          task_type_id?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_department?: string | null
          assigned_role_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          compliance_type_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          frequency?: string | null
          id?: string
          practice_id?: string
          priority?: string
          room_id?: string | null
          status?: string
          supply_category_id?: string | null
          task_category_id?: string | null
          task_type_id?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_department_fkey"
            columns: ["assigned_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_role_id_fkey"
            columns: ["assigned_role_id"]
            isOneToOne: false
            referencedRelation: "practice_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_compliance_type_id_fkey"
            columns: ["compliance_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_supply_category_id_fkey"
            columns: ["supply_category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_category_id_fkey"
            columns: ["task_category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          name: string
          practice_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          practice_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          estimated_minutes: number | null
          id: string
          is_global: boolean
          is_required: boolean
          practice_id: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          is_global?: boolean
          is_required?: boolean
          practice_id?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_minutes?: number | null
          id?: string
          is_global?: boolean
          is_required?: boolean
          practice_id?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_modules_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          notes: string | null
          practice_id: string
          score: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          practice_id: string
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          practice_id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          practice_id: string
          role: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          practice_id: string
          role?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          practice_id?: string
          role?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          practice_id: string
          request_id: string
          sender_member_id: string | null
          sender_name: string
          sender_type: string
          token_id: string
          vendor_status: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          practice_id: string
          request_id: string
          sender_member_id?: string | null
          sender_name: string
          sender_type: string
          token_id: string
          vendor_status?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          practice_id?: string
          request_id?: string
          sender_member_id?: string | null
          sender_name?: string
          sender_type?: string
          token_id?: string
          vendor_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_messages_sender_member_id_fkey"
            columns: ["sender_member_id"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_messages_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "vendor_request_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_request_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          practice_id: string
          request_id: string
          revoked_at: string | null
          status: string
          token: string
          vendor_contact_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          practice_id: string
          request_id: string
          revoked_at?: string | null
          status?: string
          token: string
          vendor_contact_id?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          practice_id?: string
          request_id?: string
          revoked_at?: string | null
          status?: string
          token?: string
          vendor_contact_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_request_tokens_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_request_tokens_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_request_tokens_vendor_contact_id_fkey"
            columns: ["vendor_contact_id"]
            isOneToOne: false
            referencedRelation: "vendor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_request_tokens_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          practice_id: string
          type: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          practice_id: string
          type: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          practice_id?: string
          type?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_daily_tasks: {
        Args: { p_practice_id: string }
        Returns: undefined
      }
      get_my_system_role: { Args: never; Returns: string }
      is_admin_role: { Args: never; Returns: boolean }
      is_brik_admin: { Args: never; Returns: boolean }
      run_daily_tasks: { Args: never; Returns: undefined }
      seed_practice_defaults: {
        Args: { p_office_id: string; p_practice_id: string }
        Returns: undefined
      }
      seed_template_defaults: {
        Args: { p_practice_id: string }
        Returns: undefined
      }
      user_practice_ids: { Args: { uid: string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
