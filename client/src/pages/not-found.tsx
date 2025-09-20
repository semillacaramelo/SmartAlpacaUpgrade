export default function NotFound() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
                <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
            </div>
        </div>
    );
}