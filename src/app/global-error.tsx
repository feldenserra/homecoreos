'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: '#1a1b1e',
                        color: '#c1c2c5',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                >
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>
                        Something went wrong!
                    </h1>
                    <p style={{ marginBottom: '2rem', maxWidth: '400px' }}>
                        A critical error occurred. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            backgroundColor: '#4c6ef5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
