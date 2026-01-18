'use client';

import { useState } from 'react';

export default function TestDownloadPage() {
    const [bookId, setBookId] = useState('589ddd04-12bb-4490-b57c-068745ed82e1');
    const [token, setToken] = useState('9c04bbc3588bb1700c8baac394ef3a437c6be816a2b9999f56b531beb68e1379');
    const [result, setResult] = useState('');

    const testDownload = async () => {
        const url = `/api/download-secure/${bookId}?token=${token}`;
        setResult(`Testing: ${url}`);

        try {
            const response = await fetch(url);

            if (response.ok && response.headers.get('content-type')?.includes('pdf')) {
                // PDF download successful
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'test-download.pdf';
                a.click();
                setResult('✅ PDF téléchargé avec succès !');
            } else {
                const text = await response.text();
                setResult(`❌ Erreur: ${text}`);
            }
        } catch (err) {
            setResult(`❌ Exception: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-6">Test Téléchargement PDF</h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Book ID</label>
                        <input
                            type="text"
                            value={bookId}
                            onChange={(e) => setBookId(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Token</label>
                        <textarea
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full p-2 border rounded h-24 font-mono text-xs"
                        />
                    </div>

                    <button
                        onClick={testDownload}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600"
                    >
                        Tester le Téléchargement
                    </button>

                    <div>
                        <label className="block text-sm font-bold mb-2">URL Générée</label>
                        <code className="block p-3 bg-gray-100 rounded text-xs break-all">
                            {`/api/download-secure/${bookId}?token=${token}`}
                        </code>
                    </div>

                    {result && (
                        <div className="mt-4 p-4 bg-blue-50 rounded">
                            <p className="text-sm whitespace-pre-wrap">{result}</p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-yellow-50 rounded">
                        <h3 className="font-bold mb-2">Lien Direct</h3>
                        <a
                            href={`/api/download-secure/${bookId}?token=${token}`}
                            className="text-blue-600 underline text-xs break-all"
                            target="_blank"
                        >
                            Cliquer ici pour télécharger directement
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
