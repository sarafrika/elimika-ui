import type { StudentGroupRosterEntry } from '@/services/client';

export type InvitationRecipient = { name: string; email: string };
export type GroupInviteStudent = InvitationRecipient & { id: string; groups: string[] };

export function groupInviteStudents(rows: StudentGroupRosterEntry[]): GroupInviteStudent[] {
  const students = new Map<string, GroupInviteStudent>();
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() ?? '';
    const id = email || row.student_uuid;
    if (!id) continue;
    const existing = students.get(id);
    const group = row.group_name || 'Student group';
    if (existing) {
      if (!existing.groups.includes(group)) existing.groups.push(group);
    } else {
      students.set(id, { id, email, name: row.full_name || email || 'Student', groups: [group] });
    }
  }
  return [...students.values()];
}

export function invitationAudience(
  manual: InvitationRecipient[],
  students: GroupInviteStudent[],
  excluded: readonly string[]
): InvitationRecipient[] {
  const exclusions = new Set(excluded);
  const recipients = new Map<string, InvitationRecipient>();
  for (const recipient of [...students.filter(student => !exclusions.has(student.id)), ...manual]) {
    const email = recipient.email.trim().toLowerCase();
    if (!email || exclusions.has(email) || recipients.has(email)) continue;
    recipients.set(email, { name: recipient.name, email });
  }
  return [...recipients.values()];
}
