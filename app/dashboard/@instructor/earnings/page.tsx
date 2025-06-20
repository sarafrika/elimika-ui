import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const earningsData = {
  totalRevenue: 12500.0,
  withdrawn: 8000.0,
  availableBalance: 4500.0,
  recentTransactions: [
    {
      id: "txn_1",
      course: "Mastering Next.js",
      amount: 49.99,
      date: "2023-10-26",
      status: "cleared",
    },
    {
      id: "txn_2",
      course: "GraphQL for Beginners",
      amount: 29.99,
      date: "2023-10-24",
      status: "cleared",
    },
    {
      id: "txn_3",
      course: "Mastering Next.js",
      amount: 49.99,
      date: "2023-10-22",
      status: "pending",
    },
  ],
  payouts: [
    {
      id: "p_1",
      amount: 2000.0,
      date: "2023-10-15",
      method: "PayPal",
    },
    {
      id: "p_2",
      amount: 6000.0,
      date: "2023-09-15",
      method: "Stripe",
    },
  ],
}

export default function EarningsPage() {
  return (
    <div className="space-y-6 p-4 md:p-10">
      <h2 className="text-2xl font-bold tracking-tight">Earnings</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All-time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${earningsData.totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Withdrawn</CardTitle>
            <CardDescription>Total amount paid out</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${earningsData.withdrawn.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
            <CardDescription>Ready for withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${earningsData.availableBalance.toFixed(2)}
            </p>
            <Button className="mt-4 w-full">Request Payout</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earningsData.recentTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.course}</TableCell>
                  <TableCell>${txn.amount.toFixed(2)}</TableCell>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        txn.status === "cleared" ? "default" : "secondary"
                      }
                      className="capitalize"
                    >
                      {txn.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earningsData.payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>${payout.amount.toFixed(2)}</TableCell>
                  <TableCell>{payout.date}</TableCell>
                  <TableCell>{payout.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
