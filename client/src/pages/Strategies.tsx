export default function Strategies() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Trading Strategies</h1>

            <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Available Strategies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold">Mean Reversion</h3>
                        <p className="text-sm text-muted-foreground">Buy low, sell high strategy</p>
                        <p className="text-sm mt-2">Status: <span className="text-red-500">Inactive</span></p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold">Momentum</h3>
                        <p className="text-sm text-muted-foreground">Follow trending stocks</p>
                        <p className="text-sm mt-2">Status: <span className="text-red-500">Inactive</span></p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold">AI Generated</h3>
                        <p className="text-sm text-muted-foreground">Machine learning strategy</p>
                        <p className="text-sm mt-2">Status: <span className="text-red-500">Inactive</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}