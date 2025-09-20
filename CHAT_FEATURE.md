# Group Chat Feature

## Overview
Provides per (course, section) real-time group chat for all roles. Students, teachers, HOD, Dean, and Admin can send messages; Admin/HOD/Dean can delete (soft delete). Admin can purge entire room.

## Data Model
- ChatRoom: { course, section, lastMessageAt }
- ChatMessage: { room, sender, senderRole, body, deleted, deletedAt, deletedBy }
Unique room per (course, section).

## REST Endpoints
- POST /api/chat/room { courseId, sectionId } -> ensure/get room
- GET /api/chat/rooms -> list rooms visible to user
- GET /api/chat/rooms/:roomId/messages?limit=50&before=<ISO> -> paginated messages
- POST /api/chat/rooms/:roomId/messages { body }
- DELETE /api/chat/messages/:messageId (admin/hod/dean)
- POST /api/chat/rooms/:roomId/purge (admin only)

## Realtime (Socket.IO)
Namespace: default
Auth: JWT sent via auth.token
Events:
- join_room { roomId }
- send_message { roomId, body }
Server emits:
- message_new (full ChatMessage)
- message_deleted { messageId }

Client currently sends via REST; real-time receive handled with socket listeners in `GroupChatPanel`.

## Rate Limiting & Validation
- Max 15 messages / 30 seconds per user (in-memory)
- Max length 500 chars
- HTML tags stripped, control chars removed

## Permissions
- Send: admin, hod, dean, teacher, student (with access to section+course)
- Delete: admin, hod, dean
- Purge: admin
Access is validated according to role scope (school/department/assignment/enrollment).

## Frontend Integration Points
Added chat buttons + panel in:
- Students: My Courses page (per course)
- Teachers: My Courses page (per course)
- HOD: Analytics Section table
- Dean: Section Analytics toolbar
- Admin: SectionManagement cards & details (first course of section)

## Component API
GroupChatPanel props:
- open, onClose
- courseId, sectionId
- title (string)
- currentUser (role used for delete permission)

## Quick Manual Test
Run backend & frontend.
Get a JWT token (login). Use `backend/test-chat-quick.js`:
```
node backend/test-chat-quick.js <JWT> <COURSE_ID> <SECTION_ID>
```
Observe realtime `message_new` events.

## Future Enhancements
- Persist rate limiting with Redis
- Edit messages & typing indicators
- Room list UI & unread counts
- File / image attachments (with scanning)
- Pagination & infinite scroll

## Safety Notes
Messages sanitized (basic). Consider adding library like DOMPurify on server or client for richer formatting.

