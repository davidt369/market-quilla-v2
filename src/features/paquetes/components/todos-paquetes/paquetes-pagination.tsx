"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";

interface PaquetesPaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
}

export function PaquetesPagination({ currentPage, totalPages, basePath = "/dashboard/paquetes/todos" }: PaquetesPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("page", pageNumber.toString());
        return `${basePath}?${params.toString()}`;
    };

    const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, page: number) => {
        e.preventDefault();
        router.push(createPageURL(page));
    };

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="py-4">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious 
                            href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"} 
                            onClick={(e) => {
                                if (currentPage <= 1) e.preventDefault();
                                else handleNavigate(e, currentPage - 1);
                            }}
                            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                            text="Anterior"
                        />
                    </PaginationItem>

                    {getPageNumbers().map((page, i) => (
                        <PaginationItem key={i}>
                            {page === 'ellipsis' ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink 
                                    href={createPageURL(page as number)}
                                    isActive={currentPage === page}
                                    onClick={(e) => handleNavigate(e, page as number)}
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext 
                            href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"} 
                            onClick={(e) => {
                                if (currentPage >= totalPages) e.preventDefault();
                                else handleNavigate(e, currentPage + 1);
                            }}
                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                            text="Siguiente"
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
