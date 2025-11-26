import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import * as pdfjsLib from "pdfjs-dist/webpack"; // using webpack build
import React, { useEffect, useRef, useState } from "react";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.212/pdf.worker.min.js`;

interface PDFViewerProps {
    file: string; // URL or path to PDF
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const pdfRef = useRef<PDFDocumentProxy | null>(null);

    useEffect(() => {
        if (!file) return;

        const loadPDF = async () => {
            const pdf: PDFDocumentProxy = await pdfjsLib.getDocument(file).promise;
            pdfRef.current = pdf;
            setNumPages(pdf.numPages);
            await renderPage(1, pdf);
        };

        const renderPage = async (num: number, pdfDoc?: PDFDocumentProxy) => {
            const pdfToRender = pdfDoc || pdfRef.current;
            if (!pdfToRender) return;

            const page: PDFPageProxy = await pdfToRender.getPage(num);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext("2d");
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // page.render({ canvasContext: context, viewport });
        };

        loadPDF();
    }, [file]);

    const nextPage = async () => {
        if (pageNumber < numPages) {
            const next = pageNumber + 1;
            setPageNumber(next);
            const pdf = pdfRef.current;
            if (!pdf || !canvasRef.current) return;
            const page = await pdf.getPage(next);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (!context) return;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            // page.render({ canvasContext: context, viewport });
        }
    };

    const prevPage = async () => {
        if (pageNumber > 1) {
            const prev = pageNumber - 1;
            setPageNumber(prev);
            const pdf = pdfRef.current;
            if (!pdf || !canvasRef.current) return;
            const page = await pdf.getPage(prev);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (!context) return;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            // page.render({ canvasContext: context, viewport });
        }
    };

    return (
        <div>
            <canvas ref={canvasRef}></canvas>
            <div className="mt-2 flex justify-center gap-4">
                <button onClick={prevPage} disabled={pageNumber === 1}>
                    Previous
                </button>
                <span>
                    {pageNumber} / {numPages}
                </span>
                <button onClick={nextPage} disabled={pageNumber === numPages}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default PDFViewer;
