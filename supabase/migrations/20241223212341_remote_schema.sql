create table "public"."workout_types" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "color" text not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid not null
);


alter table "public"."workout_types" enable row level security;

create table "public"."workouts" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "date" timestamp with time zone,
    "duration" integer,
    "created_at" timestamp with time zone default now(),
    "workout_type_id" uuid
);


alter table "public"."workouts" enable row level security;

CREATE UNIQUE INDEX workout_types_pkey ON public.workout_types USING btree (id);

CREATE UNIQUE INDEX workouts_pkey ON public.workouts USING btree (id);

alter table "public"."workout_types" add constraint "workout_types_pkey" PRIMARY KEY using index "workout_types_pkey";

alter table "public"."workouts" add constraint "workouts_pkey" PRIMARY KEY using index "workouts_pkey";

alter table "public"."workout_types" add constraint "workout_types_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workout_types" validate constraint "workout_types_user_id_fkey";

alter table "public"."workouts" add constraint "workouts_duration_check" CHECK ((duration > 0)) not valid;

alter table "public"."workouts" validate constraint "workouts_duration_check";

alter table "public"."workouts" add constraint "workouts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."workouts" validate constraint "workouts_user_id_fkey";

alter table "public"."workouts" add constraint "workouts_workout_type_id_fkey" FOREIGN KEY (workout_type_id) REFERENCES workout_types(id) ON DELETE SET NULL not valid;

alter table "public"."workouts" validate constraint "workouts_workout_type_id_fkey";

grant delete on table "public"."workout_types" to "anon";

grant insert on table "public"."workout_types" to "anon";

grant references on table "public"."workout_types" to "anon";

grant select on table "public"."workout_types" to "anon";

grant trigger on table "public"."workout_types" to "anon";

grant truncate on table "public"."workout_types" to "anon";

grant update on table "public"."workout_types" to "anon";

grant delete on table "public"."workout_types" to "authenticated";

grant insert on table "public"."workout_types" to "authenticated";

grant references on table "public"."workout_types" to "authenticated";

grant select on table "public"."workout_types" to "authenticated";

grant trigger on table "public"."workout_types" to "authenticated";

grant truncate on table "public"."workout_types" to "authenticated";

grant update on table "public"."workout_types" to "authenticated";

grant delete on table "public"."workout_types" to "service_role";

grant insert on table "public"."workout_types" to "service_role";

grant references on table "public"."workout_types" to "service_role";

grant select on table "public"."workout_types" to "service_role";

grant trigger on table "public"."workout_types" to "service_role";

grant truncate on table "public"."workout_types" to "service_role";

grant update on table "public"."workout_types" to "service_role";

grant delete on table "public"."workouts" to "anon";

grant insert on table "public"."workouts" to "anon";

grant references on table "public"."workouts" to "anon";

grant select on table "public"."workouts" to "anon";

grant trigger on table "public"."workouts" to "anon";

grant truncate on table "public"."workouts" to "anon";

grant update on table "public"."workouts" to "anon";

grant delete on table "public"."workouts" to "authenticated";

grant insert on table "public"."workouts" to "authenticated";

grant references on table "public"."workouts" to "authenticated";

grant select on table "public"."workouts" to "authenticated";

grant trigger on table "public"."workouts" to "authenticated";

grant truncate on table "public"."workouts" to "authenticated";

grant update on table "public"."workouts" to "authenticated";

grant delete on table "public"."workouts" to "service_role";

grant insert on table "public"."workouts" to "service_role";

grant references on table "public"."workouts" to "service_role";

grant select on table "public"."workouts" to "service_role";

grant trigger on table "public"."workouts" to "service_role";

grant truncate on table "public"."workouts" to "service_role";

grant update on table "public"."workouts" to "service_role";

create policy "Users can delete their own workout types"
on "public"."workout_types"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own workout types"
on "public"."workout_types"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own workout types"
on "public"."workout_types"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own workout types"
on "public"."workout_types"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can only access their own workouts"
on "public"."workouts"
as permissive
for all
to public
using ((auth.uid() = user_id));



