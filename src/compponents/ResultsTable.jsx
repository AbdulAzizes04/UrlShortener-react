import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Link,
} from "@mui/material";

export default function ResultsTable({ items }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Original URL</TableCell>
            <TableCell>Short URL</TableCell>
            <TableCell>Expires At</TableCell>
            <TableCell>Clicks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{row.original}</TableCell>
              <TableCell>
                <Link href={`/${row.code}`} target="_blank" rel="noopener">
                  {window.location.origin}/{row.code}
                </Link>
              </TableCell>
              <TableCell>
                {new Date(row.expiresAt).toLocaleString()}
              </TableCell>
              <TableCell>{row.clicks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
