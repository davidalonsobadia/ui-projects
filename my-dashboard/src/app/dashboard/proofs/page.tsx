"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Proof {
  id: string
  user_id: string
  proof_type: string
  kind: string
  title: string
  country_code: string
  noted_at: string
  inserted_at: string
  url: string
  file_storage_id: string
}

export default function ProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProofs() {
      try {
        const response = await fetch("/api/proofs")
        if (!response.ok) {
          throw new Error('Failed to fetch proofs')
        }
        const data = await response.json()
        setProofs(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching proofs:", error)
        setError(error instanceof Error ? error.message : 'Failed to fetch proofs')
        setProofs([])
      } finally {
        setLoading(false)
      }
    }

    fetchProofs()
  }, [])

  const filteredProofs = proofs.filter(
    (proof) => {
      const searchLower = search.toLowerCase()
      return (
        (proof.title?.toLowerCase() || '').includes(searchLower) ||
        (proof.proof_type?.toLowerCase() || '').includes(searchLower) ||
        (proof.country_code?.toLowerCase() || '').includes(searchLower)
      )
    }
  )

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Proofs</CardTitle>
            <CardDescription>View and manage user proofs</CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search by title, type or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredProofs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No proofs found
                </TableCell>
              </TableRow>
            ) : (
              filteredProofs.map((proof) => (
                <TableRow key={proof.id}>
                  <TableCell>{proof.title || '-'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                      {proof.proof_type || '-'}
                    </span>
                  </TableCell>
                  <TableCell>{proof.country_code || '-'}</TableCell>
                  <TableCell>{proof.noted_at ? new Date(proof.noted_at).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

