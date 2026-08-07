import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type CredentialRow = {
    name: string;
    org: string;
    issued_at?: string | null;
    credential_code?: string | null;
    status?: string | null;
};

export type VerificationRow = {
    source: string;
    title: string;
    skill?: string | null;
    change?: string | null;
    date?: string | null;
    status?: string | null;
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");
const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

export function exportCredentialsPdf(opts: {
    studentName: string;
    credentials: CredentialRow[];
    verifications: VerificationRow[];
}) {
    const { studentName, credentials, verifications } = opts;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 76, 129);
    doc.rect(0, 0, pageW, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Elimika Skills Wallet", 40, 32);
    doc.setFontSize(11);
    doc.text("Credentials Vault Export", 40, 52);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Student: ${studentName}`, 40, 96);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 112);

    // Credentials
    doc.setFontSize(13);
    doc.setTextColor(15, 76, 129);
    doc.text(`Credentials (${credentials.length})`, 40, 144);

    autoTable(doc, {
        startY: 152,
        head: [["Credential", "Issuer", "Issued", "ID", "Status"]],
        body: credentials.length
            ? credentials.map((c) => [c.name ?? "—", c.org ?? "—", fmt(c.issued_at), c.credential_code ?? "—", c.status ?? "—"])
            : [["No credentials on file", "", "", "", ""]],
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [15, 76, 129], textColor: 255 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 40, right: 40 },
    });

    const afterCreds = (doc as any).lastAutoTable?.finalY ?? 200;

    // Verification proofs
    doc.setFontSize(13);
    doc.setTextColor(15, 76, 129);
    doc.text(`Verification Proofs (${verifications.length})`, 40, afterCreds + 28);

    autoTable(doc, {
        startY: afterCreds + 36,
        head: [["Source", "Title", "Skill / Course", "Detail", "Date", "Status"]],
        body: verifications.length
            ? verifications.map((v) => [
                cap(v.source?.replace(/_/g, " ")),
                v.title ?? "—",
                v.skill ?? "—",
                v.change ?? "—",
                fmt(v.date),
                cap(v.status),
            ])
            : [["No verification events recorded", "", "", "", "", ""]],
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [20, 184, 166], textColor: 255 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 40, right: 40 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
            `Elimika Skills Wallet · Page ${i} of ${pageCount} · Verify at elimika.app`,
            40,
            doc.internal.pageSize.getHeight() - 20,
        );
    }

    const safeName = studentName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "student";
    doc.save(`elimika-credentials-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
