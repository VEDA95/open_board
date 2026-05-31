SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict Ne4qVmVwDq237AkYzINmRhB6Y8rGTTpXFYjpHxPsvaFupkRau8BbiGddTUCezoC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

INSERT INTO "public"."permissions" ("id", "path") VALUES
	('6182bc1c-ec8a-474c-aee1-bbda7c6f8ba8', 'auth:superuser'),
	('dded4dc3-3d44-4dc4-8104-f595e39f6fd7', 'role:manage'),
	('faa9c9bc-6e8b-44aa-bfc3-49426c42857e', 'user:manage'),
	('10de7750-eacb-4fe9-ba64-7eadf7812214', 'system:settings'),
	('1aa11646-2783-4409-90c2-d797f0717ed6', 'workspace:create'),
	('a8ea5855-7eba-4d37-ac5e-e70f4181da09', 'workspace:update'),
	('69dfa7ee-74ed-470d-b4b7-43b85aa95163', 'workspace:delete'),
	('ed99affd-9686-416a-8d8d-a01ed50496ee', 'workspace:manage'),
	('b95eef59-1d75-4346-9f69-b328b2633ad0', 'board:create'),
	('8be8cb11-ca0f-40c2-9430-e9e15b36ee10', 'board:update'),
	('66ab20b1-974a-4954-b200-fe17271b5bd3', 'board:delete'),
	('45174565-2013-453b-9f7e-cbd88b5677f6', 'board:manage');

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('thumbnails', 'thumbnails', NULL, '2026-04-08 04:53:17.933214+00', '2026-04-08 04:53:17.933214+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('card_attachments', 'card_attachments', NULL, '2026-04-08 04:54:51.450636+00', '2026-04-08 04:54:51.450636+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('comment_attachments', 'comment_attachments', NULL, '2026-04-08 04:55:04.911947+00', '2026-04-08 04:55:04.911947+00', true, false, NULL, NULL, NULL, 'STANDARD');

INSERT INTO "public"."roles" ("id", "name") VALUES
	('dbeb55a3-4f17-48f9-b099-d4818fb4d528', 'superuser'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', 'user'),
	('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', 'admin');

INSERT INTO "public"."role_permissions" ("role", "permission") VALUES
	('dbeb55a3-4f17-48f9-b099-d4818fb4d528', '6182bc1c-ec8a-474c-aee1-bbda7c6f8ba8'),
	('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', '45174565-2013-453b-9f7e-cbd88b5677f6'),
	('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', 'dded4dc3-3d44-4dc4-8104-f595e39f6fd7'),
	('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', 'ed99affd-9686-416a-8d8d-a01ed50496ee'),
	('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', 'faa9c9bc-6e8b-44aa-bfc3-49426c42857e'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', '1aa11646-2783-4409-90c2-d797f0717ed6'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', '66ab20b1-974a-4954-b200-fe17271b5bd3'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', '69dfa7ee-74ed-470d-b4b7-43b85aa95163'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', '8be8cb11-ca0f-40c2-9430-e9e15b36ee10'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', 'a8ea5855-7eba-4d37-ac5e-e70f4181da09'),
	('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', 'b95eef59-1d75-4346-9f69-b328b2633ad0'),
	('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', '10de7750-eacb-4fe9-ba64-7eadf7812214');

INSERT INTO "public"."user_roles" ("user_id", "role") VALUES
	('b61effb4-2d7f-43ee-b5f6-745705a59957', 'dbeb55a3-4f17-48f9-b099-d4818fb4d528');

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);

SELECT pg_catalog.setval('"public"."general_settings_id_seq"', 1, false);

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);

RESET ALL;
