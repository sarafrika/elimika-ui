"use client";

const sessions = [
  {
    program: "Project Management",
    session: "Project Management Fundamentals",
    date: "May 19, 2025",
    location: "Nairobi, Kenya",
    instructor: "John Doe",
    enrolled: 25,
    attended: 21,
    completion: 88,
    satisfaction: 4.7,
    hours: 12,
    status: "Completed",
  },
  {
    program: "Soft Skills",
    session: "Effective Communication Skills",
    date: "May 17, 2025",
    location: "Online",
    instructor: "Jane Smith",
    enrolled: 20,
    attended: 18,
    completion: 90,
    satisfaction: 4.5,
    hours: 10,
    status: "Completed",
  },
  {
    program: "Microsoft Office",
    session: "Excel for Beginners",
    date: "May 16, 2025",
    location: "Kisumu, Kenya",
    instructor: "Peter Mwangi",
    enrolled: 20,
    attended: 20,
    completion: 100,
    satisfaction: 4.8,
    hours: 8,
    status: "Completed",
  },
  {
    program: "IT & Security",
    session: "Cybersecurity Awareness",
    date: "May 15, 2025",
    location: "Mombasa, Kenya",
    instructor: "Mary Wanjiku",
    enrolled: 30,
    attended: 19,
    completion: 63,
    satisfaction: 4.2,
    hours: 6,
    status: "In Progress",
  },
  {
    program: "Sales & Marketing",
    session: "Sales Techniques Mastery",
    date: "May 14, 2025",
    location: "Nairobi, Kenya",
    instructor: "David Kimani",
    enrolled: 18,
    attended: 16,
    completion: 89,
    satisfaction: 4.6,
    hours: 12,
    status: "Completed",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-success/20 text-success border border-success/40",
    "In Progress": "bg-primary/20 text-primary border border-primary/40",
    Upcoming: "bg-muted/20 text-muted border border-muted/40",
    Cancelled: "bg-destructive/20 text-destructive border border-destructive/40",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] ?? styles["Upcoming"]
        }`}
    >
      {status}
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? "bg-success"
      : pct >= 70
        ? "bg-success/70"
        : pct >= 50
          ? "bg-warning"
          : "bg-destructive";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-muted/20">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground">{pct}%</span>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-warning text-xs">★</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SessionTable() {
  return (
    <div className="bg-card rounded-xl border border-border p-3 shadow-sm sm:p-4">
      <h3 className="mb-3 text-xs font-semibold text-foreground sm:text-sm">
        Session Performance Summary
      </h3>

      {/* Desktop table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Program
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Session Name
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Location
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Instructor
              </th>
              <th
                className="px-2 py-2 text-center font-medium text-muted-foreground"
                colSpan={2}
              >
                Participants
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Completion Rate
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Avg. Satisfaction
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Training Hours
              </th>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                Status
              </th>
            </tr>
            <tr className="border-b border-border/50">
              <th colSpan={5} />
              <th className="px-2 py-1 text-center text-muted-foreground font-normal">
                Enrolled
              </th>
              <th className="px-2 py-1 text-center text-muted-foreground font-normal">
                Attended
              </th>
              <th colSpan={4} />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-muted/10 transition-colors"
              >
                <td className="px-2 py-2.5 text-foreground">{s.program}</td>
                <td className="px-2 py-2.5 font-medium text-foreground">{s.session}</td>
                <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground">
                  {s.date}
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground">
                  {s.location}
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap text-foreground">
                  {s.instructor}
                </td>
                <td className="px-2 py-2.5 text-center text-foreground">{s.enrolled}</td>
                <td className="px-2 py-2.5 text-center text-foreground">{s.attended}</td>
                <td className="px-2 py-2.5">
                  <CompletionBar pct={s.completion} />
                </td>
                <td className="px-2 py-2.5">
                  <StarRating value={s.satisfaction} />
                </td>
                <td className="px-2 py-2.5 text-center text-foreground">{s.hours}</td>
                <td className="px-2 py-2.5">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Showing 1 to 5 of 48 sessions
        </span>
        <div className="flex items-center gap-1">
          <PagBtn label="‹" disabled />
          {[1, 2, 3, 4, 5].map((n) => (
            <PagBtn key={n} label={String(n)} active={n === 1} />
          ))}
          <PagBtn label="..." disabled />
          <PagBtn label="10" />
          <PagBtn label="›" />
        </div>
      </div>
    </div>
  );
}

function PagBtn({
  label,
  active,
  disabled,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${active
        ? "bg-primary/20 text-card-foreground"
        : disabled
          ? "cursor-default text-muted-foreground"
          : "text-foreground hover:bg-muted/10"
        }`}
    >
      {label}
    </button>
  );
}