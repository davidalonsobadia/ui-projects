"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon, DotsHorizontalIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Proof {
  id: string
  user: string
  type: string
  status: string
  date: string
  details: string
}

export default function ProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, you would:
    // 1. Add error handling
    // 2. Add pagination
    // 3. Add proper loading states
    // 4. Add retry logic
    // 5. Use React Query or SWR for better data fetching
    async function fetchProofs() {
      try {
        const response = await fetch("/api/proofs")
        const data = await response.json()
        setProofs(data)
      } catch (error) {
        console.error("Error fetching proofs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProofs()
  }, [])

  // Filter proofs based on search
  const filteredProofs = proofs.filter(
    (proof) =>
      proof.user.toLowerCase().includes(search.toLowerCase()) ||
      proof.type.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Proofs</CardTitle>
            <CardDescription>Manage user proofs and verifications</CardDescription>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Input
            placeholder="Search proofs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Type</DropdownMenuItem>
              <DropdownMenuItem>Status</DropdownMenuItem>
              <DropdownMenuItem>Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              filteredProofs.map((proof) => (
                <TableRow key={proof.id}>
                  <TableCell>{proof.user}</TableCell>
                  <TableCell>{proof.type}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        proof.status === "Verified"
                          ? "bg-green-50 text-green-700"
                          : proof.status === "Pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {proof.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(proof.date).toLocaleDateString()}</TableCell>
                  <TableCell>{proof.details}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <DotsHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Verify</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

