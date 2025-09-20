export default function Backtest() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Backtesting</h1>

            <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Strategy Backtesting</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-3">Backtest Parameters</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-muted-foreground">Start Date</label>
                                <input type="date" className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">End Date</label>
                                <input type="date" className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Initial Capital</label>
                                <input type="number" value="100000" className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">Results</h3>
                        <div className="h-48 bg-muted rounded flex items-center justify-center">
                            <p className="text-muted-foreground">Run backtest to see results</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}