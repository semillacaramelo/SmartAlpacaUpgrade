export default function AuditLog() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Audit Log</h1>

            <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Trading Activities</h2>
                <div className="text-center py-8 text-muted-foreground">
                    <p>No trading activities recorded</p>
                </div>
            </div>
        </div>
    );
}