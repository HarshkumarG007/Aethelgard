ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_outcome_check" CHECK (outcome IN ('success','failure'));--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_kind_check" CHECK (kind IN ('standard', 'letter', 'milestone', 'future'));--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_emotion_check" CHECK (emotion IS NULL OR emotion IN ('joy','nostalgia','longing','peace','excitement','gratitude','wonder'));--> statement-breakpoint
ALTER TABLE "memory_assets" ADD CONSTRAINT "memory_assets_type_check" CHECK (type IN ('image','video','audio','document'));--> statement-breakpoint
ALTER TABLE "memory_assets" ADD CONSTRAINT "memory_assets_status_check" CHECK (status IN ('PENDING','UPLOAD_AUTHORIZED','UPLOADING','PROCESSING','READY','FAILED','DELETED'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK (role IN ('viewer', 'admin'));