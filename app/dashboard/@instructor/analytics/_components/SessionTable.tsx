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
    Completed: "bg-green-50 text-green-700 border border-green-200",
    "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
    Upcoming: "bg-gray-50 text-gray-600 border border-gray-200",
    Cancelled: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
        styles[status] ?? styles["Upcoming"]
      }`}
    >
      {status}
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? "bg-green-500"
      : pct >= 70
      ? "bg-green-400"
      : pct >= 50
      ? "bg-amber-400"
      : "bg-red-400";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700">{pct}%</span>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-xs">★</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
}

export function SessionTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3">
        Session Performance Summary
      </h3>

      {/* Desktop table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Program</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Session Name</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Location</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Instructor</th>
              <th className="text-center py-2 px-2 text-gray-500 font-medium" colSpan={2}>
                Participants
              </th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Completion Rate</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Avg. Satisfaction</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Training Hours</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Status</th>
            </tr>
            <tr className="border-b border-gray-50">
              <th colSpan={5} />
              <th className="text-center py-1 px-2 text-gray-400 font-normal">Enrolled</th>
              <th className="text-center py-1 px-2 text-gray-400 font-normal">Attended</th>
              <th colSpan={4} />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2.5 px-2 text-gray-600">{s.program}</td>
                <td className="py-2.5 px-2 text-gray-800 font-medium">{s.session}</td>
                <td className="py-2.5 px-2 text-gray-500 whitespace-nowrap">{s.date}</td>
                <td className="py-2.5 px-2 text-gray-500 whitespace-nowrap">{s.location}</td>
                <td className="py-2.5 px-2 text-gray-600 whitespace-nowrap">{s.instructor}</td>
                <td className="py-2.5 px-2 text-center text-gray-700">{s.enrolled}</td>
                <td className="py-2.5 px-2 text-center text-gray-700">{s.attended}</td>
                <td className="py-2.5 px-2">
                  <CompletionBar pct={s.completion} />
                </td>
                <td className="py-2.5 px-2">
                  <StarRating value={s.satisfaction} />
                </td>
                <td className="py-2.5 px-2 text-center text-gray-700">{s.hours}</td>
                <td className="py-2.5 px-2">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
        <span className="text-xs text-gray-500">Showing 1 to 5 of 48 sessions</span>
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
      className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
        active
          ? "bg-blue-500 text-white"
          : disabled
          ? "text-gray-300 cursor-default"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
