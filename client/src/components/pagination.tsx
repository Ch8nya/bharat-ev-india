import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, perPage, total, onPageChange }: PaginationProps) {
  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always include page 1
    pages.push(1);
    
    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after page 1 if needed
    if (rangeStart > 2) {
      pages.push("ellipsis1");
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push("ellipsis2");
    }
    
    // Always include last page if it exists and is not already included
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  return (
    <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6 mt-8 rounded-lg shadow">
      {/* Mobile view */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-4 py-2 border font-styreneA text-sm font-medium rounded-md ${
            currentPage === 1
              ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
              : "bg-background text-foreground hover:bg-muted/50 border-border"
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border font-styreneA text-sm font-medium rounded-md ${
            currentPage === totalPages
              ? "bg-muted text-muted-foreground cursor-not-allowed border-border"
              : "bg-background text-foreground hover:bg-muted/50 border-border"
          }`}
        >
          Next
        </button>
      </div>
      
      {/* Desktop view */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-tiempos">
            Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-medium text-foreground">{endItem}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> results
          </p>
        </div>
        
        {totalPages > 1 && (
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* Previous page button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-border ${
                  currentPage === 1
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-background text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Page numbers */}
              {getPageNumbers().map((page, index) => {
                if (page === "ellipsis1" || page === "ellipsis2") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-border bg-background text-sm font-medium text-muted-foreground font-styreneA"
                    >
                      ...
                    </span>
                  );
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={
                      currentPage === page
                        ? "z-10 bg-accent/10 border-accent text-accent relative inline-flex items-center px-4 py-2 border text-sm font-medium font-styreneA"
                        : "bg-background border-border text-foreground hover:bg-muted/50 relative inline-flex items-center px-4 py-2 border text-sm font-medium font-styreneA"
                    }
                  >
                    {page}
                  </button>
                );
              })}
              
              {/* Next page button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-border ${
                  currentPage === totalPages
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-background text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
