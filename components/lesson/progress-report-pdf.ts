import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resultLabel } from '@/lib/grades';
import type { CourseProgressReport } from '@/services/client/types.gen';

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

const num = (value?: number | null) =>
  value == null ? '—' : String(Number(Number(value).toFixed(2)));

/** Downloads the learner's progress report, laid out like the school's progress card. */
export function exportProgressReportPdf(report: CourseProgressReport, studentName: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 76, 129);
  doc.rect(0, 0, pageW, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Student progress report', 40, 30);
  doc.setFontSize(11);
  doc.text(report.course_name ?? 'Course', 40, 50);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(`Student: ${studentName}`, 40, 90);
  const finalScore =
    report.average_lesson_score != null && report.lesson_max_score != null
      ? `${num(report.average_lesson_score)} / ${num(report.lesson_max_score)}`
      : '—';
  doc.text(`Final score: ${finalScore}   (${num(report.final_grade)}%)`, 40, 108);
  doc.text(`Final grade: ${report.final_grade_label ?? '—'}   Result: ${resultLabel(report.result_status)}`, 40, 126);
  doc.text(`Progress: ${num(report.progress_percentage)}%   Generated: ${new Date().toLocaleString()}`, 40, 144);

  const rows = (report.lessons ?? []).map(lesson => {
    const mark = lesson.marks?.[0];
    const criteria = (mark?.criteria ?? [])
      .map(criterion => `${criterion.criteria_name}: ${num(criterion.points)}`)
      .join('\n');
    return [
      String(lesson.lesson_number ?? ''),
      [lesson.lesson_title, plainText(lesson.topic_covered)].filter(Boolean).join('\n'),
      (lesson.assignments ?? []).join('\n') || '—',
      lesson.duration_minutes != null ? `${lesson.duration_minutes} min` : '—',
      lesson.attendance ? (lesson.attendance === 'ATTENDED' ? 'Present' : 'Absent') : '—',
      mark?.status === 'graded' ? `${num(mark.score)} / ${num(mark.max_score)}` : (mark?.status ?? '—'),
      criteria || '—',
    ];
  });

  autoTable(doc, {
    startY: 160,
    head: [['#', 'Material covered', 'Assignment', 'Duration', 'Attendance', 'Marks', 'Criteria']],
    body: rows.length ? rows : [['', 'No lessons yet', '', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 5, valign: 'top' },
    headStyles: { fillColor: [15, 76, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 24 }, 3: { cellWidth: 56 }, 4: { cellWidth: 64 }, 5: { cellWidth: 60 } },
    margin: { left: 40, right: 40 },
  });

  const afterTable = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? 200;
  doc.setFontSize(11);
  doc.setTextColor(15, 76, 129);
  doc.text('Instructor comments', 40, afterTable + 26);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(plainText(report.instructor_comments) || '—', pageW - 80), 40, afterTable + 44);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Elimika · Page ${i} of ${pageCount}`, 40, doc.internal.pageSize.getHeight() - 20);
  }

  const safeName = studentName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'student';
  doc.save(`progress-report-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** Comments are stored as rich-text HTML; the PDF shows their text, one paragraph or item per line. */
function plainText(html?: string | null) {
  if (!html) return '';
  // DOMParser builds an inert document, so nothing in the comment loads or runs.
  const parsed = new DOMParser().parseFromString(html.replace(/<\/(p|li|h[1-4])>|<br\s*\/?>/gi, '$&\n'), 'text/html');
  return (parsed.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
