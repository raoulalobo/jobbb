"use client";

/**
 * Role : Tableau des candidatures avec Tanstack Table v8
 * Affiche la liste des candidatures de l'utilisateur connecte avec :
 *   - Colonnes : Offre (titre + entreprise), Statut, Date, Actions
 *   - Tri par colonne (clic sur en-tete)
 *   - Filtre par statut (select)
 *   - Etat vide si aucune candidature
 *
 * Props :
 *   - applications : tableau de candidatures avec l'offre incluse (include: { offer: true })
 *
 * Interactions :
 *   - Bouton "Voir" → navigue vers /applications/[id]
 *   - Filtre statut → filtre client-side via Tanstack Table
 *   - Clic en-tete colonne → tri ascendant/descendant
 */

import { useState } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApplicationStatusBadge,
  APPLICATION_STATUSES,
} from "@/components/applications/ApplicationStatusBadge";

/**
 * Type d'une candidature avec l'offre liee chargee
 * Correspond a la requete useFindManyApplication({ include: { offer: true } })
 */
type ApplicationWithOffer = Prisma.ApplicationGetPayload<{
  include: { offer: true };
}>;

interface ApplicationsTableProps {
  /** Liste des candidatures avec leurs offres */
  applications: ApplicationWithOffer[];
}

/**
 * Formate une date en francais (ex: "18/02/2026")
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Definition des colonnes du tableau Tanstack Table
 * Chaque colonne definit : header, accessorKey/cell, et le comportement de tri
 */
const columns: ColumnDef<ApplicationWithOffer>[] = [
  {
    // Colonne Offre : affiche le titre et l'entreprise empiles
    id: "offer",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Offre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    // Accesseur pour le tri : utilise le titre de l'offre liee
    accessorFn: (row) => row.offer.title,
    cell: ({ row }) => (
      <div>
        <p className="font-medium leading-tight">{row.original.offer.title}</p>
        <p className="text-sm text-muted-foreground">
          {row.original.offer.company}
        </p>
      </div>
    ),
  },
  {
    // Colonne Statut : badge colore + filtre via getFilteredRowModel
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <ApplicationStatusBadge status={row.original.status} />
    ),
    // Filtre client-side exact sur le statut
    filterFn: "equals",
  },
  {
    // Colonne Date : date de creation formatee
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    // Colonne Actions : bouton de navigation vers le detail
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/applications/${row.original.id}`}>Voir</Link>
        </Button>
      </div>
    ),
  },
];

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  // Etat local du tri (colonne + direction)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }, // tri par defaut : plus recent en premier
  ]);

  // Etat local des filtres de colonne (ex: filtre par statut)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Valeur du filtre statut actuellement selectionne ("" = tous)
  const statusFilter =
    (columnFilters.find((f) => f.id === "status")?.value as string) ?? "";

  // Initialisation de l'instance Tanstack Table
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable retourne des fonctions non memoïsables (comportement attendu de Tanstack Table v8)
  const table = useReactTable({
    data: applications,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Barre de filtres : filtre par statut */}
      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            // "all" signifie aucun filtre actif : on retire le filtre de statut
            if (value === "all") {
              setColumnFilters((prev) => prev.filter((f) => f.id !== "status"));
            } else {
              setColumnFilters((prev) => {
                const rest = prev.filter((f) => f.id !== "status");
                return [...rest, { id: "status", value }];
              });
            }
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            {/* Option pour afficher tous les statuts */}
            <SelectItem value="all">Tous les statuts</SelectItem>
            {/* Options pour chaque statut possible */}
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                <ApplicationStatusBadge status={s} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Compteur de resultats filtres */}
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} candidature
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table>
          {/* En-tete : rendu via Tanstack Table */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* Corps : lignes de candidatures */}
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Etat vide : aucune candidature (globalement ou apres filtre)
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Aucune candidature trouvee
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
