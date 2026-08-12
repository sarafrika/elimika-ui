'use client'

import { Download, History } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { downloadCsv, fmtDateTime, useWallet } from "../page";

export function AuditTab() {
    const { audit, notify } = useWallet();

    function exportCsv() {
        downloadCsv(
            "elimika-wallet-audit.csv",
            ["Timestamp", "User role", "Event", "Entity", "Reason", "Previous", "Updated"],
            audit.map((r) => [
                fmtDateTime(r.created_at), r.actor_role, r.event_type, r.entity_type ?? "", r.reason ?? "",
                JSON.stringify(r.previous_values ?? {}), JSON.stringify(r.updated_values ?? {}),
            ]),
        );
        notify({ type: "success", message: "Export ready", description: "elimika-wallet-audit.csv downloaded." });
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-base">Financial audit trail</CardTitle>
                    <CardDescription>Immutable log of every wallet event.</CardDescription>
                </div>
                <div>

                    <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1.5" /> Export</Button>
                </div>
            </CardHeader>

            <CardContent className='mt-4 divide-y'>
                {audit.length > 0 ? (
                    audit.map(r => (
                        <div key={r.id} className='space-y-1 py-3'>
                            <div className='flex items-center justify-between gap-2'>
                                <p className='text-sm font-medium'>
                                    {r.event_type.replace(/_/g, ' ')}
                                    {r.entity_type
                                        ? ` · ${r.entity_type.replace(/_/g, ' ')}`
                                        : ''}
                                </p>

                                <span className='text-xs text-muted-foreground'>
                                    {fmtDateTime(r.created_at)}
                                </span>
                            </div>

                            {r.reason && (
                                <p className='text-xs text-muted-foreground'>
                                    {r.reason}
                                </p>
                            )}

                            <p className='break-all text-[11px] text-muted-foreground'>
                                Role: {r.actor_role} · Previous:{' '}
                                {JSON.stringify(r.previous_values ?? {})} · Updated:{' '}
                                {JSON.stringify(r.updated_values ?? {})}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className='flex flex-col items-center justify-center rounded-xl bg-muted/20 px-6 py-12 text-center'>
                        <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted'>
                            <History className='h-5 w-5 text-muted-foreground' />
                        </div>

                        <h4 className='text-sm font-semibold text-foreground'>
                            No audit activity yet
                        </h4>

                        <p className='mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground'>
                            Changes and activity related to your wallet will appear here when
                            records become available.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}