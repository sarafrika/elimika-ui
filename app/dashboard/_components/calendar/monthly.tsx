import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default function MonthlyView({ date = new Date() }: { date: Date }) {

    const monthStart = new Date(new Date(date).setDate(1));
    const nextMonth = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));
    const monthEnd = new Date(new Date(nextMonth).setDate(monthStart.getDate() - 1));

    console.log(monthEnd);

    return <Table>
        <TableBody>
            <TableRow>
                <TableCell>Noma</TableCell>
            </TableRow>
        </TableBody>
    </Table>
}